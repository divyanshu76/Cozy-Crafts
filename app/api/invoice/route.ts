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

/** Map order status to a badge color [R, G, B] */
function statusColor(status: string): [number, number, number] {
  switch (status) {
    case "PAID":
    case "CONFIRMED":
    case "PROCESSING":
    case "DELIVERED":
      return [124, 154, 126]; // sage green
    case "CANCELLED":
    case "PAYMENT_FAILED":
      return [200, 80, 70];   // muted red
    case "REFUNDED":
      return [100, 120, 180]; // soft blue
    default:
      return [150, 130, 110]; // warm taupe
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

    // ── Derive invoice status from actual order status (never hardcode) ────
    const orderStatus = (order.status as string) || "PENDING";
    const statusLabel = orderStatus.replace(/_/g, " ");
    const [sR, sG, sB] = statusColor(orderStatus);

    // ── Build PDF ──────────────────────────────────────────────────────────
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageW = 210;
    const pageH = 297;

    // ── STEP 1: Background watermark ────────────────────────────────────────
    // Draw before any content so it sits behind everything.
    try {
      const logoPath = path.join(process.cwd(), "public", "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = logoData.toString("base64");
        const logoDataUrl = `data:image/png;base64,${logoBase64}`;

        // Get true image dimensions to compute aspect ratio
        const imgProps = doc.getImageProperties(logoDataUrl);
        const aspectRatio = imgProps.width / imgProps.height;

        // Watermark: large, centered, very low opacity (~8%)
        const wmH = 110; // mm
        const wmW = wmH * aspectRatio;
        const wmX = (pageW - wmW) / 2;
        const wmY = (pageH - wmH) / 2;

        // Save graphics state, set opacity, draw, restore
        const gState = new (doc as any).GState({ opacity: 0.07 });
        doc.setGState(gState);
        doc.addImage(logoDataUrl, "PNG", wmX, wmY, wmW, wmH, undefined, "FAST");

        // Reset opacity to full for all subsequent drawing
        const fullState = new (doc as any).GState({ opacity: 1.0 });
        doc.setGState(fullState);
      }
    } catch {
      // Watermark is decorative — never let it block the invoice
    }

    // ── STEP 2: Header background banner ───────────────────────────────────
    doc.setFillColor(250, 246, 239); // #FAF6EF cream
    doc.rect(0, 0, pageW, 46, "F");

    // Fine separator line below header
    doc.setDrawColor(203, 184, 162);
    doc.setLineWidth(0.3);
    doc.line(14, 46, pageW - 14, 46);

    // ── STEP 3: Logo (header, left column) ─────────────────────────────────
    let logoEmbedded = false;
    try {
      const logoPath = path.join(process.cwd(), "public", "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = logoData.toString("base64");
        const logoDataUrl = `data:image/png;base64,${logoBase64}`;

        // Auto-compute width from actual aspect ratio at fixed 16mm height
        const imgProps = doc.getImageProperties(logoDataUrl);
        const targetH = 16;
        const targetW = (imgProps.width / imgProps.height) * targetH;

        doc.addImage(logoDataUrl, "PNG", 14, 8, targetW, targetH, undefined, "FAST");
        logoEmbedded = true;

        // Tagline and contact below logo
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 86, 72);
        doc.text("Little Things, Made With Love.", 14, 29);
        doc.text("hello@cozycrafts.shop", 14, 34);
        doc.text("www.cozycrafts.shop", 14, 39);
      }
    } catch {
      logoEmbedded = false;
    }

    if (!logoEmbedded) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(62, 44, 34);
      doc.text("CozyCraft", 14, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 86, 72);
      doc.text("Little Things, Made With Love.", 14, 25);
      doc.text("hello@cozycrafts.shop | www.cozycrafts.shop", 14, 30);
    }

    // ── STEP 4: TAX INVOICE title + meta (header, right column) ───────────
    const rightX = 196; // right-align anchor

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(62, 44, 34);
    doc.text("TAX INVOICE", rightX, 16, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 86, 72);

    // Invoice number = order number (same for D2C)
    doc.text(`Invoice No: ${order.public_order_number}`, rightX, 23, { align: "right" });
    doc.text(
      `Date: ${new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })}`,
      rightX,
      29,
      { align: "right" }
    );

    // Status badge — colored pill
    const badgeLabel = statusLabel;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const badgeTextW = doc.getTextWidth(badgeLabel) + 6; // padding
    const badgeX = rightX - badgeTextW;
    const badgeY = 32;

    // Pill background
    doc.setFillColor(sR, sG, sB);
    doc.setDrawColor(sR, sG, sB);
    doc.roundedRect(badgeX, badgeY, badgeTextW, 5.5, 1.5, 1.5, "F");

    // Pill text
    doc.setTextColor(255, 255, 255);
    doc.text(badgeLabel, badgeX + badgeTextW / 2, badgeY + 3.8, { align: "center" });

    // ── STEP 5: Order information + Billing address ─────────────────────────
    const infoY = 54;

    // Left: Order metadata
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(62, 44, 34);
    doc.text("ORDER DETAILS", 14, infoY);

    doc.setDrawColor(203, 184, 162);
    doc.setLineWidth(0.2);
    doc.line(14, infoY + 2, 90, infoY + 2);

    const labelX = 14;
    const valX = 50;
    doc.setFontSize(8.5);

    const rows: [string, string][] = [
      ["Order No:", order.public_order_number],
      ["Order Date:", new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })],
      ["Payment Mode:", order.payment_method === "COD" ? "Cash on Delivery" : "Online (Razorpay)"],
      ["Payment Status:", order.payment_status],
    ];

    rows.forEach(([label, value], i) => {
      const y = infoY + 7 + i * 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 86, 72);
      doc.text(label, labelX, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(62, 44, 34);
      doc.text(value, valX, y);
    });

    // Right: Billing / Shipping Address
    const addrX = 115;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(62, 44, 34);
    doc.text("BILLED TO / SHIP TO", addrX, infoY);

    doc.setDrawColor(203, 184, 162);
    doc.line(addrX, infoY + 2, 196, infoY + 2);

    doc.setFontSize(8.5);
    let addrY = infoY + 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(62, 44, 34);
    doc.text(customerName, addrX, addrY);
    addrY += 5.5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 86, 72);

    if (customerEmail) {
      doc.text(customerEmail, addrX, addrY);
      addrY += 5;
    }
    if (customerPhone) {
      doc.text(`Ph: ${customerPhone}`, addrX, addrY);
      addrY += 5;
    }
    if (addressLine) {
      const wrappedAddr = doc.splitTextToSize(addressLine, 76);
      doc.text(wrappedAddr, addrX, addrY);
      addrY += wrappedAddr.length * 5;
    }
    if (cityStatePin) {
      doc.text(cityStatePin, addrX, addrY);
    }

    // ── STEP 6: Items table ─────────────────────────────────────────────────
    const tableStartY = Math.max(infoY + 36, addrY + 8);

    const items = order.order_items || [];
    const tableData = items.map((item: any, idx: number) => {
      const unitPrice = Number(item.unit_price_snapshot || 0);
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.line_total || unitPrice * qty);
      return [
        (idx + 1).toString(),
        item.product_name_snapshot || "Custom Handcrafted Item",
        qty.toString(),
        `₹${unitPrice.toLocaleString("en-IN")}`,
        `₹${lineTotal.toLocaleString("en-IN")}`,
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [["#", "Item Description", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: [62, 44, 34],    // espresso dark brown
        textColor: [250, 246, 239], // cream
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      },
      alternateRowStyles: {
        fillColor: [250, 246, 239], // cream stripe
      },
      bodyStyles: {
        lineColor: [220, 205, 188],
        lineWidth: 0.2,
      },
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: [62, 44, 34],
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 97 },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 34, halign: "right" },
        4: { cellWidth: 34, halign: "right" },
      },
    });

    // ── STEP 7: Totals ──────────────────────────────────────────────────────
    // @ts-ignore
    const tableEndY: number = (doc as any).lastAutoTable?.finalY ?? (tableStartY + 30);
    let totY = tableEndY + 10;

    const totLabelX = 138;
    const totValueX = 196;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 86, 72);

    // Subtotal
    doc.text("Subtotal:", totLabelX, totY);
    doc.text(`₹${Number(order.subtotal).toLocaleString("en-IN")}`, totValueX, totY, { align: "right" });

    // Discount
    if (Number(order.discount) > 0) {
      totY += 6;
      doc.setTextColor(124, 154, 126);
      doc.text("Discount:", totLabelX, totY);
      doc.text(`−₹${Number(order.discount).toLocaleString("en-IN")}`, totValueX, totY, { align: "right" });
      doc.setTextColor(107, 86, 72);
    }

    // Shipping
    totY += 6;
    doc.text("Shipping:", totLabelX, totY);
    doc.text(
      Number(order.shipping_fee) === 0
        ? "FREE"
        : `₹${Number(order.shipping_fee).toLocaleString("en-IN")}`,
      totValueX,
      totY,
      { align: "right" }
    );

    // COD fee
    if (order.cod_fee && Number(order.cod_fee) > 0) {
      totY += 6;
      doc.text("COD Handling:", totLabelX, totY);
      doc.text(`₹${Number(order.cod_fee).toLocaleString("en-IN")}`, totValueX, totY, { align: "right" });
    }

    // Divider
    totY += 5;
    doc.setDrawColor(62, 44, 34);
    doc.setLineWidth(0.5);
    doc.line(totLabelX, totY, totValueX, totY);

    // Grand Total
    totY += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(62, 44, 34);
    doc.text("Grand Total:", totLabelX, totY);
    doc.text(`₹${Number(order.total).toLocaleString("en-IN")}`, totValueX, totY, { align: "right" });

    // ── STEP 8: Footer ──────────────────────────────────────────────────────
    const footerY = pageH - 18;

    doc.setDrawColor(203, 184, 162);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 5, pageW - 14, footerY - 5);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 86, 72);
    doc.text(
      "Thank you for choosing CozyCraft — Handmade with love. ♡",
      pageW / 2,
      footerY,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 130, 110);
    doc.text(
      "This is a computer-generated invoice and does not require a physical signature.",
      pageW / 2,
      footerY + 5,
      { align: "center" }
    );

    // ── Produce PDF ─────────────────────────────────────────────────────────
    const pdfBuffer = doc.output("arraybuffer");

    // Status-aware filename: Invoice-CC-20260908-0003-CONFIRMED.pdf
    const safeStatus = orderStatus.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
    const filename = `Invoice-${order.public_order_number}-${safeStatus}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[invoice] server error:", err);
    return new NextResponse("Server error generating invoice.", { status: 500 });
  }
}

