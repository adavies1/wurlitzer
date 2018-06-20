export function loadFileFromDisk(sourceFile) {
    if(!sourceFile instanceof File) {
        console.error('loadFileFromDisk called without passing a file reference', sourceFile);
        return Promise.reject({
            message: 'Not a File',
            input: sourceFile
        });
    }
    else {
        return new Promise((resolve, reject) => {
            const reader = new FileReader;

            reader.onload = fileData => {
                console.log(`Successfully read '${sourceFile}'`);
                if(fileData) {
                    resolve(fileData);
                }
                else {
                    console.error(`Failed to read '${sourceFile}'`);
                    reject("EMPTY", "File is empty");
                }
            };
            reader.onerror = () => {
                reject("TIMEOUT", "Request timed out");
            };
            reader.onabort = () => {
                reject('ABORT', "Request aborted");
            };

            console.log(`Attempting to read file from disk: '${sourceFile}'`);
            reader.readAsArrayBuffer(sourceFile);
        })
    }
};

export function loadFileFromUrl(sourceUrl) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('GET', sourceUrl, true);
        req.responseType = 'arraybuffer';

        req.onload = () => {
            console.log(`[SUCCESS] Successfully read from '${sourceUrl}'`);
            if(req.response) {
                resolve(req.response);
            }
            else {
                console.error(`[FAIL] Empty file at '${sourceUrl}'`);
                reject("EMPTY", "File is empty");
            }
        }
        req.onerror = function() {
            console.error(`[FAIL] Network error when reading from '${sourceUrl}'`);
            reject("ERROR", "Network error");
        };
        req.ontimeout = function() {
            console.error(`[FAIL] Timeout when reading from '${sourceUrl}'`);
            reject("TIMEOUT", "Request timed out");
        };
        req.onabort = function() {
            console.log(`[ABORT] Aborted reading from '${sourceUrl}'`);
            reject('ABORT', "Request aborted");
        };

        console.log(`[INFO] Attempting to read file from URL: '${sourceUrl}'`);

        req.send();
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

