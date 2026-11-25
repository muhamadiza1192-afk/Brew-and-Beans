import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { generateToken } from '../jwt.js'
import { loginSchema } from '../schemas/auth.schema.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/login', async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data login tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const { username, password } = validation.data

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return res.status(401).json({
                message: 'Username atau password salah',
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Username atau password salah',
            })
        }

        const token = generateToken(user.id, user.role)

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat login',
        })
    }
})

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = res.locals.user.userId

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
            },
        })

        if (!user) {
            return res.status(401).json({
                message: 'Pengguna tidak ditemukan',
            })
        }

        res.json({
            message: 'Sesi masih valid',
            user,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal memvalidasi sesi pengguna',
        })
    }
})

export default router
