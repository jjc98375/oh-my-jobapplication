import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ApplicationList } from "@/components/application-list";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("applied_at", { ascending: false })
    .limit(50);

  const todayStart = new Date().toISOString().split("T")[0];
  const { count: todayCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .gte("applied_at", todayStart);

  const { count: totalApplied } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "applied");

  const { count: totalFailed } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "failed");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{todayCount ?? 0}/{session.user.dailyLimit}</div>
          <div className="text-sm text-gray-500 mt-1">Applied Today</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{totalApplied ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Applied</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{totalFailed ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Failed</div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          <strong>Chrome Extension:</strong> Install the oh-my-jobapplication extension to start auto-applying.
        </p>
      </div>
      <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
      <ApplicationList applications={applications ?? []} />
    </div>
  );
}
