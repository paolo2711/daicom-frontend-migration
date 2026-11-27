// El rol Administrador no esta en la base: el back lo suma a la lista con este id.
export const ROL_ADMINISTRADOR = -2

// Para el :item-props de un selector de roles. Solo un super-admin asigna Administrador o ve a quienes lo tienen.
export const propsDeRol = (esSuperAdmin, razon) => (rol) => (
  rol.id === ROL_ADMINISTRADOR && !esSuperAdmin ? { disabled: true, subtitle: razon } : {})
