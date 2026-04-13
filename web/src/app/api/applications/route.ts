import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("applied_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .gte("applied_at", new Date().toISOString().split("T")[0]);

  return NextResponse.json({ applications: data, todayCount: count ?? 0 });
}

export async function POST(req: Request) {
  // Called by Chrome extension to report application results
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error: authError } = await supabase
    .from("users")
    .select("id, daily_limit, apps_today")
    .eq("id", token)
    .single();

  if (authError || !userData) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (userData.apps_today >= userData.daily_limit) {
    return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userData.id,
      job_url: body.job_url,
      company_name: body.company_name ?? null,
      job_title: body.job_title ?? null,
      job_description: body.job_description ?? null,
      status: body.status ?? "applied",
      failure_reason: body.failure_reason ?? null,
      questions_answered: body.questions_answered ?? [],
      source_url: body.source_url ?? null,
      platform: body.platform ?? "other",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status === "applied") {
    await supabase
      .from("users")
      .update({ apps_today: userData.apps_today + 1 })
      .eq("id", userData.id);
  }

  return NextResponse.json(data, { status: 201 });
}
