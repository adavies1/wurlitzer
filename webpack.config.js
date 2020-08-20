const path = require('path');
const webpack = require('webpack');

const config = {
    entry: {},
    mode: 'production',
    target: 'web',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.players.build.json'
                    }
                },
                exclude: /node_modules/,
            }
        ]
    },
    output: {},
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx']
    }
};

module.exports = [
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
