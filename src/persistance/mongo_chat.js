const mongo_client = require('../db/mongo_client').mongo_client;
const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const api = require('../api');
const {LOGINSUCCESS,LOGINFAIL,INVITESUCCESS,INVITEFAIL,BEENFRIENDSTATE,INVITEEXIST} = require("../constant");

exports.checkUsername = async (username, password, clientIp) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: username}).catch((err) => {
        return {errmsg: err}
    });
    if (result !== null) {
        if (result.password === password) {
            return {
                message: LOGINSUCCESS
            }
        }
        else {
            return {
                errmsg: LOGINFAIL
            }
        }
    }
    const ipInfo = await api.getIpInfo(clientIp);
    return await client.db('weather').collection('chat_user').insertOne({
        _id: username,
        password: password,
        status: 'login',
        friend: [],
        clientIp: ipInfo
    }).catch((err) => {
        return {errmsg: err}
    });
};


exports.inviteFriend = async (data) => {
    const object = {};
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: data.inviteName}).catch((err) => {
        object.errmsg = err;
        return object
    });
    if (result !== null) {
        result.newFriend.forEach((list)=>{
            if(list.nickname === data.nickname){
                object.errmsg = INVITEEXIST
            }
        });
        !object.errmsg ? object.message = INVITESUCCESS: "";
        return object
    }
    else {
        object.errmsg = INVITEFAIL;
        return object
    }
};

// exports.checkRoomName = async (roomName, username) => {
//     let client = await mongo_client;
//     let date = await client.db('weather').collection('chat_room').findOne({_id: roomName}).catch((err) => {
//         return {errmsg: err}
//     });
//     if (date !== null) {
//         if (date.participants.includes(username) || date.owner === username) {
//             return {
//                 message: 'Join this room success',
//                 status: 'Join'
//             }
//         }
//         else {
//             return {
//                 errmsg: 'no authority to participant into this room'
//             }
//         }
//     }
//     else {
//         await client.db('weather').collection('chat_room').insertOne({
//             _id: roomName,
//             owner: username,
//             participants: []
//         }).catch((err) => {
//             return {
//                 errmsg: err
//             }
//         });
//         return {
//             message: 'Create room success',
//             status: 'Create'
//         }
//     }
// };

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

exports.getUserInformation = async (data) => {
    let client = await mongo_client;
    return await client.db('weather').collection('chat_user').findOne({_id: data.nickname}).catch((err) => {
        return {errmsg: err}
    });
};

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

exports.updateNewFriend = async (data) => {
    let client = await mongo_client;
    let nickname = data.nickname;
    let inviteName = data.inviteName;
    let obj = {};
    let result = await client.db('weather').collection('chat_user').findOne({_id: inviteName}).catch((err) => {
        obj.errmsg = err
    });
    let friend = result.newFriend || [];
    friend.push({nickname: nickname,messageTime:data.messageTime,state:"PENDING"});
    await client.db('weather').collection('chat_user').updateOne({_id: inviteName}, {
        $set: {newFriend: friend},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        obj.errmsg = err
    });
};

exports.updateNewFriendState = async (data) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: data.nickname}).catch((err) => {
        obj.errmsg = err
    });
    result.newFriend.forEach((list)=>{
        if(list.nickname === data.inviteName){
            list.state = BEENFRIENDSTATE
        }
    });
    await client.db('weather').collection('chat_user').updateOne({_id: data.nickname}, {
        $set: {newFriend: result.newFriend},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        return err
    });
};


