setInterval(function () {
    console.log('keep alive ' + (new Date()).toString().substr(17, 24));
}, 10000);
var http = require('http');
var app = http.createServer(function (req, res) {
    res.end();
});
var io = require('socket.io').listen(app);
var fs = require('fs');
app.listen(4484);
io.set('log level', 0);
var server = new HexmazeServer();
var count = 0;
io.sockets.on('connection', function (socket) {
    var userID = count++;
    console.log('User Joined ' + userID);
    server.addPlayer(userID, socket.emit);
    socket.on('WaitingRoom.VoteStart', function (vote) {
        server.changeVoteStart(userID, vote);
    });
    socket.on('GameRoom.PlayerMoves', function (moveData) {
        server.movePlayer(userID, moveData);
    });
    socket.on('disconnect', function () {
        console.log('User Left ' + userID);
        server.removePlayer(userID);
    });
});

var HexmazeServer = function () {
    this.movePlayer = function (_userID, _moveData) { 
    
    };
    this.removePlayer = function (_userID) { 
    
    };
    this.changeVoteStart = function (_userID, _vote) { 
        
    };
    this.addPlayer = function (_userID, _emit) { 
    
    };
};
