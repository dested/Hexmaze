setInterval(function () {
    console.log('keep alive ' + (new Date()).toString().substr(17, 24));
}, 10000);
var http = require('http');
var app = http.createServer(function (req, res) {
    res.end();
});
var io = require('socket.io').listen(app);
var fs = require('fs');
app.listen(2222);
io.set('log level', 0);
var server = new HexmazeServer();
var count = 0;
    console.log('started' );

io.sockets.on('connection', function (socket) {
    var userID = count++;
    console.log('User Joined ' + userID);
    server.addPlayer(userID, socket);
    socket.on('Game.UpdatePosition', function (moveData) {
        server.movePlayer(userID, moveData);
    });
    socket.on('WaitingRoom.VoteStart', function (vote) {
        server.playerVoted(userID, vote);
    });
    socket.on('disconnect', function () {
        console.log('User Left ' + userID);
        server.removePlayer(userID);
    });
});

var MazeGenerator=require('./hexmazeServer.js').MazeGenerator;

function HexmazeServer() {
    var gameRooms = [];

    this.movePlayer = function (_userID, _moveData) {
        _moveData.userID = _userID;
        for (var i = 0; i < gameRooms.length; i++) {
            if (gameRooms[i].started) {
                for (var j = 0; j < gameRooms[i].players.length; j++) {
                    if (gameRooms[i].players[j].userID == _userID) {
                        gameRooms[i].movePlayer(gameRooms[i].players[j], _moveData);
                        return;
                    }
                }
            }
        }
    };
    this.removePlayer = function (_userID) {
        for (var i = 0; i < gameRooms.length; i++) {
                for (var j = 0; j < gameRooms[i].players.length; j++) {
                    if (gameRooms[i].players[j].userID == _userID) {
                        console.log('removing player: ' + _userID);
                        gameRooms[i].removePlayer(gameRooms[i].players[j]);
                        if (gameRooms[i].players.length == 0) {
                            gameRooms.splice(i, 1);
                            console.log('game removed, games open: ' + gameRooms.length);
                        }
                        return;
                    }
                }
        }

    };
    this.playerVoted = function (_userID, _vote) {
        for (var i = 0; i < gameRooms.length; i++) {
                for (var j = 0; j < gameRooms[i].players.length; j++) {
                    if (gameRooms[i].players[j].userID == _userID) {
                        gameRooms[i].playerVoted(gameRooms[i].players[j], _vote);
                        return;
                    }

            }
        }
    };
    this.addPlayer = function (_userID, _socket) {
        var player = new Player(_userID, _socket);
        for (var i = 0; i < gameRooms.length; i++) {
            if (!gameRooms[i].started && gameRooms[i].players.length < 6) {
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

        var playersData = self.players.map(function (p) { return { userID: p.userID, x: 0, y: 0 ,moveToX:0,moveToY:0}; });

        var playersVoted = 0;
        for (var i = 0; i < self.players.length; i++) {
            playersVoted += (self.players[i].votedToStart ? 1 : 0);
        }


        for (var i = 0; i < self.players.length; i++) {
            self.players[i].sendMessage('Game.PlayerInfo', playersData);
            self.players[i].sendMessage('WaitingRoom.PlayerCountChanged', self.players.length);
            self.players[i].sendMessage('WaitingRoom.VoteStartChanged', playersVoted);
        }

        if (self.players.length == playersVoted) {
            self.started = true;
            self.startGame();

        }

    };
    self.playerVoted = function(player, voteStatus) {

        player.votedToStart = voteStatus;

        var playersVoted = 0;
        for (var i = 0; i < self.players.length; i++) {
            playersVoted += (self.players[i].votedToStart ? 1 : 0);
        }


        for (var i = 0; i < self.players.length; i++) {
            self.players[i].sendMessage('WaitingRoom.PlayerCountChanged', self.players.length);
            self.players[i].sendMessage('WaitingRoom.VoteStartChanged', playersVoted);
        }

        if (self.players.length == playersVoted) {
            self.started = true;
            self.startGame();

        }

    };
    self.removePlayer = function (player) {
        console.log('player remvoed: ' + self.players.indexOf(player));

        self.players.splice(self.players.indexOf(player), 1);

        console.log('players left: ' + self.players.length);


        var playersVoted = 0;
        for (var i = 0; i < self.players.length; i++) {
            playersVoted += (self.players[i].votedToStart ? 1 : 0);
        }


        for (var i = 0; i < self.players.length; i++) {
            self.players[i].sendMessage('WaitingRoom.PlayerCountChanged', self.players.length);
            self.players[i].sendMessage('WaitingRoom.VoteStartChanged', playersVoted);
        }

        if (self.players.length == playersVoted) {
            self.started = true;
            self.startGame();

        }

    };
    self.startGame = function () {
        
        var maze = new MazeGenerator(20, 10);

        for (var i = 0; i < self.players.length; i++) {
            self.players[i].sendMessage('WaitingRoom.GameBeginning');
            self.players[i].sendMessage('Game.Started', maze); 
        }

        startGameTick();
    };
    var gameTick=0;
    function startGameTick(){
        //gametick
        setInterval(function(){
            gameTick++;
            //serverTick();
if(gameTick % 30){
    for (var i = 0; i < self.players.length; i++) {
        self.players[i].sendMessage('Game.UpdateTick', {tick:gameTick});
    }
}
        },1000/10);
    }

    self.movePlayer = function (player, moveData) {

        //player.position.x = moveData.x;
        //player.position.y = moveData.y;
        
        var sendData = {
            userID: player.userID,
            tick:gameTick+2,
            x: moveData.x,
            y: moveData.y
        };
        
        for (var i = 0; i < self.players.length; i++) {
            if (self.players[i].userID !== player.userID) {
                console.log('sending position: ' + self.players[i].userID+' at tick: '+gameTick);

                
                self.players[i].sendMessage('Game.UpdatePosition', [sendData]);
            }
        }
    };
}
function Player(userID, _socket) {
    this.userID = userID;
    this.position = { x: 0, y: 0 };
    this.votedToStart = false;
    this.sendMessage = function (msg, data) {
        _socket.emit(msg, data);
    };
}