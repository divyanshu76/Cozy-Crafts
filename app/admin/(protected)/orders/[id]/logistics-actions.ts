"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCourierServiceability,
  assignAwb,
  requestPickup,
  generateLabel,
  generateManifest,
} from "@/lib/shiprocket/client";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") throw new Error("Unauthorized");
  return supabase;
}

// ── 1. Fetch Courier Serviceability ───────────────────────────────────────
export async function fetchCouriersAction(orderId: string, srOrderId: string) {
  try {
    await verifyAdmin();
    const res = await getCourierServiceability(srOrderId);
    return { success: true, data: res.data.available_courier_companies };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch couriers" };
  }
}

// ── 2. Assign AWB ─────────────────────────────────────────────────────────
export async function assignAwbAction(orderId: string, srShipmentId: string, courierId: number) {
  try {
    const supabase = await verifyAdmin();
    
    // Check if already assigned
    const { data: order } = await supabase.from("orders").select("awb_number").eq("id", orderId).single();
    if (order?.awb_number) {
      return { success: false, error: "AWB is already assigned." };
    }

    const res = await assignAwb(Number(srShipmentId), courierId);
    if (!res?.awb_code) throw new Error("Invalid AWB response from Shiprocket");

    // Persist AWB
    await supabase.from("orders").update({
      awb_number: res.awb_code,
      courier_name: res.courier_name,
      shiprocket_courier_id: res.courier_company_id.toString(),
    }).eq("id", orderId);

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to assign AWB" };
  }
}

// ── 3. Request Pickup ─────────────────────────────────────────────────────
export async function requestPickupAction(orderId: string, srShipmentId: string) {
  try {
    const supabase = await verifyAdmin();

    // Verify AWB exists and pickup isn't already requested
    const { data: order } = await supabase.from("orders").select("awb_number, shipping_status").eq("id", orderId).single();
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
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to request pickup" };
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
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to generate label" };
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
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to generate manifest" };
  }
}
