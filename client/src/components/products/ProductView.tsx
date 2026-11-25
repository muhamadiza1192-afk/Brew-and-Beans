import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { api } from '../../api'
import type { Category, Product } from '../../types/pos.types'

interface ProductViewProps {
  products: Product[]
  categories: Category[]
  fetchProducts: () => Promise<void>
}

export function ProductView({
  products,
  categories,
  fetchProducts,
}: ProductViewProps) {
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

  async function handleSaveProduct(e: React.FormEvent<HTMLFormElement>) {
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
      setProductMessage(
        'Lengkapi data produk. Harga harus positif, sedangkan stok dan batas minimum harus berupa bilangan bulat tidak negatif'
      )
      return
    }

    try {
      setIsSavingProduct(true)

      const productData = {
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        price,
        costPrice,
        stock,
        minimumStock,
        imageUrl: newProductImageUrl.trim() || null,
        categoryId: newProductCategoryId ? Number(newProductCategoryId) : null,
      }

      if (editingProductId !== null) {
        await api.patch(`/api/products/${editingProductId}`, productData)
        setProductMessage('Produk berhasil diperbaharui!')
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
    setNewProductCategoryId(product.categoryId !== null ? String(product.categoryId) : '')
    setNewProductStock(String(product.stock))
    setNewProductMinimumStock(String(product.minimumStock))
    setNewProductImageUrl(product.imageUrl || '')
    setProductMessage('')
  }

  async function handleDeleteProduct(productId: number) {
    const confirmation = window.confirm('Apakah kamu yakin ingin menghapus produk ini?')
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

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-2xl font-bold text-amber-900">Manajemen Produk</h2>
        <p className="mt-2 text-stone-600">Halaman untuk mengelola produk Brew & Beans.</p>

        <form onSubmit={handleSaveProduct} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block font-medium">Nama Produk</label>
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
            <label className="mb-2 block font-medium">Deskripsi Produk</label>
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
            <label className="mb-2 block font-medium">Harga Produk</label>
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
            <label className="mb-2 block font-medium">Modal Produk</label>
            <input
              type="number"
              min="0"
              step="1"
              value={newProductCostPrice}
              onChange={(e) => setNewProductCostPrice(e.target.value)}
              placeholder="Contoh: 12000"
              className="w-full rounded-lg border border-stone-300 px-4 py-3"
              required
            />
            <p className="mt-1 text-sm text-stone-500">
              Masukkan total modal untuk satu unit produk.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium">Stock Awal</label>
            <input
              type="number"
              min="0"
              step="1"
              value={newProductStock}
              onChange={(e) => setNewProductStock(e.target.value)}
              placeholder="Contoh: 50"
              className="w-full rounded-lg border border-stone-300 px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Batas Minimum Stock</label>
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
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-700">Foto Terpasang ✓</p>
                    <p className="mt-0.5 text-xs text-stone-500 truncate max-w-xs">
                      {newProductImageUrl.startsWith('data:')
                        ? 'Dari Galeri / Komputer'
                        : newProductImageUrl}
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
                    <span className="text-xs font-semibold text-[#5A3825]">
                      Pilih dari Galeri / File
                    </span>
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
                  <span className="text-xs font-medium text-stone-600 mb-1.5">
                    Atau tempel Link URL Foto:
                  </span>
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
            <label className="mb-2 block font-medium">Kategori Produk</label>
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

          {productMessage && <p className="text-sm text-amber-800">{productMessage}</p>}

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
        <h2 className="text-xl font-bold text-amber-900">Daftar Produk</h2>

        <div className="mt-4 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border border-stone-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      product.imageUrl ||
                      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'
                    }
                    alt={product.name}
                    className="h-16 w-16 rounded-xl object-cover border border-stone-200 shadow-sm shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'
                    }}
                  />
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="mt-1 text-sm text-stone-500">{product.description}</p>
                    <p className="mt-1 text-sm text-amber-700">
                      Kategori: {product.category?.name ?? 'Tanpa Kategori'}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">Stok: {product.stock} unit</p>
                    <p className="mt-1 text-sm text-stone-600">
                      Batas Minimum: {product.minimumStock} unit
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        product.stock === 0
                          ? 'text-red-600'
                          : product.stock <= product.minimumStock
                          ? 'text-amber-600'
                          : 'text-green-700'
                      }`}
                    >
                      {product.stock === 0
                        ? 'Stok Habis'
                        : product.stock <= product.minimumStock
                        ? 'Stok Menipis'
                        : 'Stok aman'}
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
                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <p className="text-sm text-stone-500">Belum ada Produk</p>
          )}
        </div>
      </div>
    </section>
  )
}
