// backend/src/middleware/vendorScope.js
// Garante que o usuário autenticado é vendedor e possui EmpresaID no token
export default function vendorScope(req, res, next) {
  try {
    const user = req.user;
    console.log('=== VENDOR SCOPE DEBUG ===');
    console.log('VendorScope Debug - User:', {
      id: user?.id,
      role: user?.role,
      tipoPessoa: user?.tipoPessoa,
      empresaId: user?.empresaId || user?.EmpresaID,
      vendedorId: user?.vendedorId || user?.VendedorID || user?.vendorId,
      allKeys: user ? Object.keys(user) : 'no user',
      url: req.url,
      method: req.method,
      headers: req.headers.authorization ? 'Bearer token present' : 'No auth header'
    });

    if (!user) {
      console.log('VendorScope: FAIL - No user found in req.user');
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    const role = (user.role || '').toString().toLowerCase();
    const tipoPessoa = (user.tipoPessoa || '').toString().toUpperCase();
    const isVendor = role === 'vendedor' || tipoPessoa === 'JURIDICA';
    console.log('VendorScope: Role check - role:', role, 'tipoPessoa:', tipoPessoa, 'isVendor:', isVendor);

    if (!isVendor) {
      console.log('VendorScope: FAIL - User is not a vendor (role:', role, 'tipoPessoa:', tipoPessoa, ')');
      return res.status(403).json({ erro: 'Acesso restrito a vendedores' });
    }

    const empresaId = parseInt(user.empresaId || user.EmpresaID || 0, 10);
    console.log('VendorScope: EmpresaId check - raw values:', {
      empresaId: user?.empresaId,
      EmpresaID: user?.EmpresaID,
      parsed: empresaId,
      isNaN: Number.isNaN(empresaId)
    });

    if (!empresaId || Number.isNaN(empresaId)) {
      console.log('VendorScope: FAIL - Empresa not linked to vendor (empresaId:', empresaId, ')');
      return res.status(400).json({ erro: 'Empresa não vinculada ao vendedor' });
    }

    const vendedorId = parseInt(user.vendedorId || user.VendedorID || user.vendorId || 0, 10);
    console.log('VendorScope: VendedorId check - raw values:', {
      vendedorId: user?.vendedorId,
      VendedorID: user?.VendedorID,
      vendorId: user?.vendorId,
      parsed: vendedorId,
      isNaN: Number.isNaN(vendedorId)
    });

    if (!vendedorId || Number.isNaN(vendedorId)) {
      console.log('VendorScope: FAIL - VendedorID not found in token (vendedorId:', vendedorId, ')');
      return res.status(400).json({ erro: 'VendedorID não encontrado no token' });
    }

    req.vendorEmpresaId = empresaId;
    req.vendorId = vendedorId;
    console.log('VendorScope: SUCCESS - proceeding to next middleware (empresaId:', empresaId, 'vendedorId:', vendedorId, ')');
    next();
  } catch (error) {
    console.log('VendorScope: EXCEPTION -', error.message, error.stack);
    return res.status(401).json({ erro: 'Não autenticado' });
  }
}
