import { z } from 'zod'

export const transactionSchema = z.object({
    paymentMethod: z.string().trim().min(1, 'Metode pembayaran wajib dipilih').max(30, 'Metode pembayaran maksimal 30 karakter'),

    items: z.array(z.object({
        productId: z.number().int().positive('ID produk tidak valid'),
        quantity: z.number().int().positive('Jumlah produk minimal 1'),
    })
).min(1, 'Transaksi harus memiliki minimal satu produk')
.refine((items) => {
    const productIds = items.map((item) => item.productId)
    return new Set(productIds).size === productIds.length
},
{
    message: 'Produk yang sama tidak boleh dimasukkan lebih dari satu kali',
}
)
})

export const transactionIdSchema = z.coerce.number().int().positive()