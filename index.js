// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
const io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

let numUsers = 0;
let messageHistory = [];
let rooms = {};
let users = {};

io.on('connection', function (socket) {
    //whiteboard
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    //chat room
    let addedUser = false;
    socket.on('create room', function (data) {
        io.in(socket.roomName).emit('user left', {
            username: socket.username,
            numUsers: numUsers,
            otherRoom:true
        });
        rooms[data.roomName] = {owner: data.owner};
        socket.join(data.roomName);
        //TODO send directly to the active room instead of leave it
        socket.leave(socket.roomName);
        //TODO multiple rooms
        socket.roomName = data.roomName;

        io.in(socket.roomName).emit('create room', {
            roomName: data.roomName,
            owner: data.owner
        });
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        messageHistory.push({
            username: socket.username,
            message: data
        });
        //TODO bugs default could send message to private room
        console.log(socket.roomName);
        io.in(socket.roomName).emit('new message', {
            username: socket.username,
            message: data
        })
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        //TODO save this into redis or just mongoDB?
        users[username] = socket.id;
        socket.username = username;
        socket.roomName = "default";
        socket.join("default");
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers,
            roomName: socket.roomName
        });
        //load message history
        if(messageHistory.length !== 0) {
            socket.emit('load history', messageHistory, {numUsers: numUsers});
        }

        socket.broadcast.to(socket.roomName).emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    //invite other user to this room
    socket.on('invite user',function (data) {
        io.in(users[data.inviteName]).emit('invite user', {
            //TODO username wrong
            username: data.username,
            roomName: socket.roomName
        })
    });
    
    socket.on('accept invite',function (data) {
        io.in(socket.roomName).emit('user left', {
            username: socket.username,
            numUsers: numUsers,
            otherRoom:true
        });
        rooms[data.roomName] = {user: data.owner};
        socket.join(data.roomName);
        //TODO multiple rooms
        socket.roomName = data.roomName;
    });
    
    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            io.in(socket.roomName).emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});