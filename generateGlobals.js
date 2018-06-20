const fs = require('fs');

const globals = {
    modFilePath: `${__dirname}/test/unit/resources/Skid_Row2.mod` ,
    modFileUrl: '/base/test/unit/resources/Skid_Row2.mod'
}

const output = '"use strict";\n\n(window || global).globals = JSON.parse(\'' + JSON.stringify(globals) + '\')';

fs.writeFile("./globals.js", output, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("globals.js has been generated successfully.");
});