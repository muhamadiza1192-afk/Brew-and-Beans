import { useLocation } from 'react-router-dom'

interface HeaderProps {
  user: { username: string; role: string } | null
}

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Analitik',
  '/kasir': 'Kasir & Point of Sale',
  '/produk': 'Katalog Produk',
  '/kategori': 'Kategori Menu',
  '/transaksi': 'Riwayat Transaksi Penjualan',
  '/laporan': 'Laporan Penjualan & Laba Rugi',
  '/users': 'Manajemen Pengguna',
  '/pengaturan': 'Pengaturan Toko & Struk',
}

export function Header({ user }: HeaderProps) {
  const location = useLocation()
  const title = ROUTE_TITLES[location.pathname] ?? 'Brew & Beans POS'

  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h2>
        <p className="mt-1 text-xs text-stone-500">
          Brew & Beans Coffee POS &bull; Masuk sebagai{' '}
          <span className="font-semibold text-[#5A3825]">
            {user?.username} ({user?.role})
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Sistem Aktif
        </span>
      </div>
    </header>
  )
}
