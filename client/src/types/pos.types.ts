export type Page =
  | 'DASHBOARD'
  | 'KASIR'
  | 'TRANSAKSI'
  | 'PRODUK'
  | 'KATEGORI'
  | 'LAPORAN'
  | 'PENGATURAN'
  | 'USERS'

export type Category = {
  id: number
  name: string
}

export type Product = {
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

export type UserAccount = {
  id: number
  username: string
  role: 'ADMIN' | 'FLOOR'
  createdAt: string
  updatedAt: string
}

export type StoreSetting = {
  storeName: string
  address: string
  phone: string
  receiptNote: string
  receiptFooter: string
}

export type TransactionItem = {
  id: number
  productName: string
  quantity: number
  unitPrice: number
  unitCost?: number
  subtotal: number
  notes?: string | null
  addons?: string | null
}

export type Transaction = {
  id: number
  transactionNumber: string
  total: number
  paymentMethod: string
  createdAt: string
  items: TransactionItem[]
}

export type DashboardPeriod = '7_DAYS' | '1_MONTH' | '1_YEAR'

export const isAddonProduct = (p: Product) =>
  Boolean(
    p.category?.name &&
      (p.category.name.toLowerCase().includes('addon') ||
        p.category.name.toLowerCase().includes('add-on'))
  )

export const getTodayString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getYesterdayString = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
