# Panduan Deployment di aaPanel (bel.manubanyuputih.id)

Untuk menjalankan project ini dengan domain `bel.manubanyuputih.id`, ikuti langkah-langkah berikut:

## 1. Build Frontend (React/Vite)
Di terminal server (folder `/www/wwwroot/app/bel/`), jalankan perintah:
```bash
npm install
npm run build
```
Ini akan menghasilkan folder `dist` di dalam `/www/wwwroot/app/bel/`.

## 2. Setup Backend & Database (MySQL)
- Buat database MySQL baru di VPS/aaPanel (misalnya bernama `school_bell`).
- Pastikan folder `backend` sudah ada di server.
- Jalankan `npm install` di dalam folder `backend`.
- Buat file `.env` di dalam folder `backend` dengan isi:
  ```env
  PORT=3000
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=username_db_vps_anda
  DB_PASSWORD=password_db_vps_anda
  DB_NAME=school_bell
  NODE_ENV=production
  ```
- Di aaPanel, buka menu **Node.js Project** -> **Add Node Project**:
    - **Path:** `/www/wwwroot/app/bel/backend`
    - **Run Command:** `npm run start`
    - **Port:** `3000` (atau port pilihan Anda)
    - **Project Name:** `school-bell-backend`

### Solusi Jika Backend Gagal Terhubung ke Database di VPS Baru:
1. **Database Belum Dibuat**: Buat database `school_bell` terlebih dahulu di MySQL/aaPanel.
2. **Kredensial `.env` Tidak Sesuai**: Di VPS baru, username & password MySQL berbeda dari VPS sebelumnya. Pastikan `DB_USER` dan `DB_PASSWORD` di file `backend/.env` telah disesuaikan dengan kredensial MySQL VPS baru.
3. **Password Kosong / Root**: MySQL di Linux/aaPanel melarang login `root` tanpa password via TCP. Selalu buat user & password khusus database tersebut.
4. **Restart Service Backend**: Setelah membuat/mengubah file `backend/.env`, restart service Node.js di PM2 / aaPanel Node.js Project manager.

## 3. Konfigurasi Website di aaPanel
Buka menu **Website** -> Klik pada domain `bel.manubanyuputih.id`:

### A. Ubah Site Directory
- Klik tab **Site Directory**.
- Ubah **Site Directory** menjadi: `/www/wwwroot/app/bel/dist`
- Klik **Save**.
- *Sekarang, ketika Anda mengakses domain, tampilan frontend akan muncul.*

### B. Tambahkan Reverse Proxy (Untuk API)
Agar frontend bisa berkomunikasi dengan backend, kita perlu mem-proxy request ke port `3000`.
- Klik tab **Reverse Proxy** -> **Add Reverse Proxy**.
- **Proxy Name:** `api-proxy`
- **Target URL:** `http://127.0.0.1:3000` (Sesuaikan dengan port yang Anda gunakan di Node.js Manager)
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
