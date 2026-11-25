import { useState } from 'react'
import { api } from '../../api'
import type { Category } from '../../types/pos.types'

interface CategoryViewProps {
  categories: Category[]
  isLoadingCategories: boolean
  categoryError: string
  fetchCategories: () => Promise<void>
}

export function CategoryView({
  categories,
  isLoadingCategories,
  categoryError,
  fetchCategories,
}: CategoryViewProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [categoryMessage, setCategoryMessage] = useState('')

  async function handleSaveCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCategoryMessage('')

    if (!newCategoryName.trim()) {
      setCategoryMessage('Nama kategori wajib diisi.')
      return
    }

    try {
      setIsSavingCategory(true)
      const categoryData = { name: newCategoryName.trim() }

      if (editingCategoryId !== null) {
        await api.patch(`/api/categories/${editingCategoryId}`, categoryData)
        setCategoryMessage('Kategori berhasil diperbarui')
      } else {
        await api.post('/api/categories', categoryData)
        setCategoryMessage('Kategori berhasil ditambahkan!')
      }

      setNewCategoryName('')
      setEditingCategoryId(null)
      await fetchCategories()
    } catch (error: any) {
      console.error('Gagal menyimpan kategori:', error)
      setCategoryMessage(error.response?.data?.message || 'Gagal menyimpan kategori.')
    } finally {
      setIsSavingCategory(false)
    }
  }

  function handleEditCategory(category: Category) {
    setEditingCategoryId(category.id)
    setNewCategoryName(category.name)
    setCategoryMessage('')
  }

  async function handleDeleteCategory(categoryId: number) {
    const confirmation = window.confirm('Apakah kamu yakin ingin menghapus kategori ini?')
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

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-2xl font-bold text-amber-900">Manajemen Kategori</h2>
        <p className="mt-2 text-stone-600">Kelola Kategori produk Brew & Beans.</p>

        <form onSubmit={handleSaveCategory} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block font-medium">Nama Kategori</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Contoh: Coffee"
              className="w-full rounded-lg border border-stone-300 px-4 py-3"
              required
            />
          </div>

          {categoryMessage && <p className="text-sm text-amber-800">{categoryMessage}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSavingCategory}
              className="rounded-lg bg-amber-800 px-6 py-3 font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
            >
              {isSavingCategory
                ? 'Menyimpan...'
                : editingCategoryId !== null
                ? 'Simpan perubahan'
                : 'Tambah Kategori'}
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
        <h2 className="text-xl font-bold text-amber-900">Daftar Kategori</h2>

        {isLoadingCategories ? (
          <p className="mt-4 text-stone-500">Memuat Kategori</p>
        ) : categoryError ? (
          <div className="mt-4">
            <p className="text-red-600">{categoryError}</p>
            <button
              type="button"
              onClick={fetchCategories}
              className="mt-3 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900"
            >
              Coba Lagi
            </button>
          </div>
        ) : categories.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Belum ada Kategori.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 p-4"
              >
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="mt-1 text-sm text-stone-500">ID Kategori: {category.id}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditCategory(category)}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
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
  )
}
