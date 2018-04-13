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
//{ room name : {owner:owner,user:[users]}}
let rooms = {};


io.on('connection', function (socket) {
    //whiteboard
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

    //chat room
    let addedUser = false;
    //TODO
    socket.on('create room', function (data) {
        rooms[data.roomName] = {owner: data.owner};
        socket.join(data.roomName);
        socket.to(data.roomName).boardcast.emit('create room', {
            roomName: data.roomName,
            owner: data.owner
        });
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        //TODO test
        messageHistory.push({
            username: socket.username,
            message: data
        });
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    //TODO username unique
    socket.on('add user', function (username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
        //TODO test
        socket.emit('load history', messageHistory,{numUsers:numUsers});
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
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});