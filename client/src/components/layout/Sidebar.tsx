import { NavLink } from 'react-router-dom'
import {
  Coffee,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Receipt,
  TrendingUp,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

interface SidebarProps {
  isAdmin: boolean
  user: { username: string; role: string } | null
  logout: () => void
}

export function Sidebar({ isAdmin, user, logout }: SidebarProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-[#5A3825] text-white shadow-md'
        : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
    }`

  return (
    <aside className="sticky top-0 h-screen w-64 flex-shrink-0 flex flex-col justify-between bg-[#1E110A] text-stone-300 p-5 shadow-2xl z-20">
      <div>
        {/* Logo Brand */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-stone-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5A3825] text-amber-200 shadow-md">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Brew & Beans</h1>
            <p className="text-[10px] font-semibold text-amber-300 tracking-wider uppercase">
              Coffee Shop POS
            </p>
          </div>
        </div>

        {/* Navigasi Menu Menggunakan NavLink (Otomatis Ubah URL Browser) */}
        <nav className="space-y-1.5">
          {isAdmin && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink to="/kasir" className={navLinkClass}>
            <ShoppingCart className="h-4 w-4" />
            <span>Kasir (POS)</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/produk" className={navLinkClass}>
              <Package className="h-4 w-4" />
              <span>Produk</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/kategori" className={navLinkClass}>
              <Tag className="h-4 w-4" />
              <span>Kategori</span>
            </NavLink>
          )}

          <NavLink to="/transaksi" className={navLinkClass}>
            <Receipt className="h-4 w-4" />
            <span>Riwayat Transaksi</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/laporan" className={navLinkClass}>
              <TrendingUp className="h-4 w-4" />
              <span>Laporan Bisnis</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/users" className={navLinkClass}>
              <Users className="h-4 w-4" />
              <span>Pengguna & Role</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/pengaturan" className={navLinkClass}>
              <Settings className="h-4 w-4" />
              <span>Pengaturan Toko</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* Profil Bawah & Tombol Logout */}
      <div className="pt-4 border-t border-stone-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5A3825] text-amber-200 font-bold text-sm">
            {user?.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.username}</p>
            <p className="text-[11px] text-amber-300 font-medium">{user?.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl bg-red-950/40 px-3.5 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-900/60 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  )
}
