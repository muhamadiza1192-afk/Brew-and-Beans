import { z } from 'zod'

export const loginSchema = z.object({
    username: z.string().trim().min(1, 'Username tidak boleh kosong.'),
    password: z.string().min(1, 'Password tidak boleh kosong.'),
})