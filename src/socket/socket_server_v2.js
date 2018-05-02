let app = require('../../app');
let http = require('http');
let _ = require('lodash');

let server = http.createServer(app);
const io = require('socket.io')(server);

let user_service = require('../service/user');

let messageHistory = [];
let imageHistory = {};
let users = {};

let acceptedNum = {};
let accept = {};
let total = {};

io.on('connection', (socket) => {
    socket.on('USER_LOGIN', async (data) => {
        const result = await user_service.checkUser(data.nickname, data.password);
        result.err ? socket.emit('REQUEST_RESULT', result) : socket.emit('REQUEST_RESULT', data)

    });
    socket.on('FRIEND_LIST', async (data) => {
        const result = await user_service.getFriendList(data);
        (!result.err && result.roomName.length > 0) && socket.join(result.roomName);
        socket.emit('FRIEND_LIST', result);
    });

    socket.on('LOAD_HISTORY',async (data) => {
        const result = await user_service.getHistoryMessage(data);
        socket.emit('LOAD_HISTORY', result);
    })
});

module.exports = server;
