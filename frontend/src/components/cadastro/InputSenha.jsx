import { useState } from 'react';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { FaLock } from 'react-icons/fa';
import { useRegrasSenha } from '../../hooks/useRegrasSenha';

export default function InputSenha({ valor, aoAlterar, classeInput, classeIcone, classeGrupo }) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarRegras, setMostrarRegras] = useState(false);
  const { temComprimento, temMaiuscula, temMinuscula, temNumero, temEspecial } = useRegrasSenha(valor);

  return (
    <div className={`${classeGrupo} relative`}>
      <FaLock className={classeIcone} />
      <input
        className={`${classeInput} pr-12`}
        type={mostrarSenha ? 'text' : 'password'}
        name="senha"
        placeholder="Crie uma senha segura"
        value={valor}
        onChange={aoAlterar}
        onFocus={() => setMostrarRegras(true)}
        onBlur={() => setMostrarRegras(false)}
        aria-describedby="password-rules-tooltip"
      />
      <button
        type="button"
        onClick={() => setMostrarSenha(!mostrarSenha)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 z-10"
      >
        {mostrarSenha ? <FiEyeOff /> : <FiEye />}
      </button>

      {mostrarRegras && (
        <>
          <div id="password-rules-tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-80 z-50 hidden lg:block">
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: '16px', height: '16px', background: '#fff', borderTop: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }} />
              <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3">
                <h4 className="text-sm font-semibold mb-2 text-slate-800">Regras para criar uma senha</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className={temComprimento ? 'text-green-500' : 'text-slate-400'} />
                    Pelo menos 8 caracteres
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className={temMaiuscula ? 'text-green-500' : 'text-slate-400'} />
                    Ao menos uma letra maiúscula
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className={temMinuscula ? 'text-green-500' : 'text-slate-400'} />
                    Ao menos uma letra minúscula
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className={temNumero ? 'text-green-500' : 'text-slate-400'} />
                    Ao menos um número
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className={temEspecial ? 'text-green-500' : 'text-slate-400'} />
                    Ao menos um caractere especial
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="block lg:hidden mt-2 w-full">
            <div className="bg-white border border-slate-200 shadow rounded-lg p-3">
              <h4 className="text-sm font-semibold mb-2 text-slate-800">Regras para criar uma senha</h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className={temComprimento ? 'text-green-500' : 'text-slate-400'} />
                  Pelo menos 8 caracteres
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className={temMaiuscula ? 'text-green-500' : 'text-slate-400'} />
                  Ao menos uma letra maiúscula
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className={temMinuscula ? 'text-green-500' : 'text-slate-400'} />
                  Ao menos uma letra minúscula
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className={temNumero ? 'text-green-500' : 'text-slate-400'} />
                  Ao menos um número
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className={temEspecial ? 'text-green-500' : 'text-slate-400'} />
                  Ao menos um caractere especial
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}