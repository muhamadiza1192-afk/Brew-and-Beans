import jwt from "jsonwebtoken"

const jwtSecret = process.env.JWT_SECRET ?? ''

if (!jwtSecret) {
    throw new Error('JWT_SECRET belum diatur di file .env')
}

export function generateToken(userId: number, role: string) {
    return jwt.sign(
        { userId, role },
        jwtSecret,
        { expiresIn: '1d' }
    )
}

export function verifyToken(token: string) {
    return jwt.verify(token, jwtSecret)
}