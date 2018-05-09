const fs = require('fs');

global.config = {
    modFilePath: './test/unit/resources/Skid_Row2.mod'
}

// Polyfill XMLHttpRequest
global.XMLHttpRequest = function() {};
XMLHttpRequest.prototype.open = function(fakeUrl) {
    var buf  = fs.readFileSync(config.modFilePath);
    var ab   = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    this.onreadystatechange({response: ab});
};

// Polyfill FileReader
global.FileReader = function() {};
global.FileReader.prototype.onload = function() {};
global.FileReader.prototype.readAsArrayBuffer = function(path) {
    var buf  = fs.readFileSync(path);
    var ab   = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    this.onload(ab);
    return ab;
};