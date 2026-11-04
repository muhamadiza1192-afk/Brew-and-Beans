import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../jwt.js'

export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization
        if(!authHeader || !authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Token autentikasi tidak ditemukan',
            })
        }
    

        const token = authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                message: 'Format token tidak valid',
            })
        }

        const decoded = verifyToken(token)

        res.locals.user = decoded

        next()

} catch (error) {
    return res.status(401).json({
        message: 'Token tidak valid atau sudah kedaluwarsa',
    })
}
}

export function authorizeRole(...allowedRoles: string[]) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const user = res.locals.user as { role?:string } | undefined

        if (!user || !allowedRoles.includes(user.role ?? '')) {
            return res.status(403).json({
                message: ' Kamu tidak memiliki izin untuk mengakses fitur ini',
            })
        }
        next()
    }
}