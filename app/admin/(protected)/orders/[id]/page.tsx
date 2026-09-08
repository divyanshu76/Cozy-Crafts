import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Package, Truck, FileText } from "lucide-react";
import Link from "next/link";
import { CreateShipmentButton } from "./CreateShipmentButton";
import { AdminNotesForm, AdminStatusForm } from "./AdminOrderActions";
import { sendOrderEmail } from "@/lib/notifications/send-order-email";
import { generateOrderToken } from "@/lib/crypto";

// Valid order_status enum values as of migration 0002
const ALL_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "CANCELLED",
  "REFUNDED",
];

// ── Re-validate admin role in every server action ───────────────────────────
async function assertAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") redirect("/admin/login");
}

// ── Server actions ───────────────────────────────────────────────────────────
async function updateOrderStatus(orderId: string, newStatus: string) {
  "use server";
  await assertAdmin();
  const supabase = getSupabaseServerClient();

  // Fetch current status for audit log
  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  const oldStatus = currentOrder?.status ?? "UNKNOWN";

  await supabase
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  // Log the status change for audit trail
  await supabase.rpc("log_status_change", {
    p_order_id: orderId,
    p_status_type: "order_status",
    p_old_value: oldStatus,
    p_new_value: newStatus,
    p_source: "admin_manual",
  });

  // Send appropriate email notification based on new status.
  // sendOrderEmail is idempotent — safe to call even if webhook already sent it.
  if (newStatus === "CANCELLED") {
    await sendOrderEmail(orderId, "ORDER_CANCELLED");
  } else if (newStatus === "CONFIRMED" || newStatus === "PAID") {
    await sendOrderEmail(orderId, "ORDER_CONFIRMED");
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
}

async function updateTracking(orderId: string, trackingNumber: string, courier: string) {
  "use server";
  await assertAdmin();
  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({
    tracking_number: trackingNumber || null,
    courier: courier || null,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

async function updateNotes(orderId: string, notes: string) {
  "use server";
  await assertAdmin();
  const supabase = getSupabaseServerClient();
  await supabase.from("orders").update({ internal_notes: notes, updated_at: new Date().toISOString() }).eq("id", orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `*, 
      order_items(*),
      customers(email, phone, full_name),
      payments(razorpay_order_id, razorpay_payment_id, status, amount),
      order_status_history(*),
      email_log(*)`
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  const customer = order.customers as { email?: string; phone?: string; full_name?: string } | null;
  const payments = (order.payments ?? []) as { razorpay_order_id?: string; razorpay_payment_id?: string; status: string; amount: number }[];
  const address = order.shipping_address_snapshot as Record<string, string>;
  const history = (order.order_status_history as any[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const emails = (order.email_log as any[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const updateStatusAction = updateOrderStatus.bind(null, order.id);
  const updateNotesAction = updateNotes.bind(null, order.id);

  const invoiceToken = generateOrderToken(order.public_order_number);
  const invoiceUrl = `/api/invoice?order=${order.public_order_number}&token=${invoiceToken}`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-espresso-soft hover:text-espresso transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-serif text-3xl text-espresso flex items-center gap-3">
            Order <span className="font-mono text-sage">{order.public_order_number}</span>
            <span className="text-sm font-sans font-medium px-3 py-1 rounded-full bg-cream-soft border border-taupe/20">
              {order.status}
            </span>
          </h1>
        </div>
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-espresso border border-taupe/30 rounded-lg hover:bg-cream transition-colors shadow-sm w-fit"
        >
          <FileText className="h-4 w-4 text-sage" />
          Download Invoice
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm">
            <div className="p-5 border-b border-taupe/10">
              <h2 className="font-semibold text-espresso flex items-center gap-2">
                <Package className="h-4 w-4 text-sage" /> Items
              </h2>
            </div>
            <div className="divide-y divide-taupe/5">
              {order.order_items.map((item: {
                id: string;
                product_name_snapshot: string;
                product_image_snapshot?: string;
                unit_price_snapshot: number;
                quantity: number;
                line_total: number;
              }) => (
                <div key={item.id} className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-lg bg-cream-soft border border-taupe/20 shrink-0 overflow-hidden">
                    {item.product_image_snapshot && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product_image_snapshot} alt={item.product_name_snapshot} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-espresso text-sm">{item.product_name_snapshot}</p>
                    <p className="text-xs text-espresso-soft">Qty {item.quantity} × ₹{Number(item.unit_price_snapshot).toLocaleString("en-IN")}</p>
                  </div>
                  <p className="font-medium text-espresso">₹{Number(item.line_total).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-taupe/10 space-y-1 text-sm">
              <div className="flex justify-between text-espresso-soft">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sage">
                  <span>Discount</span>
                  <span>−₹{Number(order.discount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-espresso-soft">
                <span>Shipping</span>
                <span>{order.shipping_fee === 0 ? "Free" : `₹${order.shipping_fee}`}</span>
              </div>
              <div className="flex justify-between font-bold text-espresso pt-2 border-t border-taupe/10">
                <span>Total</span>
                <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5 max-h-[400px] overflow-y-auto">
              <h2 className="font-semibold text-espresso flex items-center gap-2 mb-4">
                History
              </h2>
              <div className="space-y-4">
                {history.map((h) => (
                  <div key={h.id} className="text-sm">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-medium text-espresso">{h.new_value}</span>
                      <span className="text-xs text-espresso-soft">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-espresso-soft">
                      {h.status_type.replace('_', ' ')} via {h.source}
                    </p>
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-espresso-soft">No history yet.</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5 max-h-[400px] overflow-y-auto">
              <h2 className="font-semibold text-espresso flex items-center gap-2 mb-4">
                Emails
              </h2>
              <div className="space-y-4">
                {emails.map((e) => (
                  <div key={e.id} className="text-sm border-l-2 pl-3 pb-1" style={{ borderColor: e.status === 'sent' ? '#7A9E7E' : e.status === 'failed' ? '#ef4444' : '#e5e7eb' }}>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-medium text-espresso truncate pr-2">{e.trigger}</span>
                      <span className="text-xs font-mono">{e.status}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-espresso-soft">
                        {new Date(e.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {e.attempts > 1 && <span className="text-xs text-amber-600">{e.attempts} attempts</span>}
                    </div>
                  </div>
                ))}
                {emails.length === 0 && <p className="text-sm text-espresso-soft">No emails triggered yet.</p>}
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
            <h2 className="font-semibold text-espresso flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-sage" /> Internal Notes
            </h2>
            <AdminNotesForm 
              initialNotes={order.internal_notes ?? ""} 
              updateNotesAction={async (notes: string) => {
                "use server";
                await updateNotesAction(notes);
              }} 
            />
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          
          {/* Split Status 1: Shipping */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
            <h2 className="font-semibold text-espresso mb-3 flex items-center gap-2">
               <Truck className="h-4 w-4 text-sage" /> Shipping
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-espresso-soft">Status</span>
                <span className="font-medium px-2 py-1 bg-cream-soft rounded border border-taupe/10">
                  {order.shipping_status}
                </span>
              </div>
              
              {order.awb_number ? (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-taupe/10">
                    <span className="text-espresso-soft">AWB</span>
                    <span className="font-mono text-espresso">{order.awb_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-espresso-soft">Courier</span>
                    <span className="text-espresso">{order.courier_name}</span>
                  </div>
                  {order.estimated_delivery_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-espresso-soft">EDD</span>
                      <span className="text-espresso">{order.estimated_delivery_date}</span>
                    </div>
                  )}
                </>
              ) : (
                <CreateShipmentButton orderId={order.id} orderStatus={order.status} />
              )}
            </div>
          </div>

          {/* Split Status 2: Order (Editable) */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
            <h2 className="font-semibold text-espresso mb-3">Order Status</h2>
            <AdminStatusForm 
              currentStatus={order.status}
              allStatuses={ALL_STATUSES}
              updateStatusAction={async (status: string) => {
                "use server";
                await updateStatusAction(status);
              }}
            />
            <p className="text-xs text-espresso-soft mt-3">
              Most updates happen automatically via webhooks. Only override this if something goes wrong.
            </p>
          </div>

          {/* Split Status 3: Payment (Read-only) */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
            <h2 className="font-semibold text-espresso mb-3">Payment</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-espresso-soft">Method</span>
                <span className="font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded border border-amber-200">
                  {order.payment_method || "PREPAID"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-taupe/10">
                <span className="text-espresso-soft">Status</span>
                <span className="font-medium px-2 py-1 bg-cream-soft rounded border border-taupe/10">
                  {order.payment_status}
                </span>
              </div>
              {payments[0]?.razorpay_order_id && (
                <div className="flex justify-between pt-2 border-t border-taupe/10">
                  <span className="text-espresso-soft">Razorpay Order</span>
                  <span className="font-mono text-xs text-espresso truncate max-w-[120px]">
                    {payments[0].razorpay_order_id}
                  </span>
                </div>
              )}
              {payments[0]?.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-espresso-soft">Payment ID</span>
                  <span className="font-mono text-xs text-espresso truncate max-w-[120px]">
                    {payments[0].razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
            <h2 className="font-semibold text-espresso mb-3">Customer</h2>
            <div className="space-y-1 text-sm">
              {customer?.full_name && <p className="font-medium text-espresso">{customer.full_name}</p>}
              {customer?.email && <p className="text-espresso-soft">{customer.email}</p>}
              {customer?.phone && <p className="text-espresso-soft">{customer.phone}</p>}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-5">
            <h2 className="font-semibold text-espresso mb-3">Shipping Address</h2>
            <address className="not-italic text-sm text-espresso-soft space-y-0.5">
              <p className="font-medium text-espresso">{address?.fullName}</p>
              <p>{address?.addressLine}</p>
              <p>{[address?.city, address?.state, address?.pinCode].filter(Boolean).join(", ")}</p>
              <p>{address?.phone}</p>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
