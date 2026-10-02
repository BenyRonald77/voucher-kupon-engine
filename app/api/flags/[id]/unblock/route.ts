import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const flag = await prisma.abuseFlag.findUnique({ where: { id } });
  if (!flag)
    return NextResponse.json({ error: "TIDAK_DITEMUKAN", message: "Flag tidak ditemukan" }, { status: 404 });
  const updated = await prisma.abuseFlag.update({
    where: { id },
    data: { aktif: false, diblokirSampai: null },
  });
  return NextResponse.json(updated);
}
