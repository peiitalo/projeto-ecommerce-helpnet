import jwt from 'jsonwebtoken'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const parts = authHeader.split(' ');
    const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : null;

    console.log('AuthMiddleware Debug:', {
      authHeader: authHeader ? 'present' : 'missing',
      parts: parts.length,
      token: token ? 'present' : 'missing',
      url: req.url,
      method: req.method
    });

    if (!token) {
      console.log('AuthMiddleware: No token provided');
      return res.status(401).json({ success: false, errors: ['User não autenticado'] });
    }

    const ACCESS_SECRET = process.env.JWT_SECRET || 'seu_segredo';
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;

    console.log('AuthMiddleware: Token valid, user:', { id: decoded.id, role: decoded.role });

    next();
  } catch (err) {
    console.log('AuthMiddleware: Token verification failed:', err.message);
    return res.status(401).json({ success: false, errors: ['Token inválido ou expirado'] });
  }
}