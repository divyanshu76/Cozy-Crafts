import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { verifyOrderToken } from "@/lib/crypto";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order");
  const token = searchParams.get("token");

  if (!orderNumber || !token) {
    return new NextResponse("Unauthorized. Missing token or order number.", { status: 401 });
  }

  if (!verifyOrderToken(orderNumber, token)) {
    return new NextResponse("Unauthorized. Invalid or expired token.", { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // Fetch full order details
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
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
        order_items(
          product_name_snapshot,
          quantity,
          unit_price_snapshot
        )
      `)
      .eq("public_order_number", orderNumber)
      .single();

    if (error || !order) {
      return new NextResponse("Order not found.", { status: 404 });
    }

    const addr = order.shipping_address_snapshot as any;
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Colors
    const primaryColor = "#3E2C22";
    const sageColor = "#9BAA8C";
    const lightBg = "#FAF6EF";

    // Header
    doc.setFillColor(250, 246, 239); // #FAF6EF
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(62, 44, 34); // #3E2C22
    doc.text("Cozy Craft", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 86, 72);
    doc.text("Little Things, Made With Love.", 14, 28);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(62, 44, 34);
    doc.text("TAX INVOICE", 150, 22);
    
    // Invoice Details
    let startY = 50;
    doc.setFontSize(10);
    doc.setTextColor(62, 44, 34);
    
    doc.setFont("helvetica", "bold");
    doc.text("Order Number:", 14, startY);
    doc.setFont("helvetica", "normal");
    doc.text(order.public_order_number, 50, startY);
    
    doc.setFont("helvetica", "bold");
    doc.text("Date:", 14, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(order.created_at).toLocaleDateString("en-IN"), 50, startY + 6);
    
    doc.setFont("helvetica", "bold");
    doc.text("Payment:", 14, startY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Payment'} (${order.payment_status})`, 50, startY + 12);

    // Billed To
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 130, startY);
    doc.setFont("helvetica", "normal");
    doc.text(addr.fullName || "Customer", 130, startY + 6);
    doc.text(addr.email || "", 130, startY + 12);
    if (addr.phone) doc.text(addr.phone, 130, startY + 18);
    
    if (addr.addressLine) {
      doc.text(addr.addressLine, 130, startY + 24);
      doc.text(`${addr.city}, ${addr.state} ${addr.pinCode}`, 130, startY + 30);
    }
    
    startY = Math.max(startY + 24, startY + 36);

    // Items Table
    const tableData = order.order_items.map((item: any) => [
      item.product_name_snapshot,
      item.quantity.toString(),
      `INR ${Number(item.unit_price_snapshot).toLocaleString("en-IN")}`,
      `INR ${(Number(item.unit_price_snapshot) * Number(item.quantity)).toLocaleString("en-IN")}`
    ]);

    // @ts-ignore
    doc.autoTable({
      startY: startY,
      head: [['Item', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [155, 170, 140], textColor: 255 }, // Sage color
      alternateRowStyles: { fillColor: [250, 246, 239] },
      styles: { font: 'helvetica', fontSize: 10, textColor: [62, 44, 34] },
    });

    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;
    
    // Totals
    const rightAlign = 196;
    
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, finalY);
    doc.text(`INR ${Number(order.subtotal).toLocaleString("en-IN")}`, rightAlign, finalY, { align: "right" });
    
    if (order.discount > 0) {
      finalY += 6;
      doc.setTextColor(155, 170, 140); // Sage
      doc.text("Discount:", 140, finalY);
      doc.text(`- INR ${Number(order.discount).toLocaleString("en-IN")}`, rightAlign, finalY, { align: "right" });
      doc.setTextColor(62, 44, 34); // Reset
    }
    
    finalY += 6;
    doc.text("Shipping:", 140, finalY);
    doc.text(Number(order.shipping_fee) === 0 ? "FREE" : `INR ${Number(order.shipping_fee).toLocaleString("en-IN")}`, rightAlign, finalY, { align: "right" });
    
    if (order.cod_fee && order.cod_fee > 0) {
      finalY += 6;
      doc.text("COD Fee:", 140, finalY);
      doc.text(`INR ${Number(order.cod_fee).toLocaleString("en-IN")}`, rightAlign, finalY, { align: "right" });
    }
    
    finalY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 140, finalY);
    doc.text(`INR ${Number(order.total).toLocaleString("en-IN")}`, rightAlign, finalY, { align: "right" });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 86, 72);
    doc.text("Thank you for supporting handmade. ♡", 105, 280, { align: "center" });
    doc.text("orders@cozycrafts.shop | https://www.cozycrafts.shop", 105, 285, { align: "center" });

    // Generate PDF as array buffer
    const pdfOutput = doc.output("arraybuffer");
    
    return new NextResponse(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.public_order_number}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("[invoice] server error:", err);
    return new NextResponse("Server error generating invoice.", { status: 500 });
  }
}
