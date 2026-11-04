import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authenticateToken, authorizeRole } from './middleware/auth.middleware.js'
import { prisma } from './prisma.js'
import { z } from 'zod'
import { productSchema, updateProductSchema, productIdSchema } from './schemas/product.schema.js'
import bcrypt from 'bcrypt'
import { loginSchema } from './schemas/auth.schema.js'
import { generateToken } from './jwt.js'

const app = express ()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send(' Brew & Beans API is running!')
})

app.post('/api/auth/login', async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data login tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const { username, password } = validation.data

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return res.status(401).json({
                message: 'Username atau password salah',
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Username atau password salah',
            })
        }

        const token = generateToken(user.id, user.role)

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat login',
        })
    }
})

app.get('/api/products', authenticateToken,async (req, res) => {
    try {
        
        const products = await prisma.product.findMany()

        res.json(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengakses database',
        })
    }
})

app.get('/api/products/:id', authenticateToken,async (req, res) => {
    try {
        const validation = productIdSchema.safeParse(req.params.id)

        if (!validation.success) {
            return res.status(400).json({
                message: 'ID produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const productId = validation.data

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        })
        
        if (!product) {
            return res.status(404).json({
                message:'Produk tidak ditemukan'
            })
        }

        res.json(product)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Gagal mengambil data produk',
        })
    }
})

app.post('/api/products', authenticateToken, authorizeRole('ADMIN'),async (req, res) => {
    try {
        const validation = productSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const newProduct = await prisma.product.create({
            data: validation.data,
        })

        res.status(201).json({
            message: 'Produk baru berhasil ditambahkan!',
            product: newProduct,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal menambahkan produk baru',
        })
    }
})

app.patch('/api/products/:id', authenticateToken,async (req, res) => {
    try {

        const validation = updateProductSchema.safeParse(req.body)

        if (!validation.success) {
            return res.status(400).json({
                message: 'Data produk tidak valid',
                errors: z.treeifyError(validation.error),
            })
        }

        const idValidation = productIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID produk tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }

        const productId = idValidation.data

        const data = {
            ...(validation.data.name !== undefined && {
                name: validation.data.name,
            }),
            ...(validation.data.description !== undefined && {
                description: validation.data.description,
            }),
            ...(validation.data.price !== undefined && {
                price: validation.data.price,
            }),
        }

        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId
            },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: productId,
            },
            data: data,
        })

        res.json({
            message: 'Produk berhasil diperbarui!',
            product: updatedProduct,
    })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal memperbarui data produk',
        })
    }
})

app.get('/api/db-test', async (req, res) => {
    try {
        const totalProducts = await prisma.product.count()
        res.json({
            message: 'Database berhasil terhubung!',
            totalProducts: totalProducts,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengakses database',
        })
    }
})



app.delete('/api/products/:id', authenticateToken,async (req,res) => {
    try {

        const idValidation = productIdSchema.safeParse(req.params.id)

        if (!idValidation.success) {
            return res.status(400).json({
                message: 'ID Produk tidak valid',
                errors: z.treeifyError(idValidation.error),
            })
        }
        const productId = idValidation.data

        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        })

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Produk tidak ditemukan',
            })
        }

        const deletedProduct = await prisma.product.delete({
            where: {
                id: productId,
            },
        })

        res.json({
            message: 'Produk berhasil dihapus!',
            product: deletedProduct,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: 'Gagal menghapus produk',
        })
    }
})

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000')
})