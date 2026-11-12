import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().int().positive(),
  costPrice: z.number().int().min(0, 'Harga modal tidak boleh negatif'),
  categoryId : z.number().int().positive().nullable().optional(),

  stock: z.number()
  .int('Stok harus berupa bilangan bulat')
  .min(0, 'Stok tidak boleh negatif'),

  minimumStock: z.number()
  .int('Batas minimum stok harus berupa bilangan bulat')
  .min(0, 'Batas minimum stok tidak boleh negatif')
})

export const productIdSchema = z.coerce.number().int().positive()

export const updateProductSchema = productSchema.partial().strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Setidaknya satu field harus diupdate',
  }
)
