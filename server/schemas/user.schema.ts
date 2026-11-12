import { z } from 'zod'

export const createUserSchema = z.object({
    username: z.string().trim().min(3, 'Username minimal 3 karakter').max(30, 'Username maksimal 30 karakter'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    role: z.enum(['ADMIN', 'FLOOR']).default('FLOOR'),
})

export const updateUserSchema = z.object({
    username: z.string().trim().min(3, 'Username minimal 3 karakter').max(30, 'Username maksimal 30 karakter').optional(),
    password: z.string().min(8, 'Password minimal 8 karakter').optional(),
    role: z.enum(['ADMIN', 'FLOOR']).optional(),
})

export const userIdSchema = z.coerce.number().int('ID pengguna harus berupa bilangan bulat').positive('ID pengguna harus lebih dari 0')