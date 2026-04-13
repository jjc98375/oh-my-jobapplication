import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold mb-4">Auto-Apply to Jobs with AI</h1>
      <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
        Paste a job listing URL, and our AI agent applies for you —
        filling forms, answering screening questions, and submitting applications in your browser.
      </p>
      <div className="flex gap-4 justify-center">
        <a href="/api/auth/signin" className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700">
          Get Started Free
        </a>
      </div>
      <p className="text-sm text-gray-400 mt-4">10 applications/day free. No credit card required.</p>
      <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-left">
        <div>
          <div className="text-3xl mb-2">1.</div>
          <h3 className="font-semibold mb-1">Fill Your Profile</h3>
          <p className="text-sm text-gray-500">Add your experience, education, and skills. The agent uses this to fill applications.</p>
        </div>
        <div>
          <div className="text-3xl mb-2">2.</div>
          <h3 className="font-semibold mb-1">Paste a URL</h3>
          <p className="text-sm text-gray-500">Copy a job listing page from LinkedIn, Indeed, or any job board into the extension.</p>
        </div>
        <div>
          <div className="text-3xl mb-2">3.</div>
          <h3 className="font-semibold mb-1">Watch It Apply</h3>
          <p className="text-sm text-gray-500">The agent fills forms, answers questions, and submits. Pause or stop anytime.</p>
        </div>
      </div>
    </div>
  );
}
