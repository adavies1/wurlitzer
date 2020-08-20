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
                        configFile: 'tsconfig.players.dev.json'
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
    devtool: 'inline-source-map'
};

module.exports = [
    {
        ...config,
        entry: {
            protracker: './src/players/Protracker/ProtrackerAudioWorkletProcessor.ts'
        },
        target: 'webworker',
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist', 'players')
        }
    }
];
