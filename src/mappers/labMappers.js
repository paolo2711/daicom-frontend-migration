class LabMappers {
    getMap(element) {
        return {
            id: element.id,
            name: element.name,
            code: element.code,
        }
    }
    putMap(element) {
        return this.getMap(element)
    }
}

export default new LabMappers();