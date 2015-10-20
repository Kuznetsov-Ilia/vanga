import gulp from 'gulp';
import eslint from 'gulp-eslint';
import mocha from 'gulp-mocha';
import path from 'path';
import vanga from './index.gulp';
import rename from 'gulp-rename';
gulp.task('eslint', () => {
  return gulp.src([
    'gulpfile.babel.js',
    'src/**/*.js',
    'webpack/*.js',
    '!**/__tests__/*.*'
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failOnError());
});

gulp.task('test', (done) => gulp
  
  .src('test/*.js', {read: false})
  .pipe(mocha({reporter: 'nyan'}))
);

gulp.task('gen', (done) => gulp
  .src('test/*.xml')
  //.src('test/importVars.xml')
  .pipe(vanga())
  .pipe(rename({extname: '.js'}))
  .pipe(gulp.dest('build'))
);

/*
gulp.task('tdd', (done) => {
});
*/
//gulp.task('default', ['dev']);
