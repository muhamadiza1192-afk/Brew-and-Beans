import { useState, useEffect } from 'react'
import { api } from './api'




function App() {
  const [apiProducts, setApiProducts] = useState<
  {
    id: number
    name: string
    description: string
    price: number
  }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function fetchProducts() {
    try {
      const response = await api.get('/api/products')
      setApiProducts(response.data)
    } catch (error) {
      console.error('Gagal mengambil produk:', error)
      setErrorMessage('Gagal memuat produk. Periksa koneksi server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
  fetchProducts()
  }, [])


  const products = apiProducts

  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const [transactionNumber, setTransactionNumber] = useState('')
  const [transactions, setTransactions] = useState<
    {
      id: string
      total: number
      paymentMethod: string
      date: string
  }[]
  >([])

  const [searchTransaction, setSearchTransaction] = useState('')

  const [cart, setCart] = useState<Record<number, number>>({})
  function processPayment() {
    const newTransactionNumber = `BB-${Date.now()}`

    setTransactionNumber(newTransactionNumber)
    setTransactions((currentTransactions) => [
      ...currentTransactions,
      {
        id: newTransactionNumber,
        total: cartTotal,
        paymentMethod: paymentMethod,
        date: new Date().toISOString(),
      },
    ])
    setCart({})
    setPaymentSuccess(true)
  }

  function addToCart(productId: number) {
    setCart((currentCart) => ({
      ...currentCart,
      [productId]: (currentCart[productId] ?? 0) + 1,
    }))
  }

  const cartTotal = products.reduce((total,product) => {
    const quantity = cart[product.id] ?? 0
    return total + product.price * quantity
  }, 0)
  function removeFromCart(productId: number) {
    setCart((currentCart) => {
      const currentQuantity = currentCart[productId] ?? 0

      if (currentQuantity <= 1) {
        const updatedCart = { ...currentCart}
        delete updatedCart[productId]
        return updatedCart
      }

      return {
        ...currentCart,
        [productId]: currentQuantity - 1,
      }

    })
  }

  const filteredTransactions = transactions.filter((transaction) => 
    transaction.id
      .toLocaleLowerCase()
      .includes(searchTransaction.toLocaleLowerCase())
  )

  const transactionCount = transactions.length

  const totalSales = transactions.reduce(
    (total, transaction) => total + transaction.total, 0
  )

  
  


  return (
    <main className="min-h-screen bg-amber-950 p-8 text-white">
      <h1 className="text-4xl font-bold">Brew & Beans</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">

          {isLoading ? (
          <p className="text-white">Memuat Produk...</p>  
          ) : errorMessage ? (
            <div>
            <p className="text-red-300">{errorMessage}</p>

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
            {products.map((product) => (
          <div key={product.id} className="rounded-xl bg-white p-4 shadow">
            <h2 className="text-lg font-bold text-stone-800">
              {product.name}
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              {product.description}
            </p>

            <p className=" mt-4 font-semibold text-amber-900">
              Rp {product.price.toLocaleString('id-ID')}
            </p>

            <button
            type="button"
            onClick={() => addToCart(product.id)}
            className="mt-4 w-full rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900">
              + Tambah
            </button>

            <button
              type='button'
              onClick={() => removeFromCart(product.id)}
              className="mt-2 w-full rounded-lg bg-stone-200 px-4 py-2 font-semibold text-stone-800 hover:bg-stone-300">
                - Kurangi
            </button>

            <p className="mt-2 text-sm text-stone-600">
              Jumlah di keranjang: {cart[product.id] ?? 0}
            </p>

          </div>
        ))}
        </div>
      )}
        </section>

        <aside className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-stone-800">
            Keranjang
          </h2>

          <div className="mt-4 space-y-3">
            {products
            .filter((product) => (cart[product.id] ?? 0 ) >0)
            .map((product) => (
              <div
              key={product.id}
              className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-800">
                    {product.name}
                  </p>

                  <p className="text-sm text-stone-500">
                    {cart[product.id]} * Rp
                    {product.price.toLocaleString('id-ID')}
                  </p>
                </div>

                <p className="font-semibold text-stone-800">
                  Rp {(product.price * cart[product.id]).toLocaleString('id-ID')}
                </p>

              </div>
            ))

            }
          </div>

          <div className="mt-6 border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-stone-800">
                Total Belanja
              </h3>

              <p className="text-xl font-bold text-amber-900">
                Rp {cartTotal.toLocaleString('id-ID')}
              </p>
            </div>

            <button
            type="button"
            onClick={() => setShowCheckout(true)}
            disabled={isLoading || !!errorMessage || cartTotal === 0}
            className=" mt-5 w-full rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Bayar
            </button>
          </div>
        </aside>
      </div>    

  {showCheckout && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-stone-800">
          Konfirmasi Pembayaran
        </h2>

        <p className="mt-2 text-sm text-stone-600">
          Periksa total pesanan sebelum melanjutkan
        </p>

        <div className="mt-5">
          <p className="mb-2 font-medium text-stone-700">
            Metode Pembayaran
          </p>

          <button
          type="button"
          onClick={() => setPaymentMethod('Tunai')}
          className={`w-full rounded-lg border p-3 text-left font-medium ${
            paymentMethod === 'Tunai'
            ? 'border-green-700 bg-green-50 text-green-800'
            : 'border-stone-200 text-stone-700'
          }`}>
            Tunai
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="font-medium text-stone-700">
            Total pembayaran
          </span>

          <span className="text-xl font-bold text-amber-900">
            Rp {cartTotal.toLocaleString('id-ID')}
          </span>
        </div>

        <button
        type="button"
        onClick={processPayment}
        disabled={paymentSuccess}
        className='mt-3 w-full rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800'
        >
          {paymentSuccess ? 'Pembayaran Selesai' : 'Proses Pembayaran'}
        </button>

        {paymentSuccess && (
          <>
          <p className="mt-2 text-center text-sm text-stone-600">
            Nomor Transaksi: {transactionNumber}
          </p>

          <p className="mt-4 rounded-lg bg-green-50 p-3 text-center font-semibold text-green-800">
            Pembayaran berhasil disimulasikan!
          </p>
          </>
        )}

        <button
        type="button"
        onClick={() => {
          setShowCheckout(false)
          setPaymentSuccess(false)
          setTransactionNumber('')
          setPaymentMethod('Tunai') }}
        className="mt-5 w-full rounded-lg bg-stone-200 px-4 py-3 font-semibold text-stone-800 hover:bg-stone-300">
          Kembali
        </button>
      </div>
    </div>
  )}

  <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-stone-800">
      Riwayat Transaksi
    </h2>

    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-sm text-stone-600">
          Jumlah Transaksi
        </p>

        <p className="mt-1 text-xl font-bold text-stone-800">
          {transactionCount}
        </p>
      </div>

      <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-sm text-stone-600">
          Total Penjualan
        </p>

        <p className="mt-1 text-xl font-bold text-amber-900">
          Rp {totalSales.toLocaleString('id-ID')}
        </p>
      </div>
    </div>


    <input
      type="text"
      placeholder="Cari nomor transaksi..." 
      className="mt-4 w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-800 outline-none focus:border-amber-700"
      value={searchTransaction}
      onChange={(event) => setSearchTransaction(event.target.value)}
      />

    <button 
    type="button"
    onClick={() => setSearchTransaction('')}
    className="mt-2 rounded-lg bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-300"
    >
      Reset Pencarian
    </button>

    {transactions.length === 0 ? (
      <p className="mt-3 text-sm text-stone-500">
        Belum ada transaksi.
      </p>

      


    ) : (
      <>
      {filteredTransactions.length === 0 && (
        <p className="mt-3 text-sm text-stone-500">
          {transactions.length === 0
          ? 'Belum ada transaksi.'
          : 'Transaksi tidak ditemukan.'}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {filteredTransactions.map((transaction) => (
          <div
          key={transaction.id}
          className="rounded-lg border border-stone-200 p-4">

          <p className="font-semibold text-stone-800">
            {transaction.id}
          </p>

          <p className="mt-1 text-sm text-stone-600">
            Metode: {transaction.paymentMethod}
          </p>

          <p className="mt-1 font-bold text-amber-800">
            Rp {transaction.total.toLocaleString('id-ID')}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            Waktu: {new Date(transaction.date).toLocaleString('id-ID')}
          </p>


          </div>
        ))}
      </div>
      </>
    )}

  </section>



    </main>
  )
}
export default App
