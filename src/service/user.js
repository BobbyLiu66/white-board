const mongo_chat = require('../persistance/mongo_chat');
//TODO
let resultObj = {};

exports.checkUser = (username,password)=>{
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
    return mongo_chat.checkRoomName(roomName,username).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.err = result.errmsg
        }
        else {
            resultObj.message = result.message
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        resultObj.state = false;
        return resultObj
    })
};

exports.checkFriend = (username)=>{
    return mongo_chat.checkUsername(username).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.message = "Invite success"
        }
        else {
            resultObj.err = "Nick name did not exist"
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        resultObj.state = false;
        return resultObj
    })
};