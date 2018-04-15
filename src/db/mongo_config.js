const chooseEnv = require('./config').chooseEnv;
const CONFIG = require('../../configuration');

const mongodb = {
    test: CONFIG.MONGODBTEST,
    formal: CONFIG.MONGODBFORMAL,
    dev: CONFIG.MONGODBDEV
};

exports.mongodb = chooseEnv(mongodb);