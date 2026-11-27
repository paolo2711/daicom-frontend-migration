// Para el :key de una tabla cuyas columnas cambian en pantalla: con otras columnas se arma de nuevo. Compilado, Vue
// reusaria la celda de otra columna y solo le cambiaria lo dinamico: le quedarian un icono o una clase de la otra.
export const claveDeColumnas = (columnas) => columnas.map(columna => columna.key).join()
