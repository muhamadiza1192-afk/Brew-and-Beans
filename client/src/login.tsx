import { useState } from "react";
import axios from 'axios'
import { api } from './api'
import { useAuth } from "./context/AuthContext";
import { Coffee, Eye, EyeOff, Lock, User } from "lucide-react";

type LoginResponse = {
    message: string
    token: string
    user: {
        id: number
        username: string
        role: 'ADMIN' | 'FLOOR'
    }
}

export function Login() {
    const { login } = useAuth()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()

        setErrorMessage('')
        setIsLoading(true)

        try {
            const response = await api.post<LoginResponse>(
                '/api/auth/login',
                {
                    username,
                    password,
                }
            )

            login(response.data.user, response.data.token)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.message ?? 'Login gagal. Periksa kembali username dan password.'
                )
            } else {
                setErrorMessage('Terjadi kesalahan yang tidak diketahui')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8F5F0]">
            {/* SISI KIRI: Branding & Foto Kopi Sinematik */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-stone-900 text-white">
                {/* Background Foto Kopi */}
                <img
                    src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200"
                    alt="Brew and Beans Coffee"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E110A] via-[#1E110A]/50 to-transparent" />

                {/* Header Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5A3825] text-amber-200 shadow-md">
                        <Coffee className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Brew & Beans</h1>
                        <p className="text-xs font-medium text-amber-200/80 tracking-widest uppercase">Coffee Shop POS</p>
                    </div>
                </div>

                {/* Tagline Bawah */}
                <div className="relative z-10 max-w-md">
                    <blockquote className="text-xl font-medium leading-relaxed text-stone-200">
                        "Kelola transaksi, pantau stok bahan, dan analisa performa bisnis kedai kopi dalam satu sistem terpadu."
                    </blockquote>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        Sistem Kasir & Manajemen Kedai Kopi
                    </p>
                </div>
            </div>

            {/* SISI KANAN: Form Login Bersih & Modern */}
            <div className="flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 sm:p-10 shadow-lg border border-stone-200/80">
                    {/* Header Mobile / Title */}
                    <div className="text-left space-y-2">
                        <div className="flex lg:hidden items-center gap-2 mb-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5A3825] text-white">
                                <Coffee className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-stone-800">Brew & Beans</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                            Selamat Datang
                        </h2>
                        <p className="text-sm text-stone-500">
                            Masuk untuk melanjutkan ke sistem kasir
                        </p>
                    </div>

                    {/* Form Login */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Input Username */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700">
                                Username
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan username"
                                    required
                                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 py-3 pl-10 pr-4 text-stone-900 text-sm outline-none transition focus:border-[#5A3825] focus:bg-white focus:ring-2 focus:ring-[#5A3825]/20"
                                />
                            </div>
                        </div>

                        {/* Input Password dengan Toggle Mata */}
                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700">
                                Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                    className="w-full rounded-xl border border-stone-300 bg-stone-50/50 py-3 pl-10 pr-11 text-stone-900 text-sm outline-none transition focus:border-[#5A3825] focus:bg-white focus:ring-2 focus:ring-[#5A3825]/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600 transition"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
                                {errorMessage}
                            </div>
                        )}

                        {/* Tombol Login Espresso Brown */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-[#4A2E18] py-3.5 font-bold text-white shadow-md transition hover:bg-[#38210F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? 'Memeriksa Kredensial...' : 'Masuk Sekarang'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-stone-400">
                        Brew & Beans Coffee POS &bull; v1.0
                    </p>
                </div>
            </div>
        </main>
    )
}