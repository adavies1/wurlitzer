const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        main: './src/index.ts',
        protracker: './src/players/Protracker/Protracker.ts'
    },
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
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
};
