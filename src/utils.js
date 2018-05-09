export function loadFileFromDisk(source) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader;

        reader.onload = fileData => {
            if(fileData) {
                resolve(fileData);
            }
            else {
                reject("EMPTY", "File is empty");
            }
        };
        reader.onerror = () => {
            reject("TIMEOUT", "Request timed out");
        };
        reader.onabort = () => {
            reject('ABORT', "Request aborted");
        };

        reader.readAsArrayBuffer(source);
    })
};

export function loadFileFromUrl(sourceUrl) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();

        req.onreadystatechange = response => {
            if(response.response) {
                resolve(response.response);
            }
            else {
                reject("EMPTY", "File is empty");
            }
        }
        req.onerror = function() {
            reject("ERROR", "Network error");
        };
        req.ontimeout = function() {
            reject("TIMEOUT", "Request timed out");
        };
        req.onabort = function() {
            reject('ABORT', "Request aborted");
        };

        req.responseType = 'arrayBuffer';
        req.open('GET', sourceUrl, true);
    });
};

export function readBigEndian16bitInt(arrayBuffer, offset) {
    return new DataView(arrayBuffer).getUint16(offset, false);
};

export function readBigEndian8bitInt(arrayBuffer, offset) {
    return new DataView(arrayBuffer).getUint8(offset, false);
};

export function readStringFromArrayBuffer(arrayBuffer, start, end) {
    return String.fromCharCode.apply(
        null,
        new Uint8Array(arrayBuffer.slice(start, end))
    );
};