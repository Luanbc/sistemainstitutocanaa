/**
 * pix.js - Utilitário para geração de Payload PIX Estático (BRCode)
 * Baseado na implementação original do Sistema Canaã V1
 */

export function generatePixPayload(key, amount, identifier) {
  // 1. Limpeza do Valor: aceita "50.00", "50,00", "R$ 50,00"
  let cleanAmount = amount.toString().replace('R$ ', '').replace(/\./g, '').replace(',', '.').trim();
  cleanAmount = parseFloat(cleanAmount);
  
  if (isNaN(cleanAmount)) cleanAmount = 0;

  // 2. Limpeza da Chave com Inteligência
  let cleanKey = key.toString().trim();
  
  if (cleanKey.includes('@')) {
    // E-mail: apenas remove espaços
    cleanKey = cleanKey.replace(/\s/g, '');
  } else if (cleanKey.length === 36 && cleanKey.includes('-')) {
    // Chave Aleatória (EVP): mantém como está
    cleanKey = cleanKey.replace(/\s/g, '');
  } else if (cleanKey.startsWith('+')) {
    // Telefone já com prefixo internacional: mantém o + e números
    cleanKey = '+' + cleanKey.replace(/\D/g, '');
  } else {
    // Remove tudo que não é número para validar o tipo
    const onlyNumbers = cleanKey.replace(/\D/g, '');
    
    if (onlyNumbers.length === 11 || onlyNumbers.length === 10) {
      // CPF ou Celular sem +55. Mantemos apenas números.
      cleanKey = onlyNumbers;
    } else if (onlyNumbers.length === 12 || onlyNumbers.length === 13) {
      // Telefone com 55 mas sem o +
      cleanKey = '+' + onlyNumbers;
    } else {
      cleanKey = onlyNumbers;
    }
  }

  const format = (id, val) => {
    const v = String(val);
    const len = String(v.length).padStart(2, '0');
    return id + len + v;
  };

  // Montagem do Payload (EMV CRC16)
  let payload = 
    format('00', '01') + 
    format('26', format('00', 'br.gov.bcb.pix') + format('01', cleanKey)) + 
    format('52', '0000') + 
    format('53', '986') + 
    format('54', cleanAmount.toFixed(2)) + 
    format('58', 'BR') + 
    format('59', 'CANAA') + 
    format('60', 'SAO LUIS') + 
    format('62', format('05', identifier || '***')) + 
    '6304';

  // Cálculo do CRC16
  let crc = 0xFFFF;
  for (let k = 0; k < payload.length; k++) {
    crc ^= payload.charCodeAt(k) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }

  const finalCrc = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  
  return payload + finalCrc;
}
