import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './context/AuthContext'
import { Login } from './login'
import type {
  Category,
  Product,
  StoreSetting,
  Transaction,
  UserAccount,
} from './types/pos.types'

import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { DashboardView } from './components/dashboard/DashboardView'
import { ReportView } from './components/reports/ReportView'
import { ProductView } from './components/products/ProductView'
import { CategoryView } from './components/categories/CategoryView'
import { CashierView } from './components/pos/CashierView'
import { TransactionView } from './components/transactions/TransactionView'
import { SettingView } from './components/settings/SettingView'
import { UserView } from './components/users/UserView'

function App() {
  const { user, logout, isAuthReady } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const defaultRoute = isAdmin ? '/dashboard' : '/kasir'

  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productError, setProductError] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [transactionError, setTransactionError] = useState('')

  const [users, setUsers] = useState<UserAccount[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')

  const [settings, setSettings] = useState<StoreSetting>({
    storeName: 'Brew & Beans',
    address: '',
    phone: '',
    receiptNote: '',
    receiptFooter: 'Terima kasih telah berkunjung',
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)

  async function fetchProducts() {
    try {
      setIsLoadingProducts(true)
      setProductError('')
      const response = await api.get('/api/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Gagal mengambil produk:', error)
      setProductError('Gagal memuat produk. Periksa koneksi server.')
    } finally {
      setIsLoadingProducts(false)
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

  async function fetchTransactions() {
    try {
      setIsLoadingTransactions(true)
      setTransactionError('')
      const response = await api.get('/api/transactions')
      setTransactions(response.data.transactions)
    } catch (error: any) {
      console.error('Gagal mengambil riwayat transaksi:', error)
      setTransactionError(
        error.response?.data?.message || 'Gagal memuat riwayat transaksi'
      )
    } finally {
      setIsLoadingTransactions(false)
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
        error.response?.data?.message || 'Gagal memuat daftar pengguna.'
      )
    } finally {
      setIsLoadingUsers(false)
    }
  }

  async function fetchSettings() {
    try {
      setIsLoadingSettings(true)
      const response = await api.get('/api/settings')
      setSettings(response.data.settings)
    } catch (error) {
      console.error('Gagal mengambil pengaturan:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  useEffect(() => {
    if (user) {
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
      setProducts([])
      setCategories([])
      setTransactions([])
      setUsers([])
      setIsLoadingProducts(false)
      setIsLoadingCategories(false)
      setIsLoadingTransactions(false)
      setIsLoadingUsers(false)
    }
  }, [user])

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-950 text-white">
        Memeriksa sesi login...
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="flex min-h-screen bg-[#F8F5F0] text-stone-900 font-sans">
      <Sidebar isAdmin={isAdmin} user={user} logout={logout} />

      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <Header user={user} />

        <Routes>
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />

          <Route
            path="/dashboard"
            element={
              isAdmin ? (
                <DashboardView products={products} transactions={transactions} />
              ) : (
                <Navigate to="/kasir" replace />
              )
            }
          />

          <Route
            path="/kasir"
            element={
              <CashierView
                products={products}
                isLoading={isLoadingProducts}
                errorMessage={productError}
                settings={settings}
                cashierUsername={user.username}
                fetchProducts={fetchProducts}
                fetchTransactions={fetchTransactions}
              />
            }
          />

          <Route
            path="/produk"
            element={
              isAdmin ? (
                <ProductView
                  products={products}
                  categories={categories}
                  fetchProducts={fetchProducts}
                />
              ) : (
                <Navigate to="/kasir" replace />
              )
            }
          />

          <Route
            path="/kategori"
            element={
              isAdmin ? (
                <CategoryView
                  categories={categories}
                  isLoadingCategories={isLoadingCategories}
                  categoryError={categoryError}
                  fetchCategories={fetchCategories}
                />
              ) : (
                <Navigate to="/kasir" replace />
              )
            }
          />

          <Route
            path="/transaksi"
            element={
              <TransactionView
                transactions={transactions}
                isLoadingTransactions={isLoadingTransactions}
                transactionError={transactionError}
                fetchTransactions={fetchTransactions}
              />
            }
          />

          <Route
            path="/laporan"
            element={
              isAdmin ? (
                <ReportView transactions={transactions} />
              ) : (
                <Navigate to="/kasir" replace />
              )
            }
          />

          <Route
            path="/users"
            element={
              isAdmin ? (
                <UserView
                  users={users}
                  isLoadingUsers={isLoadingUsers}
                  userError={userError}
                  fetchUsers={fetchUsers}
                />
              ) : (
                <Navigate to="/kasir" replace />
              )
            }
          />

          <Route
            path="/pengaturan"
            element={
              isAdmin ? (
                <SettingView
                  settings={settings}
                  setSettings={setSettings}
                  isLoadingSettings={isLoadingSettings}
                />
              ) : (
                <Navigate to="/kasir" replace />
              )
            }
          />

          {/* Fallback jika user mengetik URL yang tidak dikenal */}
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
