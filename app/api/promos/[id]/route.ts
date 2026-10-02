import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, validatePromoInput } from "@/lib/voucher";

function err(e: any) {
  if (e instanceof ApiError)
    return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
  throw e;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const row = await prisma.promo.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "TIDAK_DITEMUKAN", message: "Promo tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const row = await prisma.promo.findUnique({ where: { id } });
    if (!row) throw new ApiError(404, "TIDAK_DITEMUKAN", "Promo tidak ditemukan");
    const body = await req.json().catch(() => null);
    const data = validatePromoInput(body);
    if (data.kode !== row.kode) {
      const clash = await prisma.promo.findUnique({ where: { kode: data.kode } });
      if (clash) throw new ApiError(409, "KODE_SUDAH_ADA", `Kode ${data.kode} sudah dipakai`);
    }
    if (data.kuotaTotal !== null && data.kuotaTotal < row.terpakai)
      throw new ApiError(400, "VALIDASI_GAGAL", `kuotaTotal tidak boleh di bawah jumlah terpakai (${row.terpakai})`);
    const updated = await prisma.promo.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return err(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const row = await prisma.promo.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "TIDAK_DITEMUKAN", message: "Promo tidak ditemukan" }, { status: 404 });
  await prisma.promo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
