import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().int().positive(),
})

export const productIdSchema = z.coerce.number().int().positive()

export const updateProductSchema = productSchema.partial().strict().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Setidaknya satu field harus diupdate',
  }
)
