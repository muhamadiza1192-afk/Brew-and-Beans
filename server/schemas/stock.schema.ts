import { z } from 'zod'

export const updateStockSchema = z.object({
    stock: z.number()
    .int('Stok harus berupa bilangan bulan')
    .min(0, 'Stok tidak boleh negatif')
    .optional(),

    minimumStock: z.number()
    .int('Batas minimum stok harus berupa bilangan bulat')
    .min(0, 'Batas minimum stock tidah boleh negatif')
    .optional(),
}).refine(
    (data) => data.stock !== undefined || data.minimumStock !== undefined,
    {
        message: 'minimal sati data stok harus diisi',
    }
)