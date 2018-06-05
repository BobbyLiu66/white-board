const bunyan = require('bunyan');
let log = bunyan.createLogger({name: 'config'});
let projectName = {
    "formal": "chat_room_service",
    "test": "chat_room_service",
    "dev": "chat_room_service"
};

function chooseEnv(model) {
    if (process.env.NODE_ENV === "formal") {
        return model.formal
    } else if (process.env.NODE_ENV === "test") {
        return model.test;
    } else {
        return model.dev;
    }
}

log.info("env:", process.env.NODE_ENV);
exports.chooseEnv = chooseEnv;
exports.projectName = chooseEnv(projectName);
