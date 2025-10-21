import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaBuilding } from "react-icons/fa";
import {
  FiArrowRight,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";

const logoConfig = {
  useImage: true,
  imageUrl: "/logo-horizontal-branca.png",
  altText: "HelpNet Logo",
  textLogo: "HelpNet",
};

function AdminLogin() {
  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row min-h-screen">
        <aside className="w-full md:w-1/3 lg:w-1/4 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-600 to-sky-500 text-white border-b md:border-b-0">
          <div className="md:sticky md:top-8">
            <div className="mb-4">
              {logoConfig.useImage ? (
                <img
                  src={logoConfig.imageUrl}
                  alt={logoConfig.altText}
                  className="h-12 w-auto mx-auto"
                />
              ) : (
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">
                  {logoConfig.textLogo}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Fazer Login
            </h1>
            <p className="text-blue-100 mb-6 md:mb-8 text-sm sm:text-base hidden md:block">
              Acesse o painel administrativo para gerenciar pedidos, clientes e
              configurações da plataforma.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default AdminLogin;
