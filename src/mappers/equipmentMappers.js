class EquipmentMappers {
    // El campo 'equipment' en Certificate guarda el nombre como texto plano,
    // no una FK a EquipoMaestro. Por eso id y name son el mismo string:
    // el v-autocomplete sigue guardando el nombre en v-model, como siempre.
    getMap(item) {
        return {
            id: item.nombre_tecnico,
            name: item.nombre_tecnico,
        }
    }
    putMap(item) {
        return this.getMap(item)
    }
}

export default new EquipmentMappers()