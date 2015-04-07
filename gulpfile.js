var gulp = require('gulp');
var markoC = require('./index');

gulp.task('default', function() {
    gulp.src('./index.marko')
        .pipe(markoC({
            destination:'build',
            prefix:'gulpTest',
            minify:true
        }));
});