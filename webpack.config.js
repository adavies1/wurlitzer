const path = require('path');
const webpack = require('webpack');

const config = {
    entry: {},
    mode: 'production',
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
    output: {},
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx']
    }
};

module.exports = [
    {
        ...config,
        entry: {
            player: './src/MusicPlayer.ts',
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
        }
    },
    {
        ...config,
        entry: {
            protracker: './src/players/Protracker/Protracker.ts'
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist', 'players'),
        }
    }
];
