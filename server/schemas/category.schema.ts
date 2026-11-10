import { z } from 'zod'

export const categorySchema = z.object({
    name: z.string()
    .trim()
    .min(1, 'Nama kategori wajib diisi')
    .max(50, 'Nama kategori maksimal 50 karakter')
})

export const updateCategorySchema = z.object({
    name: z.string()
    .trim()
    .min(1, 'Nama kategori wajid diisi')
    .max(50, 'Nama kategori maksimal 50 karakter')
})

export const categoryIdSchema = z.coerce.number()
.int()
.positive()