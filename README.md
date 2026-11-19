# ☕ Brew & Beans — Modern Coffee Shop POS & Management System

Sistem Point of Sale (POS) dan Manajemen Bisnis Coffee Shop modern berbasis web full-stack. Dirancang khusus untuk operasional kafe yang cepat, pencatatan transaksi yang akurat, pengelolaan kustomisasi pesanan (add-ons & notes barista), hingga pelaporan laba rugi otomatis dan ekspor data ke Excel.

---

## 🚀 Fitur Unggulan

### 1. 🛒 Kasir & Point of Sale (POS)
- **Katalog Menu Cepat:** Tampilan menu kopi dengan kartu visual modern, foto produk beresolusi tajam, dan status stok otomatis (*Aman / Menipis / Habis*).
- **Kustomisasi Pesanan (Modifiers & Notes):**
  - **Add-ons Berbayar:** Pilihan tambahan fleksibel seperti *Ganti Oat Milk (+Rp 6.000)* dan *Extra Espresso Shot (+Rp 5.000)* yang otomatis menambah harga & mengurangi stok bahan.
  - **Selera Rasa (Gratis):** Pilihan cepat *Less Sugar*, *No Sugar*, *Less Ice*, serta kolom catatan khusus barista.
- **Multi-Metode Pembayaran:**
  - **Tunai:** Input uang diterima dengan kalkulator kembalian otomatis & tombol cepat *"Uang Pas"*.
  - **Kartu (EDC):** Pembayaran kartu debit/kredit.
  - **QRIS Dinamis (Midtrans Snap):** Integrasi payment gateway sandbox Midtrans dengan QRIS otomatis.
- **Cetak Struk Thermal (80mm):** Layout struk siap cetak dengan CSS media query khusus printer thermal kasir, lengkap dengan rincian add-ons, catatan pesanan, informasi toko, dan footer.

### 2. 📊 Laporan Bisnis & Analisis Laba Rugi
- **Kalkulasi HPP & Laba Kotor Otomatis:** Perhitungan *Gross Profit* real-time: `Total Penjualan - Total Modal (HPP)`.
- **Filter Periode Dinamis:** Tombol cepat *Hari Ini*, *Kemarin*, *7 Hari Terakhir*, *1 Bulan Terakhir*, atau rentang tanggal kustom (*Date Range*).
- **📥 Ekspor ke Excel (.xlsx):** Sekali klik untuk mengunduh laporan laba rugi lengkap dengan rincian menu, nomor transaksi, modal, dan baris **Total Akumulasi** di bagian bawah.

### 3. 📦 Manajemen Produk & Kategori
- **Upload Foto Langsung dari Galeri/Komputer:** Kompresi otomatis berbasis HTML5 Canvas sehingga gambar tetap tajam namun ringan (<150KB).
- **Opsi Link URL Eksternal:** Mendukung URL Unsplash atau tautan gambar langsung.
- **Kategori Khusus Add-ons:** Menu add-on otomatis tersembunyi dari menu utama kasir dan hanya muncul sebagai pilihan ekstra pada minuman.

### 4. 👥 Manajemen Pengguna & Keamanan
- Autentikasi berbasis **JWT (JSON Web Token)** dan enkripsi password dengan **bcrypt**.
- **Role-Based Access Control (RBAC):**
  - **ADMIN:** Akses penuh ke seluruh menu (Dashboard analitik, manajemen produk, kategori, pengguna, laporan laba rugi, pengaturan toko).
  - **FLOOR (Kasir):** Akses khusus operasional kasir dan riwayat penjualan.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Charts:** Recharts
- **Spreadsheet Export:** SheetJS (`xlsx`)
- **HTTP Client:** Axios

### Backend (`server/`)
- **Runtime:** Node.js + TypeScript (`tsx watch`)
- **Framework:** Express.js
- **Database & ORM:** PostgreSQL + Prisma ORM 6.19
- **Validation:** Zod
- **Payment Gateway:** Midtrans Client SDK (Sandbox)
- **Auth:** JSON Web Token (`jsonwebtoken`) + `bcrypt`

---

## 💻 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js (v18+)
- PostgreSQL berjalan di port `5432` dengan database `brew_beans_pos`

### 2. Konfigurasi Backend (`server/`)
1. Masuk ke folder server:
   ```bash
   cd server
   ```
2. Pastikan file `.env` sudah terisi:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/brew_beans_pos?schema=public"
   JWT_SECRET="your-jwt-secret-key"
   MIDTRANS_SERVER_KEY="SB-Mid-server-..."
   MIDTRANS_CLIENT_KEY="Mid-client-..."
   ```
3. Sinkronkan database Prisma:
   ```bash
   npx prisma db push
   ```
4. Jalankan backend:
   ```bash
   npm run dev
   ```
   *(Backend berjalan di `http://localhost:3000`)*

### 3. Menjalankan Frontend (`client/`)
1. Buka terminal baru dan masuk ke folder client:
   ```bash
   cd client
   ```
2. Jalankan frontend:
   ```bash
   npm run dev
   ```
   *(Frontend berjalan di `http://localhost:5173`)*

---

## ☕ Akun Default (Login)
- **Role ADMIN:** Username `iza`
- **Role FLOOR (Kasir):** Username yang didaftarkan oleh admin melalui menu *Manajemen Pengguna*.

---

*Dibuat untuk memenuhi proyek tugas DumbWays — Full-stack POS Application.*
