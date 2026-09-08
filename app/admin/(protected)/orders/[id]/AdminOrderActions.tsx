"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export function AdminNotesForm({
  initialNotes,
  updateNotesAction,
}: {
  initialNotes: string;
  updateNotesAction: (notes: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd: FormData) => {
        startTransition(async () => {
          await updateNotesAction((fd.get("notes") as string) ?? "");
        });
      }}
    >
      <textarea
        name="notes"
        defaultValue={initialNotes}
        rows={4}
        className="w-full border border-taupe/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 resize-none"
        placeholder="Private notes visible only to admins…"
      />
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 text-sm bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/80 transition-colors disabled:opacity-70 flex items-center gap-2"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Saving..." : "Save Notes"}
      </button>
    </form>
  );
}

export function AdminStatusForm({
  currentStatus,
  allStatuses,
  updateStatusAction,
}: {
  currentStatus: string;
  allStatuses: string[];
  updateStatusAction: (status: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd: FormData) => {
        startTransition(async () => {
          await updateStatusAction(fd.get("status") as string);
        });
      }}
    >
      <select
        name="status"
        defaultValue={currentStatus}
        className="w-full border border-taupe/30 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sage/30"
      >
        {allStatuses.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm border border-taupe/30 text-espresso px-4 py-2 rounded-lg hover:bg-cream-soft transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Updating..." : "Update Master Status"}
      </button>
    </form>
  );
}
