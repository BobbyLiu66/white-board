const mongo_client = require('../db/mongo_client').mongo_client;

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
        let allParticipants = [];
        allParticipants.push(date.owner);
        allParticipants = allParticipants.concat(date.participants);
        if (allParticipants.includes(username)) {
            return {
                message: 'Join this room success'
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
            message: 'Create room success'
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


