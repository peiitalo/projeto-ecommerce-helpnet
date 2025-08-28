import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/clients/home';
import Login from './pages/login';
import Cadastro from './pages/cadastro';
import Dashboard from './pages/clients/dashboard';
import NotFound from './pages/notFound';

function App() {
  return (
    <Router>
      <Routes>
        {/* Página inicial */}
        <Route path="/" element={<Home />} />
        
        {/* Autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        
        {/* Área do cliente */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Páginas futuras - podem ser implementadas depois */}
        <Route path="/produtos" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Produtos - Em desenvolvimento</h1></div>} />
        <Route path="/perfil" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Perfil - Em desenvolvimento</h1></div>} />
        <Route path="/pedidos" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Pedidos - Em desenvolvimento</h1></div>} />
        <Route path="/configuracoes" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Configurações - Em desenvolvimento</h1></div>} />
        <Route path="/contato" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Contato - Em desenvolvimento</h1></div>} />
        <Route path="/ajuda" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Ajuda - Em desenvolvimento</h1></div>} />
        <Route path="/faq" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">FAQ - Em desenvolvimento</h1></div>} />
        <Route path="/esqueci-senha" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Esqueci Senha - Em desenvolvimento</h1></div>} />
        
        {/* Página 404 - deve ser a última rota */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
