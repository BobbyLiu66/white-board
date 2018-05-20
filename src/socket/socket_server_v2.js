let app = require('../../app');
let http = require('http');
let server = http.createServer(app);
const io = require('socket.io')(server);
const requestIp = require('request-ip');

let user_service = require('../service/user');

io.on('connection', (socket) => {
    socket.on('USER_LOGIN', async (data) => {
        const clientIp = requestIp.getClientIp(socket.request);
        const result = await user_service.checkUser(data.nickname, data.password,clientIp);
        if (result.err) {
            socket.emit('REQUEST_RESULT', result)
        } else {
            socket.join(data.nickname);
            socket.emit('REQUEST_RESULT', data);
        }
    });

    socket.on('FRIEND_LIST', async (data) => {
        socket.join(data.nickname);
        const result = await user_service.getFriendList(data);
        socket.emit('FRIEND_LIST', result);
    });

    socket.on('LOAD_HISTORY', async (data) => {
        const result = await user_service.getHistoryMessage(data);
        socket.emit('LOAD_HISTORY', result, data);
    });

    socket.on('NEW_MESSAGE', async (data) => {
        const result = await user_service.saveHistoryMessage(data);
        const nickname = result.member.filter((name) => {
            return name !== data.speaker
        });
        socket.broadcast.to(nickname[0]).emit('NEW_MESSAGE', data);
    });

    socket.on('ADD_FRIEND', async (data) => {
        //TODO limit submit time
        const result = await user_service.checkFriend(data.inviteName);
        if (result.message) {
            socket.emit('ADD_FRIEND_RESULT', data);
            socket.broadcast.to(data.inviteName).emit('ADD_FRIEND_REQUEST', data);
        }
        else {
            socket.emit('ADD_FRIEND_RESULT', result)
        }
    });

    socket.on('ADD_FRIEND_SUCCESS', async (data) => {
        const result = await user_service.addFriend(data);
        await user_service.saveHistoryMessage({
            roomName: result.roomName,
            speaker: null,
            messageTime: new Date(),
            messageContent: "You two have already been to friend, start chat here"
        }, [data.nickname, data.inviteName]);
        const friendList = await user_service.getFriendList(data);
        socket.broadcast.to(data.nickname).emit('ADD_FRIEND_SUCCESS', friendList,data.inviteName);
        socket.emit('ADD_FRIEND_SUCCESS', friendList,data.nickname)
    });

    socket.on('RECONNECT', (data) => {
        socket.join(data.nickname);
    })

});

module.exports = server;
