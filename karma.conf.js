module.exports = function(config) {
    config.set({
        browsers: ['ChromeHeadless'],
        client: {
            config: {
                mocha: {

                }
            }
        },
        files: [
            'globals.js',
            'test/unit/tests/**/*.spec.js',
            {
                // This allows karma to serve any resources (you'll get 404 otherwise)
                pattern: 'test/unit/resources/**/*',
                included: false
            }
        ],
        frameworks: ['mocha', 'chai'],
        port: 9876,
        preprocessors: {
            'test/unit/tests/**/*.js': ['webpack']
        },
        webpack: {
            mode: 'development'
        }
    })
}