import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);
  const flags = await prisma.abuseFlag.findMany({ orderBy: { id: "desc" }, take: limit });
  const attempts = await prisma.redeemAttempt.findMany({ orderBy: { id: "desc" }, take: limit });
  const t = nowIso();
  const flagsAktif = flags.filter((f) => f.aktif && f.diblokirSampai && f.diblokirSampai > t).length;
  return NextResponse.json({ flags, attempts, flagsAktif });
}
