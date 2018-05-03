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

        if (result.err) {
            socket.emit('REQUEST_RESULT', result)
        } else {
            socket.emit('REQUEST_RESULT', data);
            socket.id = data.nickname
        }
    });

    socket.on('FRIEND_LIST', async (data) => {
        const result = await user_service.getFriendList(data);
        socket.emit('FRIEND_LIST', result);
    });

    socket.on('LOAD_HISTORY', async (data) => {
        const result = await user_service.getHistoryMessage(data);
        socket.emit('LOAD_HISTORY', result);
    });

    socket.on('NEW_MESSAGE', (data) => {
        user_service.saveHistoryMessage(data);
        socket.broadcast.to(data.friendName).emit('NEW_MESSAGE', data);
    });

    //TODO check this
    socket.on('ADD_FRIEND', async (data) => {
        const result = await user_service.checkFriend(data.inviteName);
        if(result.message){
            socket.broadcast.to(data.inviteName).emit('ADD_FRIEND', {data});
        }
        else {
            socket.emit('ADD_FRIEND_RESULT',result)
        }
    });

});

module.exports = server;
