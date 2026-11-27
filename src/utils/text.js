// En minusculas y sin tildes: «Calibración» y «calibracion» son lo mismo al buscar.
const sinTildes =(texto) => String(texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// Para `custom-filter` de un desplegable con opciones fijas: encuentra sin importar tildes ni mayusculas.
export const contieneSinTildes = (opcion, buscado) => sinTildes(opcion).includes(sinTildes(buscado))
