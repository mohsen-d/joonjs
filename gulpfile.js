
var gulp  = require('gulp'),
    jshint = require('gulp-jshint');

// jshint joon.js
gulp.task('jshint', function() {
  return gulp.src('source/joon.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});
