var gulp = require( 'gulp' ),
		sass = require( 'gulp-sass' ),
		autoprefixer = require( 'gulp-autoprefixer' ),
		minifycss = require( 'gulp-minify-css' ),
		uglify = require( 'gulp-uglify' ),
		rename = require( 'gulp-rename' ),
		clean = require( 'gulp-clean' ),
		concat = require( 'gulp-concat' );
		header = require( 'gulp-header' ),
		footer = require( 'gulp-footer' );

// styles task
gulp.task( 'styles', function() {
	return gulp.src( 'css/style.scss' )
		.pipe( sass() )
		.pipe( autoprefixer( 'last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4' ) )
		.pipe( gulp.dest( 'css' ) )
		.pipe( rename({ suffix: '.min' }) )
		.pipe( minifycss() )
		.pipe( gulp.dest( 'css' ) );
} );

// scripts task
gulp.task( 'scripts', function() {

	var customHeader = [
		'(function ( $ ) {',
		'"use strict";',
		'',
		'	$(function () {',
		'',
		''].join('\n');

	var customFooter = [
		'',
		'',
		'	});',
		'',
		'}(jQuery));'].join('\n');

	// passa an array of files instead of a blob to make sure that the files will be concatenated in the correct order
	var filesOrder = [
		'js/src/post.main.js',
		'js/src/post.Uploader.js',
		'js/src/post.addBlockMenu.js',
		'js/src/post.ParentView.js',
		'js/src/post.textView.js',
		'js/src/post.quoteView.js',
		'js/src/post.codeView.js',
		'js/src/post.audioView.js',
		'js/src/post.videoView.js',
		'js/src/post.embedView.js',
		'js/src/post.tweetView.js',
		'js/src/post.imgView.js',
		'js/src/post.galleryView.js',
		'js/src/post.View.js',
		'js/src/misc.js',
	];

	return gulp.src( filesOrder )
		.pipe( concat( 'main.js' ) )
		.pipe( header( customHeader ) )
		.pipe( footer( customFooter ) )
		.pipe( gulp.dest( 'js' ) )
		.pipe( rename({ suffix: '.min' }) )
		.pipe( uglify() )
		.pipe( gulp.dest( 'js' ) )
} );

// clean files and folders
gulp.task( 'clean', function() {
	return gulp.src( ['css', 'js' ], { read: false } )
		.pipe( clean() );
});

// default task
gulp.task( 'default', ['clean'], function() {
		gulp.run( 'styles', 'scripts' );
} );


// watch task
gulp.task( 'watch', function() {
 
	// Watch .less files
	gulp.watch( 'css/**/*.scss', function( event ) {
		console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
		gulp.run( 'styles' );
	} );
 
	// Watch .js files
	gulp.watch( 'js/**/*.js', function( event ) {
		console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
		gulp.run( 'scripts' );
	} );
  
} );

// watch task
// gulp.task('watch', function() {

// 	// Watch .scss files
// 	gulp.watch('src/styles/**/*.scss', ['styles'] );

// 	// Watch .js files
// 	gulp.watch('src/scripts/**/*.js', ['scripts'] );

// });