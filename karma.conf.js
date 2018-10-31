var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
    config.set({
        basePath: "",
        frameworks: ["mocha", "chai"],
        files: [
            "test/unit/**/*.spec.ts",
            {
                // This allows karma to serve any resources (you'll get 404 otherwise)
                pattern: 'test/unit/resources/**/*',
                included: false
            }
        ],
        exclude: [],
        preprocessors: {
            "test/unit/**/*.ts": ["webpack", "sourcemap"],
        },
        mime: {
            'text/x-typescript': ['ts','tsx']
        },
        webpack: {
            mode: 'development',
            module: webpackConfig.module,
            resolve: webpackConfig.resolve,
            devtool: 'inline-source-map',
            plugins: [
                new webpack.SourceMapDevToolPlugin({
                    filename: null,
                    test: /\.(ts|js)($|\?)/i
                })
            ]
        },
        webpackServer: {
            noInfo: true
        },
        reporters: ["nyan"],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ["ChromeHeadless"],
        singleRun: false,
        concurrency: Infinity,
        formatError: function(msg) {
            let output = msg.replace(/webpack:\/\/\//g, '');
            output = output.substring(output.indexOf('(') + 1, output.search(' <-'));
            return output;
        }
    });
};
