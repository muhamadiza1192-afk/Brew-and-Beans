import { z } from 'zod'

export const settingSchema = z.object({
    storeName: z.string().trim().min(1, 'Nama coffe shop wajib diisi').max(100),
    address: z.string().trim().max(255),
    phone: z.string().trim().max(30),
    receiptNote: z.string().trim().max(500),
    receiptFooter: z.string().trim().max(255),
})