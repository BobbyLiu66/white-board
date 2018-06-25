import {mongodb} from './mongo_config';
import {MongoClient} from 'mongodb';

export const mongo_client = MongoClient.connect(mongodb.whiteboard).then(
    function onFulfilled(db) {
        console.log("MONGO READY");
        return db;
    }
);