import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { categorySchema, updateCategorySchema, categoryIdSchema } from '../schemas/category.schema.js'

const router = Router()

router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        })

        res.json(categories)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal mengambil data kategori',
        })
    }
})

router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = categorySchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data kategori tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const existingCategory = await prisma.category.findUnique({
            where: { name: validation.data.name },
        })

        if (existingCategory) {
            return res.status(409).json({
                message: 'Nama kategori sudah digunakan',
            })
        }

        const newCategory = await prisma.category.create({
            data: validation.data,
        })

        res.status(201).json({
            message: 'Kategori berhasil ditambahkan',
            category: newCategory,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal menambahkan kategori',
        })
    }
})

router.patch('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = categoryIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID kategori tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const validation = updateCategorySchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data kategori tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const categoryId = idValidation.data

        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Kategori tidak ditemukan',
            })
        }

        const duplicateCategory = await prisma.category.findFirst({
            where: {
                name: validation.data.name,
                NOT: { id: categoryId },
            },
        })

        if (duplicateCategory) {
            return res.status(409).json({
                message: 'Nama kategori sudah digunakan',
            })
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: validation.data,
        })

        res.json({
            message: 'Kategori berhasil diperbarui!',
            category: updatedCategory,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal memperbarui kategori',
        })
    }
})

router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = categoryIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID kategori tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const categoryId = validation.data

        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Kategori tidak ditemukan',
            })
        }

        const totalProducts = await prisma.product.count({
            where: { categoryId },
        })

        if (totalProducts > 0) {
            return res.status(409).json({
                message: 'Kategori tidak bisa dihapus karena masih digunakan oleh produk',
            })
        }

        await prisma.category.delete({
            where: { id: categoryId },
        })

        res.json({
            message: 'Kategori berhasil dihapus',
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal menghapus kategori',
        })
    }
})

export default router
