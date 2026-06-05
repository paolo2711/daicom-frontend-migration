import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'

export function useSwal() {
  const theme = useTheme()

  const isDark = () => theme.global.current.value.dark

  const fire = (options) => {
    return Swal.fire({
      confirmButtonColor: isDark() ? '#1E88E5' : '#1F4690',
      cancelButtonColor:  isDark() ? '#EF5350' : '#fc4b6c',
      ...options
    })
  }

  const mixin = (options) => {
    return Swal.mixin({
      confirmButtonColor: isDark() ? '#1E88E5' : '#1F4690',
      cancelButtonColor:  isDark() ? '#EF5350' : '#fc4b6c',
    }).fire(options)
  }

  return { fire, mixin, isDark }
}