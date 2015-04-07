var gulp         = require('gulp');
var fs           = require('fs');
var markoComplie = require('./index');
var express      = require('express');
var path         = require('path');
var app          = express();

var server;

process.on('SIGINT', function () {
    rmdir('./.cache/');
    rmdir('./build/');
    process.exit();
});

gulp.task('default', ['startServer'], function() {
});

gulp.task('preComplied', function(){
    gulp.src('./index.marko')
        .pipe(markoComplie({
            destination:'build',
            outputDir:'src',
            prefix:'gulpTest',
            minify:true
        }))
});

gulp.task('startServer', ['preComplied'], function(){

    var root = path.normalize(__dirname + '/build');
    app.use(express.static(root));

    app.set('port', process.env.PORT || 8080);
    var tmplMarko = require.resolve('./build/index.marko');
    var tmpl = require('marko').load(tmplMarko);

    app.get('/', function (req, res) {
        tmpl.render({ name: '.marko var!'}, res);
    });

    server = app.listen(app.get('port'), function() {
        console.log('Express server listening on port ' + server.address().port);
    });

});

var rmdir = function(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);
        if(filename == "." || filename == "..") {
        } else if(stat.isDirectory()) {
            rmdir(filename);
        } else {
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
};