import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { expenseSchema, updateExpenseSchema, expenseIdSchema } from '../schemas/expense.schema.js'

const router = Router()

router.get('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const expenses = await prisma.operatingExpense.findMany({
            orderBy: { expenseDate: 'desc' },
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

router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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

router.patch('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
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

        if (data.category !== undefined) updateData.category = data.category
        if (data.description !== undefined) updateData.description = data.description
        if (data.amount !== undefined) updateData.amount = data.amount
        if (data.expenseDate !== undefined) {
            updateData.expenseDate = new Date(`${data.expenseDate}T00:00:00+07:00`)
        }

        const expense = await prisma.operatingExpense.update({
            where: { id: idValidation.data },
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

router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = expenseIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID biaya operasional tidak valid',
            })
        }

        const expense = await prisma.operatingExpense.delete({
            where: { id: validation.data },
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

export default router
