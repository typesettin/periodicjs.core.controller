'use strict';
/*
 * manuscript
 * http://github.com/typesettin/periodicjs.core.controller
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

module.exports = function (grunt) {
	grunt.initConfig({
		jsbeautifier: {
			files: ['<%= jshint.all %>'],
			options: {
				config: '.jsbeautify'
			}
		},
		simplemocha: {
			options: {
				globals: ['should', 'navigator'],
				timeout: 3000,
				ignoreLeaks: false,
				ui: 'bdd',
				reporter: 'spec'
			},
			all: {
				src: 'test/**/*.js'
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'index.js',
				'lib/**/*.js',
				'test/**/*.js',
				'package.json'
			]
		},
		jsdoc: {
			dist: {
				src: ['lib/**/*.js', 'test/**/*.js'],
				options: {
					destination: 'doc/html',
					configure: 'jsdoc.json'
				}
			}
		},
		watch: {
			scripts: {
				files: ['<%= jshint.all %>'],
				tasks: ['newer:simplemocha:all', 'newer:jshint:all', 'newer:jsbeautifier'],
				options: {
					interrupt: true
				}
			}
		}
	});

	// Loading dependencies
	for (var key in grunt.file.readJSON('package.json').devDependencies) {
		if (key.indexOf('grunt') === 0 && key !== 'grunt') {
			grunt.loadNpmTasks(key);
		}
	}
	grunt.registerTask('lint', 'jshint', 'jsbeautifier');
	grunt.registerTask('doc', 'jsdoc');
	grunt.registerTask('test', 'simplemocha');
	grunt.registerTask('default', ['lint', 'doc', 'test']);
};
