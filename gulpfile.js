var gulp = require('gulp');
var del = require('del');
var inject = require('gulp-inject');
var useref = require('gulp-useref');
var gulpIf = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var order = require('gulp-order');
var browserSync = require('browser-sync');
var proxyMiddleware = require('http-proxy-middleware');
var watch = require('gulp-watch');
var templateCache = require('gulp-angular-templatecache');
var replace = require('gulp-replace');
var config = require('./gulp.conf.js');

var target = 'http://localhost:8989';

gulp.task('clean', function() {
	del.sync(['build']);
});

gulp.task('inject', function() {

	var js = gulp.src(config.js, {read: false}).pipe(order(config.jsOrder));
	var css = gulp.src(config.css, {read: false}).pipe(order(config.cssOrder));

	return gulp
		.src(config.index)
		.pipe(inject(js, {addPrefix: '../src', relative: true}))
		.pipe(inject(css, {addPrefix: '../src', relative: true}))
		.pipe(gulp.dest(config.src))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('browserSync', function() {
	// 代理配置, 实现环境切换
	var middleware = proxyMiddleware(['/users'], {target: target, changeOrigin: true});
	browserSync({
		server: {
			baseDir: './',
			index: 'src/index.html',
			middleware: middleware
		}
	});
});

gulp.task('watch', function() {
	// gulp.watch(['./src/**/*.js'], ['inject']);
	// gulp watch 无法监听增加文件和删除文件, 查看 github issue, 他们不准备fix了, 等4.0 呵呵吧
	watch('src/**/*.js', function() {
		gulp.run('inject');
	});
	watch('src/**/*.css', function() {
		gulp.run('inject');
	});
});

gulp.task('dev', ['inject', 'browserSync', 'watch']);

gulp.task('build', ['inject', 'template'], function() {

	return gulp.src(config.index)
		.pipe(useref())
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulpIf('*.css', minifyCss()))
		.pipe(replace('<!--template.js-->', '<script src="js/templates.js"></script>'))
		.pipe(gulp.dest(config.build));
});

gulp.task('template', function() {
	return gulp.src(config.template)
		.pipe(templateCache('templates.js', {'root': './src/app', 'module': 'app'}))
		.pipe(gulp.dest(config.build + 'js'));
});
