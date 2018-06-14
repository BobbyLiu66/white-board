const mongo_chat = require('../persistance/mongo_chat');

exports.checkUser = (username, password, clientIp) => {
    let resultObj = {};
    return mongo_chat.checkUsername(username, password, clientIp).then((result) => {
        if (result.hasOwnProperty('errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj = result
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


exports.getAvatar = (data) => {
    let resultObj = {};
    return mongo_chat.getAvatar(data).then((result) => {
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

exports.updateNewFriendState = (data) => {
    mongo_chat.updateNewFriendState(data).catch((err) => {
        console.log(err)
    })
};

exports.updateRoomUser = (roomName, username) => {
    mongo_chat.updateRoomUser(roomName, username).catch((err) => {
        console.log(err)
    })
};

exports.updateAvatar = (data) => {
    mongo_chat.updateAvatar(data).catch((err) => {
        console.log(err)
    })
};

exports.saveHistoryMessage = async (data, initUser) => {
    return await mongo_chat.updateHistoryMessage(data, initUser).catch((err) => {
        console.log(err)
    })
};

exports.getHistoryMessage = async (data) => {
    let resultObj = {};
    await mongo_chat.getHistoryMessage(data, true).then((result) => {
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
    await mongo_chat.getUserInformation(data).then((result) => {
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
                                roomName: result._id,
                                friend: friend.friend
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

exports.getNewFriendList = async (data)=>{
    let resultObj = {newFriendList: []};
    await mongo_chat.getUserInformation(data).then((result) => {
        if (result.errmsg) {
            resultObj.err = result.errmsg
        }
        else {
            if (result.newFriend) {
                resultObj.newFriendList = result.newFriend
            }
        }
    }, (err) => {
        resultObj.err = err;
    }).catch((err) => {
        resultObj.err = err;
    });
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

exports.addNewFriend = async (data) => {
    let resultObj = {};
    await mongo_chat.updateNewFriend(data);
    return resultObj
};



