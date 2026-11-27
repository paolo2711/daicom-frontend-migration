// Las filas por pagina que ofrece el pie de las tablas; empiezan en la primera.
export const TAMANOS = [30, 60, 80, 100]

export const primeraPagina = () => ({ page: 1, itemsPerPage: TAMANOS[0] })

// Los nombres de CustomPagination en el back.
export const porPagina = (page, size) => ({ page, page_size: size })

export const leerPagina = (data) => ({ filas: data.results, total: data.count })

// Los filtros vacios no viajan: el back los tomaria como un filtro mas. El 0 si viaja.
export const soloConValor = (filtros) => Object.fromEntries(Object.entries(filtros)
  .filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined && valor !== false))
