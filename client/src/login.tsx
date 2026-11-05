import { useState } from "react";
import axios from 'axios'
import { api } from './api'
import { useAuth } from "./context/AuthContext";

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
                    error.response?.data?.message ?? 'Login gagal. Periksa kembali data anda.'
                )
            } else {
                setErrorMessage('Terjadi kesalahan yang tidak diketahui')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-amber-950 p=56 text-white">
            <div className="w-full max-w-md rounded-2xl bg-amber-900 p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">Brew & Beans</h1>
                    <p className="mt-2 text-amber-200">Silahkan login untuk melanjugkan</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Username
                        </label>

                        <input 
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Masukkan Username"
                        required
                        className="2-full rounded-ld border border-amber-700 bg-amber-950 p-3 text-white outline-none focus:border-amber-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Password
                        </label>

                        <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password"
                        required
                        className="w-full rounded-lg border border-amber-700 bg-amber-950 p-3 text-white outline-none focus:border-amber-400"
                        />
                    </div>

                    {errorMessage && (
                        <p className="rounded-lg bg-red-900/50 p-3 text-sm text-red-200">
                            {errorMessage}
                        </p>
                    )}

                    <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-amber-500 p-3 font-semibold text-amber-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {isLoading ? 'Memproses...' : 'Login'}
                    </button>
                </form>
            </div>
        </main>
    )


}