import { createContext, useContext, useState, useEffect } from 'react'
import { setAuthToken } from '../api'

type User = {
    id: number
    username: string
    role: 'ADMIN' | 'FLOOR'
}

type AuthContextType = {
    user: User | null
    token: string | null
    isAuthReady: boolean
    login: (user: User, token: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isAuthReady, setIsAuthReady] = useState(false)

    useEffect(() => {
        const savedSession = localStorage.getItem('brew-beans-session')

        if (savedSession) {
            try {
                const session = JSON.parse(savedSession) as {
                    user: User
                    token: string
                }

                setUser(session.user)
                setToken(session.token)
                setAuthToken(session.token)
            } catch {
                localStorage.removeItem('brew-beans-session')
                setAuthToken(null)
            }
        } 

        setIsAuthReady(true)
    },[])

    function login(user: User, token:string) {
        setUser(user)
        setToken(token)
        setAuthToken(token)

        localStorage.setItem(
            'brew-beans-session',
            JSON.stringify({ user, token})
        )
    }

    function logout() {
        setUser(null)
        setToken(null)
        setAuthToken(null)

        localStorage.removeItem('brew-beans-session')
    }

    return (
        <AuthContext.Provider value={{ user, token, isAuthReady, login, logout }}>
            {children}
            </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider')
    }

    return context
}