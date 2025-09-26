// backend/src/middleware/vendorScope.js
// Garante que o usuário autenticado é vendedor e possui EmpresaID no token
export default function vendorScope(req, res, next) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ erro: 'Não autenticado' });

    const role = (user.role || '').toString().toLowerCase();
    const isVendor = role === 'vendedor' || (user.tipoPessoa || '').toString().toUpperCase() === 'JURIDICA';
    if (!isVendor) return res.status(403).json({ erro: 'Acesso restrito a vendedores' });

    const empresaId = parseInt(user.empresaId || user.EmpresaID || 0, 10);
    if (!empresaId || Number.isNaN(empresaId)) {
      return res.status(400).json({ erro: 'Empresa não vinculada ao vendedor' });
    }

    const vendedorId = parseInt(user.vendedorId || user.VendedorID || 0, 10);
    if (!vendedorId || Number.isNaN(vendedorId)) {
      return res.status(400).json({ erro: 'VendedorID não encontrado no token' });
    }

    req.vendorEmpresaId = empresaId;
    req.vendorId = vendedorId;
    next();
  } catch {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
}
