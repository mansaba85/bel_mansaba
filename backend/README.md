# Backend School Bell Scheduler

Backend ini menggunakan Node.js (Express) dan MySQL (Sequelize) untuk menyimpan data jadwal bel sekolah.

## Fitur
- Otomatis membuat tabel MySQL saat dijalankan.
- Otomatis mengisi data awal jika database kosong.
- API untuk mengambil dan menyimpan data jadwal.

## Persiapan di aaPanel

1.  **Buat Database MySQL:**
    - Buka menu **Databases** di aaPanel.
    - Klik **Add Database**.
    - Nama Database: `school_bell` (atau sesuaikan).
    - Username & Password: Catat untuk konfigurasi `.env`.

2.  **Upload File Backend:**
    - Upload seluruh isi folder `backend` ke server aaPanel (misal ke `/www/wwwroot/school-bell-backend`).

3.  **Konfigurasi Environment (`.env`):**
    - Buat file `.env` di dalam folder backend di server.
    - Isi dengan konfigurasi berikut:
      ```env
      PORT=5002
      DB_HOST=localhost
      DB_USER=nama_user_mysql
      DB_PASSWORD=password_mysql
      DB_NAME=school_bell
      ```

4.  **Install Node.js Version Manager:**
    - Jika belum ada, install **Node.js Version Manager** dari App Store aaPanel.
    - Install Node.js versi terbaru (v18 ke atas disarankan).

5.  **Setup Node.js Project:**
    - Buka menu **Website** -> **Node.js Project**.
    - Klik **Add Node Project**.
    - **Path:** Pilih folder tempat Anda mengupload backend.
    - **Project Name:** `school-bell-backend`.
    - **Run Command:** `npm run start`.
    - **Port:** `5002`.
    - **User:** `www`.
    - Klik **Confirm**.

6.  **Buka Port di Firewall:**
    - Buka menu **Security** di aaPanel.
    - Tambahkan port `5002` (TCP) agar bisa diakses dari luar (atau gunakan Reverse Proxy di aaPanel jika ingin menggunakan domain).

## API Endpoints
- `GET /api/data`: Mengambil semua data (schoolName, activeScheduleCategory, schedules).
- `POST /api/save`: Menyimpan data. Body: `{ schoolName, activeScheduleCategory, schedules }`.

## Catatan
- Pastikan Anda sudah menjalankan `npm install` di dalam folder backend sebelum menjalankan project.
- Jika menggunakan `tsx`, pastikan sudah terinstall (sudah ada di `devDependencies`).
