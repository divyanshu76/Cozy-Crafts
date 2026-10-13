"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCourierServiceability,
  assignAwb,
  requestPickup,
  generateLabel,
  generateManifest,
  reconcileShiprocketCancellation,
} from "@/lib/shiprocket/client";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );
  const { data: { session } } = await authClient.auth.getSession();
  if (!session) throw new Error("Admin authorization failed: No session");
  
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") throw new Error("Admin authorization failed: Not an admin");
  
  // Return service role client for actual operations
  return getSupabaseServerClient();
}

// ── 1. Fetch Courier Serviceability ───────────────────────────────────────
export async function fetchCouriersAction(orderId: string, srOrderId: string) {
  try {
    await verifyAdmin();
    const res = await getCourierServiceability(srOrderId);
    return { success: true, data: res.data.available_courier_companies };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to fetch couriers";
    return { success: false, error: errMsg };
  }
}

// ── 2. Assign AWB ─────────────────────────────────────────────────────────
export async function assignAwbAction(orderId: string, srShipmentId: string, courierId: number) {
  try {
    const supabase = await verifyAdmin();
    
    // Check if order is cancelled or already assigned
    const { data: order } = await supabase.from("orders").select("awb_number, status").eq("id", orderId).single();
    if (order?.status === "CANCELLED") {
      return { success: false, error: "Cannot assign AWB: Order is CANCELLED." };
    }
    if (order?.awb_number) {
      return { success: true };
    }

    const res = await assignAwb(Number(srShipmentId), courierId);
    // assignAwb now throws a detailed error if AWB assignment fails
    // or if awb_code is missing.

    // Persist AWB
    await supabase.from("orders").update({
      awb_number: res.awb_code,
      courier_name: res.courier_name,
      shiprocket_courier_id: res.courier_company_id.toString(),
    }).eq("id", orderId);

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to assign AWB";
    return { success: false, error: errMsg };
  }
}

// ── 3. Request Pickup ─────────────────────────────────────────────────────
export async function requestPickupAction(orderId: string, srShipmentId: string) {
  try {
    const supabase = await verifyAdmin();

    // Verify AWB exists, order is not cancelled, and pickup isn't already requested
    const { data: order } = await supabase.from("orders").select("awb_number, shipping_status, status").eq("id", orderId).single();
    if (order?.status === "CANCELLED") return { success: false, error: "Cannot request pickup: Order is CANCELLED." };
    if (!order?.awb_number) return { success: false, error: "AWB must be assigned before requesting pickup." };
    if (order.shipping_status === "PICKUP_SCHEDULED" || order.shipping_status === "PICKED_UP") {
      return { success: false, error: "Pickup is already requested." };
    }

    const res = await requestPickup(Number(srShipmentId));
    
    // Update status to PICKUP_SCHEDULED
    await supabase.from("orders").update({
      shipping_status: "PICKUP_SCHEDULED",
      shiprocket_pickup_scheduled_date: res.pickup_scheduled_date ? new Date(res.pickup_scheduled_date).toISOString() : new Date().toISOString()
    }).eq("id", orderId);

    // Call RPC to log history
    await supabase.rpc("log_status_change", {
      p_order_id: orderId,
      p_status_type: "shipping_status",
      p_old_value: order.shipping_status,
      p_new_value: "PICKUP_SCHEDULED",
      p_source: "admin_manual",
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to request pickup";
    return { success: false, error: errMsg };
  }
}

// ── 4. Generate Label ─────────────────────────────────────────────────────
export async function generateLabelAction(orderId: string, srShipmentId: string) {
  try {
    const supabase = await verifyAdmin();
    
    // Check if label already generated
    const { data: order } = await supabase.from("orders").select("shiprocket_label_url").eq("id", orderId).single();
    if (order?.shiprocket_label_url) {
      return { success: false, error: "Label is already generated." };
    }

    const res = await generateLabel(Number(srShipmentId));
    if (!res?.label_url) throw new Error("Invalid Label response from Shiprocket");

    await supabase.from("orders").update({
      shiprocket_label_url: res.label_url,
    }).eq("id", orderId);

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, url: res.label_url };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to generate label";
    return { success: false, error: errMsg };
  }
}

// ── 5. Generate Manifest ──────────────────────────────────────────────────
export async function generateManifestAction(orderId: string, srShipmentId: string) {
  try {
    const supabase = await verifyAdmin();
    
    // Check if manifest already generated
    const { data: order } = await supabase.from("orders").select("shiprocket_manifest_url").eq("id", orderId).single();
    if (order?.shiprocket_manifest_url) {
      return { success: false, error: "Manifest is already generated." };
    }

    const res = await generateManifest(Number(srShipmentId));
    if (!res?.manifest_url) throw new Error("Invalid Manifest response from Shiprocket");

    await supabase.from("orders").update({
      shiprocket_manifest_url: res.manifest_url,
    }).eq("id", orderId);

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, url: res.manifest_url };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to generate manifest";
    return { success: false, error: errMsg };
  }
}

// ── 6. Reconcile / Retry Shiprocket Cancellation ──────────────────────────
export async function reconcileShiprocketCancelAction(orderId: string) {
  try {
    const supabase = await verifyAdmin();

    const { data: order } = await supabase
      .from("orders")
      .select("id, status, shiprocket_order_id, shiprocket_shipment_id, shipping_status, internal_notes")
      .eq("id", orderId)
      .single();

    if (!order) return { success: false, error: "Order not found." };
    if (order.status !== "CANCELLED") {
      return { success: false, error: "Only locally cancelled orders can be reconciled." };
    }
    if (!order.shiprocket_order_id) {
      return { success: false, error: "Order does not have a linked Shiprocket order ID." };
    }

    const shipmentId = order.shiprocket_shipment_id ? Number(order.shiprocket_shipment_id) : null;
    const result = await reconcileShiprocketCancellation(order.shiprocket_order_id, shipmentId);

    let srCancelStatus: string;
    let srCancelNote: string;

    switch (result.status) {
      case "cancelled":
        srCancelStatus = "SR_CANCELLED";
        srCancelNote = `Reconciliation: Shiprocket order ${order.shiprocket_order_id} cancelled successfully. ${result.message}`;
        await supabase.from("orders").update({ shipping_status: "CANCELLED" }).eq("id", orderId);
        break;
      case "already_cancelled":
        srCancelStatus = "SR_ALREADY_CANCELLED";
        srCancelNote = `Reconciliation: Shiprocket order ${order.shiprocket_order_id} was already cancelled. ${result.message}`;
        await supabase.from("orders").update({ shipping_status: "CANCELLED" }).eq("id", orderId);
        break;
      case "not_cancellable":
        srCancelStatus = "SR_NOT_CANCELLABLE";
        srCancelNote = `Reconciliation: Shiprocket order ${order.shiprocket_order_id} cannot be cancelled automatically (${result.message}). Please cancel manually in Shiprocket dashboard.`;
        break;
      case "unknown":
        srCancelStatus = "SR_CANCEL_UNKNOWN";
        srCancelNote = `Reconciliation: Shiprocket outcome still ambiguous (${result.message}). Please check Shiprocket dashboard.`;
        break;
      case "error":
      default:
        srCancelStatus = "SR_CANCEL_FAILED";
        srCancelNote = `Reconciliation: Shiprocket cancellation attempt failed (${result.message}). Check Shiprocket dashboard.`;
    }

    await supabase.rpc("log_status_change", {
      p_order_id: orderId,
      p_status_type: "shipping_status",
      p_old_value: order.shipping_status,
      p_new_value: srCancelStatus,
      p_source: "admin_shiprocket_reconcile",
    });

    const existingNotes = order.internal_notes ?? "";
    const separator = existingNotes ? "\n\n" : "";
    await supabase
      .from("orders")
      .update({ internal_notes: `${existingNotes}${separator}[${new Date().toISOString()}] ${srCancelNote}` })
      .eq("id", orderId);

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, status: result.status, message: srCancelNote };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Reconciliation failed.";
    return { success: false, error: errMsg };
  }
}
