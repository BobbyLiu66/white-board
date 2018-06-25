import {
    checkUsername,
    inviteFriend,
    getAvatar,
    updateUserStatus,
    updateNewFriendStatus,
    updateNewFriend,
    updateFriend,
    updateHistoryMessage,
    getUserInformation,
    getHistoryMessage
} from '../persistance/mongo_chat';

export const checkUser = ({username, password, clientIp}) => {
    let resultObj = {};
    return checkUsername({username, password, clientIp}).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            resultObj = {...result}
        }
        return resultObj
    }, (err) => {
        resultObj.err = err;
        return resultObj
    })
};

export const checkFriend = ({inviteName}) => {
    const resultObj = {};
    return inviteFriend({inviteName}).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
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


export const getUserAvatar = (data) => {
    let resultObj = {};
    return getAvatar(data).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
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

export const updateUsersStatus = ({username, status}) => {
    updateUserStatus({username, status}).catch((err) => {
        console.log(err)
    })
};

export const updateNewFriendsStatus = (data) => {
    updateNewFriendStatus(data).catch((err) => {
        console.log(err)
    })
};

export const saveHistoryMessage = async (data) => {
    return await updateHistoryMessage(data).catch((err) => {
        console.log(err)
    })
};

export const getHistoryList = async (data) => {
    let resultObj = {};
    await getHistoryMessage(data).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
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


export const getFriendList = async (data) => {
    let resultObj = {friendList: [], message: []};
    await getUserInformation(data).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            if (result.friend) {
                resultObj.friendList = [...result.friend]
            }
        }
    }, (err) => {
        resultObj.err = err;
    }).catch((err) => {
        resultObj.err = err;
    });
    if (!Object.prototype.hasOwnProperty.call(resultObj, 'err')) {
        for (const friend of resultObj.friendList) {
            await getHistoryMessage({roomName: friend.roomName}).then((result) => {
                if (result !== null) {
                    if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
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

export const getNewFriendList = async (data) => {
    const resultObj = {newFriendList: []};
    await getUserInformation(data).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
            resultObj.err = result.errmsg
        }
        else {
            if (result.newFriend) {
                resultObj.newFriendList = [...result.newFriend]
            }
        }
    }, (err) => {
        resultObj.err = err;
    }).catch((err) => {
        resultObj.err = err;
    });
    return resultObj
};

export const addFriend = async (data) => {
    let resultObj = {};
    await updateFriend(data).then((result) => {
        if (Object.prototype.hasOwnProperty.call(result, 'errmsg')) {
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


export const addNewFriend = async (data) => {
    await updateNewFriend(data);
};



