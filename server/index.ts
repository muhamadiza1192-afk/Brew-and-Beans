import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import midtransClient from 'midtrans-client'
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
import { updateStockSchema } from './schemas/stock.schema.js'
import { settingSchema } from './schemas/setting.schema.js'
import { expenseSchema, updateExpenseSchema, expenseIdSchema } from './schemas/expense.schema.js'
import { createUserSchema, updateUserSchema, userIdSchema } from './schemas/user.schema.js'

const app = express ()
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
})

app.use(cors())
// [CONFIG] Tingkatkan batas ukuran body request ke 10MB untuk mendukung upload foto Base64 dari galeri
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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

app.patch('/api/products/:id/stock', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = productIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID produk tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const validation = updateStockSchema.safeParse(req.body)

        if(!validation.success) {
            return res.status(400).json({
                message: 'Data stok tidak valid',
                errors: z.treeifyError(validation.error),
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

        const stockData = {
            ...(validation.data.stock !== undefined && {
                stock: validation.data.stock,
            }),
            ...(validation.data.minimumStock !== undefined && {
                minimumStock: validation.data.minimumStock,
            })
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: productId,
            },
            data: stockData,
            include: {
                category: true,
            },
        })
        return res.json({
            message: 'Stok produk berhasil diperbarui',
            product: updatedProduct,
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Gagal memperbarui stok produk'
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

        const { categoryId, imageUrl, ...productData } = validation.data

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
            ...(validation.data.costPrice !== undefined && {
                costPrice: validation.data.costPrice,
            }),
            ...(validation.data.categoryId !== undefined && {
                categoryId: validation.data.categoryId,
            }),
            ...(validation.data.stock !== undefined && {
                stock: validation.data.stock,
            }),
            ...(validation.data.minimumStock !== undefined && {
                minimumStock: validation.data.minimumStock,
            }),
            ...(validation.data.imageUrl !== undefined && {
                imageUrl: validation.data.imageUrl,
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

app.post('/api/payments/midtrans-token', authenticateToken, async (req, res) => {
    try {
        const { items } = req.body
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Keranjang transaksi tidak boleh kosong'})
        }

        const mainIds = items.map((i: { productId: number }) => i.productId)
        const addonIds = items.flatMap((i: { addonIds?: number[] }) => i.addonIds || [])
        const allProductIds = [...new Set([...mainIds, ...addonIds])]

        const products = await prisma.product.findMany({
            where: { id: { in: allProductIds } },
        })

        if (products.length !== allProductIds.length) {
            return res.status(404).json({ message: 'Sebagian produk tidak ditemukan' })
        }

        const itemDetails = items.map((item: { productId: number; quantity: number; addonIds?: number[] }) => {
            const prod = products.find((p) => p.id === item.productId)!
            const itemAddons = (item.addonIds || []).map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products
            const addonTotalPrice = itemAddons.reduce((sum, a) => sum + a.price, 0)
            const finalUnitPrice = prod.price + addonTotalPrice
            
            return {
                id: String(prod.id),
                price: finalUnitPrice,
                quantity: item.quantity,
                name: prod.name.slice(0, 50),
            }
        })

        const grossAmount = itemDetails.reduce(( sum: number, item: { price: number; quantity: number}) => sum + item.price * item.quantity,0)
        const orderId = `BB-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            item_details: itemDetails,
            customer_details: { first_name: res.locals.user?.username || 'Customer',},
        }

        const transaction = await snap.createTransaction(parameter)

        return res.status(200).json({
            message: 'Token Midtrans berhasil dibuat',
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            orderId,
        })
    } catch (error) {
        console.error('Gagal membuat token Midtrans:', error)
        return res.status(500).json({ message: 'Gagal membuat token pembayaran Midtrans'})
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

            const mainIds = items.map((item) => item.productId)
            const addonIds = items.flatMap((item) => item.addonIds)
            const allProductIds = [...new Set([...mainIds, ...addonIds])]

            const products = await tx.product.findMany({
                where: {
                    id: { in: allProductIds,},
                },
            })

            if (products.length !== allProductIds.length) {
                return { type: 'product-not-found' as const }
            }

            for (const item of items) {
                const stockUpdate = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stock : {
                            gte: item.quantity,
                        },
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                })
            if (stockUpdate.count === 0) {
                throw new Error('INSUFFICIENT_STOCK')
            }

            for (const addonId of item.addonIds || []) {
                const addonStockUpdate = await tx.product.updateMany({
                    where: {
                        id: addonId,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                })
                if (addonStockUpdate.count === 0) {
                    throw new Error('INSUFFICIENT_STOCK')
                }
            }
        }
            const transactionItems = items.map((item) => {
                const product = products.find((product) => product.id === item.productId)!
                const selectedAddons = (item.addonIds || [])
                    .map((id) => products.find((p) => p.id === id))
                    .filter(Boolean) as typeof products
                const addonTotalPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0)
                const addonTotalCost = selectedAddons.reduce((sum, a) => sum + a.costPrice, 0)

                const finalUnitPrice = product.price + addonTotalPrice
                const finalUnitCost = product.costPrice + addonTotalCost

                const subtotal = finalUnitPrice * item.quantity

                const addonsText = selectedAddons.length > 0
                    ? selectedAddons.map((a) => `${a.name} (+Rp ${a.price.toLocaleString('id-ID')})`).join(', ')
                    : null

                return {
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: finalUnitPrice,
                    unitCost: finalUnitCost,
                    subtotal,
                    notes: item.notes?.trim() || null,
                    addons: addonsText,
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

        if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_STOCK"
        ) {
            return res.status(409).json({
                message: 'Stok produk tidak mencukupi'
            })
        }

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

app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await prisma.storeSetting.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1 },
        })

        return res.json({
            message: 'Pengaturan berhasil diambil',
            settings,
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Gagal mengambil pengaturan',
        })
    }
})

app.put('/api/settings', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = settingSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data pengaturan tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const settings = await prisma.storeSetting.upsert({
            where: { id: 1 },
            update: validation.data,
            create: {
                id: 1,
                ...validation.data,
            },
        })

        return res.json({
            message: 'Pengaturan berhasil diperbarui',
            settings,
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
             message: 'Gagal memperbarui pengaturan'
          })
    }
})

app.get('/api/reports/profit-loss', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const startDate = typeof req.query.startDate === 'string'
            ? req.query.startDate
            : undefined

        const endDate = typeof req.query.endDate === 'string'
            ? req.query.endDate
            : undefined
        
            const isValidDate = (date: string) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return false
                }

                const parsedDate = new Date(`${date}T00:00:00.000Z`)

                return !Number.isNaN(parsedDate.getTime()) &&
                    parsedDate.toISOString().slice(0, 10) === date
            }

            if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))
            ) {
                return res.status(400).json({
                    message: 'Format tanggal tidak valid.gunakan YYYY-MM-DD',
                })
            }

            if (startDate && endDate && startDate > endDate) {
                return res.status(400).json({
                    message: 'Tanggal awal tidak boleh melebihi tanggal akhir',
                })
            }

            const start = startDate
                ? new Date(`${startDate}T00:00:00+07:00`)
                : undefined
            
            const end = endDate
                ? new Date(
                    new Date(`${endDate}T00:00:00+07:00`).getTime() + 24* 60 * 60 * 1000 )
                : undefined
                    
            const dateFilter = {
                ...(start ? { gte: start } : {}),
                ...(end ? { lt: end } : {}),
            }

            const [transactions, expenses] = await Promise.all([
                prisma.transaction.findMany({
                    where: {...(start || end ? { createdAt: dateFilter } : {}),},
                    include: { items: true,},
                    orderBy: { createdAt: 'desc',},
                }),

                prisma.operatingExpense.findMany({
                    where: {...(start || end ? { expenseDate: dateFilter } : {}),},
                    orderBy: {expenseDate: 'desc',},
                }),
            ])

    const totalSales = transactions.reduce((sum, transaction) => sum + transaction.total, 0)

    const totalCost = transactions.reduce(
        (sum, transaction) =>
            sum + transaction.items.reduce((itemSum, item) => itemSum + item.unitCost * item.quantity, 0),
        0,
    )

    const grossProfit = totalSales - totalCost

    const totalOperatingExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netProfit = grossProfit - totalOperatingExpenses

    const productMap = new Map<string, {
        productName: string
        quantity: number
        totalSales: number
        totalCost: number
        grossProfit: number
    }>()

    for (const transaction of transactions) {
        for (const item of transaction.items) {
            const existing = productMap.get(item.productName)

            const itemCost = item.unitCost * item.quantity

            if (existing) {
                existing.quantity += item.quantity
                existing.totalSales += item.subtotal
                existing.totalCost += itemCost
                existing.grossProfit += item.subtotal - itemCost
            } else {
                productMap.set(item.productName, {
                    productName: item.productName,
                    quantity: item.quantity,
                    totalSales: item.subtotal,
                    totalCost: itemCost,
                    grossProfit: item.subtotal - itemCost,
                })
            }
        }
    }

    const itemsWithZeroUnitCost = transactions.reduce(
        (sum, transaction) => sum + transaction.items.filter((item) => item.unitCost === 0).length,
        0,
    )

    return res.json({
        message: 'Laporan laba rugi berhasil diambil',
        summary: {
            totalTransactions: transactions.length,
            totalSales,
            totalCost,
            grossProfit,
            totalOperatingExpenses,
            netProfit,
            itemsWithZeroUnitCost
        }, products: Array.from(productMap.values()),
        expenses,
    })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Gagal mengambil laporan laba rugi'
        })
    }
})

app.get('/api/expenses', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const expenses = await prisma.operatingExpense.findMany({
            orderBy: {
                expenseDate: 'desc',
            },
        })

        res.json({
            message: 'Daftar biaya operasional berhasil diambil',
            expenses,
        })
    } catch (error) {
        console.error('Gagal mengambil biaya operasional:', error)

        res.status(500).json({
            message: 'Gagal mengambil biaya operasional',
        })
    }
})

app.post('/api/expenses', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = expenseSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data biaya operasional tidak valid',
                errors: validation.error.issues,
            })
        }

        const data = validation.data

        const expense = await prisma.operatingExpense.create({
            data: {
                category: data.category,
                description: data.description,
                amount: data.amount,
                expenseDate: new Date(`${data.expenseDate}T00:00:00+07:00`),
            },
        })

        res.status(201).json({
            message: 'Biaya operasional berhasil ditambahkan',
            expense,
        })
    } catch (error) {
        console.error('Gagal menambahkan biaya operasional:', error)

        res.status(500).json({
            message: 'Gagal menambahkan biaya operasional',
        })
    }
})

app.patch('/api/expenses/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = expenseIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID biaya operasional tidak valid',
            })
        }

        const validation = updateExpenseSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data biaya operasional tidak valid',
                errors: validation.error.issues,
            })
        }

        const data = validation.data
        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                message: 'Tidak ada data yang diperbarui',
            })
        }

        const updateData: {
            category?: string
            description?: string
            amount?: number
            expenseDate?: Date
        } = {}

        if (data.category !== undefined) {
            updateData.category = data.category
        }

        if (data.description !== undefined) {
            updateData.description = data.description
        }

        if (data.amount !== undefined) {
            updateData.amount = data.amount
        }

        if (data.expenseDate !== undefined) {
            updateData.expenseDate = new Date(
                `${data.expenseDate}T00:00:00+07:00`
            )
        }

        const expense = await prisma.operatingExpense.update({
            where: {
                id: idValidation.data,
            },
            data: updateData,
        })

        res.json({
            message: 'Biaya operasional berhasil diperbarui',
            expense,
          })
    } catch (error) {
        console.error('Gagal memperbarui biaya operasional:', error)

        res.status(500).json({
            message: 'Gagal memperbarui biaya operasional',
        })
    }
})

app.delete('/api/expenses/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = expenseIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID biaya operasional tidak valid',
            })
        }

        const expense = await prisma.operatingExpense.delete({
            where: {
                id: validation.data,
            },
        })

        res.json({
            message: 'Biaya operasional berhasil dihapus',
            expense,
        })
    } catch (error) {
        console.error('Gagal menghapus biaya operasional:', error)

        res.status(500).json({
            message: 'Gagal menghapus biaya operasional',
        })
    }
})

app.get('/api/users', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc',},
        })

        return res.json({
            message: 'Daftar pengguna berhasil diambil', users,
        })
    } catch (error) {
        console.error('Gagal mengambil daftar pengguna:', error)

        return res.status(500).json({
            message: 'Gagal mengambil daftar pengguna',
        })
    }
})

app.post('/api/users', authenticateToken, authorizeRole('ADMIN'), async (req, res)=> {
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
                username, password: hashedPassword, role,
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

        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            return res.status(409).json({
                message: 'Username sudah digunakan',
            })
        }

        return res.status(500).json({
            message: 'Gagal menambahkan pengguna',
        })
    }
})

app.patch('/api/users/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const idValidation = userIdSchema.safeParse(req.params.id)

        if(!idValidation.success) {
            return res.status(400).json({
                message: 'ID pengguna tidak valid',
                errors :z.treeifyError(idValidation.error),
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
        } ={}

        if (data.username !== undefined) {
            updateData.username = data.username
        }

        if (data.password !== undefined) {
            updateData.password = await bcrypt.hash(data.password, 10)
        }

        if (data.role !== undefined) {
            updateData.role = data.role
        }

        const updateUser = await prisma.user.update({
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
            user: updateUser,
        })
    } catch (error) {
        console.error('Gagal memperbarui pengguna:', error)

        if(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            return res.status(409).json({
                message: 'Username sudah digunakan',
            })
        }

        return res.status(500).json({
            message: 'Gagal memperbarui pengguna',
        })
    }
})

app.delete('/api/users/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = userIdSchema.safeParse(req.params.id)

        if(!validation.success) {
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

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000')
})