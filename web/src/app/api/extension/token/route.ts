import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    token: session.user.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      dailyLimit: session.user.dailyLimit,
      appsToday: session.user.appsToday,
    },
  });
}
