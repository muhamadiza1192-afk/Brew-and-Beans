import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { prisma } from './prisma.js'
import { authenticateToken, authorizeRole } from './middleware/auth.middleware.js'

// Import modular route handlers
import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'
import categoryRoutes from './routes/category.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import settingRoutes from './routes/setting.routes.js'
import reportRoutes from './routes/report.routes.js'
import expenseRoutes from './routes/expense.routes.js'
import userRoutes from './routes/user.routes.js'

const app = express()

app.use(cors())
// [CONFIG] Tingkatkan batas ukuran body request ke 10MB untuk mendukung upload foto Base64 dari galeri
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/', (req, res) => {
    res.send('Brew & Beans API is running!')
})

app.get('/api/db-test', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
    try {
        const totalProducts = await prisma.product.count()
        res.json({
            message: 'Database berhasil terhubung!',
            totalProducts,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengakses database',
        })
    }
})

// Mount Modular Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/users', userRoutes)

const PORT = Number(process.env.PORT) || 3000

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server berjalan di port ${PORT}`)
    })
}

export default app
