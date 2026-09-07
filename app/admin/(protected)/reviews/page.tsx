import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CheckCircle, XCircle, Clock } from "lucide-react";

async function setReviewStatus(reviewId: string, status: "approved" | "rejected") {
  "use server";
  const supabase = getSupabaseServerClient();
  await supabase.from("reviews").update({ status }).eq("id", reviewId);
  revalidatePath("/admin/reviews");
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  approved: <CheckCircle className="h-4 w-4 text-sage" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

export default async function AdminReviewsPage() {
  const supabase = getSupabaseServerClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, body, status, verified, created_at, product_id, products(name)")
    .order("created_at", { ascending: false });

  const pending = (reviews ?? []).filter((r) => r.status === "pending");
  const rest = (reviews ?? []).filter((r) => r.status !== "pending");
  const ordered = [...pending, ...rest];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-espresso">Reviews</h1>
        <span className="text-sm text-amber-600 font-medium">
          {pending.length} pending approval
        </span>
      </div>

      <div className="space-y-4">
        {ordered.map((review) => {
          const product = review.products as { name?: string } | null;
          const approveAction = setReviewStatus.bind(null, review.id, "approved");
          const rejectAction = setReviewStatus.bind(null, review.id, "rejected");

          return (
            <div
              key={review.id}
              className={`bg-white rounded-xl border shadow-sm p-5 ${
                review.status === "pending" ? "border-amber-200" : "border-taupe/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {STATUS_ICONS[review.status]}
                    <span className="font-semibold text-espresso">{review.customer_name}</span>
                    <span className="text-xs text-espresso-soft">for</span>
                    <span className="text-xs font-medium text-sage">{product?.name ?? review.product_id}</span>
                    {review.verified && (
                      <span className="text-xs bg-sage/10 text-sage px-1.5 py-0.5 rounded">Verified</span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-amber-400" : "text-taupe/30"}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-espresso-soft">{review.body}</p>
                  <p className="text-xs text-taupe mt-2">
                    {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {review.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <form action={approveAction}>
                      <button type="submit" className="flex items-center gap-1 text-xs bg-sage text-white px-3 py-1.5 rounded-lg hover:bg-sage/80 transition-colors">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </button>
                    </form>
                    <form action={rejectAction}>
                      <button type="submit" className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {ordered.length === 0 && (
          <div className="text-center text-espresso-soft py-12">No reviews yet.</div>
        )}
      </div>
    </div>
  );
}
