import { useState, useEffect } from 'react'
import { api } from './api'
import { useAuth } from './context/AuthContext'
import { Login } from './login'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Coffee, LayoutDashboard, ShoppingCart, Package, Tag, Receipt, TrendingUp, Users, Settings, LogOut, FileSpreadsheet, Upload, X } from 'lucide-react'
import * as XLSX from 'xlsx'


function App() {

  const { user, logout, isAuthReady } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  type Page = 'DASHBOARD' | 'KASIR' | 'TRANSAKSI' | 'PRODUK' | 'KATEGORI' | 'LAPORAN' | 'PENGATURAN' | "USERS"

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
    imageUrl?: string | null
    categoryId: number | null
    category: Category | null
  }

  const [apiProducts, setApiProducts] = useState<Product[]>([])
  

  const products = apiProducts

  const isAddonProduct = (p: Product) =>
    Boolean(
      p.category?.name &&
        (p.category.name.toLowerCase().includes('addon') ||
          p.category.name.toLowerCase().includes('add-on'))
    )

  const addonProducts = products.filter(isAddonProduct)
  const displayCashierProducts = products.filter((p) => !isAddonProduct(p))

  type Category ={
    id: number
    name: string
  }

  type UserAccount = {
    id: number
    username: string
    role: 'ADMIN' |'FLOOR'
    createdAt: string
    updatedAt: string
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<UserAccount[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'FLOOR'>('FLOOR')
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [addUserError, setAddUserError] = useState('')
  const [addUserSuccess, setAddUserSuccess] = useState('')
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editUserRole, setEditUserRole] = useState<'ADMIN' | 'FLOOR'>('FLOOR')
  const [isUpdatingUser,setIsUpdatingUser] = useState(false)
  const [editUserError, setEditUserError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')

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
  const [newProductImageUrl, setNewProductImageUrl] = useState('')

  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [productMessage, setProductMessage] = useState('')

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, atau WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setNewProductImageUrl(compressedDataUrl)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }


  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  type DashboardPeriod = '7_DAYS' | '1_MONTH' | '1_YEAR'
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>('7_DAYS')


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

  async function fetchUsers() {
    try {
      setIsLoadingUsers(true)
      setUserError('')

      const response = await api.get('/api/users')

      setUsers(response.data.users)
    } catch (error: any) {
      console.error('Gagal mengambil daftar pengguna:', error)

      setUserError(
        error.response?.data?.message ||
        'Gagal memuat daftar pengguna.'
      )
    } finally {
      setIsLoadingUsers(false)
    }
  }

  async function handleAddUser(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setIsSavingUser(true)
      setAddUserError('')
      setAddUserSuccess('')

      await api.post('/api/users', {
        username: newUsername,
        password: newPassword,
        role: newUserRole,
      })

      setAddUserSuccess('User berhasil ditambahkan!')

      setNewUsername('')
      setNewPassword('')
      setNewUserRole('FLOOR')

      await fetchUsers()

      setShowAddUserForm(false)
    } catch (error: any) {
      console.error('Gagal menambahkan user:', error)

      setAddUserError(
        error.response?.data?.message || 'Gagal menambahkan user.'
      )
    } finally {
      setIsSavingUser(false)
    }
  }

  function handleStartEditUser(account: UserAccount) {
    setEditingUserId(account.id)
    setEditUsername(account.username)
    setEditPassword('')
    setEditUserRole(account.role)
    setEditUserError('')
  }

  async function handleUpdateUser(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (editingUserId === null) return

    try {
      setIsUpdatingUser(true)
      setEditUserError('')

      const updateData: {
        username: string
        role: 'ADMIN' | 'FLOOR'
        password?: string
      } = {
        username: editUsername,
        role: editUserRole,
      }

      if (editPassword.trim() !== '') {
        updateData.password = editPassword
      }

      await api.patch(`/api/users/${editingUserId}`, updateData)

      setEditingUserId(null)
      setEditPassword('')

      await fetchUsers()
    } catch (error: any) {
      console.error('GAgal mengubah user:', error)

      setEditUserError(
        error.response?.data?.message || 'Gagal mengubah user.'
      )
    } finally {
      setIsUpdatingUser(false)
    }
  }

  async function handleDeleteUser(account: UserAccount) {
  const confirmed = window.confirm(
    `Apakah kamu yakin ingin menghapus user "${account.username}"?`
  )

  if (!confirmed) return

  try {
    await api.delete(`/api/users/${account.id}`)

    await fetchUsers()
  } catch (error: any) {
    console.error('Gagal menghapus user:', error)

    window.alert(
      error.response?.data?.message ||
      'Gagal menghapus user.'
    )
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
        imageUrl: newProductImageUrl.trim() || null,
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
      setNewProductImageUrl('')
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
    setNewProductImageUrl(product.imageUrl || '')
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
      setProductMessage(error.response?.data?.message || 'Gagal menghapus produk.')
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

      if (user.role === 'ADMIN') {
        fetchUsers()
      } else {
        setUsers([])
      }
      

    } else {
      setApiProducts([])
      setCategories([])
      setTransactions([])
      setUsers([])
      setIsLoading(false)
      setIsLoadingCategories(false)
      setIsLoadingTransactions(false)
      setIsLoadingUsers(false)
    }
  }, [user])


  
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [cashReceived, setCashReceived] = useState('')
  const [lastCashReceived, setLastCashReceived] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)


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
      unitCost?: number
      subtotal: number
      notes?: string | null
      addons?: string | null
    }[]
  }

  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [transactionError, setTransactionError] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const getTodayString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getYesterdayString = () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [searchTransaction, setSearchTransaction] = useState('')
  const [transactionDateFilter, setTransactionDateFilter] = useState(getTodayString())

  const [reportStartDate, setReportStartDate] = useState(getTodayString())
  const [reportEndDate, setReportEndDate] = useState(getTodayString())

  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartNotes, setCartNotes] = useState<Record<number, string>>({})
  const [cartAddons, setCartAddons] = useState<Record<number, number[]>>({})

    async function processPayment() {
    if (Object.keys(cart).length === 0) {
      return
    }

    const itemsPayload = Object.entries(cart).map(([productId, quantity]) => {
      const pId = Number(productId)
      return {
        productId: pId,
        quantity,
        notes: cartNotes[pId]?.trim() || null,
        addonIds: cartAddons[pId] || [],
      }
    })

    // JIKA MEMILIH METODE QRIS -> BUKA MIDTRANS SNAP
    if (paymentMethod === 'QRIS') {
      try {
        setIsProcessingPayment(true)
        setPaymentError('')

        // 1. Minta token Snap ke Backend
        const tokenRes = await api.post('/api/payments/midtrans-token', {
          items: itemsPayload,
        })

        const snapToken = tokenRes.data.token

        // 2. Buka Pop-up Midtrans
        if (typeof (window as any).snap !== 'undefined') {
          (window as any).snap.pay(snapToken, {
            onSuccess: async function (result: any) {
              try {
                // Simpan transaksi ke database setelah sukses dibayar
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
              } catch (err: any) {
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

    // UNTUK PEMBAYARAN TUNAI DAN KARTU (EDC) BIASA
    try {
      setIsProcessingPayment(true)
      setPaymentError('')

      const transactionData = {
        paymentMethod,
        items: itemsPayload,
      }

      console.log('DATA TRANSAKSI DIKIRIM:', transactionData)

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

  const filteredUsers = users.filter((account) => {
    const matchesSearch = account.username
      .toLowerCase()
      .includes(userSearch.toLowerCase())

    const matchesRole =
      userRoleFilter === 'ALL' ||
      account.role === userRoleFilter

    return matchesSearch && matchesRole
  })

  const totalUsers = users.length

  const totalAdmin = users.filter((account) => account.role === 'ADMIN').length
  const totalFloor = users.filter((account) => account.role === 'FLOOR').length

  const transactionCount = filteredTransactions.length

  const totalSales = filteredTransactions.reduce(
    (total, transaction) => total + transaction.total, 0
  )

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

  let chartData: { label: string, total: number }[] = []

  if (dashboardPeriod === '7_DAYS') {
    chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const dateKey = [date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      const total = transactions.filter((t) => {
        const d = new Date(t.createdAt)
        const k = [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0'),
        ].join('-')
        return k === dateKey
      })
      .reduce((sum, t) => sum + t.total, 0)

      return { label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short'}), total,}
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
    // 1 Tahun (12 bulan terakhir)
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
  // Produk Terlaris Sesuai Periode Terpilih
  const productSales: Record<string, number> = {}
  dashboardTransactions.forEach((transaction) => {
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
      const startDate = new Date(`${reportStartDate}T00:00:00`)

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

  const reportTotalCost = filteredReportTransactions.reduce(
    (total: number, transaction: Transaction) =>
      total + transaction.items.reduce((itemTotal,item) => itemTotal + (item.unitCost || 0) * item.quantity, 0),
  0)

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
      const totalHpp = tx.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0)
      const labaKotor = tx.total - totalHpp
      
      return{
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
      'No.': '' as any,
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

    const filePeriod = reportStartDate && reportEndDate
      ? `${reportStartDate}_sd_${reportEndDate}`
      : 'Semua_Periode'
    XLSX.writeFile(workbook, `Laporan_Laba_Rugi_Brew_Beans_${filePeriod}.xlsx`)

  }

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
    <div className="flex min-h-screen bg-[#F8F5F0] text-stone-900 font-sans">
      {/* SIDEBAR KIRI (Dark Espresso) */}
      <aside className="sticky top-0 h-screen w-64 flex-shrink-0 flex flex-col justify-between bg-[#1E110A] text-stone-300 p-5 shadow-2xl z-20">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-stone-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5A3825] text-amber-200 shadow-md">
              <Coffee className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Brew & Beans</h1>
              <p className="text-[10px] font-semibold text-amber-300 tracking-wider uppercase">Coffee Shop POS</p>
            </div>
          </div>

          {/* Navigasi Menu Berdasarkan Role */}
          <nav className="space-y-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePage('DASHBOARD')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === 'DASHBOARD'
                    ? 'bg-[#5A3825] text-white shadow-md'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActivePage('KASIR')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activePage === 'KASIR'
                  ? 'bg-[#5A3825] text-white shadow-md'
                  : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Kasir (POS)</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePage('PRODUK')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === 'PRODUK'
                    ? 'bg-[#5A3825] text-white shadow-md'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Produk</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePage('KATEGORI')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === 'KATEGORI'
                    ? 'bg-[#5A3825] text-white shadow-md'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Tag className="h-4 w-4" />
                <span>Kategori</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActivePage('TRANSAKSI')}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activePage === 'TRANSAKSI'
                  ? 'bg-[#5A3825] text-white shadow-md'
                  : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Riwayat Transaksi</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePage('LAPORAN')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === 'LAPORAN'
                    ? 'bg-[#5A3825] text-white shadow-md'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Laporan Bisnis</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePage('USERS')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === 'USERS'
                    ? 'bg-[#5A3825] text-white shadow-md'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Pengguna & Role</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActivePage('PENGATURAN')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activePage === 'PENGATURAN'
                    ? 'bg-[#5A3825] text-white shadow-md'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Pengaturan Toko</span>
              </button>
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

      {/* AREA KONTEN UTAMA (Warm Cream) */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              {activePage === 'DASHBOARD' && 'Dashboard Analitik'}
              {activePage === 'KASIR' && 'Kasir & Point of Sale'}
              {activePage === 'PRODUK' && 'Katalog Produk'}
              {activePage === 'KATEGORI' && 'Kategori Menu'}
              {activePage === 'TRANSAKSI' && 'Riwayat Transaksi Penjualan'}
              {activePage === 'LAPORAN' && 'Laporan Penjualan & Laba Rugi'}
              {activePage === 'USERS' && 'Manajemen Pengguna'}
              {activePage === 'PENGATURAN' && 'Pengaturan Toko & Struk'}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Brew & Beans Coffee POS &bull; Masuk sebagai <span className="font-semibold text-[#5A3825]">{user?.username} ({user?.role})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
        </header>

      {activePage === 'DASHBOARD' && isAdmin && (
        <section className="space-y-6">
          {/* Header Periode & Tombol Pilihan */}
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

          {/* Kartu Metrik yang Ikut Berubah Sesuai Periode (Opsi B) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">Total Produk Aktif</p>
              <p className="mt-2 text-3xl font-extrabold text-[#5A3825]">
                {products.length}
              </p>
              <p className="mt-1 text-xs text-stone-400">Total katalog menu</p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">
                Total Transaksi ({dashboardPeriod === '7_DAYS' ? '7 Hari' : dashboardPeriod === '1_MONTH' ? '1 Bulan' : '1 Tahun'})
              </p>
              <p className="mt-2 text-3xl font-extrabold text-stone-900">
                {dashboardTotalTransactions}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">Transaksi terbayar</p>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-stone-500">
                Total Penjualan ({dashboardPeriod === '7_DAYS' ? '7 Hari' : dashboardPeriod === '1_MONTH' ? '1 Bulan' : '1 Tahun'})
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#5A3825]">
                Rp {dashboardTotalSales.toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">Omzet kotor periode ini</p>
            </div>
          </div>

          {/* Bagian Grafik */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-800 mb-1">
              Grafik Tren Penjualan
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Ringkasan omzet berdasarkan rentang {dashboardPeriod === '7_DAYS' ? '7 hari terakhir' : dashboardPeriod === '1_MONTH' ? '30 hari terakhir' : '12 bulan terakhir'}
            </p>

            <ResponsiveContainer width="100%" height={300}>
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

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-stone-500">
                Total Modal (HPP)
              </p>

              <p className="mt-2 text-2xl font-bold text-stone-700">
                Rp {reportTotalCost.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm text-stone-500">
                Laba Kotor
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                Rp {reportGrossProfit.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
            <h2 className="text-xl font-bold text-amber-900">
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
            <label className="mb-2 block font-medium text-stone-800">
              Foto Produk (Galeri / URL)
            </label>

            <div className="space-y-3">
              {newProductImageUrl && (
                <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <img
                    src={newProductImageUrl}
                    alt="Preview Produk"
                    className="h-20 w-20 rounded-lg object-cover shadow-sm border border-stone-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-700">Foto Terpasang ✓</p>
                    <p className="mt-0.5 text-xs text-stone-500 truncate max-w-xs">
                      {newProductImageUrl.startsWith('data:') ? 'Dari Galeri / Komputer' : newProductImageUrl}
                    </p>
                    <button
                      type="button"
                      onClick={() => setNewProductImageUrl('')}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      Hapus / Ganti Foto
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-4 text-center cursor-pointer hover:border-[#5A3825] hover:bg-stone-100/60 transition">
                  <div className="rounded-full bg-[#5A3825]/10 p-2.5 text-[#5A3825]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#5A3825]">Pilih dari Galeri / File</span>
                    <p className="text-[11px] text-stone-400 mt-0.5">JPG, PNG, atau WebP</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col justify-center rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                  <span className="text-xs font-medium text-stone-600 mb-1.5">Atau tempel Link URL Foto:</span>
                  <input
                    type="text"
                    value={newProductImageUrl.startsWith('data:') ? '' : newProductImageUrl}
                    onChange={(e) => setNewProductImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs focus:border-[#5A3825] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Kosongkan jika ingin sistem memasang foto estetik otomatis.
                  </p>
                </div>
              </div>
            </div>
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

          <div className="flex gap-3">
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

            {editingProductId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null)
                  setNewProductName('')
                  setNewProductDescription('')
                  setNewProductPrice('')
                  setNewProductCostPrice('')
                  setNewProductCategoryId('')
                  setNewProductStock('0')
                  setNewProductMinimumStock('0')
                  setNewProductImageUrl('')
                  setProductMessage('')
                }}
                className="rounded-lg border border-stone-300 px-5 py-3 font-semibold text-stone-600 hover:bg-stone-100"
              >
                Batal
              </button>
            )}
          </div>

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
                    <div className="flex items-center gap-4">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'}
                        alt={product.name}
                        className="h-16 w-16 rounded-xl object-cover border border-stone-200 shadow-sm shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'
                        }}
                      />
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
                            Edit
                          </button>

                          <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                          >
                            Delete
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
            {displayCashierProducts.map((product) => (
              <div 
                key={product.id} 
                className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm flex flex-col justify-between transition hover:shadow-md"
              >
                <div>
                  {/* Foto Menu Kopi dengan Fallback Otomatis */}
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
                  {/* Keterangan Menu */}
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
                    <p className={`mt-1 text-xs font-semibold ${
                      product.stock === 0
                        ? 'text-red-600'
                        : product.stock <= product.minimumStock
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}>
                      Stok: {product.stock} unit {product.stock === 0 ? '(Habis)' : product.stock <= product.minimumStock ? '(Menipis)' : '(Aman)'}
                    </p>
                  </div>
                </div>
                {/* Tombol Kasir */}
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
                        Di keranjang: <strong className="text-stone-900">{cart[product.id]}</strong>
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

        <aside className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-stone-800">
            Keranjang
          </h2>

          <div className="mt-4 space-y-3">
            {products
              .filter((product) => (cart[product.id] ?? 0) > 0)
              .map((product) => {
                const qty = cart[product.id]
                const selectedAddonIds = cartAddons[product.id] || []
                const selectedAddons = selectedAddonIds
                  .map((aId) => products.find((p) => p.id === aId))
                  .filter(Boolean) as typeof products
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
                        <p className="font-bold text-stone-900 text-sm">
                          {product.name}
                        </p>
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

                    {/* Pilihan Add-ons Berbayar (Susu Oat, Extra Shot, dll) */}
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

                    {/* Pilihan Selera Rasa (Gratis) */}
                    <div className="mt-2 pt-2 border-t border-stone-200/60">
                      <p className="text-[11px] font-bold text-stone-600">
                        ☕ Catatan Rasa:
                      </p>
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
          className={`rounded-xl border p-3 text-center font-semibold transition ${
            paymentMethod === 'Tunai'
            ? 'border-amber-800 bg-amber-50 text-amber-900 ring-2 ring-amber-800'
            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}>
            Tunai
          </button>

          <button
          type="button"
          onClick={() => setPaymentMethod('QRIS')}
          className={`rounded-xl border p-3 text-center font-semibold transition ${ paymentMethod === 'QRIS'
            ? 'border-amber-800 bg-amber-50 text-amber-900 ring-2 ring-amber-800'
            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}
          >
            QRIS
          </button>

          <button
          type="button"
          onClick={() => setPaymentMethod('Kartu (EDC)')}
          className={`rounded-xl border p-3 text-center font-semibold transition ${ paymentMethod === 'Kartu (EDC)'
            ? 'border-amber-800 bg-amber-50 text-amber-900 ring-2 ring-amber-800'
            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}
          >
            Kartu (EDC)
          </button>
        </div>

        {paymentMethod === 'QRIS' && !paymentSuccess && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-sm font-semibold text-blue-900">Pembayaran QRIS</p>
            <p className="mt-1 text-xs text-blue-700">
              Arahkan pelanggan untuk scan QRIS statis / dinamis kasir senilai{' '}
              <span className="font-bold">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </p>
          </div>
        )}

        {paymentMethod === 'Kartu (EDC)' && !paymentSuccess && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-sm font-semibold text-blue-900">Pembayaran Kartu / EDC</p>
            <p className="mt-1 text-xs text-blue-700">
              Gesek / Tap kartu debit/kredit pada mesin EDC senilai{' '}
              <span className="font-bold">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </p>
          </div>
        )}
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
                <span className={`font-bold ${ Number(cashReceived) >= cartTotal ? 'text-emerald-700' : 'text-red-600'}`}>
                  {Number(cashReceived) >= cartTotal ? `Rp ${(Number(cashReceived) - cartTotal).toLocaleString('id-ID')}`
                  : `Kurang Rp ${(cartTotal - Number(cashReceived)).toLocaleString('id-ID')}`}
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
        className='mt-3 w-full rounded-lg bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800'
        >
          {isProcessingPayment
          ? 'Memproses...'
          : paymentMethod === 'QRIS'
          ? 'Bayar via Midtrans (QRIS)'
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
               {item.addons && (
                 <p className="text-xs text-emerald-800 pl-2">
                   + {item.addons}
                 </p>
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
                 <span>
                   Rp {item.subtotal.toLocaleString('id-ID')}
                 </span>
               </div>
             </div>
           ))}
          </div>

            <div className="my-4 border-t border-dashed border-stone-400" />
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    Rp {receiptTransaction.total.toLocaleString('id-ID')}
                  </span>
                </div>

                {receiptTransaction.paymentMethod === 'Tunai' && Number(lastCashReceived) > 0 &&(
                  <>
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Tunai Diterima</span>
                    <span>Rp {Number(lastCashReceived).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Kembalian</span>
                    <span>
                      Rp {Math.max(0, Number(lastCashReceived) - receiptTransaction.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                  </>
                )}
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
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div>
        <h2 className="text-xl font-bold text-stone-800">
          Riwayat Transaksi Penjualan
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          {transactionDateFilter
            ? `Menampilkan transaksi tanggal: ${transactionDateFilter === getTodayString() ? 'Hari Ini (' + transactionDateFilter + ')' : transactionDateFilter === getYesterdayString() ? 'Kemarin (' + transactionDateFilter + ')' : transactionDateFilter}`
            : 'Menampilkan semua transaksi sepanjang waktu'}
        </p>
      </div>

      {/* Filter Tanggal & Tombol Cepat */}
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

    {/* Metric Cards untuk Tanggal Terpilih */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
        <p className="text-xs font-medium text-stone-600">
          Jumlah Transaksi {transactionDateFilter ? `(${transactionDateFilter})` : ''}
        </p>
        <p className="mt-1 text-2xl font-bold text-stone-900">
          {transactionCount}
        </p>
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

    {/* Search Box */}
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
                <div key={item.id} className="text-sm text-stone-600 mb-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium text-stone-800">
                      {item.productName} × {item.quantity}
                    </span>
                    <span>
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {item.addons && (
                    <p className="text-xs text-emerald-700 pl-2">
                      + {item.addons}
                    </p>
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
            <h3 className="text-lg font-bold text-amber-900">
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

{activePage === 'USERS' && isAdmin && (
  <section className="space-y-6">
    <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
      <h2 className="text-2xl font-bold text-amber-900">
        Manajemen Pengguna
      </h2>

      <p className="mt-2 text-stone-600">
        Kelola akun Admin dan Floor Brew & Beans.
      </p>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => {
            setShowAddUserForm(!showAddUserForm)
            setAddUserError('')
            setAddUserSuccess('')
          }}
          className="rounded-lg bg-amber-800 px-5 py-3 font-semibold text-white hover:bg-amber-900"
        >
          {showAddUserForm ? 'Batal' : '+ Tambah User'}
        </button>

        {addUserSuccess && (
          <p className="mt-3 text-sm font-medium text-green-700">
            {addUserSuccess}
          </p>
        )}

        {showAddUserForm && (
          <form
            onSubmit={handleAddUser}
            className="mt-5 max-w-xl space-y-4 rounded-xl border border-stone-200 p-5"
          >
            <h3 className="text-lg font-bold text-amber-900">
              Tambah User Baru
            </h3>

            <div>
              <label className="mb-1 block font-medium">
                Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                required
                className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-700"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-700"
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Role
              </label>
              <select
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(e.target.value as 'ADMIN' | 'FLOOR')
                }
                className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-700"
              >
                <option value="FLOOR">FLOOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {addUserError && (
              <p className="text-sm text-red-600">
                {addUserError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSavingUser}
              className="rounded-lg bg-amber-800 px-5 py-3 font-semibold text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingUser ? 'Menyimpan...' : 'Simpan User'}
            </button>
          </form>
        )}
      </div>
    </div>

    <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
      <h2 className="text-xl font-bold text-amber-900">
        Daftar Pengguna
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          type="text"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Cari username..."
          className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-700"
        />

        <select
          value={userRoleFilter}
          onChange={(e) => setUserRoleFilter(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-700"
        >
          <option value="ALL">Semua Role</option>
          <option value="ADMIN">ADMIN</option>
          <option value="FLOOR">FLOOR</option>
        </select>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-500">Total User</p>
            <p className="mt-1 text-2xl font-bold text-stone-800">
              {totalUsers}
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-500">Total ADMIN</p>
            <p className="mt-1 text-2xl font-bold text-amber-800">
              {totalAdmin}
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-500">Total FLOOR</p>
            <p className="mt-1 text-2xl font-bold text-stone-800">
              {totalFloor}
            </p>
          </div>
        </div>
      </div>

      {isLoadingUsers ? (
        <p className="mt-4 text-stone-500">
          Memuat daftar pengguna...
        </p>
      ) : userError ? (
        <div className="mt-4">
          <p className="text-red-600">
            {userError}
          </p>

          <button
          type="button"
          onClick={fetchUsers}
          className="mt-3 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          {users.length === 0
           ? 'Belum ada User.'
           : 'User tidak ditemukan.'}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filteredUsers.map((account) => (
            <div
            key={account.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 p-4"
            >
              <div>
                <h3 className="font-semibold">
                  {account.username}
                </h3>

                <p className="mt-1 text-sm text-stone-500">
                  ID Pengguna: {account.id}
                </p>

                <p className="mt-1 text-sm text-stone-500">
                  Dibuat: {new Date(account.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>

              <span className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                account.role === 'ADMIN'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {account.role}
              </span>

              <button
                type="button"
                onClick={() => handleStartEditUser(account)}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDeleteUser(account)}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
              >
                Hapus
              </button>

              {editingUserId === account.id && (
                <form
                  onSubmit={handleUpdateUser}
                  className="mt-3 space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5"
                >
                  <h3 className="font-bold text-blue-900">
                    Edit User: {account.username}
                  </h3>

                  <div>
                    <label className="mb-1 block font-medium">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      minLength={3}
                      maxLength={30}
                      required
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      minLength={8}
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3"
                      placeholder="Kosongkan jika tidak ingin mengganti password"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium">
                      Role
                    </label>
                    <select
                      value={editUserRole}
                      onChange={(e) =>
                        setEditUserRole(e.target.value as 'ADMIN' | 'FLOOR')
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3"
                    >
                      <option value="FLOOR">FLOOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  {editUserError && (
                    <p className="text-sm text-red-600">
                      {editUserError}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isUpdatingUser}
                      className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {isUpdatingUser ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="rounded-lg bg-stone-200 px-5 py-3 font-semibold text-stone-700 hover:bg-stone-300"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)}
      </main>
    </div>
  )
}
export default App
