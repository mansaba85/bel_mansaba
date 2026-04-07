# Panduan Deployment di aaPanel (bel.manubanyuputih.id)

Untuk menjalankan project ini dengan domain `bel.manubanyuputih.id`, ikuti langkah-langkah berikut:

## 1. Build Frontend (React/Vite)
Di terminal server (folder `/www/wwwroot/app/bel/`), jalankan perintah:
```bash
npm install
npm run build
```
Ini akan menghasilkan folder `dist` di dalam `/www/wwwroot/app/bel/`.

## 2. Setup Backend (Node.js)
- Pastikan folder `backend` sudah ada di `/www/wwwroot/app/bel/backend`.
- Jalankan `npm install` di dalam folder `backend`.
- Buat file `.env` di dalam folder `backend` dengan konfigurasi MySQL Anda.
- Di aaPanel, buka menu **Node.js Project** -> **Add Node Project**:
    - **Path:** `/www/wwwroot/app/bel/backend`
    - **Run Command:** `npm run start`
    - **Port:** `5002`
    - **Project Name:** `school-bell-backend`

## 3. Konfigurasi Website di aaPanel
Buka menu **Website** -> Klik pada domain `bel.manubanyuputih.id`:

### A. Ubah Site Directory
- Klik tab **Site Directory**.
- Ubah **Site Directory** menjadi: `/www/wwwroot/app/bel/dist`
- Klik **Save**.
- *Sekarang, ketika Anda mengakses domain, tampilan frontend akan muncul.*

### B. Tambahkan Reverse Proxy (Untuk API)
Agar frontend bisa berkomunikasi dengan backend, kita perlu mem-proxy request `/api` ke port `5002`.
- Klik tab **Reverse Proxy** -> **Add Reverse Proxy**.
- **Proxy Name:** `api-proxy`
- **Target URL:** `http://127.0.0.1:5002`
- **Sent Domain:** `$host`
- Klik **Confirm**.

## 4. Konfigurasi Nginx (Opsional tapi Disarankan)
Jika Anda menggunakan React Router (SPA), tambahkan baris berikut di tab **Config** website Anda (di dalam blok `server {}`):
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Ringkasan Path:
- **Frontend (Static):** `/www/wwwroot/app/bel/dist` (Arahkan Website ke sini)
- **Backend (Node.js):** `/www/wwwroot/app/bel/backend` (Jalankan sebagai Node Project di port 5002)
