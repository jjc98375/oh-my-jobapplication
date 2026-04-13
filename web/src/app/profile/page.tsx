import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (!profile) redirect("/");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <p className="text-gray-500 mb-8">
        Fill out your information below. The AI agent will use this to fill job applications.
      </p>
      <ProfileForm initial={profile} />
    </div>
  );
}
