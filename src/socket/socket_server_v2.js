import app from '../../app'
import {getClientIp} from 'request-ip';
import {
    checkUser,
    getFriendList,
    getNewFriendList,
    getHistoryList,
    saveHistoryMessage,
    checkFriend,
    addNewFriend,
    updateNewFriendsStatus,
    addFriend,
} from '../service/user';
import s3 from '../s3';

const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('USER_LOGIN', async (data) => {
        const clientIp = getClientIp(socket.request);
        const result = await checkUser({...data, clientIp});
        if (Object.prototype.hasOwnProperty.call(result, 'err')) {
            socket.emit('REQUEST_RESULT', result)
        } else {
            socket.join(data.nickname);
            socket.emit('REQUEST_RESULT', {...data, avatar: result.avatar});
        }
    });

    socket.on('FRIEND_LIST', async (data) => {
        socket.join(data.nickname);
        const result = await getFriendList(data);
        socket.emit('FRIEND_LIST', result);
    });

    socket.on('NEW_FRIEND_LIST', async (data) => {
        const result = await getNewFriendList(data);
        socket.emit('LOAD_FRIEND_LIST', result);
    });

    socket.on('LOAD_HISTORY', async (data) => {
        const result = await getHistoryList(data);
        //FIXME
        socket.emit('LOAD_HISTORY', result, data);
    });

    socket.on('NEW_MESSAGE', async (data) => {
        const result = await saveHistoryMessage(data);
        const {nickname} = result.member.filter((name) => {
            return name !== data.speaker
        });
        socket.broadcast.to(nickname).emit('NEW_MESSAGE', data);
    });

    socket.on('ADD_FRIEND', async (data) => {
        const result = await checkFriend(data);
        if (Object.prototype.hasOwnProperty.call(result, 'message')) {
            socket.emit('ADD_FRIEND_RESULT', data);
            const res = await addNewFriend(data);
            if (!Object.prototype.hasOwnProperty.call(res, 'err'))
                socket.broadcast.to(data.inviteName).emit('ADD_FRIEND_REQUEST', data);
        } else {
            socket.emit('ADD_FRIEND_RESULT', result)
        }
    });

    socket.on('ADD_FRIEND_SUCCESS', async (data) => {
        await updateNewFriendsStatus(data);
        const result = await addFriend(data);
        //FIXME
        await saveHistoryMessage({
            roomName: result.roomName,
            speaker: null,
            messageTime: new Date(),
            messageContent: "You two have already been to friend"
        }, [data.nickname, data.inviteName]);
        const friendList = await getFriendList(data);
        //FIXME
        socket.broadcast.to(data.nickname).emit('ADD_FRIEND_SUCCESS', friendList, data.inviteName);
        //FIXME
        socket.emit('ADD_FRIEND_SUCCESS', friendList, data.nickname)
    });

    socket.on('AVATAR', (data) => {
        s3.uploadPhoto(data).then((result) => {
            socket.emit("AVATAR", result)
        });
    });

    socket.on('RECONNECT', (data) => {
        socket.join(data.nickname);
    })
});

module.exports = server;
