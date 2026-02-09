/**
 * Normaliza un texto: mayúsculas, sin tildes, sin espacios extras
 */
export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return '';
  
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Valida que un número de pasaporte tenga el formato correcto (letra + 6 números)
 */
export function validarFormatoPasaporte(numero: string): boolean {
  const regex = /^[A-Z]\d{6}$/;
  return regex.test(numero);
}

/**
 * Formatea un número de pasaporte
 */
export function formatearPasaporte(numero: string): string {
  return numero.toUpperCase().replace(/\s/g, '');
}

/**
 * Verifica si dos rangos de fechas se solapan
 */
export function fechasSeSolapan(
  inicio1: Date,
  fin1: Date,
  inicio2: Date,
  fin2: Date,
): boolean {
  return inicio1 <= fin2 && fin1 >= inicio2;
}

/**
 * Genera el consecutivo anual de contrato
 */
export function generarNumeroContrato(ano: number, consecutivo: number): string {
  return `${ano}-${consecutivo.toString().padStart(4, '0')}`;
}
