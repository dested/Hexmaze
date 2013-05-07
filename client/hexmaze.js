window.mazeClient = new MazeClient(updateContent);

function updateContent() {
    var canvas = document.getElementById('mazecanvas');
    var ctx = canvas.getContext("2d");
    // ctx.clearRect(0, 0, width, height);
    draw(ctx);
}

/* GEOMETRY
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

function GEOMETRY() {};
GEOMETRY.ss = 3;                                   // overall size multiplier
GEOMETRY.sx = GEOMETRY.ss;                         // horizontal spacing between hexagons
GEOMETRY.sy = GEOMETRY.sx;                         // vertical spacing between hexagons
GEOMETRY.cx = 2.5 * GEOMETRY.ss;                   // more cx... <[ ]>; less cx... [ ]
GEOMETRY.ccx = 5 * GEOMETRY.ss;                    // more ccx... <[  ]>; less ccx... <[]>
GEOMETRY.cy = 5 * Math.sqrt(3) / 2 * GEOMETRY.ss;  // height of hexagon
GEOMETRY.f = 2;         // f is for fat. Used to generate fatwall, which fixes rendering issues with polygons sharing an edge

GEOMETRY.dx = GEOMETRY.sx + GEOMETRY.cx + GEOMETRY.ccx;    // total width of maze cell including space
GEOMETRY.dy = GEOMETRY.sy + 2 * GEOMETRY.cy;               // total height of maze cell including space

/* polygon definitions */
GEOMETRY.corner1 = [                           // top left corner of of hexagon
    [GEOMETRY.cx, GEOMETRY.sy / 2], 
    [GEOMETRY.cx + GEOMETRY.sx, 0], 
    [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.sy]
];
GEOMETRY.corner2 = [                           // top right corner of hexagon
    [GEOMETRY.dx, 0], 
    [GEOMETRY.dx + GEOMETRY.sx, GEOMETRY.sy / 2], 
    [GEOMETRY.dx, GEOMETRY.sy]
];
/* top, top left, and bottom left walls respectively*/
GEOMETRY.wall = [
    [
        [GEOMETRY.cx + GEOMETRY.sx, 0], 
        [GEOMETRY.dx, 0], 
        [GEOMETRY.dx, GEOMETRY.sy], 
        [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.sy]
    ],[
        [0, GEOMETRY.cy + GEOMETRY.sy / 2], 
        [GEOMETRY.cx, GEOMETRY.sy / 2], 
        [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.sy], 
        [GEOMETRY.sx, GEOMETRY.cy + GEOMETRY.sy]
    ],[
        [0, GEOMETRY.cy + 3 * GEOMETRY.sy / 2], 
        [GEOMETRY.sx, GEOMETRY.cy + GEOMETRY.sy], 
        [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.dy], 
        [GEOMETRY.cx, GEOMETRY.dy + GEOMETRY.sy / 2]]
];
/* thicker walls */
GEOMETRY.fatwall = [
    [
        [GEOMETRY.cx + GEOMETRY.sx, -GEOMETRY.f], 
        [GEOMETRY.dx, -GEOMETRY.f], 
        [GEOMETRY.dx, GEOMETRY.sy + GEOMETRY.f], 
        [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.sy + GEOMETRY.f]
    ],[
        [-GEOMETRY.f, GEOMETRY.cy + GEOMETRY.sy / 2 - GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2], 
        [GEOMETRY.cx - GEOMETRY.f, GEOMETRY.sy / 2 - GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2], 
        [GEOMETRY.cx + GEOMETRY.sx + GEOMETRY.f, GEOMETRY.sy + GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2], 
        [GEOMETRY.sx + GEOMETRY.f, GEOMETRY.cy + GEOMETRY.sy + GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2]
    ],[
        [-GEOMETRY.f, GEOMETRY.cy + 3 * GEOMETRY.sy / 2 + GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2], 
        [GEOMETRY.sx + GEOMETRY.f, GEOMETRY.cy + GEOMETRY.sy - GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2], 
        [GEOMETRY.cx + GEOMETRY.sx + GEOMETRY.f, GEOMETRY.dy - GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2], 
        [GEOMETRY.cx - GEOMETRY.f, GEOMETRY.dy + GEOMETRY.sy / 2 + GEOMETRY.f * GEOMETRY.sy / GEOMETRY.sx / 2]
    ]
];
/* actual hexagon */
GEOMETRY.hexagon = [
    [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.sy], 
    [GEOMETRY.dx, GEOMETRY.sy], 
    [GEOMETRY.dx + GEOMETRY.cx, GEOMETRY.cy + GEOMETRY.sy], 
    [GEOMETRY.dx, GEOMETRY.dy], 
    [GEOMETRY.cx + GEOMETRY.sx, GEOMETRY.dy], 
    [GEOMETRY.sx, GEOMETRY.cy + GEOMETRY.sy]
];

/* variables pertaining to maze */
Maze = {
    xsize: 0, 
    ysize: 0,
    in: [[]],
    prev: [[]],
    wall: [[[]], [[]], [[]]], // up, leftup, leftdown
    sol: [[]],
    obstacle_polys: [],
    walkable_polys: [],
    padding: 1,

    solution_polys: [],
    solutionlength: 0, // not the same as solution_polys.length since each cell in solution may have more than one polygon.
};

var width, height;

var changed, observer_x, observer_y, jump = 3, v;
var mousex = 0, mousey = 0;
var requestAnimFrame = window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  function (callback, element) { setTimeout(callback, 50); };

window.onload = function () {

    var stats = new xStats();
    stats.element.style.position = 'absolute';
    stats.element.style.left = 0;
    stats.element.style.top = 0;
    document.body.appendChild(stats.element);

    init();
    //document.onkeydown = checkKey;
};

function init() {
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

    canvas.onmousemove = function (evt) {
        if (evt.offsetX) {
            mousex = evt.offsetX; mousey = evt.offsetY;
        } else if (evt.layerX) {
            mousex = evt.layerX; mousey = evt.layerY;
        }
        //changed = true;
    };
};

function polygonize() {
    // generates obstacle and walkable polygons for rendering

    // initialize first element of obstacles to bounding rectangle as required by visibility_polygon.js
    Maze.obstacle_polys = [[
        [-GEOMETRY.dx, -GEOMETRY.dy], 
        [width + GEOMETRY.dx, -GEOMETRY.dy], 
        [width + GEOMETRY.dx, height + GEOMETRY.dy], 
        [-GEOMETRY.dx, height + GEOMETRY.dy]
    ]];
    Maze.walkable_polys = [];
    for (var x = 0; x < Maze.xsize; x++) {
        for (var y = 0, yy = Maze.ysize - x % 2; y < yy; y++) {
            for (var w = 0; w < 3; w++) {
                if (Maze.wall[w][x][y] === 1) {
                    Maze.obstacle_polys.push(plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.wall[w]));
                } else {
                    Maze.walkable_polys.push(plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.fatwall[w]));
                }
            }
            Maze.obstacle_polys.push(plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.corner1));
            Maze.obstacle_polys.push(plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.corner2));
            if (!Maze.in[x][y] || 
                (x < Maze.padding || x >= Maze.xsize - Maze.padding || y < Maze.padding || y >= Maze.ysize - x % 2 - Maze.padding)) {
                Maze.obstacle_polys.push(plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.hexagon));
            } else {
                Maze.walkable_polys.push(plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.hexagon));
            }
        }
    }
    Maze.obstacle_polys = VisibilityPolygon.convertToClockwise(Maze.obstacle_polys);
    Maze.walkable_polys = VisibilityPolygon.convertToClockwise(Maze.walkable_polys);
};

function pixels2mazecell(a) { 
    // converts real pixel coordinates to maze cell coordinates
    // note: this is a retarded implementation that runs in O(xsize*ysize) time instead of O(1);
    var dist = 999999999999;
    var minx, miny;
    for (var x = 0; x < Maze.xsize; x++) {
        for (var y = 0, yy = Maze.ysize - x % 2; y < yy; y++) {
            var tempx = x * GEOMETRY.dx + GEOMETRY.cx + GEOMETRY.ccx / 2 + GEOMETRY.sx;
            var tempy = y * GEOMETRY.dy + GEOMETRY.cy + GEOMETRY.sy + (x % 2) * (GEOMETRY.dy / 2);
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
    if(!Maze.xsize) return;
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
                { polygon: plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.hexagon), n: a });
            if (!Maze.wall[1][x][y]) {
                if (x % 2 === 1 && Maze.sol[x - 1][y]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.fatwall[1]), n: a });
                } else if (x % 2 === 0 && Maze.sol[x - 1][y - 1]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.fatwall[1]), n: a });
                }
            }
            if (!Maze.wall[2][x][y]) {
                if (x % 2 === 1 && Maze.sol[x - 1][y + 1]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.fatwall[2]), n: a });
                } else if (x % 2 === 0 && Maze.sol[x - 1][y]) {
                    Maze.solution_polys.push(
                        { polygon: plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.fatwall[2]), n: a });
                }
            }
            if (!Maze.wall[0][x][y] && Maze.sol[x][y - 1]) {
                Maze.solution_polys.push(
                    { polygon: plus(x * GEOMETRY.dx, y * GEOMETRY.dy + (x % 2) * GEOMETRY.dy / 2, GEOMETRY.fatwall[0]), n: a });
            }
        }
    }
};

// function chasemouse() {};{
//     Maze.solution_polys = [];
//     var vv = [[
//         [-GEOMETRY.dx, -GEOMETRY.dy], 
//         [width + GEOMETRY.dx, -GEOMETRY.dy], 
//         [width + GEOMETRY.dx, height + GEOMETRY.dy], 
//         [-GEOMETRY.dx, height + GEOMETRY.dy]
//     ], v];
//     if (VisibilityPolygon.inObstacle([mousex, mousey], vv)) {
//         var d = VisibilityPolygon.distance([mousex, mousey], [observer_x, observer_y]);
//         d = Math.sqrt(d);
//         if (d <= jump) return;
//         var x = observer_x + (mousex - observer_x) / d * Math.sqrt(d);
//         var y = observer_y + (mousey - observer_y) / d * Math.sqrt(d);
//         if (x < 0 || x > width || y < 0 || y > height) return;
//         if (VisibilityPolygon.inObstacle([x, y], polys)) return;
//         observer_x = x;
//         observer_y = y;
//         mazeClient.updatePlayerPosition(x,y);
//         changed = true;
//     }
// };

// function update() {
//     chasemouse();
//     if (changed) {
//         var a1 = pixels2mazecell([mousex, mousey]), a2 = pixels2mazecell([observer_x, observer_y]);
//         solve(a1[0], a1[1], a2[0], a2[1]);
//         var canvas = document.getElementById('mazecanvas');
//         var ctx = canvas.getContext("2d");
//         // ctx.clearRect(0, 0, width, height);
//         draw(ctx);
//         changed = false;
//     }
//     requestAnimFrame(update);
// };

// function checkKey(e) {
//     var jump = 5;
//     e = e || window.event;
//     var x = observer_x;
//     var y = observer_y;
//     if (e.keyCode == '38') {
//         y -= jump;
//     } else if (e.keyCode == '40') {
//         y += jump;
//     } else if (e.keyCode == '39') {
//         x += jump;
//     } else if (e.keyCode == '37') {
//         x -= jump;
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
    // v = VisibilityPolygon.compute([observer_x, observer_y], Maze.obstacle_polys);
    // ctx.beginPath();
    // ctx.moveTo(v[0][0], v[0][1]);
    // for (var i = 1, j = v.length; i < j; i++) {
    //     ctx.lineTo(v[i][0], v[i][1]);
    // }
    // ctx.fillStyle = "rgba(255,255,255,0.2)";
    // ctx.fill();

    // var vv = [[
    //     [-GEOMETRY.dx, -GEOMETRY.dy], 
    //     [width + GEOMETRY.dx, -GEOMETRY.dy], 
    //     [width + GEOMETRY.dx, height + GEOMETRY.dy], 
    //     [-GEOMETRY.dx, height + GEOMETRY.dy]
    // ], v];
    // if (VisibilityPolygon.inObstacle([mousex, mousey], vv)) {
    //     ctx.save();
    //     ctx.beginPath();
    //     ctx.moveTo(mousex, mousey);
    //     ctx.lineTo(observer_x, observer_y);
    //     ctx.strokeStyle = '#fff';
    //     ctx.stroke();
    //     ctx.restore();
    // }
    
    for (var m = 0; m < mazeClient.players.length; m++) {
        if (mazeClient.players[m] != mazeClient.currentPlayer) {
            ctx.save();
    
            ctx.beginPath();
            ctx.arc(mazeClient.players[m].x, mazeClient.players[m].y, 5, 0, Math.PI * 2, true);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.restore();
        }
    }
    

    ctx.save();
    ctx.beginPath();
    ctx.arc(observer_x, observer_y, 5, 0, Math.PI * 2, true);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
    
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