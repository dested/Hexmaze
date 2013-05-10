window.mazeClient = new MazeClient(updateContent,gameTick);

var changed, v, started = false;;

function updateContent() {
    changed = true;
};

/* GEO
                                  ^ sy   ^  ^
                <------ dx ------>V      |  |
                         /--------\      |  |
                        /          \     |  |
                       /            \   cy  | 
                      /              \   |  |
                     /                \  |  dy
                    /                  \ |  |
                <sx><-cx-><- ccx-><-cx-> V  |
                ^   \                  /    |
                     \                /     |
                      \              /      |
                       \            /       |
                        \----------/        V
*/

function GEO() {};
GEO.setSize = function(ss) {
    GEO.ss = ss;                                   // overall size multiplier
    GEO.sx = GEO.ss;                         // horizontal spacing between hexagons
    GEO.sy = GEO.sx;                         // vertical spacing between hexagons
    GEO.cx = 2.5 * GEO.ss;                   // more cx... <[ ]>; less cx... [ ]
    GEO.ccx = 5 * GEO.ss;                    // more ccx... <[  ]>; less ccx... <[]>
    GEO.cy = 5 * Math.sqrt(3) / 2 * GEO.ss;  // height of hexagon
    GEO.f = 2;         // f is for fat. Used to generate fatwall, which fixes rendering issues with polygons sharing an edge

    GEO.dx = GEO.sx + GEO.cx + GEO.ccx;    // total width of maze cell including space
    GEO.dy = GEO.sy + 2 * GEO.cy;               // total height of maze cell including space

    /* polygon definitions */
    GEO.corner1 = [                           // top left corner of of hexagon
        [GEO.cx, GEO.sy / 2],
        [GEO.cx + GEO.sx, 0],
        [GEO.cx + GEO.sx, GEO.sy]
    ];
    GEO.corner2 = [                           // top right corner of hexagon
        [GEO.dx, 0],
        [GEO.dx + GEO.sx, GEO.sy / 2],
        [GEO.dx, GEO.sy]
    ];
    /* top, top left, and bottom left walls respectively*/
    GEO.wall = [
        [
            [GEO.cx + GEO.sx, 0],
            [GEO.dx, 0],
            [GEO.dx, GEO.sy],
            [GEO.cx + GEO.sx, GEO.sy]
        ],[
            [0, GEO.cy + GEO.sy / 2],
            [GEO.cx, GEO.sy / 2],
            [GEO.cx + GEO.sx, GEO.sy],
            [GEO.sx, GEO.cy + GEO.sy]
        ],[
            [0, GEO.cy + 3 * GEO.sy / 2],
            [GEO.sx, GEO.cy + GEO.sy],
            [GEO.cx + GEO.sx, GEO.dy],
            [GEO.cx, GEO.dy + GEO.sy / 2]]
    ];
    /* thicker walls */
    GEO.fatwall = [
        [
            [GEO.cx + GEO.sx, -GEO.f],
            [GEO.dx, -GEO.f],
            [GEO.dx, GEO.sy + GEO.f],
            [GEO.cx + GEO.sx, GEO.sy + GEO.f]
        ],[
            [-GEO.f, GEO.cy + GEO.sy / 2 - GEO.f * GEO.sy / GEO.sx / 2],
            [GEO.cx - GEO.f, GEO.sy / 2 - GEO.f * GEO.sy / GEO.sx / 2],
            [GEO.cx + GEO.sx + GEO.f, GEO.sy + GEO.f * GEO.sy / GEO.sx / 2],
            [GEO.sx + GEO.f, GEO.cy + GEO.sy + GEO.f * GEO.sy / GEO.sx / 2]
        ],[
            [-GEO.f, GEO.cy + 3 * GEO.sy / 2 + GEO.f * GEO.sy / GEO.sx / 2],
            [GEO.sx + GEO.f, GEO.cy + GEO.sy - GEO.f * GEO.sy / GEO.sx / 2],
            [GEO.cx + GEO.sx + GEO.f, GEO.dy - GEO.f * GEO.sy / GEO.sx / 2],
            [GEO.cx - GEO.f, GEO.dy + GEO.sy / 2 + GEO.f * GEO.sy / GEO.sx / 2]
        ]
    ];
    /* actual hexagon */
    GEO.hexagon = [
        [GEO.cx + GEO.sx, GEO.sy],
        [GEO.dx, GEO.sy],
        [GEO.dx + GEO.cx, GEO.cy + GEO.sy],
        [GEO.dx, GEO.dy],
        [GEO.cx + GEO.sx, GEO.dy],
        [GEO.sx, GEO.cy + GEO.sy]
    ];
};

/* variables pertaining to maze */
Maze = {
    xsize: 2, 
    ysize: 2,
    in: [[]],
    prev: [[]],
    wall: [[[]], [[]], [[]]], // up, leftup, leftdown
    sol: [[]],
    obstacle_polys: [],
    walkable_polys: [],
    padding: 1,

    solution_polys: [],
    solutionlength: 0 // not the same as solution_polys.length since each cell in solution may have more than one polygon.
};

var width, height;
var observer_x, observer_y;

var mousex = 0, mousey = 0;
var requestAnimFrame = window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  function (callback, element) { setTimeout(callback, 1000/16); };

window.onload = function () {

    var stats = new xStats();
    stats.element.style.position = 'absolute';
    stats.element.style.left = 0;
    stats.element.style.top = 0;
    document.body.appendChild(stats.element);

    init();
    //document.onkeydown = checkKey;
};

var setMouseX,setMouseY;
function init() {
    var canvas = document.getElementById('mazecanvas');
    canvas.onmousemove = function (evt) {
        if (evt.offsetX) {
            setMouseX = evt.offsetX; setMouseY = evt.offsetY;
        } else if (evt.layerX) {
            setMouseX = evt.layerX; setMouseY = evt.layerY;
        }
        changed = true;
    };
};

function gameTick() {

    if((setMouseX||setMouseY)!==undefined && (mousex!==setMouseX || mousey!==setMouseY)){
        mousex=setMouseX/GEO.ss;
        mousey=setMouseY/GEO.ss;
        if(canMove())
        {
            mazeClient.updatePlayerPosition(mousex,mousey);
        }

    }

}

function resize() {
    var canvas = document.getElementById('mazecanvas');
    canvas.height = height = window.innerHeight;
    canvas.width = width = window.innerWidth;

    var context = canvas.getContext("2d");

    /* for Retina display support */
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = context.webkitBackingStorePixelRatio 
        || context.mozBackingStorePixelRatio 
        || context.msBackingStorePixelRatio 
        || context.oBackingStorePixelRatio 
        || context.backingStorePixelRatio || 1;
    var ratio = devicePixelRatio / backingStoreRatio;

    // upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
        var oldWidth = canvas.width;
        var oldHeight = canvas.height;

        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;

        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';

        context.scale(ratio, ratio);
    }

    GEO.setSize(Math.min(width/Maze.xsize/11, height/Maze.ysize/(1 + 10 * Math.sqrt(3) / 2)));
    polygonize();
    updateContent();
}


function startGame(data) {
    if(data !== undefined) {
        Maze.xsize = data.maze_in.length;
        Maze.ysize = data.maze_in[0].length;
        GEO.setSize(Math.min(width/Maze.xsize/11, height/Maze.ysize/(1 + 10 * Math.sqrt(3) / 2)));
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

        resize();

        observer_x=GEO.dx+GEO.sx+GEO.cx+GEO.ccx/2;
        observer_y=GEO.dy+GEO.sy+GEO.cy + (observer_x%2)*GEO.cy;

        observer_x/=GEO.ss;
        observer_y/=GEO.ss;

        for (var m = 0; m < mazeClient.players.length; m++) {
            if (mazeClient.players[m] != mazeClient.currentPlayer) {
                mazeClient.players[m].x=observer_x;
                mazeClient.players[m].y=observer_y;
                mazeClient.players[m].moveToX=observer_x;
                mazeClient.players[m].moveToY=observer_y;
            }
        }



        update();

        window.onresize = resize;
        started = true;
    }
    console.log(Maze);
};

function polygonize() {
    // generates obstacle and walkable polygons for rendering

    // initialize first element of obstacles to bounding rectangle as required by visibility_polygon.js
    Maze.obstacle_polys = [[
        [-GEO.dx, -GEO.dy],
        [width + GEO.dx, -GEO.dy],
        [width + GEO.dx, height + GEO.dy],
        [-GEO.dx, height + GEO.dy]
    ]];
    Maze.walkable_polys = [];
    for (var x = 0; x < Maze.xsize; x++) {
        for (var y = 0, yy = Maze.ysize - x % 2; y < yy; y++) {
            for (var w = 0; w < 3; w++) {
                if (Maze.wall[w][x][y] === 1) {
                    Maze.obstacle_polys.push(plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.wall[w]));
                } else {
                    Maze.walkable_polys.push(plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.fatwall[w]));
                }
            }
            Maze.obstacle_polys.push(plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.corner1));
            Maze.obstacle_polys.push(plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.corner2));
            if (!Maze.in[x][y] || 
                (x < Maze.padding || x >= Maze.xsize - Maze.padding || y < Maze.padding || y >= Maze.ysize - x % 2 - Maze.padding)) {
                Maze.obstacle_polys.push(plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.hexagon));
            } else {
                Maze.walkable_polys.push(plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.hexagon));
            }
        }
    }
    Maze.obstacle_polys = VisibilityPolygon.convertToClockwise(Maze.obstacle_polys);
    Maze.walkable_polys = VisibilityPolygon.convertToClockwise(Maze.walkable_polys);
};

function pixels2mazecell_int(a) { 
    // converts real pixel coordinates to maze cell coordinates
    // note: this is a retarded implementation that runs in O(xsize*ysize) time instead of O(1);
    var dist = 999999999999;
    var minx, miny;
    for (var x = 0; x < Maze.xsize; x++) {
        for (var y = 0, yy = Maze.ysize - x % 2; y < yy; y++) {
            var tempx = x * GEO.dx + GEO.cx + GEO.ccx / 2 + GEO.sx;
            var tempy = y * GEO.dy + GEO.cy + GEO.sy + (x % 2) * (GEO.dy / 2);
            if (VisibilityPolygon.distance([tempx, tempy], a) < dist) {
                dist = VisibilityPolygon.distance([tempx, tempy], a);
                minx = x;
                miny = y;
            }
        }
    }
    return [minx, miny];
};

function plus(x, y, p) {
    var qqq = [];
    for (var i = 0, j = p.length; i < j; i++) {
        qqq[i] = [p[i][0] + x, p[i][1] + y];
    }
    return qqq;
};

function solve(x1, y1, x2, y2) {
    //console.log(started, Maze.sol, x1, y1, x2, y2);
    if(!Maze.xsize) return;
    if(!Maze.in[x1][y1] || Maze.prev[x1][y1] === null || Maze.prev[x1][y1] === undefined) return;
    if(!Maze.in[x2][y2] || Maze.prev[x2][y2] === null || Maze.prev[x2][y2] === undefined) return;
    if (x1 < Maze.padding || x1 >= Maze.xsize - Maze.padding || y1 < Maze.padding || y1 >= Maze.ysize - x1 % 2 - Maze.padding) return;
    if (x2 < Maze.padding || x2 >= Maze.xsize - Maze.padding || y2 < Maze.padding || y2 >= Maze.ysize - x2 % 2 - Maze.padding) return;
    var solutions = [], sola = [], solb = [];
    for (var x = 0; x < Maze.xsize; x++) {
        for (var y = 0, yy = Maze.ysize - x % 2; y < yy; y++) {
            Maze.sol[x][y] = 0;
        }
    }
    var overlap = false;
    do {
        sola.unshift([x1, y1]);
        Maze.sol[x1][y1] ^= 1;
        var temp = Maze.prev[x1][y1][0];
        y1 = Maze.prev[x1][y1][1];
        x1 = temp;
    } while (Maze.prev[x1][y1][0] !== x1 || Maze.prev[x1][y1][1] !== y1);
    do {
        if (!overlap && Maze.sol[x2][y2]) {
            overlap = true;
            Maze.sol[x2][y2] = true;
        } else {
            Maze.sol[x2][y2] ^= 1;
        }
        if (Maze.sol[x2][y2]) {
            solb.push([x2, y2]);
        }
        var temp = Maze.prev[x2][y2][0];
        y2 = Maze.prev[x2][y2][1];
        x2 = temp;
    } while (Maze.prev[x2][y2][0] !== x2 || Maze.prev[x2][y2][1] !== y2);
    solutions = solutions.concat(solb, sola);
    for (var i = 0, j = solutions.length; i < j; i++) {
        if (!Maze.sol[solutions[i][0]][solutions[i][1]]) {
            solutions.splice(i, 1);
            i--;
            j--;
        }
    }
    solvepolygonize(solutions);
    Maze.solutionlength = solutions.length;
};

function solvepolygonize(solutions) {
    for (var a = 0, b = solutions.length; a < b; a++) {
        var x = solutions[a][0], y = solutions[a][1];
        if (Maze.sol[x][y]) {
            Maze.solution_polys.push(
                { polygon: plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.hexagon), n: a });
            if (!Maze.wall[1][x][y]) {
                if (x % 2 === 1 && Maze.sol[x - 1][y]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.fatwall[1]), n: a });
                } else if (x % 2 === 0 && Maze.sol[x - 1][y - 1]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.fatwall[1]), n: a });
                }
            }
            if (!Maze.wall[2][x][y]) {
                if (x % 2 === 1 && Maze.sol[x - 1][y + 1]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.fatwall[2]), n: a });
                } else if (x % 2 === 0 && Maze.sol[x - 1][y]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.fatwall[2]), n: a });
                }
            }
            if (!Maze.wall[0][x][y] && Maze.sol[x][y - 1]) {
                Maze.solution_polys.push(
                    { polygon: plus(x * GEO.dx, y * GEO.dy + (x % 2) * GEO.dy / 2, GEO.fatwall[0]), n: a });
            }
        }
    }
};

function canMove(){
    if(mousex===undefined || mousey===undefined )return false;
    if(v === undefined)
        v = VisibilityPolygon.compute([observer_x*GEO.ss, observer_y*GEO.ss], Maze.obstacle_polys);
    Maze.solution_polys = [];
    var vv = [[
        [-GEO.dx, -GEO.dy],
        [width + GEO.dx, -GEO.dy],
        [width + GEO.dx, height + GEO.dy],
        [-GEO.dx, height + GEO.dy]
    ], v];
    return VisibilityPolygon.inObstacle([mousex*GEO.ss, mousey*GEO.ss], vv);
}

function chasemouse()  {

    if (canMove()) {
        var d = VisibilityPolygon.distance([mousex*GEO.ss, mousey*GEO.ss], [observer_x*GEO.ss, observer_y*GEO.ss]);
        d = Math.sqrt(d);
        if (d <= GEO.ss) return;
        var x = observer_x*GEO.ss + (mousex*GEO.ss - observer_x*GEO.ss) / d * Math.sqrt(d);
        var y = observer_y*GEO.ss + (mousey*GEO.ss - observer_y*GEO.ss) / d * Math.sqrt(d);
        if (x < 0 || x > width || y < 0 || y > height) return;
        if (VisibilityPolygon.inObstacle([x, y], Maze.obstacle_polys)) return;
        observer_x = x/GEO.ss;
        observer_y = y/GEO.ss;

        changed = true;
    }
}


function chaseOtherPlayers()  {

    for(var i=0;i<mazeClient.players.length;i++){
if(mazeClient.players[i] == mazeClient.currentPlayer)continue;
        var player=mazeClient.players[i];

        var d = VisibilityPolygon.distance([player.moveToX*GEO.ss, player.moveToY*GEO.ss], [player.x*GEO.ss, player.y*GEO.ss]);
        d = Math.sqrt(d);
        if (d <= GEO.ss) continue;
        var x = player.x*GEO.ss + (player.moveToX*GEO.ss - player.x*GEO.ss) / d * Math.sqrt(d);
        var y = player.y*GEO.ss + (player.moveToY*GEO.ss - player.y*GEO.ss) / d * Math.sqrt(d);
        if (x < 0 || x > width || y < 0 || y > height) return;

        player.x = x/GEO.ss;
        player.y = y/GEO.ss;

        changed = true;
    }

}

function update() {
    if(mousex===undefined || mousey===undefined ){
//bah fix
        requestAnimFrame(update);
        return;
    }

    chasemouse();
    chaseOtherPlayers();
    if (changed && started) {
        v = VisibilityPolygon.compute([observer_x*GEO.ss, observer_y*GEO.ss], Maze.obstacle_polys);
        var a1 = pixels2mazecell_int([mousex*GEO.ss, mousey*GEO.ss]), a2 = pixels2mazecell_int([observer_x*GEO.ss, observer_y*GEO.ss]);
        solve(a1[0], a1[1], a2[0], a2[1]);
        var canvas = document.getElementById('mazecanvas');
        var ctx = canvas.getContext("2d");
        // ctx.clearRect(0, 0, width, height);
        draw(ctx);
        changed = false;
    }
    requestAnimFrame(update);
 };

// function checkKey(e) {
//     e = e || window.event;
//     var x = observer_x;
//     var y = observer_y;
//     if (e.keyCode == '38') {
//         y -= GEO.ss;
//     } else if (e.keyCode == '40') {
//         y += GEO.ss;
//     } else if (e.keyCode == '39') {
//         x += GEO.ss;
//     } else if (e.keyCode == '37') {
//         x -= GEO.ss;
//     }
//     if (x < 0 || x > width || y < 0 || y > height) return;
//     if (VisibilityPolygon.inObstacle([x, y], Maze.obstacle_polys)) return;
//     observer_x = x;
//     observer_y = y;
//     changed = true;
// };

function draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "#333";
    ctx.fill();

    if(!Maze.xsize) return;

    /* illuminate corridor */
    for (var i = 0, j = Maze.walkable_polys.length; i < j; i++) {
        var qqq = Maze.walkable_polys[i];
        ctx.beginPath();
        ctx.moveTo(qqq[0][0], qqq[0][1]);
        for (var k = 1, l = qqq.length; k < l; k++) {
            ctx.lineTo(qqq[k][0], qqq[k][1]);
        }
        ctx.fillStyle = "#444";
        ctx.fill();
    }

    /* display wall */
    // for(var i=1, j=Maze.obstacle_polys.length; i<j; i++) {
    //   var qqq = Maze.obstacle_polys[i];
    //   ctx.beginPath();
    //   ctx.moveTo(qqq[0][0], qqq[0][1]);
    //   for(var k=1, l=qqq.length; k<l; k++) {
    //     ctx.lineTo(qqq[k][0], qqq[k][1]);
    //   }
    //   ctx.fillStyle = "#cfc";
    //   ctx.fill();
    //   ctx.strokeStyle = '#0f0';
    //   ctx.stroke();
    // }

    /* display solution */
    for (var i = 0, j = Maze.solution_polys.length; i < j; i++) {
        var qqq = Maze.solution_polys[i].polygon;
        ctx.beginPath();
        ctx.moveTo(qqq[0][0], qqq[0][1]);
        for (var k = 1, l = qqq.length; k < l; k++) {
            ctx.lineTo(qqq[k][0], qqq[k][1]);
        }
        var red = Math.sqrt(Maze.solution_polys[i].n / Maze.solutionlength);
        var green = Math.sqrt(1 - Maze.solution_polys[i].n / Maze.solutionlength);
        ctx.fillStyle = "rgb(" + Math.floor(red * 100) + "," + Math.floor(green * 100) + ",0)";
        ctx.fill();
    }

    /* display visibility polygon */
    ctx.beginPath();
    ctx.moveTo(v[0][0], v[0][1]);
    for (var i = 1, j = v.length; i < j; i++) {
        ctx.lineTo(v[i][0], v[i][1]);
    }
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();

    var vv = [[
        [-GEO.dx, -GEO.dy],
        [width + GEO.dx, -GEO.dy],
        [width + GEO.dx, height + GEO.dy],
        [-GEO.dx, height + GEO.dy]
    ], v];
    if (VisibilityPolygon.inObstacle([mousex*GEO.ss, mousey*GEO.ss], vv)) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(mousex*GEO.ss, mousey*GEO.ss);
        ctx.lineTo(observer_x*GEO.ss, observer_y*GEO.ss);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.restore();
    }
    
    for (var m = 0; m < mazeClient.players.length; m++) {
        if (mazeClient.players[m] != mazeClient.currentPlayer) {
            ctx.save();
    
            ctx.beginPath();
            ctx.arc(mazeClient.players[m].x*GEO.ss, mazeClient.players[m].y*GEO.ss, 5, 0, Math.PI * 2, true);
            ctx.fillStyle = "#f30";
            ctx.fill();
            ctx.restore();
        }
    }
    

    ctx.save();
    ctx.beginPath();
    ctx.arc(observer_x*GEO.ss, observer_y*GEO.ss, 5, 0, Math.PI * 2, true);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
};

// stole this function from http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};