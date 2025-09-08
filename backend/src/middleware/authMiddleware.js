import jwt from 'jsonwebtoken'
export async function authMiddleware(req, res, next) {
    const token = req.headers['authorization'].split(' ')[1]
    if (!token) throw new Error("User não autenticado")

    const decoded = jwt.verify(token, "seu_segredo")
    req.user = decoded

    next()
} 