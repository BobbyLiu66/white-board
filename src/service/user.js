const mongo_chat = require('../persistance/mongo_chat');

let resultObj = {
    message: null,
    err: null,
    status:true
};

exports.checkUser = (username,password)=>{
    mongo_chat.checkUsername(username,password).then((result)=>{
        if(result.hasOwnProperty('errmsg')){
            resultObj.message = "This nick name has been used"
        }
        else {
            resultObj.message = "Login success"
        }
        return resultObj
    },(err)=>{
        resultObj.err = err;
        resultObj.status = false;
        return resultObj
    })
};