const io = require('../../bin/www');

io.on('connection', (socket) => {
//whiteboard
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
});