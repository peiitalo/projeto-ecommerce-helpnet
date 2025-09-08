// backend/src/middleware/vendorScope.js
export default function vendorScope(req, res, next) {
  // MVP: obtém EmpresaID do header. Em produção, use JWT e roles.
  const header = req.header('X-Empresa-ID') || req.header('x-empresa-id');
  const empresaId = header ? parseInt(header, 10) : NaN;

  if (!empresaId || Number.isNaN(empresaId)) {
    return res.status(400).json({ erro: 'X-Empresa-ID inválido ou ausente' });
  }

  req.vendorEmpresaId = empresaId;
  next();
}
