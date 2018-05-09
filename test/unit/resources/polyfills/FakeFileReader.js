const fs = require('fs');

// Polyfill FileReader
const FakeFileReader = function() {};
FakeFileReader.prototype.onload = function() {};
FakeFileReader.prototype.readAsArrayBuffer = function(path) {
    var buf  = fs.readFileSync(path);
    var ab   = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    this.onload(ab);
};

export default FakeFileReader;