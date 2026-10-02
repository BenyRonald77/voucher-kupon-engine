import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, validatePromoInput } from "@/lib/voucher";
import { nowIso } from "@/lib/format";

export async function GET() {
  const rows = await prisma.promo.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const data = validatePromoInput(body);
    const exists = await prisma.promo.findUnique({ where: { kode: data.kode } });
    if (exists) throw new ApiError(409, "KODE_SUDAH_ADA", `Kode ${data.kode} sudah dipakai`);
    const created = await prisma.promo.create({
      data: { ...data, createdAt: nowIso() },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    throw e;
  }
}
