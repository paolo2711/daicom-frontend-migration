class UserMappers {
    getMap(element) {
        return {
            id: element.id,
            username: element.username,
            first_name: element.first_name,
            last_name: element.last_name,
            kind: element.kind,
            kind_description: element.kind_description,
            email: element.email,
        }
    }
    putMap(element) {
        return {
            id: element.id,
            username: element.username,
            first_name: element.first_name,
            last_name: element.last_name,
            kind: element.kind,
            email: element.email,
        }
    }
}

export default new UserMappers();