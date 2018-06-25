import request from "request";

export const getIpInfo = (clientIp) => {
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: `http://ip-api.com/json/${clientIp}`,
        }, (error, response, body) => {
            if (error) reject(error);
            resolve(JSON.parse(body));
        });
    })
};


