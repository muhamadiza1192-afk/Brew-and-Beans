import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/profit-loss', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
        const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined

        const isValidDate = (date: string) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return false
            }

            const parsedDate = new Date(`${date}T00:00:00.000Z`)

            return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date
        }

        if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
            return res.status(400).json({
                message: 'Format tanggal tidak valid. gunakan YYYY-MM-DD',
            })
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                message: 'Tanggal awal tidak boleh melebihi tanggal akhir',
            })
        }

        const start = startDate ? new Date(`${startDate}T00:00:00+07:00`) : undefined
        const end = endDate
            ? new Date(new Date(`${endDate}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000)
            : undefined

        const dateFilter = {
            ...(start ? { gte: start } : {}),
            ...(end ? { lt: end } : {}),
        }

        const [transactions, expenses] = await Promise.all([
            prisma.transaction.findMany({
                where: { ...(start || end ? { createdAt: dateFilter } : {}) },
                include: { items: true },
                orderBy: { createdAt: 'desc' },
            }),

            prisma.operatingExpense.findMany({
                where: { ...(start || end ? { expenseDate: dateFilter } : {}) },
                orderBy: { expenseDate: 'desc' },
            }),
        ])

        const totalSales = transactions.reduce((sum, transaction) => sum + transaction.total, 0)

        const totalCost = transactions.reduce(
            (sum, transaction) =>
                sum + transaction.items.reduce((itemSum, item) => itemSum + item.unitCost * item.quantity, 0),
            0
        )

        const grossProfit = totalSales - totalCost
        const totalOperatingExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
        const netProfit = grossProfit - totalOperatingExpenses

        const productMap = new Map<
            string,
            {
                productName: string
                quantity: number
                totalSales: number
                totalCost: number
                grossProfit: number
            }
        >()

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
            0
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
                itemsWithZeroUnitCost,
            },
            products: Array.from(productMap.values()),
            expenses,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Gagal mengambil laporan laba rugi',
        })
    }
})

export default router
