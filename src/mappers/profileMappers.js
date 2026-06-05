class ProfileMappers {
    putMap(element) {
        return {
            username: element.username,
            first_name: element.first_name,
            last_name: element.last_name,
            email: element.email
        }
    }
}

export default new ProfileMappers();