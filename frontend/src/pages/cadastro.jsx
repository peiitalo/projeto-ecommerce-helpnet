import { useState } from "react";

function Cadastro() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const proximaEtapa = () => {
    setEtapaAtual((prev) => prev + 1);
  };

  const etapaAnterior = () => {
    setEtapaAtual((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const renderEtapa = () => {
    switch (etapaAtual) {
      case 1:
        return (
          <div>
            <h2>Etapa 1: Informações Pessoais</h2>
            <input
              type="text"
              name="nome"
              placeholder="Nome"
              value={formData.nome}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="password"
              name="senha"
              placeholder="Senha"
              value={formData.senha}
              onChange={handleChange}
            />
            <button onClick={proximaEtapa}>Próxima</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2>Etapa 2: Endereço</h2>
            <input
              type="text"
              name="endereco"
              placeholder="Endereço"
              value={formData.endereco}
              onChange={handleChange}
            />
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={formData.cidade}
              onChange={handleChange}
            />
            <input
              type="text"
              name="estado"
              placeholder="Estado"
              value={formData.estado}
              onChange={handleChange}
            />
            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={formData.cep}
              onChange={handleChange}
            />
            <button onClick={etapaAnterior}>Anterior</button>
            <button onClick={proximaEtapa}>Próxima</button>
          </div>
        );
      case 3:
        return (
          <div>
            <h2>Etapa 3: Revisão</h2>
            <p>
              <strong>Nome:</strong> {formData.nome}
            </p>
            <p>
              <strong>Email:</strong> {formData.email}
            </p>
            <p>
              <strong>Endereço:</strong> {formData.endereco}
            </p>
            <p>
              <strong>Cidade:</strong> {formData.cidade}
            </p>
            <p>
              <strong>Estado:</strong> {formData.estado}
            </p>
            <p>
              <strong>CEP:</strong> {formData.cep}
            </p>
            <button onClick={etapaAnterior}>Anterior</button>
            <button onClick={() => alert("Formulário enviado!")}>Enviar</button>
          </div>
        );
      default:
        return <p>Etapa desconhecida</p>;
    }
  };

  return <div className="">{renderEtapa()}</div>;
}

export default Cadastro;
