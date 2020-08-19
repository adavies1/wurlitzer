const path = require('path');
const webpack = require('webpack');

const config = {
    entry: {},
    mode: 'development',
    target: 'web',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.dev.json'
                    }
                },
                exclude: /node_modules/,
            }
        ]
    },
    output: {},
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
};

module.exports = [
    {
        ...config,
        entry: {
            dev: './src/index.ts',
            //player: './src/MusicPlayer.ts'
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist')
        }
    },
    {
        ...config,
        entry: {
            protracker: './src/players/Protracker/ProtrackerAudioWorkletProcessor.ts'
        },
        target: 'webworker',
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist', 'players')
        }
    }
];
