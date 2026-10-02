# Voucher & Kupon Engine

Mesin voucher/kupon untuk e-commerce kecil: kelola kode promo dengan aturan
fleksibel, simulasi checkout yang menerapkan voucher secara atomik (kuota
tidak jebol saat redeem bersamaan), deteksi penyalahgunaan, dan laporan
efektivitas tiap kode promo.

Stack: Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000.

Catatan VM ini: download binary Prisma sering gagal (ECONNRESET), jadi pakai
`npm install --ignore-scripts` lalu salin engine dari
`~/workspace/ts-convert/prisma-engines/` ke `node_modules/@prisma/engines/`
sebelum `npx prisma generate`.

## Halaman

| Halaman | Fungsi |
|---|---|
| `/` | Dashboard ringkasan |
| `/promo` | Kelola kode promo (CRUD + aturan) |
| `/simulasi` | Simulasi checkout / redeem voucher |
| `/flag` | Daftar flag penyalahgunaan + log percobaan |
| `/laporan` | Efektivitas per kode promo |

## API

| Method & Path | Fungsi |
|---|---|
| `GET /api/promos` | Daftar promo |
| `POST /api/promos` | Buat promo |
| `GET /api/promos/:id` | Detail promo |
| `PUT /api/promos/:id` | Ubah promo |
| `DELETE /api/promos/:id` | Hapus promo |
| `POST /api/checkout` | Simulasi checkout + redeem atomik |
| `GET /api/flags` | Daftar flag + log percobaan |
| `POST /api/flags/:id/unblock` | Cabut blokir manual |
| `GET /api/reports/promo-summary` | Efektivitas per kode |

Contoh redeem:

```bash
curl -X POST http://localhost:3000/api/checkout -H 'Content-Type: application/json' -d '{
  "userId": "user-1",
  "kode": "HEMAT10",
  "items": [
    {"nama": "Kopi 250g", "kategori": "makanan", "harga": 60000, "qty": 2}
  ]
}'
```

## Aturan redeem (urutan validasi)

403 user diblokir → 404 kode tidak dikenal → 422 nonaktif/belum
berlaku/kedaluwarsa → 409 kuota habis → 422 kategori tidak cocok →
422 minimal belanja → 409 batas per pengguna. Kuota dikonsumsi via
conditional update atomik sehingga redeem paralel tidak menjebol kuota.
