import { auth, signIn, signOut } from "@/lib/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <a href="/" className="font-bold text-xl">
          oh-my-jobapplication
        </a>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <a href="/dashboard" className="text-sm hover:underline">
                Dashboard
              </a>
              <a href="/profile" className="text-sm hover:underline">
                Profile
              </a>
              <span className="text-sm text-gray-500">
                {session.user.appsToday}/{session.user.dailyLimit} today
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button className="text-sm text-red-600 hover:underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Sign in with Google
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("linkedin");
                }}
              >
                <button className="px-3 py-1.5 bg-sky-700 text-white text-sm rounded hover:bg-sky-800">
                  Sign in with LinkedIn
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
