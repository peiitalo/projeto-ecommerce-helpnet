import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaLock } from "react-icons/fa";

export default function InputConfirmarSenha({
  valor,
  aoAlterar,
  classeInput,
  classeIcone,
  classeGrupo,
}) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className={`${classeGrupo} relative`}>
      <FaLock className={classeIcone} />
      <input
        className={`${classeInput} pr-12`}
        type={mostrarSenha ? "text" : "password"}
        name="confirmarSenha"
        placeholder="Confirme a senha"
        value={valor}
        onChange={aoAlterar}  
        required
        aria-describedby="password-confirmation"
      />
      <button
        type="button"
        onClick={() => setMostrarSenha(!mostrarSenha)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 z-10"
      >
        {mostrarSenha ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}