// crypto.randomUUID solo existe en contexto seguro y la app se abre por http en
// la red local. getRandomValues si esta siempre.
export function uuid() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40   // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80   // variante RFC 4122

  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
          hex.slice(16, 20), hex.slice(20)].join('-')
}
