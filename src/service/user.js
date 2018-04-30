const mongo_chat = require('../persistance/mongo_chat');

exports.checkUser = (username,password)=>{
    let resultObj = {};
    return mongo_chat.checkUsername(username,password).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        return resultObj
    })
};

exports.checkRoom = (roomName,username) => {
    let resultObj = {};
    return mongo_chat.checkRoomName(roomName,username).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message;
            resultObj.status = result.status
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        return resultObj
    })
};

exports.checkFriend = (inviteName)=>{
    let resultObj = {};
    return mongo_chat.inviteFriend(inviteName).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        return resultObj
    })
};

exports.updateUserStatus = (username,status) =>{
    mongo_chat.updateUserStatus(username,status).catch((err)=>{console.log(err)})
};

exports.updateRoomUser = (roomName,username) =>{
    mongo_chat.updateRoomUser(roomName,username).catch((err)=>{console.log(err)})
};
//TODO save to redis
exports.saveHistoryMessage = (data)=>{
    mongo_chat.updateHistoryMessage(data).catch((err)=>{console.log(err)})
};

exports.getHistoryMessage = (data)=>{
    mongo_chat.getHistoryMessage(data).catch((err)=>{console.log(err)})
};
//TODO test this method
exports.findOnlineNum = (roomName) =>{
    let resultObj = {};
    return mongo_chat.countAcceptedNum(roomName).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        return resultObj
    })
};
