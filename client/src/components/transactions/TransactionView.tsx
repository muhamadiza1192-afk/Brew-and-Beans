import { useState } from 'react'
import { getTodayString, getYesterdayString, type Transaction } from '../../types/pos.types'

interface TransactionViewProps {
  transactions: Transaction[]
  isLoadingTransactions: boolean
  transactionError: string
  fetchTransactions: () => Promise<void>
}

export function TransactionView({
  transactions,
  isLoadingTransactions,
  transactionError,
  fetchTransactions,
}: TransactionViewProps) {
  const [searchTransaction, setSearchTransaction] = useState('')
  const [transactionDateFilter, setTransactionDateFilter] = useState(getTodayString())

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.transactionNumber
      .toLocaleLowerCase()
      .includes(searchTransaction.toLocaleLowerCase())

    if (!matchesSearch) return false

    if (transactionDateFilter) {
      const txDate = new Date(transaction.createdAt)
      const txDateString = [
        txDate.getFullYear(),
        String(txDate.getMonth() + 1).padStart(2, '0'),
        String(txDate.getDate()).padStart(2, '0'),
      ].join('-')

      if (txDateString !== transactionDateFilter) return false
    }

    return true
  })

  const transactionCount = filteredTransactions.length
  const totalSales = filteredTransactions.reduce(
    (total, transaction) => total + transaction.total,
    0
  )

  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Riwayat Transaksi Penjualan</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {transactionDateFilter
              ? `Menampilkan transaksi tanggal: ${
                  transactionDateFilter === getTodayString()
                    ? 'Hari Ini (' + transactionDateFilter + ')'
                    : transactionDateFilter === getYesterdayString()
                    ? 'Kemarin (' + transactionDateFilter + ')'
                    : transactionDateFilter
                }`
              : 'Menampilkan semua transaksi sepanjang waktu'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={transactionDateFilter}
            onChange={(e) => setTransactionDateFilter(e.target.value)}
            className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#5A3825] focus:bg-white"
          />

          <button
            type="button"
            onClick={() => setTransactionDateFilter(getTodayString())}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              transactionDateFilter === getTodayString()
                ? 'bg-[#5A3825] text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Hari Ini
          </button>

          <button
            type="button"
            onClick={() => setTransactionDateFilter(getYesterdayString())}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              transactionDateFilter === getYesterdayString()
                ? 'bg-[#5A3825] text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Kemarin
          </button>

          <button
            type="button"
            onClick={() => setTransactionDateFilter('')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              transactionDateFilter === ''
                ? 'bg-[#5A3825] text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
          <p className="text-xs font-medium text-stone-600">
            Jumlah Transaksi {transactionDateFilter ? `(${transactionDateFilter})` : ''}
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{transactionCount}</p>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
          <p className="text-xs font-medium text-stone-600">
            Total Penjualan {transactionDateFilter ? `(${transactionDateFilter})` : ''}
          </p>
          <p className="mt-1 text-2xl font-bold text-[#5A3825]">
            Rp {totalSales.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Cari nomor transaksi..."
          className="w-full rounded-xl border border-stone-300 bg-stone-50/60 px-4 py-2.5 text-sm text-stone-800 outline-none focus:border-[#5A3825] focus:bg-white"
          value={searchTransaction}
          onChange={(event) => setSearchTransaction(event.target.value)}
        />
        {searchTransaction && (
          <button
            type="button"
            onClick={() => setSearchTransaction('')}
            className="rounded-xl bg-stone-200 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-300"
          >
            Reset
          </button>
        )}
      </div>

      {isLoadingTransactions ? (
        <p className="mt-4 text-stone-500">Memuat riwayat transaksi...</p>
      ) : transactionError ? (
        <div className="mt-4">
          <p className="text-red-600">{transactionError}</p>
          <button
            type="button"
            onClick={fetchTransactions}
            className="mt-3 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white"
          >
            Coba Lagi
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Belum ada transaksi.</p>
      ) : (
        <>
          {filteredTransactions.length === 0 && (
            <p className="mt-3 text-sm text-stone-500">Transaksi tidak ditemukan.</p>
          )}

          <div className="mt-4 space-y-3">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-lg border border-stone-200 p-4">
                <p className="font-semibold text-stone-800">{transaction.transactionNumber}</p>
                <p className="mt-1 text-sm text-stone-600">
                  Metode: {transaction.paymentMethod}
                </p>
                <p className="mt-1 font-bold text-amber-800">
                  Rp {transaction.total.toLocaleString('id-ID')}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Waktu: {new Date(transaction.createdAt).toLocaleString('id-ID')}
                </p>

                <div className="mt-3 border-t border-stone-200 pt-3">
                  <p className="mb-2 text-sm font-semibold text-stone-700">Detail Produk</p>

                  {transaction.items.map((item) => (
                    <div key={item.id} className="text-sm text-stone-600 mb-1.5">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium text-stone-800">
                          {item.productName} × {item.quantity}
                        </span>
                        <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {item.addons && (
                        <p className="text-xs text-emerald-700 pl-2">+ {item.addons}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs font-semibold text-amber-900 pl-2 italic">
                          * Note: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
