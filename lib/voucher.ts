export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseKategori(kategori?: string | null): string[] | null {
  if (!kategori || !kategori.trim()) return null;
  return kategori
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function validatePromoInput(body: any) {
  const errs: string[] = [];
  const kode = String(body?.kode ?? "").trim().toUpperCase();
  const nama = String(body?.nama ?? "").trim();
  const tipeDiskon = body?.tipeDiskon;
  const nilaiDiskon = Number(body?.nilaiDiskon);
  const minBelanja = body?.minBelanja == null ? 0 : Number(body?.minBelanja);
  const kategori =
    body?.kategori == null || String(body.kategori).trim() === ""
      ? null
      : String(body.kategori).trim().toLowerCase();
  const kuotaTotal =
    body?.kuotaTotal == null || body?.kuotaTotal === "" ? null : Number(body?.kuotaTotal);
  const batasPerUser = body?.batasPerUser == null ? 1 : Number(body?.batasPerUser);
  const mulaiBerlaku = String(body?.mulaiBerlaku ?? "");
  const selesaiBerlaku = String(body?.selesaiBerlaku ?? "");
  const aktif = body?.aktif == null ? true : Boolean(body?.aktif);

  if (!kode) errs.push("kode wajib diisi");
  if (!nama) errs.push("nama wajib diisi");
  if (tipeDiskon !== "persen" && tipeDiskon !== "nominal")
    errs.push("tipeDiskon harus 'persen' atau 'nominal'");
  if (!Number.isFinite(nilaiDiskon) || nilaiDiskon <= 0)
    errs.push("nilaiDiskon harus > 0");
  if (tipeDiskon === "persen" && nilaiDiskon > 100)
    errs.push("diskon persen maksimal 100");
  if (!Number.isFinite(minBelanja) || minBelanja < 0)
    errs.push("minBelanja harus >= 0");
  if (kuotaTotal !== null && (!Number.isInteger(kuotaTotal) || kuotaTotal < 0))
    errs.push("kuotaTotal harus bilangan bulat >= 0 atau kosong (tanpa batas)");
  if (!Number.isInteger(batasPerUser) || batasPerUser < 1)
    errs.push("batasPerUser harus bilangan bulat >= 1");
  if (!DATE_RE.test(mulaiBerlaku) || !DATE_RE.test(selesaiBerlaku))
    errs.push("mulaiBerlaku/selesaiBerlaku harus format YYYY-MM-DD");
  else if (mulaiBerlaku > selesaiBerlaku)
    errs.push("mulaiBerlaku tidak boleh setelah selesaiBerlaku");

  if (errs.length)
    throw new ApiError(400, "VALIDASI_GAGAL", errs.join("; "));

  return {
    kode,
    nama,
    tipeDiskon,
    nilaiDiskon,
    minBelanja,
    kategori,
    kuotaTotal,
    batasPerUser,
    mulaiBerlaku,
    selesaiBerlaku,
    aktif,
  };
}
