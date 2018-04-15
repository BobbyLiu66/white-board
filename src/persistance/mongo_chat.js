const path = require('path');
const fs = require('fs');
const mongo_client = require('../db/mongo_client').mongo_client;
const _ = require('lodash');

exports.checkUsername = async (username,password) => {
    let client = await mongo_client;
    return await client.db('weather').collection('chat_user_list').insertOne({_id: username,password:password}).catch((err)=>{return err});
};

exports.saveIpInfo = async (ipInfo) => {
    let client = await mongo_client;
    ipInfo._id = ipInfo.query;
    delete ipInfo.query;
    delete ipInfo.status;
    client.db('weather').collection('ip_info').updateOne(ipInfo, {
        $currentDate: {
            lastModified: true
        }
    }, {"upsert": true})
};

exports.checkUsername("hii");
