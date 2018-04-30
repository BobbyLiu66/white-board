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

io.on('connection',  (socket) => {
    //chat room
    let addedUser = false;
    //TODO antiquate
    socket.on('create room', async (data) => {
        let result = await user_service.checkRoom(data.roomName, data.owner);
        if (result.err) {
            // fail
            socket.emit('request result', result);
            return
        }
        // success
        socket.emit('request result');
        // io.in(socket.roomName).emit('user left', {
        //     username: socket.username,
        //     otherRoom: true
        // });
        socket.join(data.roomName);
        socket.leave(socket.roomName);
        socket.roomName = data.roomName;
        socket.emit('clear screen');
        //under the condition that join an existing room
        if (result.status === "Join") {
            //load message history
            if (messageHistory.length !== 0) {
                let sendHistory = _.filter(messageHistory, (value) => {
                    return value.roomName === socket.roomName
                });
                socket.emit('load history', sendHistory);
            }
            socket.emit('load image', {
                roomName: socket.roomName,
                image: imageHistory[socket.roomName]
            })
        }
        io.in(socket.roomName).emit('create room', {
            roomName: data.roomName,
            owner: data.owner,
            message: result.message,
        });
    });

    // send new message to client
    socket.on('new message', (data) => {
        //TODO save to redis
        user_service.saveHistoryMessage({
            username: data.username,
            messageContent: data.messageContent,
            roomName: socket.activeRoom,
            messageTime: data.username
        });
        socket.broadcast.to(socket.activeRoom).emit('new message', data);
    });

    // sign in user
    socket.on('add user', (username, roomName = "default") => {
        if (addedUser) return;
        // we store the username in the socket session for this client
        users[username] = socket.id;
        socket.username = username;
        socket.roomName = roomName;
        socket.join(socket.roomName);
        addedUser = true;
        socket.emit('login', {
            username: username,
            roomName: socket.roomName
        });
        user_service.updateUserStatus(username, "login");
        //load message history
        if (messageHistory.length !== 0) {
            let sendHistory = _.filter(messageHistory, (value) => {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory);
        }

        socket.emit('load image', {
            roomName:socket.roomName,
            image: imageHistory[socket.roomName]
        });

        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
        });

        socket.emit('user joined', {
            username: "you",
            roomName: socket.roomName
        })
    });

    // login method
    socket.on('check user', async (username, pwd) => {
        let result = await user_service.checkUser(username, pwd);
        if (result.err) {
            // fail
            socket.emit('request result', result);
            return
        }
        //success
        socket.emit('request result');
        //TODO
        socket.username = username;
        socket.roomName = "default";
        socket.join(socket.roomName);
        addedUser = true;
        socket.emit('login', {
            roomName: socket.roomName,
            username: username
        });
        user_service.updateUserStatus(username, "login");

        //load message history
        if (messageHistory.length !== 0) {
            let sendHistory = _.filter(messageHistory, (value) => {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory);
        }
        socket.emit('load image', {
            roomName:socket.roomName,
            image: imageHistory[socket.roomName]
        });

        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
        });

        socket.emit('user joined', {
            username: "you",
            roomName: socket.roomName
        })
    });

    socket.on('user login', async (data) => {
        let result = await user_service.checkUser(data.nickname, data.password);
        if (result.err) {
            // fail
            socket.emit('request result', result);
            return
        }
        //success
        socket.emit('request result',data);
        socket.username = username;
        user_service.updateUserStatus(username, "login");
        //TODO select friend from database
        socket.emit('load friend list',{

        });
    });

    // socket.on('load history',(data)=>{
    //     //load message history
    //     if (messageHistory.length !== 0) {
    //         let sendHistory = _.filter(messageHistory, (value) => {
    //             return value.roomName === socket.roomName
    //         });
    //         socket.emit('load history', sendHistory);
    //     }
    //     socket.emit('load image', {
    //         roomName:socket.roomName,
    //         image: imageHistory[socket.roomName]
    //     });
    // })
    socket.on('load history',async (data)=>{
        socket.activeRoom = data.roomName;
        const chatHistory = await user_service.getHistoryMessage(data);
        socket.emit('load history', chatHistory);
    });

    //invite other user to this room
    socket.on('invite user', async (data) => {
        let result = await user_service.checkFriend(data.inviteName);
        if (result.message) {
            io.in(users[data.inviteName]).emit('invite user', {
                username: data.username,
                roomName: socket.roomName,
                inviteName: data.inviteName
            });
            // success
            socket.emit('request result', {
                inviteName: data.inviteName
            })
        }
        else {
            // fail
            socket.emit('request result', result)
        }
    });

    // accept room owner's invitation
    socket.on('accept invite', (data) => {
        socket.leave(socket.roomName);
        user_service.updateRoomUser(data.roomName, data.username);
        socket.join(data.roomName);
        socket.roomName = data.roomName;
        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
        });
        socket.emit('user joined', {
            username: "you",
            roomName: data.roomName
        });
        if (messageHistory.length !== 0) {
            let sendHistory = _.filter(messageHistory, (value) => {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory, socket.roomName);
        }
        socket.emit('load image', {
            roomName:socket.roomName,
            image: imageHistory[socket.roomName]
        })
    });

    // decline room owner's invitation
    socket.on('decline invite', (data) => {
        socket.broadcast.to(users[data.username]).emit('decline invite', {
            username: data.inviteUser
        });
    });

    // broadcast user typing status
    socket.on('typing', () => {
        socket.broadcast.to(socket.roomName).emit('typing', {
            username: socket.username
        });
    });

    // broadcast user stop typing status
    socket.on('stop typing', () => {
        socket.broadcast.to(socket.roomName).emit('stop typing', {
            username: socket.username
        });
    });

    // logout user
    socket.on('disconnect', () => {
        if (addedUser) {
            // echo globally that this client has left
            user_service.updateUserStatus(socket.username, "logout");
            // io.in(socket.roomName).emit('user left', {
            //     username: socket.username,
            // });
        }
    });




    // whiteboard
    socket.on('drawing', (data,image) => {
        if(socket.roomName !== "default"){
            imageHistory[socket.roomName] = image;
            socket.to(socket.roomName).emit('drawing', data)
        }
        else {
            socket.emit('drawing',data)
        }
    });

    // clear area request
    socket.on('clear area', async () => {
        if(socket.roomName === "default"){
            //clear screen
            socket.emit('clear whiteboard screen');
        }
        else {
            let result = await user_service.findOnlineNum(socket.roomName);
            if (result.message) {
                acceptedNum[socket.roomName] = result.message;
                //TODO implement send message to each user in front end
                socket.broadcast.to(socket.roomName).emit('clear area', {
                    sponsor: socket.username
                })
            }
            else {
                socket.emit('invite fail', result.err)
            }
        }
    });

    // accept clear whiteboard request
    socket.on('accept clear', (data) => {
        if (accept.hasOwnProperty(socket.roomName)) {
            accept[socket.roomName]++;
        }
        if (total.hasOwnProperty(socket.roomName)){
            total[socket.roomName]++;
        }
        else {
            accept[socket.roomName] = 1;
            total[socket.roomName] = 0;
        }

        socket.broadcast.to(users[data.sponsor]).emit('accept clear', {
            username: socket.username,
            sponsor: data.sponsor,
            roomName:socket.roomName
        });
        if ((acceptedNum[socket.roomName] - 1) / 2 <= accept[socket.roomName]) {
            io.in(socket.roomName).emit('clear success');
        }
    });

    // decline clear whiteboard request
    socket.on('decline clear', (data) => {
        socket.broadcast.to(users[data.sponsor]).emit('decline clear', {
            username: socket.username,
            sponsor: data.sponsor,
            roomName:socket.roomName
        });
        if (total.hasOwnProperty(socket.roomName)) {
            total[socket.roomName]++;
        }
        else {
            total[socket.roomName]++;
        }
        if(total[socket.roomName] === acceptedNum[socket.roomName]){
            io.in(socket.roomName).emit('clear fail');
        }
    });
});

module.exports = server;
