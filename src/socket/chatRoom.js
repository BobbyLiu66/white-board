const io = require('../../bin/www');

let messageHistory = [];
let rooms = {};
let users = {};

io.on('connection', function (socket) {
    //chat room
    let addedUser = false;
    socket.on('create room', function (data) {
        io.in(socket.roomName).emit('user left', {
            username: socket.username,
            otherRoom: true
        });
        rooms[data.roomName] = {owner: data.owner};
        socket.join(data.roomName);
        socket.leave(socket.roomName);
        socket.roomName = data.roomName;

        io.in(socket.roomName).emit('create room', {
            roomName: data.roomName,
            owner: data.owner
        });
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        //TODO save message history to database. once server restart load history to RAM
        messageHistory.push({
            username: socket.username,
            message: data,
            roomName: socket.roomName,
            messageTime:new Date()
        });
        io.in(socket.roomName).emit('new message', {
            username: socket.username,
            message: data
        })
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', async function (username,roomName) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        //TODO save this into redis or just mongoDB?
        users[username] = socket.id;
        socket.username = username;
        socket.roomName = roomName ? roomName : "default";
        socket.join(socket.roomName);
        addedUser = true;
        socket.emit('login', {
            roomName: socket.roomName
        });
        //load message history
        if (messageHistory.length !== 0) {
            let sendHistory = _.filter(messageHistory,function (value) {
                return value.roomName === socket.roomName
            });
            socket.emit('load history', sendHistory);
        }

        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
        });

        socket.emit('user joined', {
            username: "you",
            roomName: socket.roomName
        })
    });

    //invite other user to this room
    socket.on('invite user', function (data) {
        io.in(users[data.inviteName]).emit('invite user', {
            username: data.username,
            roomName: socket.roomName
        })
    });

    socket.on('accept invite', function (data) {
        socket.leave(socket.roomName);
        //TODO
        rooms[data.roomName] = {user: data.username};
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
            socket.emit('load history', messageHistory, socket.roomName);
        }
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
            io.in(socket.roomName).emit('user left', {
                username: socket.username,
            });
        }
    });
});
