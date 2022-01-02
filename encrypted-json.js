const fs = require('fs');
const zlib = require('zlib');

function compress(input) {
    return new Promise(function(resolve, reject) {
        zlib.gzip(input, (err, buffer) => {
            resolve(buffer);
        });
    });
}

function decompress(input) {
    return new Promise(function(resolve, reject) {
        zlib.gunzip(input, (err, buffer) => {
            resolve(buffer);
        });
    });
}

function read(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, function read(err, data) {
            resolve(data);
        });
    });
}

function write(path, data) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, data, function() {
            resolve(true);
        });
    });
}

module.exports.writeJSON = function(path, json) {
    json = JSON.stringify(json);
    compress(json).then(buffer => {
        write(path, buffer).then(status => { });
    });
}

module.exports.readJSON = function(path) {
    return new Promise(function(resolve, reject) {
        read(path).then(json => {
            decompress(json).then(buffer => {
                resolve(JSON.parse(buffer.toString("utf-8")));
            });
        });
    });
}

module.exports.quickfix = function(path) {
    writeJSON(path, {});
}

module.exports.format = function(path) {
    read(path).then(response => {
        response = JSON.parse(response);
        writeJSON(path, response);
    });
}