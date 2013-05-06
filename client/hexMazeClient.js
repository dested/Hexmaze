function MazeClient(updateContent) {
    var self = this;
    self.players = [];
    self.currentPlayerID = null;
    self.currentPlayer = null;
    var client = io.connect('192.168.1.68:3343');


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
    client.on('Game.Started', function (data) {
        if(data !== undefined) {
            Maze.xsize = data.maze_in.length;
            Maze.ysize = data.maze_in[0].length;
            Maze.in = clone(data.maze_in);
            Maze.prev = clone(data.maze_prev);
            Maze.wall = clone(data.maze_wall);
            Maze.xsize = Maze.in.length;
            Maze.ysize = Maze.in[0].length;
            for(var x=0; x<Maze.xsize; x++) {
                Maze.sol[x] = [];
                for(var y=0; y<Maze.ysize; y++) {
                    Maze.sol[x][y] = 0;
                }
            }
            polygonize();
            updateContent();
        }
        console.log(Maze);
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