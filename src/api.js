const request = require("request");

exports.getIpInfo = (clientIp)=>{
    return new Promise((resolve, reject)=>{
        request({
            method: 'GET',
            url: `http://ip-api.com/json/${clientIp}`,
        }, function (error, response, body) {
            if (error) reject(error);
            resolve(body);
        });
    })
};


