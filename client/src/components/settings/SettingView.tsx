import { useState } from 'react'
import { api } from '../../api'
import type { StoreSetting } from '../../types/pos.types'

interface SettingViewProps {
  settings: StoreSetting
  setSettings: React.Dispatch<React.SetStateAction<StoreSetting>>
  isLoadingSettings: boolean
}

export function SettingView({
  settings,
  setSettings,
  isLoadingSettings,
}: SettingViewProps) {
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsMessage, setSettingMessage] = useState('')

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setIsSavingSettings(true)
      setSettingMessage('')

      const response = await api.put('/api/settings', settings)
      setSettings(response.data.settings)
      setSettingMessage('Pengaturan berhasil diperbarui')
    } catch (error: any) {
      console.error('Gagal menyimpan pengaturan:', error)
      setSettingMessage(error.response?.data?.message || 'Gagal menyimpan pengaturan')
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-6 text-stone-800 shadow">
        <h2 className="text-2xl font-bold text-amber-900">Pengaturan Coffee Shop</h2>
        <p className="mt-2 text-stone-600">
          Kelola informasi Brew & Beans dan tampilan struk pembayaran.
        </p>

        {isLoadingSettings ? (
          <p className="mt-6 text-stone-500">Memuat Pengaturan...</p>
        ) : (
          <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block font-medium">Nama Coffee Shop</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Alamat Coffee Shop</label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                rows={3}
                maxLength={255}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Nomor Telepon</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                maxLength={30}
              />
            </div>

            <div className="border-t border-stone-200 pt-5">
              <h3 className="text-lg font-bold text-amber-900">Pengaturan Struk</h3>
            </div>

            <div>
              <label className="mb-2 block font-medium">Catatan Struk</label>
              <textarea
                value={settings.receiptNote}
                onChange={(e) => setSettings({ ...settings, receiptNote: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Pesan Penutup Struk</label>
              <textarea
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-4 py-3"
                rows={2}
                maxLength={255}
              />
            </div>

            {settingsMessage && (
              <p className="text-sm font-medium text-amber-800">{settingsMessage}</p>
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
  )
}
