class RoleMappers {
    fullMap(element) {
        return {
            id: element.id,
            name: element.name
        }
    }
}

export default new RoleMappers();