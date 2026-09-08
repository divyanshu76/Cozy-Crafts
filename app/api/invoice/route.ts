import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { verifyOrderToken } from "@/lib/crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

/**
 * Checks if the request is from an authenticated admin.
 */
async function isAuthorizedAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const adminDb = getSupabaseServerClient();
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    return profile?.role === "admin";
  } catch (e) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawOrderParam =
    searchParams.get("order") ||
    searchParams.get("orderNumber") ||
    searchParams.get("id");
  const token = searchParams.get("token");

  if (!rawOrderParam) {
    return new NextResponse("Missing order parameter.", { status: 400 });
  }

  const orderIdentifier = rawOrderParam.trim();

  try {
    const supabase = getSupabaseServerClient();

    // Fetch order details — support lookup by public_order_number or UUID id
    let query = supabase.from("orders").select(`
      id,
      public_order_number,
      status,
      payment_status,
      payment_method,
      subtotal,
      discount,
      shipping_fee,
      cod_fee,
      total,
      created_at,
      shipping_address_snapshot,
      customer_id,
      customers(full_name, email, phone),
      order_items(
        product_name_snapshot,
        quantity,
        unit_price_snapshot,
        line_total
      )
    `);

    // Check if it's a UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderIdentifier
      );

    if (isUuid) {
      query = query.eq("id", orderIdentifier);
    } else {
      query = query.eq("public_order_number", orderIdentifier.toUpperCase());
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return new NextResponse("Order not found.", { status: 404 });
    }

    // ── Authorization check ────────────────────────────────────────────────
    let isAuthorized = false;

    // 1. Verify token if provided
    if (token && verifyOrderToken(order.public_order_number, token)) {
      isAuthorized = true;
    }

    // 2. If token check didn't pass, check for authenticated admin session
    if (!isAuthorized) {
      const isAdmin = await isAuthorizedAdmin();
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new NextResponse(
        "Unauthorized. Please use the secure invoice link sent to your email or sign in as an admin.",
        { status: 401 }
      );
    }

    // ── Parse customer & address details safely ────────────────────────────
    let addr: Record<string, any> = {};
    if (order.shipping_address_snapshot) {
      if (typeof order.shipping_address_snapshot === "string") {
        try {
          addr = JSON.parse(order.shipping_address_snapshot);
        } catch {
          addr = {};
        }
      } else if (typeof order.shipping_address_snapshot === "object") {
        addr = order.shipping_address_snapshot;
      }
    }

    const customer = (order.customers as any) || {};
    const customerName = addr.fullName || customer.full_name || "Customer";
    const customerEmail = addr.email || customer.email || "";
    const customerPhone = addr.phone || customer.phone || "";
    const addressLine = addr.addressLine || "";
    const cityStatePin = [addr.city, addr.state, addr.pinCode]
      .filter(Boolean)
      .join(", ");

    // ── Build PDF with jsPDF & jspdf-autotable ──────────────────────────────
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header Background banner
    doc.setFillColor(250, 246, 239); // #FAF6EF (Cream soft)
    doc.rect(0, 0, 210, 42, "F");

    // Try embedding Cozy Craft logo
    let logoEmbedded = false;
    try {
      const logoPath = path.join(process.cwd(), "public", "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath).toString("base64");
        doc.addImage(
          `data:image/png;base64,${logoBase64}`,
          "PNG",
          14,
          8,
          46,
          14,
          undefined,
          "FAST"
        );
        logoEmbedded = true;
      }
    } catch {
      logoEmbedded = false;
    }

    if (!logoEmbedded) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(62, 44, 34); // #3E2C22
      doc.text("Cozy Craft", 14, 20);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 86, 72);
    doc.text("Little Things, Made With Love.", 14, 28);
    doc.text("hello@cozycrafts.shop | https://www.cozycrafts.shop", 14, 33);

    // TAX INVOICE label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(62, 44, 34);
    doc.text("TAX INVOICE", 145, 20);

    // Status pill
    const orderStatusFormatted = (order.status || "CONFIRMED").replace(/_/g, " ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(124, 154, 126); // Sage
    doc.text(`Status: ${orderStatusFormatted}`, 145, 27);

    // Order & Billed To details
    const startY = 52;
    doc.setFontSize(10);
    doc.setTextColor(62, 44, 34);

    // Left Column: Order metadata
    doc.setFont("helvetica", "bold");
    doc.text("Order Number:", 14, startY);
    doc.setFont("helvetica", "normal");
    doc.text(order.public_order_number, 45, startY);

    doc.setFont("helvetica", "bold");
    doc.text("Order Date:", 14, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }),
      45,
      startY + 6
    );

    doc.setFont("helvetica", "bold");
    doc.text("Payment Mode:", 14, startY + 12);
    doc.setFont("helvetica", "normal");
    const paymentLabel =
      order.payment_method === "COD" ? "Cash on Delivery" : "Online Payment";
    doc.text(`${paymentLabel} (${order.payment_status})`, 45, startY + 12);

    // Right Column: Billed To
    const rightColX = 120;
    doc.setFont("helvetica", "bold");
    doc.text("Billed To / Shipping Address:", rightColX, startY);

    doc.setFont("helvetica", "bold");
    doc.text(customerName, rightColX, startY + 6);

    doc.setFont("helvetica", "normal");
    let currentY = startY + 11;
    if (customerEmail) {
      doc.text(customerEmail, rightColX, currentY);
      currentY += 5;
    }
    if (customerPhone) {
      doc.text(`Ph: ${customerPhone}`, rightColX, currentY);
      currentY += 5;
    }
    if (addressLine) {
      doc.text(addressLine, rightColX, currentY);
      currentY += 5;
    }
    if (cityStatePin) {
      doc.text(cityStatePin, rightColX, currentY);
      currentY += 5;
    }

    const tableStartY = Math.max(startY + 22, currentY + 4);

    // ── Items Table ────────────────────────────────────────────────────────
    const items = order.order_items || [];
    const tableData = items.map((item: any, idx: number) => {
      const unitPrice = Number(item.unit_price_snapshot || 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.line_total || unitPrice * qty);
      return [
        (idx + 1).toString(),
        item.product_name_snapshot || "Custom Handcrafted Item",
        qty.toString(),
        `INR ${unitPrice.toLocaleString("en-IN")}`,
        `INR ${lineTotal.toLocaleString("en-IN")}`,
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [124, 154, 126], // Sage #7C9A7E
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [250, 246, 239],
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: [62, 44, 34],
        cellPadding: 3.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 95 },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
    });

    // ── Summary Totals ─────────────────────────────────────────────────────
    // @ts-ignore
    let finalY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 8
      : tableStartY + 40;

    const labelX = 140;
    const valueX = 196;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(62, 44, 34);

    doc.text("Subtotal:", labelX, finalY);
    doc.text(
      `INR ${Number(order.subtotal).toLocaleString("en-IN")}`,
      valueX,
      finalY,
      { align: "right" }
    );

    if (order.discount > 0) {
      finalY += 6;
      doc.setTextColor(124, 154, 126);
      doc.text("Discount:", labelX, finalY);
      doc.text(
        `- INR ${Number(order.discount).toLocaleString("en-IN")}`,
        valueX,
        finalY,
        { align: "right" }
      );
      doc.setTextColor(62, 44, 34);
    }

    finalY += 6;
    doc.text("Shipping:", labelX, finalY);
    doc.text(
      Number(order.shipping_fee) === 0
        ? "FREE"
        : `INR ${Number(order.shipping_fee).toLocaleString("en-IN")}`,
      valueX,
      finalY,
      { align: "right" }
    );

    if (order.cod_fee && Number(order.cod_fee) > 0) {
      finalY += 6;
      doc.text("COD Handling Fee:", labelX, finalY);
      doc.text(
        `INR ${Number(order.cod_fee).toLocaleString("en-IN")}`,
        valueX,
        finalY,
        { align: "right" }
      );
    }

    finalY += 8;
    doc.setDrawColor(203, 184, 162); // Taupe divider
    doc.line(labelX, finalY - 4, valueX, finalY - 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(62, 44, 34);
    doc.text("Grand Total:", labelX, finalY);
    doc.text(
      `INR ${Number(order.total).toLocaleString("en-IN")}`,
      valueX,
      finalY,
      { align: "right" }
    );

    // ── Footer ─────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 86, 72);
    doc.text("Thank you for choosing Cozy Craft! Handmade with love. ♡", 105, 278, {
      align: "center",
    });
    doc.text(
      "This is a computer-generated invoice and requires no physical signature.",
      105,
      283,
      { align: "center" }
    );

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice-${order.public_order_number}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[invoice] server error:", err);
    return new NextResponse("Server error generating invoice.", { status: 500 });
  }
}
