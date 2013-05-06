setInterval(function () {
    console.log('keep alive ' + (new Date()).toString().substr(17, 24));
}, 10000);
var http = require('http');
var app = http.createServer(function (req, res) {
    res.end();
});
var io = require('socket.io').listen(app);
var fs = require('fs');
app.listen(3343);
io.set('log level', 0);
var server = new HexmazeServer();
var count = 0;
io.sockets.on('connection', function (socket) {
    var userID = count++;
    console.log('User Joined ' + userID);
    server.addPlayer(userID, socket);
    socket.on('Game.UpdatePosition', function (moveData) {
        server.movePlayer(userID, moveData);
    });
    socket.on('disconnect', function () {
        console.log('User Left ' + userID);
        server.removePlayer(userID);
    });
});

var CommunicationLayer = function() {

};
function HexmazeServer() {
    var gameRooms = [];

    this.movePlayer = function (_userID, _moveData) {
        _moveData.userID = _userID;
        for (var i = 0; i < gameRooms.length; i++) {
            if (gameRooms[i].started) {
                for (var j = 0; j < gameRooms[i].players.length; j++) {
                    if (gameRooms[i].players[j].userID == _userID) {
                        gameRooms[i].movePlayer(gameRooms[i].players[j], _moveData);
                    }
                }
            }
        }
    };
    this.removePlayer = function (_userID) {

    };
    this.changeVoteStart = function (_userID, _vote) {

    };
    this.addPlayer = function (_userID, _socket) {
        var player = new Player(_userID, _socket);
        for (var i = 0; i < gameRooms.length; i++) {
            if (!gameRooms[i].started && gameRooms[i].players.length < 2) {
                console.log('adding player to room: ' + gameRooms[i].id + ' user: ' + player.userID);
                gameRooms[i].addPlayer(player);
                return;
            }
        }
        var room;
        gameRooms.push(room = new GameRoom());
        room.addPlayer(player);
    };
};
var gameRooms = 0;
function GameRoom() {
    var self = this;
    self.id = gameRooms++;
    self.players = [];
    self.started = false;
    self.addPlayer = function (player) {
        player.sendMessage('Game.PlayerReflect', { userID: player.userID });

        self.players.push(player);

        var playersData = self.players.map(function (p) { return { userID: p.userID,x:0,y:0 }; });

        for (var i = 0; i < self.players.length; i++) {
            self.players[i].sendMessage('Game.PlayerInfo', playersData);
        }

        if (self.players.length == 2) {
            self.started = true;
            self.startGame();
            
        }

    };
    self.startGame = function () {
        //todo generate maze
        for (var i = 0; i < self.players.length; i++) {
            self.players[i].sendMessage('Game.Started'); //todo probably send maze data here too
        }
    };
    self.movePlayer = function (player, moveData) {


        player.position.x = moveData.x;
        player.position.y = moveData.y;
        
        var sendData = {
            userID: player.userID,
            x: player.position.x,
            y: player.position.y
        };
        
        for (var i = 0; i < self.players.length; i++) {
            if (self.players[i].userID !== player.userID) {
                console.log('sending position: ' + self.players[i].userID);

                
                self.players[i].sendMessage('Game.UpdatePosition', [sendData]);
            }
        }
    };
}
function Player(userID, _socket) {
    this.userID = userID;
    this.position = { x: 0, y: 0 };
    this.sendMessage = function (msg, data) {
        _socket.emit(msg, data);
    };
}