import { Router } from 'express'
import midtransClient from 'midtrans-client'
import { prisma } from '../prisma.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
})

router.post('/midtrans-token', authenticateToken, async (req, res) => {
    try {
        const { items } = req.body
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Keranjang transaksi tidak boleh kosong' })
        }

        const mainIds = items.map((i: { productId: number }) => i.productId)
        const addonIds = items.flatMap((i: { addonIds?: number[] }) => i.addonIds || [])
        const allProductIds = [...new Set([...mainIds, ...addonIds])]

        const products = await prisma.product.findMany({
            where: { id: { in: allProductIds } },
        })

        if (products.length !== allProductIds.length) {
            return res.status(404).json({ message: 'Sebagian produk tidak ditemukan' })
        }

        const itemDetails = items.map((item: { productId: number; quantity: number; addonIds?: number[] }) => {
            const prod = products.find((p) => p.id === item.productId)!
            const itemAddons = (item.addonIds || [])
                .map((id) => products.find((p) => p.id === id))
                .filter(Boolean) as typeof products
            const addonTotalPrice = itemAddons.reduce((sum, a) => sum + a.price, 0)
            const finalUnitPrice = prod.price + addonTotalPrice

            return {
                id: String(prod.id),
                price: finalUnitPrice,
                quantity: item.quantity,
                name: prod.name.slice(0, 50),
            }
        })

        const grossAmount = itemDetails.reduce(
            (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
            0
        )
        const orderId = `BB-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            item_details: itemDetails,
            customer_details: {
                first_name: res.locals.user?.username || 'Customer',
            },
        }

        const transaction = await snap.createTransaction(parameter)

        return res.status(200).json({
            message: 'Token Midtrans berhasil dibuat',
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            orderId,
        })
    } catch (error) {
        console.error('Gagal membuat token Midtrans:', error)
        return res.status(500).json({ message: 'Gagal membuat token pembayaran Midtrans' })
    }
})

export default router
