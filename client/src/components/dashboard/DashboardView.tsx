import { useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { DashboardPeriod, Product, Transaction } from '../../types/pos.types'

interface DashboardViewProps {
  products: Product[]
  transactions: Transaction[]
}

export function DashboardView({ products, transactions }: DashboardViewProps) {
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>('7_DAYS')

  const dashboardTransactions = transactions.filter((t) => {
    const txTime = new Date(t.createdAt).getTime()
    const now = new Date()

    if (dashboardPeriod === '7_DAYS') {
      const past7 = new Date(now)
      past7.setDate(past7.getDate() - 6)
      past7.setHours(0, 0, 0, 0)
      return txTime >= past7.getTime()
    }

    if (dashboardPeriod === '1_MONTH') {
      const past30 = new Date(now)
      past30.setDate(past30.getDate() - 29)
      past30.setHours(0, 0, 0, 0)
      return txTime >= past30.getTime()
    }

    if (dashboardPeriod === '1_YEAR') {
      const pastYear = new Date(now)
      pastYear.setFullYear(pastYear.getFullYear() - 1)
      pastYear.setHours(0, 0, 0, 0)
      return txTime >= pastYear.getTime()
    }

    return true
  })

  const dashboardTotalTransactions = dashboardTransactions.length
  const dashboardTotalSales = dashboardTransactions.reduce((sum, t) => sum + t.total, 0)

  let chartData: { label: string; total: number }[] = []

  if (dashboardPeriod === '7_DAYS') {
    chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      const total = transactions
        .filter((t) => {
          const d = new Date(t.createdAt)
          const k = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0'),
          ].join('-')
          return k === dateKey
        })
        .reduce((sum, t) => sum + t.total, 0)

      return {
        label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        total,
      }
    })
  } else if (dashboardPeriod === '1_MONTH') {
    chartData = Array.from({ length: 30 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - index))
      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      const total = transactions
        .filter((t) => {
          const d = new Date(t.createdAt)
          const k = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0'),
          ].join('-')
          return k === dateKey
        })
        .reduce((sum, t) => sum + t.total, 0)

      return {
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        total,
      }
    })
  } else {
    chartData = Array.from({ length: 12 }, (_, index) => {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - (11 - index))
      const monthKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
      ].join('-')

      const total = transactions
        .filter((t) => {
          const d = new Date(t.createdAt)
          const k = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
          ].join('-')
          return k === monthKey
        })
        .reduce((sum, t) => sum + t.total, 0)

      return {
        label: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        total,
      }
    })
  }

  const productSales: Record<string, number> = {}
  dashboardTransactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      productSales[item.productName] =
        (productSales[item.productName] ?? 0) + item.quantity
    })
  })

  const favoriteProducts = Object.entries(productSales)
    .map(([productName, quantitySold]) => ({ productName, quantitySold }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Ringkasan Bisnis
          </p>
          <h3 className="text-lg font-bold text-stone-800">
            Performa Penjualan & Produk
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDashboardPeriod('7_DAYS')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              dashboardPeriod === '7_DAYS'
                ? 'bg-[#5A3825] text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            7 Hari Terakhir
          </button>

          <button
            type="button"
            onClick={() => setDashboardPeriod('1_MONTH')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              dashboardPeriod === '1_MONTH'
                ? 'bg-[#5A3825] text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            1 Bulan Terakhir
          </button>

          <button
            type="button"
            onClick={() => setDashboardPeriod('1_YEAR')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              dashboardPeriod === '1_YEAR'
                ? 'bg-[#5A3825] text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            1 Tahun Terakhir
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">Total Produk Aktif</p>
          <p className="mt-2 text-3xl font-extrabold text-[#5A3825]">{products.length}</p>
          <p className="mt-1 text-xs text-stone-400">Total katalog menu</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">
            Total Transaksi (
            {dashboardPeriod === '7_DAYS'
              ? '7 Hari'
              : dashboardPeriod === '1_MONTH'
              ? '1 Bulan'
              : '1 Tahun'}
            )
          </p>
          <p className="mt-2 text-3xl font-extrabold text-stone-900">
            {dashboardTotalTransactions}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Transaksi terbayar</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">
            Total Penjualan (
            {dashboardPeriod === '7_DAYS'
              ? '7 Hari'
              : dashboardPeriod === '1_MONTH'
              ? '1 Bulan'
              : '1 Tahun'}
            )
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#5A3825]">
            Rp {dashboardTotalSales.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Omzet kotor periode ini</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-1">Grafik Tren Penjualan</h2>
        <p className="text-xs text-stone-500 mb-6">
          Ringkasan omzet berdasarkan rentang{' '}
          {dashboardPeriod === '7_DAYS'
            ? '7 hari terakhir'
            : dashboardPeriod === '1_MONTH'
            ? '30 hari terakhir'
            : '12 bulan terakhir'}
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
              tick={{ fontSize: 11 }}
              width={100}
            />
            <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
            <Bar dataKey="total" name="Penjualan" fill="#92400e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-xl font-bold text-amber-900">Produk Favorit</h2>
        <p className="mt-1 text-sm text-stone-500">
          Lima produk dengan jumlah penjualan terbanyak.
        </p>

        {favoriteProducts.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Belum ada data penjualan produk.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {favoriteProducts.map((product, index) => (
              <div
                key={product.productName}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-900">
                    {index + 1}
                  </div>
                  <p className="font-semibold">{product.productName}</p>
                </div>

                <p className="font-bold text-amber-900">{product.quantitySold} terjual</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
