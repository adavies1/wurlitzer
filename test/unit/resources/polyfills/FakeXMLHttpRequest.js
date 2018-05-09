const fs = require('fs');
const MODFILEPATH = './test/unit/resources/Skid_Row2.mod';

// Polyfill XMLHttpRequest
const FakeXMLHttpRequest = function() {};
FakeXMLHttpRequest.prototype.open = function(fakeUrl) {
    var buf  = fs.readFileSync(MODFILEPATH);
    var ab   = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i];
    }
    this.onreadystatechange({response: ab});
};

export default FakeXMLHttpRequest;