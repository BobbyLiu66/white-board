const mongo_client = require('../db/mongo_client').mongo_client;
const _ = require('lodash');
const uuidv4 = require('uuid/v4');


exports.checkUsername = async (username, password) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: username}).catch((err) => {
        return {errmsg: err}
    });
    if (result !== null) {
        if (result.password === password) {
            return {
                message: "login success"
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
        status: 'login',
        friend: []
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
            status: 'Create'
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


exports.updateHistoryMessage = async (data, initUser) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_history').findOne({_id: data.roomName}).catch((err) => {
        return {errmsg: err}
    });
    let messageList = result ? result.message : [];
    messageList.push({
        speaker: data.speaker,
        messageTime: data.messageTime,
        messageContent: data.messageContent,
        status: false
    });
    let setMessage = {message: messageList};
    if (initUser) {
        setMessage.member = initUser
    }
    await client.db('weather').collection('chat_history').updateOne({_id: data.roomName}, {
        $set: setMessage,
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        return {errmsg: err}
    });
    return result
};

exports.getHistoryMessage = async (data, options) => {
    let client = await mongo_client;
    const result = await client.db('weather').collection('chat_history').findOne({_id: data.roomName}).catch((err) => {
        return {errmsg: err}
    });

    if (options) {
        let updateMessage = result;
        updateMessage.message.map((message) => {
            message.status = true
        });
        await client.db('weather').collection('chat_history').updateOne({_id: data.roomName}, {
            $set: {message: updateMessage.message},
            $currentDate: {
                lastModified: true
            }
        }, {'upsert': true}).catch((err) => {
            return {errmsg: err}
        });
    }

    return result

};

exports.getRoomList = async (data) => {
    let client = await mongo_client;
    return await client.db('weather').collection('chat_user').findOne({_id: data.nickname}).catch((err) => {
        return {errmsg: err}
    });
};
//TODO test this
exports.updateFriend = async (data) => {
    let client = await mongo_client;
    let nickname = data.nickname;
    let inviteName = data.inviteName;
    let roomName = uuidv4();
    let obj = {};
    for (let i = 0; i < 2; i++) {
        let result = await client.db('weather').collection('chat_user').findOne({_id: nickname}).catch((err) => {
            obj.errmsg = err
        });
        let friend = result.friend || [];
        friend.push({roomName: roomName, friend: inviteName});
        await client.db('weather').collection('chat_user').updateOne({_id: nickname}, {
            $set: {friend: friend},
            $currentDate: {
                lastModified: true
            }
        }, {'upsert': true}).catch((err) => {
            obj.errmsg = err
        });
        nickname = data.inviteName;
        inviteName = data.nickname
    }
    obj.roomName = roomName;
    return obj
};


//antiquate
exports.countAcceptedNum = async (roomName) => {
    let client = await mongo_client;
    let userResult = await client.db('weather').collection('chat_room').findOne({_id: roomName});
    //TODO add default user info to db
    let users = userResult.participants;
    users.push(userResult.owner);
    let onlineNum = [];
    for (let user of users) {
        let res = await client.db('weather').collection('chat_user').findOne({
            _id: user,
            status: "login"
        }).catch((err) => {
            return {errmsg: err}
        });
        if (res !== null) {
            onlineNum.push(res)
        }
    }
    return {
        message: onlineNum.length
    };
};


