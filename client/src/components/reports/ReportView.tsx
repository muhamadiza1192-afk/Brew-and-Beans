import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getTodayString, getYesterdayString, type Transaction } from '../../types/pos.types'

interface ReportViewProps {
  transactions: Transaction[]
}

export function ReportView({ transactions }: ReportViewProps) {
  const [reportStartDate, setReportStartDate] = useState(getTodayString())
  const [reportEndDate, setReportEndDate] = useState(getTodayString())

  const filteredReportTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.createdAt)

    if (reportStartDate) {
      const startDate = new Date(`${reportStartDate}T00:00:00`)
      if (transactionDate < startDate) return false
    }

    if (reportEndDate) {
      const endDate = new Date(`${reportEndDate}T23:59:59.999`)
      if (transactionDate > endDate) return false
    }

    return true
  })

  const reportTransactionCount = filteredReportTransactions.length
  const reportTotalSales = filteredReportTransactions.reduce(
    (total, transaction) => total + transaction.total,
    0
  )
  const reportTotalCost = filteredReportTransactions.reduce(
    (total, transaction) =>
      total +
      transaction.items.reduce(
        (itemTotal, item) => itemTotal + (item.unitCost || 0) * item.quantity,
        0
      ),
    0
  )
  const reportGrossProfit = reportTotalSales - reportTotalCost

  const handleExportExcel = () => {
    if (filteredReportTransactions.length === 0) {
      alert('Tidak ada transaksi untuk diexport pada periode ini.')
      return
    }

    const rows = filteredReportTransactions.map((tx, index) => {
      const itemsDetail = tx.items
        .map((item) => {
          let str = `${item.productName} (${item.quantity}x)`
          if (item.addons) str += ` [Addon: ${item.addons}]`
          if (item.notes) str += ` [Note: ${item.notes}]`
          return str
        })
        .join(', ')
      const totalHpp = tx.items.reduce(
        (sum, item) => sum + (item.unitCost || 0) * item.quantity,
        0
      )
      const labaKotor = tx.total - totalHpp

      return {
        'No.': index + 1,
        'No. Transaksi': tx.transactionNumber,
        'Tanggal & Waktu': new Date(tx.createdAt).toLocaleString('id-ID'),
        'Metode Pembayaran': tx.paymentMethod,
        'Menu Dipesan': itemsDetail,
        'Total Penjualan (Rp)': tx.total,
        'Total Modal / HPP (Rp)': totalHpp,
        'Laba Kotor (Rp)': labaKotor,
      }
    })

    rows.push({
      'No.': '' as unknown as number,
      'No. Transaksi': 'TOTAL AKUMULASI',
      'Tanggal & Waktu': '',
      'Metode Pembayaran': '',
      'Menu Dipesan': `${reportTransactionCount} Transaksi`,
      'Total Penjualan (Rp)': reportTotalSales,
      'Total Modal / HPP (Rp)': reportTotalCost,
      'Laba Kotor (Rp)': reportGrossProfit,
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
      { wch: 35 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laba Rugi')

    const filePeriod =
      reportStartDate && reportEndDate
        ? `${reportStartDate}_sd_${reportEndDate}`
        : 'Semua_Periode'
    XLSX.writeFile(workbook, `Laporan_Laba_Rugi_Brew_Beans_${filePeriod}.xlsx`)
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-2xl font-bold text-amber-900">Laporan Penjualan</h2>
        <p className="mt-2 text-stone-600">
          Lihat ringkasan penjualan Brew & Beans berdasarkan periode tanggal.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Tanggal Awal</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Tanggal Akhir</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              min={reportStartDate || undefined}
              className="w-full rounded-lg border border-stone-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReportStartDate(getTodayString())
                setReportEndDate(getTodayString())
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                reportStartDate === getTodayString() && reportEndDate === getTodayString()
                  ? 'bg-[#5A3825] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Hari Ini
            </button>

            <button
              type="button"
              onClick={() => {
                setReportStartDate(getYesterdayString())
                setReportEndDate(getYesterdayString())
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                reportStartDate === getYesterdayString() && reportEndDate === getYesterdayString()
                  ? 'bg-[#5A3825] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Kemarin
            </button>

            <button
              type="button"
              onClick={() => {
                const d7 = new Date()
                d7.setDate(d7.getDate() - 6)
                const d7Str = [
                  d7.getFullYear(),
                  String(d7.getMonth() + 1).padStart(2, '0'),
                  String(d7.getDate()).padStart(2, '0'),
                ].join('-')
                setReportStartDate(d7Str)
                setReportEndDate(getTodayString())
              }}
              className="rounded-xl bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              7 Hari Terakhir
            </button>

            <button
              type="button"
              onClick={() => {
                const d30 = new Date()
                d30.setDate(d30.getDate() - 29)
                const d30Str = [
                  d30.getFullYear(),
                  String(d30.getMonth() + 1).padStart(2, '0'),
                  String(d30.getDate()).padStart(2, '0'),
                ].join('-')
                setReportStartDate(d30Str)
                setReportEndDate(getTodayString())
              }}
              className="rounded-xl bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              1 Bulan Terakhir
            </button>

            <button
              type="button"
              onClick={() => {
                setReportStartDate('')
                setReportEndDate('')
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                !reportStartDate && !reportEndDate
                  ? 'bg-[#5A3825] text-white shadow-sm'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              Semua Periode
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredReportTransactions.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-stone-500">Jumlah Transaksi</p>
          <p className="mt-2 text-2xl font-bold text-amber-900">{reportTransactionCount}</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-stone-500">Total Penjualan</p>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            Rp {reportTotalSales.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-stone-500">Total Modal (HPP)</p>
          <p className="mt-2 text-2xl font-bold text-stone-700">
            Rp {reportTotalCost.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-stone-500">Laba Kotor</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            Rp {reportGrossProfit.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-xl font-bold text-amber-900">Detail Penjualan</h2>

        {filteredReportTransactions.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Tidak ada transaksi pada periode ini.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredReportTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-lg border border-stone-200 p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">{transaction.transactionNumber}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {new Date(transaction.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <p className="font-bold text-amber-900">
                    Rp {transaction.total.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="mt-3 border-t border-stone-200 pt-3">
                  <p className="text-sm text-stone-600">
                    Metode Pembayaran: {transaction.paymentMethod}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Jumlah Jenis Produk: {transaction.items.length}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
