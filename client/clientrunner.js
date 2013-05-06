var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    webFiles = {};



fs.readdir('./', function (err, files) {
    for (var i = 0; i < files.length; i++) {
        (function(file) {
            fs.readFile('./' + file, function(err2, data) {
                console.log(file);
                if (err) {
                    throw err;
                }
                webFiles["/" + file] = data;
                watchFile('./' + file, '/' + file);
            });
        })(files[i]);
    }
});

fs.readdir('./lib', function (err, files) {
    for (var i = 0; i < files.length; i++) {
        (function (file) {
            fs.readFile('./lib/' + file, function (err2, data) {
                console.log(file);
                if (err) {
                    throw err;
                }
                webFiles['/lib/' + file] = data;
                watchFile('./lib/' + file, '/lib/' + file);
            });
        })(files[i]);
    }
});

function watchFile(file,fileName) {
    fs.watchFile(file, function (curr, prev) {
        console.log('watch '+file)
        if (+curr.mtime === +prev.mtime) {
        } else {
            fs.readFile(file, function (err2, data) {
                if (err2) {
                    throw err2;
                }
                webFiles[fileName] = data;
            });
        }
    });
}

http.createServer(function (request, response) {
    var url = request.url;
    if (url == '/') {
        url = '/index.html';
    }

    var c = url.split('.');
    var type = c[c.length - 1];
    console.log(url);
    if (!webFiles[url]) {
        response.writeHeader(404);
        console.log('not found');

    } else {
        response.writeHeader(200, { "Content-Type": "text/" + type });
        response.write(webFiles[url]);
    }
    response.end();
}).listen(8000);