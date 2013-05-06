
    var ss = 8, sx = ss, sy = sx, cx = 2.5*ss, ccx = 5*ss, cy = 5*Math.sqrt(3)/2*ss;
    var fat = 2;
    var dx = sx + cx + ccx, dy = sy + 2*cy;

    /* omfg by far the hardest thing is to define these polygons */
    var blob1 = [[cx, sy/2], [cx+sx, 0], [cx+sx, sy]];
    var blob2 = [[dx, 0], [dx+sx, sy/2], [dx, sy]];
    var wall = [
      [[cx+sx, 0], [dx, 0], [dx, sy], [cx+sx, sy]],
      [[0, cy+sy/2], [cx, sy/2], [cx+sx, sy], [sx, cy+sy]],
      [[0, cy+3*sy/2], [sx, cy+sy], [cx+sx, dy], [cx, dy+sy/2]]
    ];
    var fatwall = [
      [[cx+sx, -fat], [dx, -fat], [dx, sy+fat], [cx+sx, sy+fat]],
      [[-fat, cy+sy/2 - fat*sy/sx/2], [cx-fat, sy/2 - fat*sy/sx/2], [cx+sx+fat, sy + fat*sy/sx/2], [sx+fat, cy+sy + fat*sy/sx/2]],
      [[-fat, cy+3*sy/2 + fat*sy/sx/2], [sx+fat, cy+sy - fat*sy/sx/2], [cx+sx+fat, dy - fat*sy/sx/2], [cx-fat, dy+sy/2 + fat*sy/sx/2]]
    ];
    var hexagon = [[cx+sx, sy], [dx, sy], [dx+cx, cy+sy], [dx, dy], [cx+sx, dy], [sx, cy+sy]];

    var maze_in = [];
    var maze_prev = [];
    var maze_wall = [[],[],[]]; // up, leftup, leftdown
    var maze_sol = [];
    var padding = 1;
    var polys = [];
    var drawpolys = [];
    var solvepolys = [];
    var solutionlength;
    var q = [[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]], [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]];
    var changed, observer_x, observer_y, jump = 3, v;
    var width, height, xsize_maze, ysize_maze;
    var mousex = 0, mousey = 0;
    var requestAnimFrame = window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function(callback, element) { setTimeout(callback, 50); };

    window.onload = function() {
      var canvas = document.getElementById('mazecanvas');
      canvas.height = height =  window.innerHeight;
      canvas.width = width = window.innerWidth;

      var context = canvas.getContext("2d");
      var devicePixelRatio = window.devicePixelRatio || 1;
      var backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
      var ratio = devicePixelRatio / backingStoreRatio;

      // upscale the canvas if the two ratios don't match
      if(devicePixelRatio !== backingStoreRatio) {
        var oldWidth = canvas.width;
        var oldHeight = canvas.height;

        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;

        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';

        context.scale(ratio, ratio);
      }

      ysize_maze = Math.floor((height)/dy);
      xsize_maze = Math.floor((width)/dx);

      for(var x=0; x<xsize_maze; x++) {
        maze_in[x] = [];
        maze_sol[x] = [];
        maze_prev[x] = [];
        maze_wall[0][x] = [];
        maze_wall[1][x] = [];
        maze_wall[2][x] = [];
        for(var y=0, yy = ysize_maze-x%2; y<yy; y++) {
          maze_in[x][y] = (x<padding || x>=xsize_maze-padding || y<padding || y>=ysize_maze-x%2-padding);
          maze_wall[0][x][y] =1;
          maze_wall[1][x][y] =1;
          maze_wall[2][x][y] =1;
        }
      }
      var polygonize = function() {
        polys = [[[-dx,-dy],[width+dx,-dy],[width+dx,height+dy],[-dx,height+dy]]];
        drawpolys = [];
        for(var x=0; x<xsize_maze; x++) {
          for(var y=0, yy = ysize_maze-x%2; y<yy; y++) {
            for(var w=0; w<3; w++) {
              if(maze_wall[w][x][y] === 1) {
                polys.push(plus(x*dx, y*dy + (x%2)*dy/2, wall[w]));
              } else {
                drawpolys.push(plus(x*dx, y*dy + (x%2)*dy/2, fatwall[w]));
              }
            }
            polys.push(plus(x*dx, y*dy + (x%2)*dy/2, blob1));
            polys.push(plus(x*dx, y*dy + (x%2)*dy/2, blob2));
            if(!maze_in[x][y] || (x<padding || x>=xsize_maze-padding || y<padding || y>=ysize_maze-x%2-padding)) {
              polys.push(plus(x*dx, y*dy + (x%2)*dy/2, hexagon));
            } else {
              drawpolys.push(plus(x*dx, y*dy + (x%2)*dy/2, hexagon));
            }
          }
        }
        polys = VisibilityPolygon.convertToClockwise(polys);
        drawpolys = VisibilityPolygon.convertToClockwise(drawpolys);
      };

      var generate = function() {
        var xcur = Math.floor(Math.random()*(xsize_maze-4))+2, ycur = Math.floor(Math.random()*(ysize_maze-5))+2;
        observer_x = xcur*dx + cx + ccx/2 + sx;
        observer_y = ycur*dy + cy + sy + (xcur%2)*(dy/2);
        xcur = Math.floor(Math.random()*(xsize_maze-4))+2;
        ycur = Math.floor(Math.random()*(ysize_maze-5))+2;
        console.log(xcur, ycur, xsize_maze, ysize_maze);
        maze_prev[xcur][ycur] = [xcur, ycur];
        var qwerqwer = 0;
        do {
          maze_in[xcur][ycur] = true;
          var neighbours = [];
          for(p=0; p<6; p++) {
            if(!maze_in[xcur+q[xcur%2][p][0]][ycur+q[xcur%2][p][1]]) {
              neighbours.push(q[xcur%2][p]);
            }
          }
          while(neighbours.length === 0) {
            if(maze_prev[xcur][ycur][0] === xcur && maze_prev[xcur][ycur][1] === ycur) return;
            var _xcur = maze_prev[xcur][ycur][0];
            ycur = maze_prev[xcur][ycur][1];
            xcur = _xcur;
            neighbours = [];
            for(p=0; p<6; p++) {
              if(!maze_in[xcur+q[xcur%2][p][0]][ycur+q[xcur%2][p][1]]) {
                neighbours.push(q[xcur%2][p]);
              }
            }
          }
          var z = neighbours[Math.floor(Math.random()*neighbours.length)];
          if(z[0] === -1) {
            if(xcur%2 === 0) {
              if(z[1] === -1) {
                maze_wall[1][xcur][ycur] = 0;
              } else {
                maze_wall[2][xcur][ycur] = 0;
              }
            } else {
              if(z[1] === 0) {
                maze_wall[1][xcur][ycur] = 0;
              } else {
                maze_wall[2][xcur][ycur] = 0;
              }
            }
          } else if(z[0] === 0) {
            if(z[1] === -1) {
              maze_wall[0][xcur][ycur] = 0;
            } else {
              maze_wall[0][xcur][ycur+1] = 0;
            }
          } else {
            if(xcur%2 === 0) {
              if(z[1] === -1) {
                maze_wall[2][xcur+1][ycur-1] = 0;
              } else {
                maze_wall[1][xcur+1][ycur] = 0;
              }
            } else {
              if(z[1] === 0) {
                maze_wall[2][xcur+1][ycur] = 0;
              } else {
                maze_wall[1][xcur+1][ycur+1] = 0;
              }
            }
          }
          maze_prev[xcur+z[0]][ycur+z[1]] = [xcur, ycur];
          xcur += z[0];
          ycur += z[1];
        } while (!(maze_prev[xcur][ycur][0] === xcur && maze_prev[xcur][ycur][1] === ycur));
      };
      generate();
      polygonize(); draw(context);
      update();
      document.onkeydown = checkKey;

      canvas.onmousemove = function(evt) {
        if(evt.offsetX) {
          mousex = evt.offsetX; mousey = evt.offsetY;
        } else if(evt.layerX) {
          mousex = evt.layerX; mousey = evt.layerY;
        }
        changed = true;
      };
      console.log(xy2xy([observer_x, observer_y]));
    };

    function xy2xy(a) { // converts real pixel coordinates to maze cell coordinates
      var dist = 999999999999;
      var minx, miny;
      for(var x=0; x<xsize_maze; x++) {
        for(var y=0, yy = ysize_maze-x%2; y<yy; y++) {
          var tempx = x*dx + cx + ccx/2 + sx;
          var tempy = y*dy + cy + sy + (x%2)*(dy/2);
          if(VisibilityPolygon.distance([tempx, tempy],a) < dist) {
            dist = VisibilityPolygon.distance([tempx, tempy],a);
            minx = x;
            miny = y;
          }
        }
      }
      return [minx, miny];
    };

    function plus(x, y, p) {
      var qqq = [];
      for(var i=0, j=p.length; i<j; i++) {
        qqq[i] = [p[i][0]+x, p[i][1]+y];
      }
      return qqq;
    };

    function solve(x1, y1, x2, y2) {
      if(x1<padding || x1>=xsize_maze-padding || y1<padding || y1>=ysize_maze-x1%2-padding) return;
      if(x2<padding || x2>=xsize_maze-padding || y2<padding || y2>=ysize_maze-x2%2-padding) return;
      var solutions = [], sola = [], solb = [];
      for(var x=0; x<xsize_maze; x++) {
        for(var y=0, yy = ysize_maze-x%2; y<yy; y++) {
          maze_sol[x][y] = 0;
        }
      }
      var overlap = false;
      do {
        sola.unshift([x1, y1]);
        maze_sol[x1][y1] ^= 1;
        var temp = maze_prev[x1][y1][0];
        y1 = maze_prev[x1][y1][1];
        x1 = temp;
      } while(maze_prev[x1][y1][0] !== x1 || maze_prev[x1][y1][1] !== y1);
      do {
        if(!overlap && maze_sol[x2][y2]) {
          overlap = true;
          maze_sol[x2][y2] = true;
        } else {
          maze_sol[x2][y2] ^= 1;
        }
        if(maze_sol[x2][y2]) {
          solb.push([x2, y2]);
        }
        var temp = maze_prev[x2][y2][0];
        y2 = maze_prev[x2][y2][1];
        x2 = temp;
      } while(maze_prev[x2][y2][0] !== x2 || maze_prev[x2][y2][1] !== y2);
      solutions = solutions.concat(solb, sola);
      for(var i=0, j=solutions.length; i<j; i++) {
        if(!maze_sol[solutions[i][0]][solutions[i][1]]) {
          solutions.splice(i,1);
          i--;
          j--;
        }
      }
      solvepolygonize(solutions);
    };

    function solvepolygonize(solutions) {
      for(var a=0, b=solutions.length; a<b; a++) {
        var x = solutions[a][0], y = solutions[a][1];
        if(maze_sol[x][y]) {
          solvepolys.push({polygon:plus(x*dx, y*dy + (x%2)*dy/2, hexagon), n:a});
          if(!maze_wall[1][x][y]) {
            if(x%2 === 1 && maze_sol[x-1][y]) {
              solvepolys.push({polygon:plus(x*dx, y*dy + (x%2)*dy/2, fatwall[1]), n:a});
            } else if(x%2 === 0 && maze_sol[x-1][y-1]) {
              solvepolys.push({polygon:plus(x*dx, y*dy + (x%2)*dy/2, fatwall[1]), n:a});
            }
          }
          if(!maze_wall[2][x][y]) {
            if(x%2 === 1 && maze_sol[x-1][y+1]) {
              solvepolys.push({polygon:plus(x*dx, y*dy + (x%2)*dy/2, fatwall[2]), n:a});
            } else if(x%2 === 0 && maze_sol[x-1][y]) {
              solvepolys.push({polygon:plus(x*dx, y*dy + (x%2)*dy/2, fatwall[2]), n:a});
            }
          }
          if(!maze_wall[0][x][y] && maze_sol[x][y-1]) {
            solvepolys.push({polygon:plus(x*dx, y*dy + (x%2)*dy/2, fatwall[0]), n:a});
          }
        }
      }
      solutionlength = solutions.length;
    };

    function chasemouse() {
      solvepolys = [];
      var vv = [[[-dx,-dy],[width+dx,-dy],[width+dx,height+dy],[-dx,height+dy]], v];
      if(VisibilityPolygon.inObstacle([mousex, mousey], vv)) {
        var d = VisibilityPolygon.distance([mousex, mousey], [observer_x, observer_y]);
        d = Math.sqrt(d);
        if(d <= jump) return;
        var x = observer_x + (mousex - observer_x)/d  * Math.sqrt(d);
        var y = observer_y + (mousey - observer_y)/d  * Math.sqrt(d);
        if (x < 0 || x > width || y < 0 || y > height) return;
        if (VisibilityPolygon.inObstacle([x, y], polys)) return;
        observer_x = x;
        observer_y = y;
        changed = true;
      }
    };

    function update() {
      chasemouse();
      if (changed) {
        var a1 = xy2xy([mousex, mousey]), a2 = xy2xy([observer_x, observer_y]);
        solve(a1[0], a1[1], a2[0], a2[1]);
        var canvas = document.getElementById('mazecanvas');
        var ctx = canvas.getContext("2d");
        // ctx.clearRect(0, 0, width, height);
        draw(ctx);
        changed = false;
      }
      requestAnimFrame(update);
    };

    function checkKey(e) {
      var jump = 5;
      e = e || window.event;
      var x = observer_x;
      var y = observer_y;
      if (e.keyCode == '38') {
        y-=jump;
      } else if (e.keyCode == '40') {
        y+=jump;
      } else if (e.keyCode == '39') {
        x+=jump;
      } else if (e.keyCode == '37') {
        x-=jump;
      }
      if (x < 0 || x > width || y < 0 || y > height) return;
      if (VisibilityPolygon.inObstacle([x, y], polys)) return;
      observer_x = x;
      observer_y = y;
      changed = true;
    };

    function draw(ctx) {
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.fillStyle = "#333";
      ctx.fill();

      /* illuminate corridor */
      for(var i=0, j=drawpolys.length; i<j; i++) {
        var qqq = drawpolys[i];
        ctx.beginPath();
        ctx.moveTo(qqq[0][0], qqq[0][1]);
        for(var k=1, l=qqq.length; k<l; k++) {
          ctx.lineTo(qqq[k][0], qqq[k][1]);
        }
        ctx.fillStyle = "#444";
        ctx.fill();
      }

      /* display wall */
      // for(var i=1, j=polys.length; i<j; i++) {
      //   var qqq = polys[i];
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
      for(var i=0, j=solvepolys.length; i<j; i++) {
        var qqq = solvepolys[i].polygon;
        ctx.beginPath();
        ctx.moveTo(qqq[0][0], qqq[0][1]);
        for(var k=1, l=qqq.length; k<l; k++) {
          ctx.lineTo(qqq[k][0], qqq[k][1]);
        }
        var red = Math.sqrt(solvepolys[i].n/solutionlength);
        var green = Math.sqrt(1 - solvepolys[i].n/solutionlength);
        ctx.fillStyle = "rgb(" + Math.floor(red*100) + "," + Math.floor(green*100) + ",0)";
        ctx.fill();
      }

      v = VisibilityPolygon.compute([observer_x, observer_y], polys);
      ctx.beginPath();
      ctx.moveTo(v[0][0], v[0][1]);
      for (var i=1, j=v.length; i<j; i++) {
        ctx.lineTo(v[i][0], v[i][1]);
      }
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();

      var vv = [[[-dx,-dy],[width+dx,-dy],[width+dx,height+dy],[-dx,height+dy]], v];
      if(VisibilityPolygon.inObstacle([mousex, mousey], vv)) {
        ctx.beginPath();
        ctx.moveTo(mousex,mousey);
        ctx.lineTo(observer_x, observer_y);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(observer_x, observer_y, 5, 0, Math.PI*2, true);
      ctx.fillStyle = "#fff";
      ctx.fill();
    };