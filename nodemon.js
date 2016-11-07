var nodemon = require('nodemon');
nodemon({
        script: 'app.js',
    stdout: false // important: this tells nodemon not to output to console
}).on('readable', function() { // the `readable` event indicates that data is ready to pick up
    this.stdout.pipe(fs.createWriteStream('public/output.txt'));
    this.stderr.pipe(fs.createWriteStream('public/err.txt'));
});