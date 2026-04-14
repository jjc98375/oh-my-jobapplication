import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function resolveUserId(req: Request): Promise<string | null> {
  // Try session auth first (web app)
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  // Fall back to Bearer token auth (extension)
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("extension_token", token)
    .single();

  return data?.id ?? null;
}

export async function GET(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = [
    "phone", "location", "work_experience", "education",
    "skills", "work_authorization", "salary_expectation", "willing_to_relocate",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json(data);
}
