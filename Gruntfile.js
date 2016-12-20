'use strict';
/*
 * manuscript
 * http://github.com/typesettin/periodicjs.core.controller
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
var testPaths = 'test/**/*.js';

module.exports = function (grunt) {
	grunt.initConfig({
		jsbeautifier: {
			files: ['<%= jshint.all %>'],
			options: {
				config: '.jsbeautify'
			}
		},
		mocha_istanbul: {
      coveralls: {
        src: testPaths, // multiple folders also works
        options: {
          coverageFolder: 'coverage', // will check both coverage folders and merge the coverage results
          coverage:true, // this will make the grunt.event.on('coverage') event listener to be triggered
          check: {
            lines: 5,
            branches: 5,
            functions: 5,
            statements: 5,
          },
          // root: './lib', // define where the cover task should consider the root of libraries that are covered by tests
          reportFormats: ['cobertura','lcovonly'],
        }
      }
    },
    istanbul_check_coverage: {
      default: {
        options: {
          coverageFolder: 'coverage', // will check both coverage folders and merge the coverage results
          check: {
            lines: 80,
            branches: 80,
            functions: 80,
            statements: 80,
          },
        },
      },
    },
    coveralls: {
    // Options relevant to all targets
      options: {
        // When true, grunt-coveralls will only print a warning rather than
        // an error, to prevent CI builds from failing unnecessarily (e.g. if
        // coveralls.io is down). Optional, defaults to false.
        force: false,
      },

      all: {
        // LCOV coverage file (can be string, glob or array)
        src: 'coverage/*.info',
        options: {
          // Any options for just this target
        },
      },
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
				src: ['lib/**/*.js', 'utility/**/*.js', 'index.js'],
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
	grunt.registerTask('default', ['lint', 'doc', 'test']);
  grunt.registerTask('test', 'mocha_istanbul');
};
