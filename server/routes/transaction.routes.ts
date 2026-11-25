import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { transactionSchema, transactionIdSchema } from '../schemas/transaction.schema.js'

const router = Router()

router.post('/', authenticateToken, async (req, res) => {
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
                where: { id: cashierId },
            })

            if (!cashier) {
                return { type: 'cashier-not-found' as const }
            }

            const mainIds = items.map((item) => item.productId)
            const addonIds = items.flatMap((item) => item.addonIds)
            const allProductIds = [...new Set([...mainIds, ...addonIds])]

            const products = await tx.product.findMany({
                where: { id: { in: allProductIds } },
            })

            if (products.length !== allProductIds.length) {
                return { type: 'product-not-found' as const }
            }

            for (const item of items) {
                const stockUpdate = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
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
                const product = products.find((p) => p.id === item.productId)!
                const selectedAddons = (item.addonIds || [])
                    .map((id) => products.find((p) => p.id === id))
                    .filter(Boolean) as typeof products
                const addonTotalPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0)
                const addonTotalCost = selectedAddons.reduce((sum, a) => sum + a.costPrice, 0)

                const finalUnitPrice = product.price + addonTotalPrice
                const finalUnitCost = product.costPrice + addonTotalCost

                const subtotal = finalUnitPrice * item.quantity

                const addonsText =
                    selectedAddons.length > 0
                        ? selectedAddons
                              .map((a) => `${a.name} (+Rp ${a.price.toLocaleString('id-ID')})`)
                              .join(', ')
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
                    items: { create: transactionItems },
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

        if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
            return res.status(409).json({
                message: 'Stok produk tidak mencukupi',
            })
        }

        res.status(500).json({
            message: 'Gagal menyimpan transaksi',
        })
    }
})

router.get('/', authenticateToken, async (req, res) => {
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
            orderBy: { createdAt: 'desc' },
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

router.get('/:id', authenticateToken, async (req, res) => {
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
            where: { id: transactionId },
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
            message: 'Gagal mengambil detail transaksi',
        })
    }
})

export default router
