import { z } from 'zod'

export const expenseSchema = z.object({
    category: z.string().trim().min(1, 'Kategori biaya wajib diisi').max(100, 'Kategori maksimal 100 karakter'),
    description: z.string().min(1, 'Keterangan biaya wajib diisi').max(255, 'Keterangan maksimal 255 karakter'),
    amount: z.number().int('Nominal harus berupa bilangan bulat').positive('Nominal harus lebih dari 0'),
    expenseDate: z.string()
    .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Format tanggal harus YYYY-MM-DD'
    )
    .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
}, 'Tanggal tidak valid'),
})

export const updateExpenseSchema = expenseSchema.partial()

export const expenseIdSchema = z.coerce.number().int().positive()