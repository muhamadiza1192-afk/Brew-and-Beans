import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { createUserSchema, updateUserSchema, userIdSchema } from '../schemas/user.schema.js'

const router = Router()

router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        return res.json({
            message: 'Daftar pengguna berhasil diambil',
            users,
        })
    } catch (error) {
        console.error('Gagal mengambil daftar pengguna:', error)
        return res.status(500).json({
            message: 'Gagal mengambil daftar pengguna',
        })
    }
})

router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = createUserSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data pengguna tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const { username, password, role } = validation.data

        const existingUser = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUser) {
            return res.status(409).json({
                message: 'Username sudah digunakan',
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return res.status(201).json({
            message: 'Pengguna berhasil ditambahkan',
            user: newUser,
        })
    } catch (error) {
        console.error('Gagal menambahkan pengguna:', error)

        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
            return res.status(409).json({
                message: 'Username sudah digunakan',
            })
        }

        return res.status(500).json({
            message: 'Gagal menambahkan pengguna',
        })
    }
})

router.patch('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = userIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID pengguna tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const validation = updateUserSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data pengguna tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const userId = idValidation.data
        const data = validation.data

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                message: 'Tidak ada data yang diperbarui',
            })
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!existingUser) {
            return res.status(404).json({
                message: 'Pengguna tidak ditemukan',
            })
        }

        if (data.username !== undefined) {
            const duplicateUser = await prisma.user.findFirst({
                where: {
                    username: data.username,
                    NOT: { id: userId },
                },
            })

            if (duplicateUser) {
                return res.status(409).json({
                    message: 'Username sudah digunakan',
                })
            }
        }

        const updateData: {
            username?: string
            password?: string
            role?: 'ADMIN' | 'FLOOR'
        } = {}

        if (data.username !== undefined) updateData.username = data.username
        if (data.password !== undefined) updateData.password = await bcrypt.hash(data.password, 10)
        if (data.role !== undefined) updateData.role = data.role

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return res.json({
            message: 'Pengguna berhasil diperbarui',
            user: updatedUser,
        })
    } catch (error) {
        console.error('Gagal memperbarui pengguna:', error)

        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
            return res.status(409).json({
                message: 'Username sudah digunakan',
            })
        }

        return res.status(500).json({
            message: 'Gagal memperbarui pengguna',
        })
    }
})

router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = userIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID pengguna tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const userId = validation.data
        const currentUserId = res.locals.user.userId

        if (userId === currentUserId) {
            return res.status(403).json({
                message: 'Anda tidak dapat menghapus akun sendiri',
            })
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!existingUser) {
            return res.status(404).json({
                message: 'Pengguna tidak ditemukan',
            })
        }

        if (existingUser.role === 'ADMIN') {
            const totalAdmins = await prisma.user.count({
                where: { role: 'ADMIN' },
            })

            if (totalAdmins <= 1) {
                return res.status(409).json({
                    message: 'Admin terakhir tidak dapat dihapus',
                })
            }
        }

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
            },
        })

        return res.json({
            message: 'Pengguna berhasil dihapus',
            user: deletedUser,
        })
    } catch (error) {
        console.error('Gagal menghapus pengguna:', error)
        return res.status(500).json({
            message: 'Gagal menghapus pengguna',
        })
    }
})

export default router
