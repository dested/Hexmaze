function MazeGenerator(xsize_maze, ysize_maze) {
    // creates a maze of dimensions xsize_Maze and ysize_maze.
    // notice that the usable area is xsize_maze-2 by ysize_maze-2 since there is a padding of 1 cell.
    // also, even columns are shorter by 1 cell.

    var maze_in = [];
    var maze_prev = [];
    var maze_wall = [[], [], []]; // up, leftup, leftdown
    var padding = 1;
    var q = [[[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]], [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]];

    for (var x = 0; x < xsize_maze; x++) {
        maze_in[x] = [];
        maze_prev[x] = [];
        maze_wall[0][x] = [];
        maze_wall[1][x] = [];
        maze_wall[2][x] = [];
        for (var y = 0, yy = ysize_maze - x % 2; y < yy; y++) {
            maze_in[x][y] = (x < padding || x >= xsize_maze - padding || y < padding || y >= ysize_maze - x % 2 - padding);
            maze_wall[0][x][y] = 1;
            maze_wall[1][x][y] = 1;
            maze_wall[2][x][y] = 1;
        }
    }

    function dfs() {
        var xcur = Math.floor(Math.random() * (xsize_maze - 4)) + 2, ycur = Math.floor(Math.random() * (ysize_maze - 5)) + 2;
        xcur = Math.floor(Math.random() * (xsize_maze - 4)) + 2;
        ycur = Math.floor(Math.random() * (ysize_maze - 5)) + 2;
        maze_prev[xcur][ycur] = [xcur, ycur];
        var qwerqwer = 0;
        do {
            maze_in[xcur][ycur] = true;
            var neighbours = [];
            for (p = 0; p < 6; p++) {
                if (!maze_in[xcur + q[xcur % 2][p][0]][ycur + q[xcur % 2][p][1]]) {
                    neighbours.push(q[xcur % 2][p]);
                }
            }
            while (neighbours.length === 0) {
                if (maze_prev[xcur][ycur][0] === xcur && maze_prev[xcur][ycur][1] === ycur) return;
                var _xcur = maze_prev[xcur][ycur][0];
                ycur = maze_prev[xcur][ycur][1];
                xcur = _xcur;
                neighbours = [];
                for (p = 0; p < 6; p++) {
                    if (!maze_in[xcur + q[xcur % 2][p][0]][ycur + q[xcur % 2][p][1]]) {
                        neighbours.push(q[xcur % 2][p]);
                    }
                }
            }
            var z = neighbours[Math.floor(Math.random() * neighbours.length)];
            if (z[0] === -1) {
                if (xcur % 2 === 0) {
                    if (z[1] === -1) {
                        maze_wall[1][xcur][ycur] = 0;
                    } else {
                        maze_wall[2][xcur][ycur] = 0;
                    }
                } else {
                    if (z[1] === 0) {
                        maze_wall[1][xcur][ycur] = 0;
                    } else {
                        maze_wall[2][xcur][ycur] = 0;
                    }
                }
            } else if (z[0] === 0) {
                if (z[1] === -1) {
                    maze_wall[0][xcur][ycur] = 0;
                } else {
                    maze_wall[0][xcur][ycur + 1] = 0;
                }
            } else {
                if (xcur % 2 === 0) {
                    if (z[1] === -1) {
                        maze_wall[2][xcur + 1][ycur - 1] = 0;
                    } else {
                        maze_wall[1][xcur + 1][ycur] = 0;
                    }
                } else {
                    if (z[1] === 0) {
                        maze_wall[2][xcur + 1][ycur] = 0;
                    } else {
                        maze_wall[1][xcur + 1][ycur + 1] = 0;
                    }
                }
            }
            maze_prev[xcur + z[0]][ycur + z[1]] = [xcur, ycur];
            xcur += z[0];
            ycur += z[1];
        } while (!(maze_prev[xcur][ycur][0] === xcur && maze_prev[xcur][ycur][1] === ycur));
    };

    dfs();

    return {maze_in:maze_in, maze_wall:maze_wall, maze_prev:maze_prev};
};

exports.MazeGenerator=MazeGenerator;
