const mongo_client = require('../db/mongo_client').mongo_client;
const _ = require('lodash');

exports.checkUsername = async (username, password) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: username}).catch((err) => {
        return {errmsg: err}
    });
    if (result !== null) {
        if (result.password === password && result.status === 'logout') {
            return {
                message: "login success"
            }
        }
        else if (result.password === password && result.status === 'login') {
            return {
                errmsg: "This account has already login"
            }
        }
        else {
            return {
                errmsg: "nickname or password is wrong"
            }
        }
    }
    return await client.db('weather').collection('chat_user').insertOne({
        _id: username,
        password: password,
        status: 'login'
    }).catch((err) => {
        return {errmsg: err}
    });
};

exports.inviteFriend = async (inviteName) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: inviteName}).catch((err) => {
        return {errmsg: err}
    });
    if (result !== null) {
        return {
            message: 'invite success'
        }
    }
    else {
        return {
            errmsg: 'Nick name did not exist'
        }
    }
};

exports.checkRoomName = async (roomName, username) => {
    let client = await mongo_client;
    let date = await client.db('weather').collection('chat_room').findOne({_id: roomName}).catch((err) => {
        return {errmsg: err}
    });
    if (date !== null) {
        if (date.participants.includes(username) || date.owner === username) {
            return {
                message: 'Join this room success',
                status: 'Join'
            }
        }
        else {
            return {
                errmsg: 'no authority to participant into this room'
            }
        }
    }
    else {
        await client.db('weather').collection('chat_room').insertOne({
            _id: roomName,
            owner: username,
            participants: []
        }).catch((err) => {
            return {
                errmsg: err
            }
        });
        return {
            message: 'Create room success',
            status:'Create'
        }
    }
};

exports.updateUserStatus = async (username, status) => {
    let client = await mongo_client;
    await client.db('weather').collection('chat_user').updateOne({_id: username}, {
        $set: {status: status},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        return err
    });
};

exports.updateRoomUser = async (roomName, user) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_room').findOne({_id: roomName}).catch((err) => {
        return {errmsg: err}
    });
    let users = result.participants;
    users.push(user);
    await client.db('weather').collection('chat_room').updateOne({_id: roomName}, {
        $set: {participants: users},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        return {errmsg: err}
    });
};

exports.countAcceptedNum = async (roomName) => {
    let client = await mongo_client;
    let userResult = await client.db('weather').collection('chat_room').findOne({_id:roomName});
    //TODO add default user info to db
    let users = userResult.participants;
    users.push(userResult.owner);
    let onlineNum = [];
    for(let user of users){
        let res = await client.db('weather').collection('chat_user').findOne({_id:user,status:"login"}).catch((err)=>{return{errmsg:err}});
        if(res !== null){
            onlineNum.push(res)
        }
    }
    return {
        message:onlineNum.length
    };
};


