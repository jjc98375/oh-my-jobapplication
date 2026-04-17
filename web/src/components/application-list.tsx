import type { Application } from "@/lib/types";

const statusColors: Record<Application["status"], string> = {
  applied: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-gray-100 text-gray-800",
};

export function ApplicationList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No applications yet.</p>
        <p className="text-sm mt-2">Paste a job listing URL in the Chrome extension to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{app.job_title ?? "Untitled"}</div>
            <div className="text-sm text-gray-500">
              {app.company_name ?? "Unknown company"} &middot; {app.platform}
            </div>
            {app.failure_reason && (
              <div className="text-sm text-red-500 mt-1">{app.failure_reason}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[app.status]}`}>
              {app.status}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(app.applied_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
