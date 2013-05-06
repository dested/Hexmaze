function MazeClient(ui) {
    var self = this;
    self.players = [];
    self.currentPlayerID = null;
    self.currentPlayer = null;
    var client = io.connect('198.211.107.235:4484');


    client.on('MazeGame.PlayerLeft', function (data) {

    });
    client.on('MazeGame.PlayerWon', function (data1) {
        window.alert('Player ' + data1 + ' Won!');
        client = null;
    });
    window.setInterval(this.$flushMoveQueue, 500);
    var updates = [];
    client.on('MazeGame.PlayerPositionUpdates', function (data) {
        for (var i = 0; i < data.length; i++) {
            updates.push(data[i]);
        }
    });
    window.setInterval(function () {
        if (updates.length > 0) {
            var update = updates[0];
            ui.mazeBuilders[update.id].navigate(update.navigate);
            ui.draw();
            updates.shift();
        }
    }, 75);
    client.on('MazeGame.MazeData', function (mazeData) {
       ui. setupGame(players, currentPlayer, mazeData);
    });
    client.on('MazeGame.PlayerInfo', function (data) {
        for (var $t1 = 0; $t1 < data.length; $t1++) {

            if (data[$t1].id === self.currentPlayerID) {
                self.currentPlayer = data[$t1];
            }
        }
        self.players = data;
    });
    client.on('MazeGame.PlayerReflect', function (data) {
        self.currentPlayerID = data;
    });

}