import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { productSchema, updateProductSchema, productIdSchema } from '../schemas/product.schema.js'
import { updateStockSchema } from '../schemas/stock.schema.js'

const router = Router()

router.get('/', authenticateToken, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { name: 'asc' },
        })

        res.json(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengakses database',
        })
    }
})

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const validation = productIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const productId = validation.data

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { category: true },
        })

        if (!product) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        res.json(product)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal mengambil data produk',
        })
    }
})

router.patch('/:id/stock', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = productIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID produk tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const validation = updateStockSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data stok tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const productId = idValidation.data

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        const stockData = {
            ...(validation.data.stock !== undefined && {
                stock: validation.data.stock,
            }),
            ...(validation.data.minimumStock !== undefined && {
                minimumStock: validation.data.minimumStock,
            }),
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: stockData,
            include: { category: true },
        })

        return res.json({
            message: 'Stok produk berhasil diperbarui',
            product: updatedProduct,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Gagal memperbarui stok produk',
        })
    }
})

router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = productSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const { categoryId, imageUrl, ...productData } = validation.data

        if (categoryId !== undefined && categoryId !== null) {
            const existingCategory = await prisma.category.findUnique({
                where: { id: categoryId },
            })

            if (!existingCategory) {
                return res.status(404).json({
                    message: 'Kategori tidak ditemukan',
                })
            }
        }

        const newProduct = await prisma.product.create({
            data: {
                ...productData,
                categoryId: categoryId ?? null,
                imageUrl: imageUrl ?? null,
            },
        })

        res.status(201).json({
            message: 'Produk baru berhasil ditambahkan!',
            product: newProduct,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal menambahkan produk baru',
        })
    }
})

router.patch('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = updateProductSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const idValidation = productIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID produk tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const productId = idValidation.data

        const data = {
            ...(validation.data.name !== undefined && { name: validation.data.name }),
            ...(validation.data.description !== undefined && { description: validation.data.description }),
            ...(validation.data.price !== undefined && { price: validation.data.price }),
            ...(validation.data.costPrice !== undefined && { costPrice: validation.data.costPrice }),
            ...(validation.data.categoryId !== undefined && { categoryId: validation.data.categoryId }),
            ...(validation.data.stock !== undefined && { stock: validation.data.stock }),
            ...(validation.data.minimumStock !== undefined && { minimumStock: validation.data.minimumStock }),
            ...(validation.data.imageUrl !== undefined && { imageUrl: validation.data.imageUrl }),
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        if (validation.data.categoryId !== undefined && validation.data.categoryId !== null) {
            const existingCategory = await prisma.category.findUnique({
                where: { id: validation.data.categoryId },
            })

            if (!existingCategory) {
                return res.status(404).json({
                    message: 'Kategori tidak ditemukan',
                })
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data,
            include: { category: true },
        })

        res.json({
            message: 'Produk berhasil diperbarui!',
            product: updatedProduct,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal memperbarui data produk',
        })
    }
})

router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = productIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID Produk tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const productId = idValidation.data

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        const deletedProduct = await prisma.product.delete({
            where: { id: productId },
        })

        res.json({
            message: 'Produk berhasil dihapus!',
            product: deletedProduct,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal menghapus produk',
        })
    }
})

export default router
