import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authenticateToken, authorizeRole } from './middleware/auth.middleware.js'
import { prisma } from './prisma.js'
import { z } from 'zod'
import { productSchema, updateProductSchema, productIdSchema } from './schemas/product.schema.js'
import bcrypt from 'bcrypt'
import { loginSchema } from './schemas/auth.schema.js'
import { generateToken } from './jwt.js'
import { categorySchema, updateCategorySchema, categoryIdSchema } from './schemas/category.schema.js'
import { transactionSchema, transactionIdSchema } from './schemas/transaction.schema.js'
import { randomUUID } from 'node:crypto'

const app = express ()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send(' Brew & Beans API is running!')
})

app.post('/api/auth/login', async (req, res) => {
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

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const userId = res.locals.user.userId

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
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
            message: 'Gagal memvalidasi sesi pengguna'
        })
    }
})

app.get('/api/products', authenticateToken,async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        res.json(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengakses database',
        })
    }
})

app.get('/api/products/:id', authenticateToken,async (req, res) => {
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
            where: {
                id: productId,
            },
            include: {
                category: true,
            },
        })
        
        if (!product) {
            return res.status(404).json({
                message:'Produk tidak ditemukan'
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

app.post('/api/products', authenticateToken, authorizeRole('ADMIN'),async (req, res) => {
    try {
        const validation = productSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const { categoryId, ...productData } = validation.data

        if (categoryId !== undefined && categoryId !== null) {
            const existingCategory = await prisma.category.findUnique({
                where: {
                    id: categoryId,
                },
            })

            if (!existingCategory) {
                return res.status(404).json({
                    message: 'Kategori tidak ditemukan',
                })
            }
        }

        const newProduct = await prisma.product.create({
            data: {
                ...productData, categoryId: categoryId ?? null,
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

app.patch('/api/products/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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
            ...(validation.data.name !== undefined && {
                name: validation.data.name,
            }),
            ...(validation.data.description !== undefined && {
                description: validation.data.description,
            }),
            ...(validation.data.price !== undefined && {
                price: validation.data.price,
            }),
            ...(validation.data.categoryId !== undefined && {
                categoryId: validation.data.categoryId,
            })
        }

        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId
            },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        if (
            validation.data.categoryId !== undefined &&
            validation.data.categoryId !== null
        ) {
            const existingCategory = await prisma.category.findUnique({
                where: {
                    id: validation.data.categoryId,
                },
            })

            if (!existingCategory) {
                return res.status(404).json({
                    message: 'Kategori tidak ditemukan',
                })
            }
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: productId,
            },
            data: data,
            include: {
                category: true,
            },
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

app.get('/api/db-test', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const totalProducts = await prisma.product.count()
        res.json({
            message: 'Database berhasil terhubung!',
            totalProducts: totalProducts,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengakses database',
        })
    }
})



app.delete('/api/products/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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
            where: {
                id: productId,
            },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        const deletedProduct = await prisma.product.delete({
            where: {
                id: productId,
            },
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

app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc'
            },
        })

        res.json(categories)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Gagal mengambil data kategori',
        })
    }
})

app.post('/api/categories', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = categorySchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data kategori tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const existingCategory = await prisma.category.findUnique({
            where: {
                name: validation.data.name,
            },
        })

        if(existingCategory) {
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

app.patch('/api/categories/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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
            where: {
                id: categoryId,
            },
        })

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Kategori tidak ditemukan',
            })
        }

        const duplicateCategory = await prisma.category.findFirst({
            where: {
                name: validation.data.name,
                NOT: { id: categoryId,},
            },
        })

        if (duplicateCategory) {
            return res.status(409).json({
                message: 'Nama kategori sudah digunakan',
            })
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId,},
            data: validation.data,
        })

        res.json({
            message: 'Kategori berhasil diperbarui!',
            category: updatedCategory,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Gagal memperbarui ketegori'
        })
    }
})

app.delete('/api/categories/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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
            where: {
                id: categoryId,},
        })

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Kategori tidak ditemukan',
            })
        }

        const totalProducts = await prisma.product.count({
            where: {
                categoryId: categoryId,
            },
        })

        if (totalProducts > 0) {
            return res.status(409).json({
                message: 'Kategori tidak bisa dihapus karena masih digunakan oleh produk',
            })
        }

        await prisma.category.delete({
            where: {
                id: categoryId,
            },
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

app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const validation = transactionSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data transaksi tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const { paymentMethod, items } = validation.data
        const cashierId = res.locals.user.userId

        const result = await prisma.$transaction(async (tx) => {
            const cashier = await tx.user.findUnique({
                where: {
                    id: cashierId,
                },
            })

            if (!cashier) {
                return { type: 'cashier-not-found' as const }
            }

            const productIds = [...new Set(items.map((item) => item.productId))]

            const products = await tx.product.findMany({
                where: {
                    id: { in: productIds,},
                },
            })

            if (products.length !== productIds.length) {
                return { type: 'product-not-found' as const }
            }

            const transactionItems = items.map((item) => {
                const product = products.find((product) => product.id === item.productId)!

                const subtotal = product.price * item.quantity

                return {
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    subtotal,
                }
            })

            const total = transactionItems.reduce((sum, item) => sum + item.subtotal, 0)

            const transactionNumber = `BB-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`
            const newTransaction = await tx.transaction.create({
                data: {
                    transactionNumber,
                    total,
                    paymentMethod,
                    cashierId,

                    items: {create: transactionItems,},
                },
                include: {
                    items: true,
                    cashier: {
                        select: {
                            id: true,
                            username: true,
                            role: true,
                        },
                    },
                },
            })

            return {
                type: 'success' as const,
                transaction: newTransaction,
            }
        })

        if (result.type === 'cashier-not-found') {
            return res.status(401).json({
                message: 'Pengguna kasir tidak ditemukan',
            })
        }

        if (result.type === 'product-not-found') {
            return res.status(404).json({
                message: 'Satu atau lebih produk tidak ditemukan',
            })
        }

        return res.status(201).json({
            message: 'Transaksi berhasil disimpan',
            transaction: result.transaction,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Gagal menyimpan transaksi'
        })
        
    }
})

app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                items: true,
                cashier: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
        })

        return res.status(200).json({
            message: 'Riwayat transaksi berhasil diambil',
            transactions,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Gagal mengambil riwayat transaksi',
        })
    }
})

app.get('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const validation = transactionIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID transaksi tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const transactionId = validation.data

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId,
            },
            include: {
                items: true,
                cashier: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                    },
                },
            },
        })

        if (!transaction) {
            return res.status(404).json({
                message: 'Transaksi tidak ditemukan',
            })
        }

        res.json({
            message: 'Detail transaksi berhasil diambil',
            transaction,
        })
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Gagal mengambil detail transaksi'
        })
    }
})

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000')
})