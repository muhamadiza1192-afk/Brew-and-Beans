import { useState } from 'react'
import { api } from '../../api'
import type { UserAccount } from '../../types/pos.types'

interface UserViewProps {
  users: UserAccount[]
  isLoadingUsers: boolean
  userError: string
  fetchUsers: () => Promise<void>
}

export function UserView({
  users,
  isLoadingUsers,
  userError,
  fetchUsers,
}: UserViewProps) {
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
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [editUserError, setEditUserError] = useState('')

  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')

  const filteredUsers = users.filter((account) => {
    const matchesSearch = account.username.toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = userRoleFilter === 'ALL' || account.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  const totalUsers = users.length
  const totalAdmin = users.filter((account) => account.role === 'ADMIN').length
  const totalFloor = users.filter((account) => account.role === 'FLOOR').length

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
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
      setAddUserError(error.response?.data?.message || 'Gagal menambahkan user.')
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

  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
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
      console.error('Gagal mengubah user:', error)
      setEditUserError(error.response?.data?.message || 'Gagal mengubah user.')
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
      window.alert(error.response?.data?.message || 'Gagal menghapus user.')
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-2xl font-bold text-amber-900">Manajemen Pengguna</h2>
        <p className="mt-2 text-stone-600">Kelola akun Admin dan Floor Brew & Beans.</p>

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
            <p className="mt-3 text-sm font-medium text-green-700">{addUserSuccess}</p>
          )}

          {showAddUserForm && (
            <form
              onSubmit={handleAddUser}
              className="mt-5 max-w-xl space-y-4 rounded-xl border border-stone-200 p-5"
            >
              <h3 className="text-lg font-bold text-amber-900">Tambah User Baru</h3>

              <div>
                <label className="mb-1 block font-medium">Username</label>
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
                <label className="mb-1 block font-medium">Password</label>
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
                <label className="mb-1 block font-medium">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'FLOOR')}
                  className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-amber-700"
                >
                  <option value="FLOOR">FLOOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {addUserError && <p className="text-sm text-red-600">{addUserError}</p>}

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
        <h2 className="text-xl font-bold text-amber-900">Daftar Pengguna</h2>

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

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-2">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Total User</p>
              <p className="mt-1 text-2xl font-bold text-stone-800">{totalUsers}</p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Total ADMIN</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{totalAdmin}</p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Total FLOOR</p>
              <p className="mt-1 text-2xl font-bold text-stone-800">{totalFloor}</p>
            </div>
          </div>
        </div>

        {isLoadingUsers ? (
          <p className="mt-4 text-stone-500">Memuat daftar pengguna...</p>
        ) : userError ? (
          <div className="mt-4">
            <p className="text-red-600">{userError}</p>
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
            {users.length === 0 ? 'Belum ada User.' : 'User tidak ditemukan.'}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredUsers.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 p-4"
              >
                <div>
                  <h3 className="font-semibold">{account.username}</h3>
                  <p className="mt-1 text-sm text-stone-500">ID Pengguna: {account.id}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Dibuat: {new Date(account.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>

                <span
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    account.role === 'ADMIN'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {account.role}
                </span>

                <div className="flex gap-2">
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
                </div>

                {editingUserId === account.id && (
                  <form
                    onSubmit={handleUpdateUser}
                    className="mt-3 w-full space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5"
                  >
                    <h3 className="font-bold text-blue-900">Edit User: {account.username}</h3>

                    <div>
                      <label className="mb-1 block font-medium">Username</label>
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
                      <label className="mb-1 block font-medium">Password Baru</label>
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
                      <label className="mb-1 block font-medium">Role</label>
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

                    {editUserError && <p className="text-sm text-red-600">{editUserError}</p>}

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
  )
}
