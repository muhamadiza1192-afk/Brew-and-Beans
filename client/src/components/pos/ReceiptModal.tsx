import type { StoreSetting, Transaction } from '../../types/pos.types'

interface ReceiptModalProps {
  transaction: Transaction
  settings: StoreSetting
  cashierUsername: string
  lastCashReceived: string
  onClose: () => void
}

export function ReceiptModal({
  transaction,
  settings,
  cashierUsername,
  lastCashReceived,
  onClose,
}: ReceiptModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-center text-xl font-bold text-stone-800">
          Struk Transaksi
        </h2>

        <div
          id="receipt"
          className="rounded-lg border border-dashed border-stone-400 bg-white p-5 text-stone-800"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold">{settings.storeName}</h3>
            {settings.address && <p className="mt-1 text-sm">{settings.address}</p>}
            {settings.phone && <p className="text-sm">{settings.phone}</p>}
          </div>

          <div className="my-4 border-t border-dashed border-stone-400" />

          <div className="space-y-1 text-sm">
            <p>No: {transaction.transactionNumber}</p>
            <p>Tanggal: {new Date(transaction.createdAt).toLocaleDateString('id-ID')}</p>
            <p>Kasir: {cashierUsername}</p>
            <p>Pembayaran: {transaction.paymentMethod}</p>
          </div>

          <div className="my-4 border-t border-dashed border-stone-400" />

          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div key={item.id} className="text-sm">
                <p className="font-semibold">{item.productName}</p>
                {item.addons && (
                  <p className="text-xs text-emerald-800 pl-2">+ {item.addons}</p>
                )}
                {item.notes && (
                  <p className="text-xs font-semibold text-amber-900 pl-2 italic">
                    * Note: {item.notes}
                  </p>
                )}
                <div className="flex justify-between gap-2 mt-0.5">
                  <span>
                    {item.quantity} x Rp {item.unitPrice.toLocaleString('id-ID')}
                  </span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-stone-400" />

          <div className="space-y-1">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {transaction.total.toLocaleString('id-ID')}</span>
            </div>

            {transaction.paymentMethod === 'Tunai' && Number(lastCashReceived) > 0 && (
              <>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Tunai Diterima</span>
                  <span>Rp {Number(lastCashReceived).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Kembalian</span>
                  <span>
                    Rp{' '}
                    {Math.max(0, Number(lastCashReceived) - transaction.total).toLocaleString(
                      'id-ID'
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {settings.receiptNote && (
            <p className="mt-4 text-center text-sm">{settings.receiptNote}</p>
          )}

          <p className="mt-4 text-center text-sm font-medium">{settings.receiptFooter}</p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 w-full rounded-lg bg-amber-800 px-4 py-3 font-semibold text-white hover:bg-amber-900"
        >
          Cetak Struk
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-lg bg-stone-200 px-4 py-3 font-semibold text-stone-800 hover:bg-stone-300"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
