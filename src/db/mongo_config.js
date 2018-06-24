import {chooseEnv} from './config';
import CONFIG from '../../configuration';

const mongodb = {
    test: CONFIG.MONGODBTEST,
    formal: CONFIG.MONGODBFORMAL,
    dev: CONFIG.MONGODBDEV
};

exports.mongodb = chooseEnv(mongodb);