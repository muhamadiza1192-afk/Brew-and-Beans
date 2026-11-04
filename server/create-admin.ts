import { prisma } from "./prisma.js"
import bcrypt from "bcrypt"
import readline from "node:readline/promises"
import { password } from "@inquirer/prompts"
import { stdin as input, stdout as output } from "node:process"

async function createAdmin() {
    const rl = readline.createInterface({ input, output})

    try {
        const username = (await rl.question('Masukkan username Admin: ')).trim()

        if (!username.trim()) {
            throw new Error('Username tidak boleh kosong.')
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUser) {
            throw new Error('Username tersebut sudah digunakan.')
        }


        const adminPassword = await password({
            message: 'Masukkan password Admin:',
            mask: '*',
        })

        if (adminPassword.length < 8) {
            throw new Error('Password minimal harus  8 karakter.')
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        const admin = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'ADMIN'
            },
        })

        console.log(`Akun Admin berhasil dibuat: ${admin.username}`)
    } catch (error) {
        console.error('Gagal membuat akun Admin:', error instanceof Error ? error.message:error)
    } finally {
        rl.close()
        await prisma.$disconnect()
    }
}

createAdmin()