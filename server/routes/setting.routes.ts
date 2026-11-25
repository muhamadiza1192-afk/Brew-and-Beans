import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js'
import { settingSchema } from '../schemas/setting.schema.js'

const router = Router()

router.get('/', authenticateToken, async (req, res) => {
    try {
        const settings = await prisma.storeSetting.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1 },
        })

        return res.json({
            message: 'Pengaturan berhasil diambil',
            settings,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Gagal mengambil pengaturan',
        })
    }
})

router.put('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const validation = settingSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data pengaturan tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const settings = await prisma.storeSetting.upsert({
            where: { id: 1 },
            update: validation.data,
            create: {
                id: 1,
                ...validation.data,
            },
        })

        return res.json({
            message: 'Pengaturan berhasil diperbarui',
            settings,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Gagal memperbarui pengaturan',
        })
    }
})

export default router
