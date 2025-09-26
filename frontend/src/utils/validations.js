import { cpf, cnpj } from "cpf-cnpj-validator";

// Validação de senha (mesmas regras do backend)
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) errors.push(`Senha deve ter no mínimo ${minLength} caracteres`);
  if (!hasUpperCase) errors.push('Senha deve ter pelo menos uma letra maiúscula');
  if (!hasLowerCase) errors.push('Senha deve ter pelo menos uma letra minúscula');
  if (!hasNumbers) errors.push('Senha deve ter pelo menos um número');
  if (!hasSpecialChar) errors.push('Senha deve ter pelo menos um caractere especial');

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validação CPF/CNPJ
export const validateDocument = (numero, tipoPessoa) => {
  const cleanDoc = numero.replace(/[^\d]/g, '');

  if (tipoPessoa === 'fisica') {
    const isValid = cpf.isValid(cleanDoc);
    return {
      isValid,
      errors: isValid ? [] : ['CPF inválido']
    };
  } else {
    const isValid = cnpj.isValid(cleanDoc);
    return {
      isValid,
      errors: isValid ? [] : ['CNPJ inválido']
    };
  }
};

// Validação de email
export const validateEmail = (email) => {
  // Regex simples para email (pode usar bibliotecas se quiser)
  const regex = /^\S+@\S+\.\S+$/;
  const isValid = regex.test(email);
  return {
    isValid,
    errors: isValid ? [] : ['Email inválido']
  };
};

// Validação CEP
export const validateCEP = (cep) => {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  const isValid = /^\d{8}$/.test(cleanCEP);
  return {
    isValid,
    errors: isValid ? [] : ['CEP inválido']
  };
};

// Validação Código IBGE (opcional)
export const validateCodigoIBGE = (codigo) => {
  if (!codigo || codigo.trim() === '') {
    return {
      isValid: true,
      errors: []
    };
  }
  const cleanCodigo = codigo.replace(/[^\d]/g, '');
  const isValid = /^\d{7}$/.test(cleanCodigo);
  return {
    isValid,
    errors: isValid ? [] : ['Código IBGE deve ter 7 dígitos']
  };
};