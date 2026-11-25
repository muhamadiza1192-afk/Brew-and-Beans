import { useState } from 'react'
import { api } from '../../api'
import {
  isAddonProduct,
  type Product,
  type StoreSetting,
  type Transaction,
} from '../../types/pos.types'
import { ReceiptModal } from './ReceiptModal'

interface CashierViewProps {
  products: Product[]
  isLoading: boolean
  errorMessage: string
  settings: StoreSetting
  cashierUsername: string
  fetchProducts: () => Promise<void>
  fetchTransactions: () => Promise<void>
}

export function CashierView({
  products,
  isLoading,
  errorMessage,
  settings,
  cashierUsername,
  fetchProducts,
  fetchTransactions,
}: CashierViewProps) {
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartNotes, setCartNotes] = useState<Record<number, string>>({})
  const [cartAddons, setCartAddons] = useState<Record<number, number[]>>({})

  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [cashReceived, setCashReceived] = useState('')
  const [lastCashReceived, setLastCashReceived] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const addonProducts = products.filter(isAddonProduct)
  const displayCashierProducts = products.filter((p) => !isAddonProduct(p))

  const cartTotal = products.reduce((total, product) => {
    const quantity = cart[product.id] ?? 0
    if (quantity === 0) return total

    const selectedAddonIds = cartAddons[product.id] || []
    const addonPriceTotal = selectedAddonIds.reduce((sum, aId) => {
      const addon = products.find((p) => p.id === aId)
      return sum + (addon?.price || 0)
    }, 0)

    return total + (product.price + addonPriceTotal) * quantity
  }, 0)

  function addToCart(productId: number) {
    const selectedProduct = products.find((product) => product.id === productId)
    if (!selectedProduct) return

    setCart((currentCart) => {
      const currentQuantity = currentCart[productId] ?? 0
      if (currentQuantity >= selectedProduct.stock) return currentCart

      return {
        ...currentCart,
        [productId]: currentQuantity + 1,
      }
    })
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) => {
      const currentQuantity = currentCart[productId] ?? 0
      if (currentQuantity <= 1) {
        const updatedCart = { ...currentCart }
        delete updatedCart[productId]
        return updatedCart
      }

      return {
        ...currentCart,
        [productId]: currentQuantity - 1,
      }
    })

    if ((cart[productId] ?? 0) <= 1) {
      setCartNotes((prev) => {
        const updated = { ...prev }
        delete updated[productId]
        return updated
      })
      setCartAddons((prev) => {
        const updated = { ...prev }
        delete updated[productId]
        return updated
      })
    }
  }

  async function processPayment() {
    if (Object.keys(cart).length === 0) return

    const itemsPayload = Object.entries(cart).map(([productId, quantity]) => {
      const pId = Number(productId)
      return {
        productId: pId,
        quantity,
        notes: cartNotes[pId]?.trim() || null,
        addonIds: cartAddons[pId] || [],
      }
    })

    // METODE QRIS -> MIDTRANS SNAP
    if (paymentMethod === 'QRIS') {
      try {
        setIsProcessingPayment(true)
        setPaymentError('')

        const tokenRes = await api.post('/api/payments/midtrans-token', {
          items: itemsPayload,
        })

        const snapToken = tokenRes.data.token

        if (typeof (window as any).snap !== 'undefined') {
          ;(window as any).snap.pay(snapToken, {
            onSuccess: async function (result: any) {
              try {
                const transactionData = {
                  paymentMethod: `QRIS (${result.payment_type?.toUpperCase() ?? 'MIDTRANS'})`,
                  items: itemsPayload,
                }

                const response = await api.post('/api/transactions', transactionData)
                const savedTransaction = response.data.transaction

                setReceiptTransaction(savedTransaction)
                setLastCashReceived('')
                setPaymentSuccess(true)
                setShowReceipt(true)
                setCart({})
                setCartNotes({})
                setCartAddons({})

                await fetchProducts()
                await fetchTransactions()
              } catch {
                setPaymentError('Gagal menyimpan transaksi setelah pembayaran Midtrans.')
              } finally {
                setIsProcessingPayment(false)
              }
            },
            onPending: function () {
              setPaymentError('Menunggu pembayaran diselesaikan pelanggan.')
              setIsProcessingPayment(false)
            },
            onError: function () {
              setPaymentError('Pembayaran Midtrans gagal atau ditolak.')
              setIsProcessingPayment(false)
            },
            onClose: function () {
              setPaymentError('Popup Midtrans ditutup sebelum pembayaran selesai.')
              setIsProcessingPayment(false)
            },
          })
        } else {
          setPaymentError('SDK Midtrans belum termuat. Silakan muat ulang halaman.')
          setIsProcessingPayment(false)
        }
        return
      } catch (error: any) {
        console.error('Gagal inisialisasi Midtrans:', error)
        setPaymentError(
          error.response?.data?.message || 'Gagal memulai pembayaran Midtrans.'
        )
        setIsProcessingPayment(false)
        return
      }
    }

    // PEMBAYARAN TUNAI DAN KARTU (EDC)
    try {
      setIsProcessingPayment(true)
      setPaymentError('')

      const transactionData = {
        paymentMethod,
        items: itemsPayload,
      }

      const response = await api.post('/api/transactions', transactionData)
      const savedTransaction = response.data.transaction

      setReceiptTransaction(savedTransaction)
      setLastCashReceived(cashReceived)
      setPaymentSuccess(true)
      setShowReceipt(true)
      setCart({})
      setCartNotes({})
      setCartAddons({})

      await fetchProducts()
      await fetchTransactions()
    } catch (error: any) {
      console.error('Gagal memproses pembayaran:', error)
      setPaymentError(
        error.response?.data?.message ||
          'Pembayaran gagal diproses. Silakan coba kembali.'
      )
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* KATALOG MENU */}
        <section className="lg:col-span-2">
          {isLoading ? (
            <p className="text-stone-600">Memuat Produk...</p>
          ) : errorMessage ? (
            <div>
              <p className="text-red-600">{errorMessage}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="mt-3 rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white hover:bg-amber-800"
              >
                Coba lagi...
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayCashierProducts.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm flex flex-col justify-between transition hover:shadow-md"
                >
                  <div>
                    <div className="relative h-40 w-full overflow-hidden bg-stone-100">
                      <img
                        src={
                          product.imageUrl ||
                          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'
                        }
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'
                        }}
                      />
                    </div>

                    <div className="p-4">
                      <h2 className="text-base font-bold text-stone-900 line-clamp-1">
                        {product.name}
                      </h2>
                      <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="mt-3 text-lg font-extrabold text-[#5A3825]">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          product.stock === 0
                            ? 'text-red-600'
                            : product.stock <= product.minimumStock
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        Stok: {product.stock} unit{' '}
                        {product.stock === 0
                          ? '(Habis)'
                          : product.stock <= product.minimumStock
                          ? '(Menipis)'
                          : '(Aman)'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      disabled={
                        product.stock === 0 || (cart[product.id] ?? 0) >= product.stock
                      }
                      className="w-full rounded-xl bg-[#5A3825] px-4 py-2.5 font-semibold text-white transition hover:bg-[#432918] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {product.stock === 0
                        ? 'Stok Habis'
                        : (cart[product.id] ?? 0) >= product.stock
                        ? 'Stok Maksimal'
                        : '+ Tambah ke Pesanan'}
                    </button>

                    {(cart[product.id] ?? 0) > 0 && (
                      <div className="mt-2.5 flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
                        <span className="font-medium text-stone-600">
                          Di keranjang:{' '}
                          <strong className="text-stone-900">{cart[product.id]}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="font-semibold text-red-600 hover:underline"
                        >
                          - Kurangi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* KERANJANG BELANJA & KUSTOMISASI */}
        <aside className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-stone-800">Keranjang</h2>

          <div className="mt-4 space-y-3">
            {products
              .filter((product) => (cart[product.id] ?? 0) > 0)
              .map((product) => {
                const qty = cart[product.id]
                const selectedAddonIds = cartAddons[product.id] || []
                const selectedAddons = selectedAddonIds
                  .map((aId) => products.find((p) => p.id === aId))
                  .filter(Boolean) as Product[]
                const addonTotalPerCup = selectedAddons.reduce((sum, a) => sum + a.price, 0)
                const itemSubtotal = (product.price + addonTotalPerCup) * qty
                const currentNotes = cartNotes[product.id] || ''

                return (
                  <div
                    key={product.id}
                    className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-stone-900 text-sm">{product.name}</p>
                        <p className="text-xs text-stone-500">
                          {qty} × Rp {(product.price + addonTotalPerCup).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-[#5A3825] text-sm">
                          Rp {itemSubtotal.toLocaleString('id-ID')}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          Hapus / -1
                        </button>
                      </div>
                    </div>

                    {addonProducts.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60">
                        <p className="text-[11px] font-bold text-emerald-800">
                          🥛 Tambah Add-ons:
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {addonProducts.map((addon) => {
                            const isSelected = selectedAddonIds.includes(addon.id)
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={() => {
                                  setCartAddons((prev) => {
                                    const current = prev[product.id] || []
                                    const updated = current.includes(addon.id)
                                      ? current.filter((id) => id !== addon.id)
                                      : [...current, addon.id]
                                    return { ...prev, [product.id]: updated }
                                  })
                                }}
                                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition border ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                    : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                                }`}
                              >
                                + {addon.name} (+{addon.price.toLocaleString('id-ID')})
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-stone-200/60">
                      <p className="text-[11px] font-bold text-stone-600">☕ Catatan Rasa:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {['Less Sugar', 'No Sugar', 'Less Ice'].map((tag) => {
                          const isSelected = currentNotes.includes(tag)
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setCartNotes((prev) => {
                                  const cur = prev[product.id] || ''
                                  let updated = ''
                                  if (cur.includes(tag)) {
                                    updated = cur
                                      .replace(tag, '')
                                      .replace(/,\s*,/g, ',')
                                      .replace(/^,\s*|,\s*$/g, '')
                                      .trim()
                                  } else {
                                    updated = cur ? `${cur}, ${tag}` : tag
                                  }
                                  return { ...prev, [product.id]: updated }
                                })
                              }}
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition border ${
                                isSelected
                                  ? 'bg-[#5A3825] text-white border-[#5A3825]'
                                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                              }`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>

                      <input
                        type="text"
                        value={currentNotes}
                        onChange={(e) => {
                          const val = e.target.value
                          setCartNotes((prev) => ({ ...prev, [product.id]: val }))
                        }}
                        placeholder="Ketik catatan khusus barista..."
                        className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-800 placeholder-stone-400 focus:border-[#5A3825] focus:outline-none"
                      />
                    </div>
                  </div>
                )
              })}
          </div>

          <div className="mt-6 border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-stone-800">Total Belanja</h3>
              <p className="text-xl font-bold text-amber-900">
                Rp {cartTotal.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              disabled={isLoading || !!errorMessage || cartTotal === 0}
              className="mt-5 w-full rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Bayar
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL CHECKOUT PEMBAYARAN */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-stone-800">
              {paymentSuccess ? 'Pembayaran Berhasil' : 'Konfirmasi Pembayaran'}
            </h2>

            {!paymentSuccess && (
              <>
                <p className="mt-2 text-sm text-stone-600">
                  Periksa total pesanan sebelum melanjutkan
                </p>

                <div className="mt-5">
                  <p className="mb-2 font-medium text-stone-700">Metode Pembayaran</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Tunai')}
                      className={`flex-1 rounded-xl border p-3 text-center font-semibold transition ${
                        paymentMethod === 'Tunai'
                          ? 'border-amber-800 bg-amber-50 text-amber-900 ring-2 ring-amber-800'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Tunai
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`flex-1 rounded-xl border p-3 text-center font-semibold transition ${
                        paymentMethod === 'QRIS'
                          ? 'border-amber-800 bg-amber-50 text-amber-900 ring-2 ring-amber-800'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      QRIS
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Kartu (EDC)')}
                      className={`flex-1 rounded-xl border p-3 text-center font-semibold transition ${
                        paymentMethod === 'Kartu (EDC)'
                          ? 'border-amber-800 bg-amber-50 text-amber-900 ring-2 ring-amber-800'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Kartu (EDC)
                    </button>
                  </div>
                </div>

                {paymentMethod === 'QRIS' && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                    <p className="text-sm font-semibold text-blue-900">Pembayaran QRIS</p>
                    <p className="mt-1 text-xs text-blue-700">
                      Arahkan pelanggan untuk scan QRIS statis / dinamis kasir senilai{' '}
                      <span className="font-bold">
                        Rp {cartTotal.toLocaleString('id-ID')}
                      </span>
                    </p>
                  </div>
                )}

                {paymentMethod === 'Kartu (EDC)' && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                    <p className="text-sm font-semibold text-blue-900">
                      Pembayaran Kartu / EDC
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Gesek / Tap kartu debit/kredit pada mesin EDC senilai{' '}
                      <span className="font-bold">
                        Rp {cartTotal.toLocaleString('id-ID')}
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4">
              <span className="font-medium text-stone-700">Total pembayaran</span>
              <span className="text-xl font-bold text-amber-900">
                Rp{' '}
                {(paymentSuccess && receiptTransaction
                  ? receiptTransaction.total
                  : cartTotal
                ).toLocaleString('id-ID')}
              </span>
            </div>

            {paymentMethod === 'Tunai' && !paymentSuccess && (
              <div className="mt-4 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-5">
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Nominal Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-amber-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setCashReceived(String(cartTotal))}
                  className="text-sm font-semibold text-amber-800 hover:underline"
                >
                  + Gunakan Uang Pas (Rp {cartTotal.toLocaleString('id-ID')})
                </button>

                {Number(cashReceived) > 0 && (
                  <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-sm">
                    <span className="font-medium text-stone-600">Uang Kembalian</span>
                    <span
                      className={`font-bold ${
                        Number(cashReceived) >= cartTotal
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {Number(cashReceived) >= cartTotal
                        ? `Rp ${(Number(cashReceived) - cartTotal).toLocaleString('id-ID')}`
                        : `Kurang Rp ${(cartTotal - Number(cashReceived)).toLocaleString(
                            'id-ID'
                          )}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!paymentSuccess && (
              <button
                type="button"
                onClick={processPayment}
                disabled={isProcessingPayment}
                className="mt-3 w-full rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {isProcessingPayment
                  ? 'Memproses...'
                  : paymentMethod === 'QRIS'
                  ? 'Bayar via Midtrans (QRIS)'
                  : 'Pembayaran selesai'}
              </button>
            )}

            {paymentError && (
              <p className="mt-3 text-center text-sm text-red-600">{paymentError}</p>
            )}

            {paymentSuccess && receiptTransaction && (
              <div className="mt-5 space-y-3">
                <p className="text-center text-sm text-stone-600">
                  Nomor Transaksi: {receiptTransaction.transactionNumber}
                </p>

                <p className="rounded-lg bg-green-50 p-3 text-center font-semibold text-green-800">
                  Pembayaran berhasil disimpan!
                </p>

                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="w-full rounded-lg bg-amber-800 px-4 py-3 font-semibold text-white hover:bg-amber-900"
                >
                  Cetak / Lihat Struk
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowCheckout(false)
                setShowReceipt(false)
                setPaymentSuccess(false)
                setPaymentMethod('Tunai')
                setReceiptTransaction(null)
                setPaymentError('')
              }}
              className="mt-5 w-full rounded-lg bg-stone-200 px-4 py-3 font-semibold text-stone-800 hover:bg-stone-300"
            >
              {paymentSuccess ? 'Selesai' : 'Kembali'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL STRUK THERMAL 80MM */}
      {showReceipt && receiptTransaction && (
        <ReceiptModal
          transaction={receiptTransaction}
          settings={settings}
          cashierUsername={cashierUsername}
          lastCashReceived={lastCashReceived}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  )
}
