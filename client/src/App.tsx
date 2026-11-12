import { useState, useEffect } from 'react'
import { api } from './api'
import { useAuth } from './context/AuthContext'
import { Login } from './login'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'


function App() {

  const { user, logout, isAuthReady } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isFloor = user?.role === 'FLOOR'

  type Page = 'DASHBOARD' | 'KASIR' | 'TRANSAKSI' | 'PRODUK' | 'KATEGORI' | 'LAPORAN' | 'PENGATURAN'

  const [activePage, setActivePage] = useState<Page>(
    user?.role === 'ADMIN' ? 'DASHBOARD' : 'KASIR'
  )

  type Product = {
    id: number
    name: string
    description: string
    price: number
    costPrice: number
    stock: number
    minimumStock: number
    categoryId: number | null
    category: Category | null
  }

  const [apiProducts, setApiProducts] = useState<Product[]>([])
  

  const products = apiProducts

  type Category ={
    id: number
    name: string
  }

  const [categories, setCategories] = useState<Category[]>([])

  type StoreSetting = {
    storeName: string
    address: string
    phone: string
    receiptNote: string
    receiptFooter: string
  }

  const [settings, setSettings] = useState<StoreSetting>({
    storeName: 'Brew & Beans',
    address: '',
    phone: '',
    receiptNote: '',
    receiptFooter: 'Terima kasih telah berkunjung'
  })

  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsMessage, setSettingMessage] = useState('')

  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [categoryMessage, setCategoryMessage] = useState('')

  const [newProductName, setNewProductName] = useState('')
  const [newProductDescription, setNewProductDescription] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCostPrice, setNewProductCostPrice] = useState('')
  const [newProductCategoryId, setNewProductCategoryId] = useState('')
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [newProductStock, setNewProductStock] = useState('0')
  const [newProductMinimumStock, setNewProductMinimumStock] = useState('0')

  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [productMessage, setProductMessage] = useState('')


  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [chartPeriod, setChartPeriod] = useState<'DAILY' | 'MONTHLY'>('DAILY')


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

  async function fetchCategories() {
    try {
      setIsLoadingCategories(true)
      setCategoryError('')

      const response = await api.get('/api/categories')

      setCategories(response.data)
    } catch (error) {
      console.error('Gagal mengambil kategori:', error)
      setCategoryError('Gagal memuat kategori. Periksa koneksi server.')
    } finally {
      setIsLoadingCategories(false)
    }
  }

  async function fetchSettings() {
    try {
      setIsLoadingSettings(true)
      setSettingMessage('')

      const response = await api.get('/api/settings')

      setSettings(response.data.settings)
    } catch (error: any) {
      console.error('Gagal mengambil pengaturan:', error)

      setSettingMessage(
        error.response?.data?.message ||
        'Gagal memuat pengaturan coffe shop'
      )
    } finally {
      setIsLoadingSettings(false)
    }
  }

  async function fetchTransactions() {
  try {
    setIsLoadingTransactions(true)
    setTransactionError('')

    const response = await api.get('/api/transactions')

    setTransactions(response.data.transactions)
  } catch (error: any) {
    console.error('Gagal mengambil riwayat transaksi:', error)

    setTransactionError(
      error.response?.data?.message ||
      'Gagal memuat riwayat transaksi'
    )
  } finally {
    setIsLoadingTransactions(false)
  }
  }

  async function handleSaveCategory(e: React.SubmitEvent<HTMLElement>) {
    e.preventDefault()

    setCategoryMessage('')

    if (!newCategoryName.trim()) {
      setCategoryMessage('Nama kategori wajib diisi.')
      return
    }

    try {
      setIsSavingCategory(true)

      const categoryData ={
        name: newCategoryName.trim(),
      }

      if (editingCategoryId !== null) {
        await api.patch(
          `/api/categories/${editingCategoryId}`,
          categoryData
        )

        setCategoryMessage('Kategori berhasil diperbarui')
      } else {
        await api.post('/api/categories', categoryData)

        setCategoryMessage('Kategori berhasil ditambahkan!')
      }

      setNewCategoryName('')
      setEditingCategoryId(null)

      await fetchCategories()
    } catch (error: any) {
      console.error('Gagal menyimpak kategori:', error)
      setCategoryMessage(error.response?.data?.message || 'Gagal menyimpan ketegori.')
    } finally{
      setIsSavingCategory(false)
    }
  }

  async function handleSaveSettings(e: React.SubmitEvent<HTMLElement>) {
    e.preventDefault()

    try {
      setIsSavingSettings(true)
      setSettingMessage('')

      const response = await api.put('/api/settings', settings)

      setSettings(response.data.settings)
      setSettingMessage('Pengaturan berhasil diperbarui')
    } catch (error: any) {
      console.error('Gagal menyimpan pengaturan:', error)

      setSettingMessage(
        error.response?.data?.message ||
        'Gagal mnyimpan pengaturan'
      )
    } finally {
      setIsSavingSettings(false)
    }
  }

  function handleEditCategory(category: Category) {
    setEditingCategoryId(category.id)
    setNewCategoryName(category.name)
    setCategoryMessage('')
  }

  async function handleDeleteCategory(categoryId: number) {
    const confirmation = window.confirm(
      'Apakah kamu yakin ingin menghapus kategori ini?'
    )

    if (!confirmation) return

      try {
        await api.delete(`/api/categories/${categoryId}`)

        setCategoryMessage('Kategori berhasil dihapus!')

        await fetchCategories()
      } catch (error: any) {
        console.error('Gagal menghapus kategori:', error)

        setCategoryMessage(error.response?.data?.message || 'Gagal menghapus kategori')
      }
  }

  async function handleSaveProduct(e: React.SubmitEvent<HTMLElement>) {
    e.preventDefault()

    setProductMessage('')

    const price = Number(newProductPrice)
    const costPrice = Number(newProductCostPrice)
    const stock = Number(newProductStock)
    const minimumStock = Number(newProductMinimumStock)

    if (
      !newProductName.trim() ||
      !newProductDescription.trim() ||
      !Number.isInteger(price) ||
      price <= 0 ||
      !Number.isInteger(costPrice) ||
      costPrice < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      setProductMessage('Lengkapi data produk. Harga harus positif, sedangkan stok dan batas minimum harus berupa bilangan bulat tidak negatif')
      return
    }

    try {
      setIsSavingProduct(true)

      const productData = {
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        price, costPrice, stock, minimumStock,
        categoryId: newProductCategoryId
        ? Number(newProductCategoryId)
        : null,
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
      setNewProductCostPrice('')
      setNewProductCategoryId('')
      setNewProductStock('0')
      setNewProductMinimumStock('0')
      setEditingProductId(null)

      await fetchProducts()

    } catch (error: any) {
      console.error('Gagal menyimpan produk:', error)
      setProductMessage(error.response?.data?.message || 'Gagal menambahkan produk.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  function handleEditProduct(product: Product) {
    setEditingProductId(product.id)
    setNewProductName(product.name)
    setNewProductDescription(product.description)
    setNewProductPrice(String(product.price))
    setNewProductCostPrice(String(product.costPrice))
    setNewProductCategoryId(
      product.categoryId !== null
        ? String(product.categoryId)
        : ''
    )
    setNewProductStock(String(product.stock))
    setNewProductMinimumStock(String(product.minimumStock))
    setProductMessage('')
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
      fetchCategories()
      fetchTransactions()
      fetchSettings()
      

    } else {
      setApiProducts([])
      setCategories([])
      setTransactions([])
      setIsLoading(false)
      setIsLoadingCategories(false)
      setIsLoadingTransactions(false)
    }
  }, [user])


  
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  const [transactionNumber, setTransactionNumber] = useState('')

  type Transaction = {
    id: number
    transactionNumber: string
    total: number
    paymentMethod: string
    createdAt: string
    items: {
      id: number
      productName: string
      quantity: number
      unitPrice: number
      subtotal: number
    }[]
  }

  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [transactionError, setTransactionError] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const [searchTransaction, setSearchTransaction] = useState('')

  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')

  const [cart, setCart] = useState<Record<number, number>>({})

  async function processPayment() {
    if (Object.keys(cart).length === 0) {
      return
    }

    try {
      setIsProcessingPayment(true)
      setPaymentError('')

      const transactionData = {
        paymentMethod,
        items: Object.entries(cart).map(([productId, quantity]) => ({
          productId: Number(productId),
          quantity,
        })),
      }

      console.log('DATA TRANSAKSI DIKIRIM:', transactionData)

      const response = await api.post(
        '/api/transactions', transactionData
      )

      const savedTransaction = response.data.transaction

      setTransactionNumber(savedTransaction.transactionNumber)
      setReceiptTransaction(savedTransaction)
      setPaymentSuccess(true)
      setShowReceipt(true)
      setCart({})

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

  function addToCart(productId: number) {
    const selectedProduct = products.find(
      (product) => product.id === productId
    )

    if (!selectedProduct) return

    setCart((currentCart) => {
      const currentQuantity = currentCart[productId] ?? 0

      if (currentQuantity >= selectedProduct.stock) {
        return currentCart
      }


      return{
      ...currentCart,
      [productId]: currentQuantity + 1,
      }
  })
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
    transaction.transactionNumber
      .toLocaleLowerCase()
      .includes(searchTransaction.toLocaleLowerCase())
  )

  const transactionCount = transactions.length

  const totalSales = transactions.reduce(
    (total, transaction) => total + transaction.total, 0
  )

  const chartData = chartPeriod === 'DAILY'
    ? Array.from({ length: 7 }, (_,index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(1, '0'),
      ].join('-')

      const total = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.createdAt)

        const transactionKey = [
          transactionDate.getFullYear(),
          String(transactionDate.getMonth() + 1).padStart(2, '0'),
          String(transactionDate.getDate()).padStart(2, '0'),
        ].join('-')

        return transactionKey === dateKey
      }).reduce((sum, transaction) => sum + transaction.total, 0)

      return {
        label: date.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
        }),
        total,
      }
    })

    : Array.from({ length: 12 }, (_, index) => {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - (11 - index))

      const monthKey = [
        date.getFullYear(),
        String (date.getMonth() + 1).padStart(2, '0'),
      ].join('-')

      const total = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.createdAt)

        const transactionMonthKey = [
          transactionDate.getFullYear(),
          String(transactionDate.getMonth() + 1).padStart(2, '0'),
        ].join('-')

        return transactionMonthKey === monthKey
      }).reduce((sum, transaction) => sum + transaction.total, 0)

      return {
        label: date.toLocaleDateString('id-ID', {
          month: 'short',
          year: '2-digit',
        }),
        total,
      }
    })

  const productSales: Record<string, number> ={}

  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      productSales[item.productName] =
        (productSales[item.productName] ?? 0) + item.quantity
    })
  })
  
  const favoriteProducts = Object.entries(productSales)
  .map(([productName, quantitySold]) => ({
    productName,
    quantitySold,
  }))
  .sort((a, b) => b.quantitySold - a.quantitySold)
  .slice(0, 5)

  const filteredReportTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.createdAt)

    if (reportStartDate) {
      const startDate = new Date(`$${reportStartDate}T00:00:00`)

      if (transactionDate < startDate) {
        return false
      }
    }

    if (reportEndDate) {
      const endDate = new Date(`${reportEndDate}T23:59:59.999`)

      if (transactionDate > endDate) {
        return false
      }
    }

    return true
  })

  const reportTransactionCount = filteredReportTransactions.length

  const reportTotalSales = filteredReportTransactions.reduce(
    (total: number, transaction: Transaction) => total + transaction.total, 0
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

        {isAdmin && (
          <button
          type="button"
          onClick={() => setActivePage('KATEGORI')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'KATEGORI'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Kategori
          </button>
        )}

        {isAdmin && (
          <button
          type="button"
          onClick={() => setActivePage('LAPORAN')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'LAPORAN'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Laporan
          </button>
        )}

        {isAdmin && (
          <button
          type="button"
          onClick={() => setActivePage('PENGATURAN')}
          className={`rounded-lg px-5 py-3 font-semibold transition ${
            activePage === 'PENGATURAN'
            ? 'bg-amber-500 text-amber-950'
            : 'bg-amber-900 text-white hover:bg-amber-800'
          }`}
          >
            Pengaturan
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
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cold-3">
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
          </div>

          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-800">
                  Grafik Penjualan
                </h2>

                <p className="text-sm text-stone-500">
                  Ringkasan omzet berdasarkan periode
                </p>
              </div>

              <div className="flex gap-2">
                <button
                type="button"
                onClick={() => setChartPeriod('DAILY')}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  chartPeriod === 'DAILY'
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                >
                  7 Hari
                </button>

                <button
                type="button"
                onClick={() => setChartPeriod('MONTHLY')}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  chartPeriod === 'MONTHLY'
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                >
                  12 Bulan
                </button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>\
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  tickFormatter={(value) =>
                    `Rp ${Number(value).toLocaleString('id-ID')}`
                  }
                  tick={{ fontSize: 11 }}
                  width={100}
                />

                <Tooltip
                  formatter={(value) =>
                    `Rp ${Number(value).toLocaleString('id-ID')}`
                  }
                />

                <Bar
                  dataKey="total"
                  name="Penjualan"
                  fill="#92400e"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
            <h2 className="text-xl font-bold text-amber-900">
              Produk Favorit
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Lima produk dengan jumlah penjualan terbanyak.
            </p>

            {favoriteProducts.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">
                Belum ada data penjualan produk.
              </p>
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

                      <p className="font-semibold">
                        {product.productName}
                      </p>
                    </div>
                    
                    <p className="font-bold text-amber-900">
                      {product.quantitySold} terjual
                    </p>
                  </div>
                ))}
              </div>
            )
          }
          </div>
        </section>
      )}

      {activePage === 'LAPORAN' && isAdmin && (
        <section className="mt-6 space-y-6">
          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
            <h2 className="text-2xl font-bold text-amber-900">
              Laporan penjualan
            </h2>

            <p className="mt-2 text-stone-600">
              Lihat ringkasan penjualan Brew & Beans berdasarkan periode tanggal.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium">
                  Tanggal Awal
                </label>

                <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Tanggal Akhir
                </label>

                <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                min={reportStartDate || undefined}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                />
              </div>
            </div>

            <button
            type="button"
            onClick={() => {
              setReportStartDate('')
              setReportEndDate('')
            }}
            className="mt-4 rounded-lg bg-stone-200 px-5 py-3 font-semibold text-stone-800 hover:bg-stone-300"
            >
              Reset Filter
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols2">
            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-stone-500">
                Jumlah Transaksi
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-900">
                {reportTransactionCount}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-stone-500">
                Total Penjualan
              </p>
              
              <p className="mt-2 text-2xl font-bold text-amber-900">
                Rp {reportTotalSales.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
            <h2 className="text-xl font-old text-amber-900">
              Detail Penjualan
            </h2>

            {filteredReportTransactions.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">
                Tidak ada transaksi pada periode ini.
              </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {filteredReportTransactions.map((transaction) =>
                  <div
                  key={transaction.id}
                  className="rounded-lg border border-stone-200 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {transaction.transactionNumber}
                        </p>

                        <p className="mt-1 xt-sm text-stone-500">
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
                  )}
                </div>
              )}
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

          <div>
            <label className="mb-2 block font-medium">
              Modal Produk
            </label>
            
            <input
            type="number"
            min="0"
            step="1"
            value={newProductCostPrice}
            onChange={(e) => setNewProductCostPrice(e.target.value)}
            placeholder="Contoh: 25000"
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            required
            />

            <p className="mt-1 text-sm text-stone-500">
              Masukkan total modal untuk satu unit produk.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Stock Awal
            </label>

            <input
            type="number" 
            min="0"
            step="1"
            value={newProductStock}
            onChange={(e) => setNewProductStock(e.target.value)}
            placeholder="contoh: 50"
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Batas Minimum Stock
            </label>

            <input
            type="number"
            min="0"
            step="1"
            value={newProductMinimumStock}
            onChange={(e) => setNewProductMinimumStock(e.target.value)}
            placeholder="Contoh: 10"
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            required
            />
          </div>

        <div>
          <label className="mb-2 block font-medium">
            Kategori Produk
          </label>

          <select
            value={newProductCategoryId}
            onChange={(e) => setNewProductCategoryId(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
          >
            <option value="">Tanpa Kategori</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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

                      <p className="mt-1 text-sm text-amber-700">
                        Kategori: {product.category?.name ?? 'Tanpa Kategori'}
                      </p>

                      <p className="mt-1 text-sm text-stone-600">
                        Stok: {product.stock} unit
                      </p>

                      <p className="mt-1 text-sm text-stone-600">
                        Batas Minimum: {product.minimumStock} unit
                      </p>

                      <p className={`mt-1 text-sm font-semibold ${
                        product.stock === 0
                        ? 'text-red-600'
                        : product.stock <= product.minimumStock
                          ? 'text-amber-600'
                          : 'text-green-700'
                      }`}>
                        {product.stock === 0
                        ? 'Stok Habis'
                        : product.stock <= product.minimumStock
                          ? 'Stok Menipis'
                          : 'Stok aman'
                        }
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-amber-900">
                        Harga Jual: Rp {product.price.toLocaleString('id-ID')}
                      </p>

                      <p className="mt-1 text-sm text-stone-600">
                        Modal: Rp {product.costPrice.toLocaleString('id-ID')}
                      </p>
                    </div>

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

      {activePage === 'KATEGORI' && isAdmin && (
        <section className="space-y-6">
          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
            <h2 className="text-2xl font-bold text-amber-900">
              Manajemen Kategori
            </h2>

            <p className="mt-2 text-stone-600">
              Kelola Kategori produk Brew & Beans.
            </p>

            <form onSubmit={handleSaveCategory} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block font-medium">
                  Nama Kategori
                </label>

                <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Coffe"
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                required
                />
              </div>

              {categoryMessage && (
                <p className="text-sm text-amber-800">
                    {categoryMessage}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                type="submit"
                disabled={isSavingCategory}
                className="rounded-lg bg-amber-800 px-6 py-3 font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
                >
                  {isSavingCategory
                    ? 'Menyimpan...'
                    :editingCategoryId !== null
                      ? 'Simpan perubahan'
                      : 'Tambah Kategori'
                  }
                </button>

                {editingCategoryId !== null && (
                  <button
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null)
                    setNewCategoryName('')
                    setCategoryMessage('')
                  }}
                  className="rounded-lg bg-stone-200 px-6 py-3 font-semibold text-stone-800 hover:bg-stone-300"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
                <h2 className="text-xl font-bold text-amber-900">
                  Daftar Kategori
                </h2>

                {isLoadingCategories ? (
                  <p className="mt-4 text-stone-500">
                    Memuat Kategori
                  </p>
                ) : categoryError ? (
                  <div className="mt-4">
                    <p className="text-red-600">
                    {categoryError}
                    </p>

                    <button
                    type="button"
                    onClick={fetchCategories}
                    className="mt-3 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : categories.length === 0 ? (
                  <p className="mt-4 text-sm text-stone-500">
                    Belum ada Kategori.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {categories.map((category) => (
                      <div
                      key={category.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 p-4"
                      >
                        <div>
                          <h3 className="font-semibold">
                            {category.name}
                          </h3>

                          <p className="mt-1 text-sm text-stone-500">
                            ID Kategori: {category.id}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                          type="button"
                          onClick={() => handleEditCategory(category)}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                          >
                            Happy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

            <p className={`mt-2 text-sm font-semibold ${
              product.stock === 0
              ? 'text-red-600'
              : product.stock <= product.minimumStock
                ? 'text-amber-600'
                : 'text-green-700'
            }`}>
              Stok tersedia: {product.stock} unit
              {product.stock === 0
              ? ' (Habis)'
              : product.stock <= product.minimumStock
                ? ' (Menipis)'
                : ' (Aman)'
              }
            </p>

            <button
            type="button"
            onClick={() => addToCart(product.id)}
            disabled={
              product.stock === 0 || (cart[product.id] ?? 0) >= product.stock
            }
            className="mt-4 w-full rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900">
              {product.stock === 0
              ? 'Stok Habis'
              : (cart[product.id] ?? 0) >= product.stock
                ? 'Stok Maksimal'
                : '+ Tambah'
              }
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
          {paymentSuccess ? 'Pembayaran Berhasil' : 'Konfirmasi Pembayaran'}
        </h2>

        {!paymentSuccess && (
          <>
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
        </>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="font-medium text-stone-700">
            Total pembayaran
          </span>

          <span className="text-xl font-bold text-amber-900">
            Rp {(paymentSuccess && receiptTransaction ? receiptTransaction.total : cartTotal).toLocaleString('id-ID')}
          </span>
        </div>

      {!paymentSuccess && (
        <button
        type="button"
        onClick={processPayment}
        disabled={isProcessingPayment}
        className='mt-3 w-full rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800'
        >
          {isProcessingPayment
          ? 'Memproses Pembayaran...'
          : 'Pembayaran selesai' }
        </button>
      )}

        {paymentError && (
          <p className="mt-3 text-center text-sm text-red-600">
            {paymentError}
          </p>
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
          setTransactionNumber('')
          setPaymentMethod('Tunai')
          setReceiptTransaction(null)
          setPaymentError('')
        }}
        className="mt-5 w-full rounded-lg bg-stone-200 px-4 py-3 font-semibold text-stone-800 hover:bg-stone-300">
          {paymentSuccess ? 'Selesai' : 'Kembali'}
        </button>
      </div>
    </div>
    )}

  {showReceipt && receiptTransaction && (
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
            <h3 className="text-xl font-bold">
              {settings.storeName}
            </h3>
            
            {settings.address && (
            <p className="mt-1 text-sm">{settings.address}</p>
            )}
            {settings.phone && (
            <p className="text-sm">{settings.phone}</p>
            )}
          </div>
          <div className="my-4 border-t border-dashed border-stone-400"/>
                  
          <div className="space-y-1 text-sm">
            <p>No: {receiptTransaction.transactionNumber}</p>
            <p>
              Tanggal: {new Date(receiptTransaction.createdAt).toLocaleDateString('id-ID')}
            </p>
             <p>Kasir: {user.username}</p>
              <p>Pembayaran: {receiptTransaction.paymentMethod}</p>
          </div>

          <div className="my-4 border-t border-dashed border-stone-400" />

          <div className="space-y-3">
           {receiptTransaction.items.map((item) => (
             <div key={item.id} className="text-sm">
               <p className="font-semibold">{item.productName}</p>
                 <div className="flex justify-between gap-2">
                   <span>
                     {item.quantity} × Rp {item.unitPrice.toLocaleString('id-ID')}
                    </span>
                    <span>
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
              </div>
              ))}
            </div>

            <div className="my-4 border-t border-dashed border-stone-400" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>
                  Rp {receiptTransaction.total.toLocaleString('id-ID')}
                </span>
              </div>

               {settings.receiptNote && (
                <p className="mt-4 text-center text-sm">
                  {settings.receiptNote}
                </p>
                )}

              <p className="mt-4 text-center text-sm font-medium">
                {settings.receiptFooter}
                 </p>
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
        onClick={() => setShowReceipt(false)}
        className="mt-2 w-full rounded-lg bg-stone-200 px-4 py-3 font-semibold text-stone-800 hover:bg-stone-300"
      >
        Tutup
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

    {isLoadingTransactions ? (
      <p className="mt-4 text-stone-500">
        Memuat riwayat transaksi...
      </p>
    ) : transactionError ? (
      <div className="mt-4">
        <p className="text-red-600">
          {transactionError}
        </p>

        <button
        type="button"
        onClick={fetchTransactions}
        className="mt-3 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white"
        >
          Coba Lagi
        </button>
      </div>
    ) : transactions.length === 0 ? (
      <p className="mt-3 text-sm text-stone-500">
        Belum ada transaksi.
      </p>
    ) : (
      <>
      {filteredTransactions.length === 0 && (
        <p className="mt-3 text-sm text-stone-500">
          Transaksi tidak ditemukan.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {filteredTransactions.map((transaction) => (
          <div
          key={transaction.id}
          className="rounded-lg border border-stone-200 p-4"
          >
            <p className="font-semibold text-stone-800">
              {transaction.transactionNumber}
            </p>

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
              <p className="mb-2 text-sm font-semibold text-stone-700">
                Detail Produk
              </p>

              {transaction.items.map((item) => (
                <div
                key={item.id}
                className="flex justify-between gap-3 text-sm text-stone-600"
                >
                  <span>
                    {item.productName} × {item.quantity}
                  </span>

                  <span>
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </>
    )}
  </section>
)}

{activePage === 'PENGATURAN' && isAdmin && (
  <section className="space-y-6">
    <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
      <h2 className="text-2xl font-bold text-amber-900">
        Pengaturan Coffe Shop
      </h2>

      <p className="mt-2 text-stone-600">
        Kelola informasi Brew & Beans dan tampilan struk pembayaran.
      </p>

      {isLoadingSettings ? (
        <p className="mt-6 text-stone-500">
          Memuat Pengaturan...
        </p>
      ) : (
        <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Nama Coffe Shop
              </label>
              <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value,})}
              className="w-full rounded-lg border border-stone-300 px-4 py-3"
              required
              maxLength={100}
              />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Alamat Coffe Shop
            </label>
            <textarea
            value={settings.address}
            onChange={(e) => setSettings({...settings, address: e.target.value,})}
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            rows={3}
            maxLength={255}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Nomor Telepon
            </label>
            <input
            type="tel"
            value={settings.phone}
            onChange={(e) => setSettings({...settings, phone: e.target.value,})}
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            maxLength={30}
            />
          </div>

          <div className="border-t border-stone-200 pt-5">
            <h3 className="text=lg font-bold text-amber-900">
              Pengaturan Struk
            </h3>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Catatan Struk
            </label>
            <textarea
            value={settings.receiptNote}
            onChange={(e) => setSettings({...settings, receiptNote: e.target.value,})}
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            rows={3}
            maxLength={500}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Pesan Penutup Struk
            </label>
            <textarea
            value={settings.receiptFooter}
            onChange={(e) => setSettings({...settings, receiptFooter: e.target.value,})}
            className="w-full rounded-lg border border-stone-300 px-4 py-3"
            rows={2}
            maxLength={255}
            />
          </div>

          {settingsMessage && (
            <p className="text-sm font-medium text-amber-800">
              {settingsMessage}
            </p>
          )}

          <button
          type="submit"
          disabled={isSavingSettings}
          className="rounded-lg bg-amber-800 px-6 py-3 font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
          >
            {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      )}
    </div>
  </section>
)}
    </main>
  )
}
export default App
