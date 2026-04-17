import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function parseIntClamped(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = parseInt(value ?? "", 10);
  if (isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

async function resolveUserFromToken(token: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, daily_limit, apps_today")
    .eq("extension_token", token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = parseIntClamped(url.searchParams.get("limit"), 50, 1, 100);
  const offset = parseIntClamped(url.searchParams.get("offset"), 0, 0, 100000);

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("applied_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
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

  const userData = await resolveUserFromToken(token);
  if (!userData) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.job_url || typeof body.job_url !== "string") {
    return NextResponse.json({ error: "job_url is required" }, { status: 400 });
  }

  const validStatuses = ["applied", "pending", "failed", "skipped"];
  const status = typeof body.status === "string" && validStatuses.includes(body.status)
    ? body.status
    : "applied";

  const validPlatforms = ["linkedin", "indeed", "jobright", "other"];
  const platform = typeof body.platform === "string" && validPlatforms.includes(body.platform)
    ? body.platform
    : "other";

  // Atomic daily limit check + increment (only for successful applications)
  if (status === "applied") {
    const { data: limitResult, error: limitError } = await supabase
      .rpc("try_increment_apps_today", { p_user_id: userData.id });

    if (limitError) {
      return NextResponse.json({ error: "Failed to check daily limit" }, { status: 500 });
    }

    if (!limitResult?.[0]?.success) {
      return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
    }
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userData.id,
      job_url: body.job_url,
      company_name: typeof body.company_name === "string" ? body.company_name : null,
      job_title: typeof body.job_title === "string" ? body.job_title : null,
      job_description: typeof body.job_description === "string" ? body.job_description : null,
      status,
      failure_reason: typeof body.failure_reason === "string" ? body.failure_reason : null,
      questions_answered: Array.isArray(body.questions_answered) ? body.questions_answered : [],
      source_url: typeof body.source_url === "string" ? body.source_url : null,
      platform,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
