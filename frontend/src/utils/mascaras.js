// Utilitários de máscaras para CPF, CNPJ, CEP e telefones

export const mascararCPF = (valor = '') =>
  valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const mascararCNPJ = (valor = '') =>
  valor
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

export const mascararTelefone = (valor = '') =>
  valor
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');

export const mascararCEP = (valor = '') =>
  valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2');