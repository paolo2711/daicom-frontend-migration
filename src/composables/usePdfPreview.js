import { ref, watch } from 'vue'

// La vista previa de un PDF que arma el back sin guardar nada: lo pide, lo muestra y libera su URL al cerrarla.
export function usePdfPreview (pedir, alFallar) {
  const abierta = ref(false)
  const url = ref('')
  const armando = ref(false)

  const soltar = () => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = ''
  }
  watch(abierta, (sigue) => { if (!sigue) soltar() })

  async function ver () {
    armando.value = true
    try {
      const pdf = await pedir()
      soltar()
      url.value = URL.createObjectURL(pdf)
      abierta.value = true
    } catch (error) {
      alFallar(error)
    } finally {
      armando.value = false
    }
  }

  return { abierta, url, armando, ver }
}
