﻿function MazeClient(updateContent) {
    var self = this;
    self.players = [];
    self.currentPlayerID = null;
    self.currentPlayer = null;
    var client = io.connect('198.211.107.235:3343');


    client.on('Game.PlayerLeft', function (data) {

    });
    client.on('Game.PlayerWon', function (data1) {
        window.alert('Player ' + data1 + ' Won!');
        client = null;
    });
    window.setInterval(this.$flushMoveQueue, 500);
    var updates = [];
    client.on('Game.UpdatePosition', function (data) {
        for (var i = 0; i < data.length; i++) {
            updates.push(data[i]);
        }
    });
    window.setInterval(function () {
        if (updates.length > 0) {
            var update = updates[0];
            for (var i = 0; i < self.players.length; i++) {
                if (self.players[i].userID == update.userID) {
                    self.players[i].x = update.x;
                    self.players[i].y = update.y;
                }
            }
            updateContent();
            updates.shift();
        }
    }, 75);
    client.on('Game.Started', function () {
        
    });

 /*   client.on('Game.MazeData', function (mazeData) {
       ui. setupGame(players, currentPlayer, mazeData);
    });*/
    client.on('Game.PlayerInfo', function (data) {
        for (var $t1 = 0; $t1 < data.length; $t1++) {

            if (data[$t1].userID === self.currentPlayerID) {
                self.currentPlayer = data[$t1];
            }
        }
        self.players = data;
    });
    client.on('Game.PlayerReflect', function (data) {
        self.currentPlayerID = data.userID;
    });
    this.updatePlayerPosition = function (x, y) {
        client.emit('Game.UpdatePosition', { x: x, y: y });
    };
}