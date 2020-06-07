const path = require('path');
const webpack = require('webpack');

module.exports = [
    {
        entry: {
            main: './src/index.ts'
        },
        mode: 'development',
        target: 'web',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                    },
                    exclude: /node_modules/,
                }
            ]
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist')
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx']
        },
        devServer: {
            publicPath: '/dist/',
            hot: false,
            inline: false,
            injectClient: false,
            injectHot: false,
            liveReload: false
        },
        devtool: 'inline-source-map'
    },
    {
        entry: {
            protracker: './src/players/Protracker/ProtrackerAudioWorkletProcessor.ts'
        },
        mode: 'development',
        target: 'webworker',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                    },
                    exclude: /node_modules/,
                }
            ]
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist')
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx']
        },
        devServer: {
            publicPath: '/dist/',
            hot: false,
            inline: false,
            injectClient: false,
            injectHot: false,
            liveReload: false
        },
        devtool: 'inline-source-map'
    }
];
