import {mongo_client} from '../db/mongo_client';
import uuidv4 from 'uuid/v4';
import {getIpInfo} from '../api';
import {LOGINSUCCESS, LOGINFAIL, INVITESUCCESS, INVITEFAIL, BEENFRIENDSTATE, INVITEEXIST} from '../constant';

export const checkUsername = async ({username, password, clientIp}) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: username}).catch((err) => {
        console.log(err)
        return {errmsg: err}
    });
    console.log("result,", result)
    if (result !== null) {
        if (result.password === password) {
            return {
                message: LOGINSUCCESS,
                avatar: result.avatar
            }
        }
        else {
            return {
                errmsg: LOGINFAIL
            }
        }
    }
    const ipInfo = await getIpInfo(clientIp);
    return await client.db('weather').collection('chat_user').insertOne({
        _id: username,
        password: password,
        status: 'login',
        friend: [],
        newFriend: [],
        clientIp: ipInfo
    }).catch((err) => {
        return {errmsg: err}
    });
};


export const inviteFriend = async ({data}) => {
    const object = {};
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_user').findOne({_id: data.inviteName}).catch((err) => {
        object.errmsg = err;
        return object
    });
    if (result !== null) {
        result.newFriend.map((list) => {
            if (list.nickname === data.nickname) {
                object.errmsg = INVITEEXIST
            }
        });
        !object.errmsg ? object.message = INVITESUCCESS : "";
        return object
    }
    else {
        object.errmsg = INVITEFAIL;
        return object
    }
};

export const updateUserStatus = async ({username, status}) => {
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

export const getAvatar = async ({nickname}) => {
    const client = await mongo_client;
    const result = await client.db('weather').collection('chat_user').findOne({_id: nickname}).catch((err) => {
        return {errmsg: err}
    });
    return {avatar: result.avatar}
};

export const updateHistoryMessage = async ({roomName, speaker, messageTime, messageContent, initUser}) => {
    let client = await mongo_client;
    let result = await client.db('weather').collection('chat_history').findOne({_id: roomName}).catch((err) => {
        return {errmsg: err}
    });
    let messageList = result ? [...result.message] : [];
    messageList.push({
        speaker: speaker,
        messageTime: messageTime,
        messageContent: messageContent,
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


export const getHistoryMessage = async ({roomName, options=false}) => {
    let client = await mongo_client;
    const result = await client.db('weather').collection('chat_history').findOne({_id: roomName}).catch((err) => {
        return {errmsg: err}
    });

    if (options) {
        let updateMessage = result;
        updateMessage.message.map((message) => {
            message.status = true
        });
        await client.db('weather').collection('chat_history').updateOne({_id: roomName}, {
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

export const getUserInformation = async ({nickname}) => {
    let client = await mongo_client;
    return await client.db('weather').collection('chat_user').findOne({_id: nickname}).catch((err) => {
        return {errmsg: err}
    });
};

export const updateFriend = async ({inviteName, nickname}) => {
    let client = await mongo_client;
    const roomName = uuidv4();
    const obj = {roomName};
    let result = await client.db('weather').collection('chat_user').findOne({_id: nickname}).catch((err) => {
        obj.errmsg = err
    });
    const friend = [...result.friend] || [];
    friend.push({roomName: roomName, friend: inviteName});
    await client.db('weather').collection('chat_user').updateOne({_id: nickname}, {
        $set: {friend: friend},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        obj.errmsg = err
    });
    return obj
};

export const updateNewFriend = async ({nickname, inviteName, messageTime}) => {
    let client = await mongo_client;
    let obj = {};
    const result = await client.db('weather').collection('chat_user').findOne({_id: inviteName}).catch((err) => {
        obj.errmsg = err
    });
    const friend = [...result.newFriend] || [];
    friend.push({nickname: nickname, messageTime: messageTime, state: "PENDING"});
    await client.db('weather').collection('chat_user').updateOne({_id: inviteName}, {
        $set: {newFriend: friend},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        obj.errmsg = err
    });
};

export const updateNewFriendStatus = async ({inviteName, nickname}) => {
    let client = await mongo_client;
    const result = await client.db('weather').collection('chat_user').findOne({_id: inviteName}).catch((err) => {
        return err
    });
    result.newFriend.map((friend) => {
        if (friend.nickname === nickname) {
            friend.state = BEENFRIENDSTATE
        }
    });

    await client.db('weather').collection('chat_user').updateOne({_id: inviteName}, {
        $set: {newFriend: result.newFriend},
        $currentDate: {
            lastModified: true
        }
    }, {'upsert': true}).catch((err) => {
        return err
    });
};
