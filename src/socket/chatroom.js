let app = require('../../app');
let http = require('http');
let _ = require('lodash');

let server = http.createServer(app);
const io = require('socket.io')(server);

let user_service = require('../service/user');

let messageHistory = [];
let imageHistory = {};
let users = {};

io.on('connection', function (socket) {
    //chat room
    let addedUser = false;
    socket.on('create room', async function (data) {
        let result = await user_service.checkRoom(data.roomName, data.owner);
        if (result.err) {
            socket.emit('create room fail', result);
            return
        }
        io.in(socket.roomName).emit('user left', {
            username: socket.username,
            otherRoom: true
        });
        socket.join(data.roomName);
        socket.leave(socket.roomName);
        socket.roomName = data.roomName;
        socket.emit('clear screen');
        //under the condition that join an existing room
        if(result.status === "Join"){
            //load message history
            if (messageHistory.length !== 0) {
                let sendHistory = _.filter(messageHistory, function (value) {
                    return value.roomName === socket.roomName
                });
                socket.emit('load history', sendHistory);
            }
            socket.emit('load image',{
                image:imageHistory[socket.roomName]
            })
        }
        io.in(socket.roomName).emit('create room', {
            roomName: data.roomName,
            owner: data.owner,
            message:result.message,
        });
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        //TODO save to redis
        messageHistory.push({
            username: socket.username,
            message: data,
            roomName: socket.roomName,
            messageTime: new Date()
        });
        io.in(socket.roomName).emit('new message', {
            username: socket.username,
            message: data
        })
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username, roomName = "default",image) {
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
            let sendHistory = _.filter(messageHistory, function (value) {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory);
        }
        //TODO add image
        socket.emit('load image',{
            image:imageHistory[socket.roomName]
        });

        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
        });

        socket.emit('user joined', {
            username: "you",
            roomName: socket.roomName
        })
    });


    socket.on('check user', async function (username, pwd,image) {
        let result = await user_service.checkUser(username, pwd);
        if (result.err) {
            socket.emit('login fail', result);
            return
        }
        users[username] = socket.id;
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
            let sendHistory = _.filter(messageHistory, function (value) {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory);
        }
        socket.emit('load image',{
            image:imageHistory[socket.roomName]
        })

        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
        });

        socket.emit('user joined', {
            username: "you",
            roomName: socket.roomName
        })
    });

    //invite other user to this room
    socket.on('invite user', async function (data) {
        let result = await user_service.checkFriend(data.inviteName);
        if (result.message) {
            io.in(users[data.inviteName]).emit('invite user', {
                username: data.username,
                roomName: socket.roomName,
                inviteName: data.inviteName
            });
            socket.emit('invite success', {
                inviteName: data.inviteName
            })
        }
        else {
            socket.emit('invite fail', result)
        }
    });


    socket.on('accept invite', function (data) {
        socket.leave(socket.roomName);
        user_service.updateRoomUser(data.roomName,data.username);
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
            let sendHistory = _.filter(messageHistory, function (value) {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory, socket.roomName);
        }
        socket.emit('load image',{
            image:imageHistory[socket.roomName]
        })
    });


    socket.on('decline invite', function (data) {
        socket.broadcast.to(users[data.username]).emit('decline invite', {
            username: data.inviteUser
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.to(socket.roomName).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.to(socket.roomName).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            // echo globally that this client has left
            user_service.updateUserStatus(socket.username, "logout");
            io.in(socket.roomName).emit('user left', {
                username: socket.username,
            });
        }
    });



    //whiteboard
    socket.on('drawing', (data) =>  {
        imageHistory[socket.roomName] = data.image;

        socket.to(socket.roomName).emit('drawing', data)
    });
});


module.exports = server;