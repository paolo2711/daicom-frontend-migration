class LogMappers {
    getMap(element) {
        return {
            id: element.id,
            description: element.description,
            action: element.action,
            log_date: element.log_date,
            user: element.user,
            user_data: element.user_data,
            log_time: element.log_time,
        }
    }
}

export default new LogMappers();