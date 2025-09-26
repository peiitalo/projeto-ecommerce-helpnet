import jwt from 'jsonwebtoken'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const parts = authHeader.split(' ');
    const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : null;

    if (!token) return res.status(401).json({ success: false, errors: ['User não autenticado'] });

    const ACCESS_SECRET = process.env.JWT_SECRET || 'seu_segredo';
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, errors: ['Token inválido ou expirado'] });
  }
}