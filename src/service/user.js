const mongo_chat = require('../persistance/mongo_chat');

exports.checkUser = (username, password) => {
    let resultObj = {};
    return mongo_chat.checkUsername(username, password).then((result) => {
        if (result.hasOwnProperty('errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    }, (err) => {
        resultObj.err = err;
        return resultObj
    })
};

exports.checkRoom = (roomName, username) => {
    let resultObj = {};
    return mongo_chat.checkRoomName(roomName, username).then((result) => {
        if (result.hasOwnProperty('errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message;
            resultObj.status = result.status
        }
        return resultObj
    }, (err) => {
        resultObj.err = err;
        return resultObj
    })
};

exports.checkFriend = (inviteName) => {
    let resultObj = {};
    return mongo_chat.inviteFriend(inviteName).then((result) => {
        if (result.hasOwnProperty('errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    }, (err) => {
        resultObj.err = err;
        return resultObj
    })
};

exports.updateUserStatus = (username, status) => {
    mongo_chat.updateUserStatus(username, status).catch((err) => {
        console.log(err)
    })
};

exports.updateRoomUser = (roomName, username) => {
    mongo_chat.updateRoomUser(roomName, username).catch((err) => {
        console.log(err)
    })
};
//TODO implement
exports.saveHistoryMessage = async (data) => {
    await mongo_chat.updateHistoryMessage(data).catch((err) => {
        console.log(err)
    })
};

exports.getHistoryMessage = async (data) => {
    let resultObj = {};
    await mongo_chat.getHistoryMessage(data,true).then((result) => {
        if (result.errmsg) {
            resultObj.err = result.errmsg
        }
        else {
            if (result.message.length > 0) {
                resultObj.message = result.message;
            }
        }
    }, (err) => {
        resultObj.err = err;
    }).catch((err) => {
        resultObj.err = err;
    });
    return resultObj
};

/**
 * {nickname}
 */
exports.getFriendList = async (data) => {
    let resultObj = {friendList: [], message: []};
    await mongo_chat.getRoomList(data).then((result) => {
        if (result.errmsg) {
            resultObj.err = result.errmsg
        }
        else {
            if (result.friend) {
                resultObj.friendList = result.friend
            }
        }
    }, (err) => {
        resultObj.err = err;
    }).catch((err) => {
        resultObj.err = err;
    });
    if (!resultObj.err) {
        let obj = {};
        for (let friend of resultObj.friendList) {
            obj.roomName = friend.roomName;
            obj.nickname = data.nickname;
            await mongo_chat.getHistoryMessage(obj).then((result) => {
                if (result !== null) {
                    if (result.errmsg) {
                        resultObj.err = result.errmsg
                    }
                    else {
                        if (result.message.length > 0) {
                            resultObj.message.push({
                                message: result.message[result.message.length - 1],
                                roomName: result._id
                            })
                        }
                    }
                }
            }, (err) => {
                resultObj.err = err;
            }).catch((err) => {
                resultObj.err = err;
            });
        }
    }
    return resultObj
};

exports.addFriend = async (data) => {
    let resultObj = {};
    await mongo_chat.updateFriend(data).then((result) => {
        if (result.errmsg) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj.roomName = result.roomName
        }
    }, (err) => {
        resultObj.err = err;
    }).catch((err) => {
        resultObj.err = err;
    });
    return resultObj
};


//TODO feiqi
exports.findOnlineNum = (roomName) => {
    let resultObj = {};
    return mongo_chat.countAcceptedNum(roomName).then((result) => {
        if (result.hasOwnProperty('errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    }, (err) => {
        resultObj.err = err;
        return resultObj
    })
};
