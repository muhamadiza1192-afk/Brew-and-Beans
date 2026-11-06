import { useState, useEffect } from 'react'
import { api } from './api'
import { useAuth } from './context/AuthContext'
import { Login } from './login'




function App() {

  const { user, logout, isAuthReady } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isFloor = user?.role === 'FLOOR'

  type Page = 'DASHBOARD' | 'KASIR' | 'TRANSAKSI' | 'PRODUK'

  const [activePage, setActivePage] = useState<Page>(
    user?.role === 'ADMIN' ? 'DASHBOARD' : 'KASIR'
  )

  const [apiProducts, setApiProducts] = useState<
  {
    id: number
    name: string
    description: string
    price: number
  }[]
  >([])

  const products = apiProducts

  const [newProductName, setNewProductName] = useState('')
  const [newProductDescription, setNewProductDescription] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [editingProductId, setEditingProductId] = useState<number | null>(null)

  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [productMessage, setProductMessage] = useState('')


  const [isLoading, setIsLoading] = useState(false)
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

  async function handleSaveProduct(e: React.SubmitEvent<HTMLElement>) {
    e.preventDefault()

    setProductMessage('')

    const price = Number(newProductPrice)

    if (
      !newProductName.trim() ||
      !newProductDescription.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setProductMessage('Lengkapi semua data dan masukkan harga yang valid.')
      return
    }

    try {
      setIsSavingProduct(true)

      const productData = {
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        price: price,
      }

      if (editingProductId !== null) {
        await api.patch(
          `/api/products/${editingProductId}`,
          productData
        )

        setProductMessage ('Produk berhasil diperbaharui!')
      } else {
        await api.post('/api/products', productData)

        setProductMessage('Produk berhasil ditambahkan')
      }

      setNewProductName('')
      setNewProductDescription('')
      setNewProductPrice('')
      setEditingProductId(null)

      await fetchProducts()

    } catch (error: any) {
      console.error('Gagal menyimpan produk:', error)
      setProductMessage(error.response?.data?.message || 'Gagal menambahkan produk.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  function handleEditProduct(product: {
    id: number
    name: string
    description: string
    price: number
  }) {
    setEditingProductId(product.id)
    setNewProductName(product.name)
    setNewProductDescription(product.description)
    setNewProductPrice(String(product.price))
    setProductMessage
  }

  async function handleDeleteProduct(productId: number) {
    const confirmation = window.confirm(
      'Apakah kamu yakin ingin menghapus produk ini?'
    )

    if (!confirmation) return
    try {
      await api.delete(`/api/products/${productId}`)

      setProductMessage('Produk berhasil dihapus!')

      await fetchProducts()
    } catch (error: any) {
      console.error('Gagal menghapus produk:', error)
      setProductMessage(error.response?.data?.message || 'Gagal menghaoppus produk.')
    }
  }

  useEffect(() => {
    if (user) {
      setActivePage(
        user.role === 'ADMIN' ? 'DASHBOARD' : 'KASIR'
      )

      fetchProducts()
    } else {
      setApiProducts([])
      setIsLoading(false)
    }
  }, [user])


  
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

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-950 text-white">
        Memeriksa sesi login...
      </div>
    )
  }

  if (!user) {
    return <Login/>
  }
  


  return (
    <main className="min-h-screen bg-amber-950 p-8 text-white">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Brew & Beans</h1>
          <p className="mt-2 text-amber-200">
            Selamat datang, {user?.username}
          </p>

          <p className="mt-1 text-sm text-amber-300">
            Role: {user?.role}
          </p>

        </div>

        <button
        type="button"
        onClick={logout}
        className="rounded -lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
        >
        Logout
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-3">
        {isAdmin && (
          <button
          type="button"
          onClick={() => setActivePage('DASHBOARD')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'DASHBOARD'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Dashboard
          </button>
        )}

        {isAdmin && (
          <button
          type="button"
          onClick={() => setActivePage('PRODUK')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'PRODUK'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Poduct
          </button>
        )}

        <button
        type="button"
          onClick={() => setActivePage('KASIR')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'KASIR'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Kasir
        </button>

        <button
        type="button"
          onClick={() => setActivePage('TRANSAKSI')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'TRANSAKSI'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Transaksi
        </button>
      </nav>

      {activePage === 'DASHBOARD' && isAdmin && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-stone-500">
              Total Produk
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-900">
              {products.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-stone-500">
              Jumlah Transaksi
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-900">
              {transactionCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-stone-500">
              Total Penjualan
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-900">
              Rp {totalSales.toLocaleString('id-ID')}
            </p>
          </div>
        </section>
      )}

      {activePage === 'PRODUK' && isAdmin && (
        <section className="space-y-6">
          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
          <h2 className="text-2xl font-bold text-amber-900">
            Manajemen Produk
          </h2>

          <p className="mt-2 text-stone-600">
            Halaman untuk mengelola produk Brew & Beans.
          </p>

          <form onSubmit={handleSaveProduct} className="mt-6 space-y-4">

          <div>
            <label className="mb-2 block font-medium">
              Nama Produk
            </label>
            
            <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="Contoh: Caramel Latte"
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Deskripsi Produk
            </label>
            
            <textarea
            value={newProductDescription}
            onChange={(e) => setNewProductDescription(e.target.value)}
            placeholder="Masukkan deskripsi produk"
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            rows={3}
            required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Harga Produk
            </label>
            
            <input
            type="number"
            min="1"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            placeholder="Contoh: 25000"
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            required
            />
          </div>

          {productMessage && (
            <p className="text-sm text-amber-800">
              {productMessage}
            </p>
          )}

          <button
          type="submit"
          disabled={isSavingProduct}
          className="rounded-lg bg-amber-800 px-6 py-3 font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
          >
            {isSavingProduct
            ? 'Menyimpan...'
            : editingProductId !== null
            ? 'Simpan Perubahan'
            : 'Tambah Produk'}
          </button>

          </form>
          </div>

          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">

            <h2 className="text-xl font-bold text-amber-900">
              Daftar Produk
            </h2>

            <div className="mt-4 space-y-3">

              {products.map((product) => (
                <div
                key={product.id}
                className="rounded-lg border border-stone-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        {product.description}
                      </p>
                    </div>

                    <p className="font-bold text-amber-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>

                    <div className="flex gap-2">
                      <button
                      type="button"
                      onClick={() => handleEditProduct(product)}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <p className="text-sm text-stone-500">
                  Belum ada Produk
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {activePage === 'KASIR' && (
        <>
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

</>
)}


  {activePage === 'TRANSAKSI' && (
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
)}




    </main>
  )
}
export default App
