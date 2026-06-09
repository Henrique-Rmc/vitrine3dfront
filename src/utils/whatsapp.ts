export function buildWhatsAppUrl(whatsappNumber: string, productName: string): string {
  const digits = whatsappNumber.replace(/\D/g, '')
  const message = `Olá! Gostaria de solicitar um orçamento para o produto: *${productName}*`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
