import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a cryptographically random token
  const token = randomBytes(32).toString("hex");

  // Store the token in the database
  const { error } = await supabase
    .from("users")
    .update({ extension_token: token })
    .eq("id", session.user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }

  return NextResponse.json({
    token,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      dailyLimit: session.user.dailyLimit,
      appsToday: session.user.appsToday,
    },
  });
}
