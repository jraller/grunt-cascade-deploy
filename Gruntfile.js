/*
 * grunt-cascade
 * https://github.com/jraller/grunt-cascade
 *
 * Copyright (c) 2013 Jason Aller
 * Licensed under the MIT license.
 */

/*jslint node: true */

'use strict';

module.exports = function (grunt) {

  // Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>',
			],
			options: {
				jshintrc: '.jshintrc',
			},
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp'],
		},

		// Configuration to be run (and then tested).
		cascadeDeploy: {
			'default': {
				options: {
					site: 'Jason',
					url: 'http://conference.cascadeserver.com', // will append /ws/services/AssetOperationService?wsdl automatically
				},
				files: [
					{src: ['Base Folder/css/*.css'], dest: '/css', type: 'file'},
//					{src: ['Base Folder/js/**/*.js', '!**/no-deploy.js'], site: 'SOAP-Test', dest: 'js/', type: 'file'},
//					{src: ['Base Folder/js/**/*.js', '!**/no-deploy.js'], site: 'SOAP-Two', dest: 'js/', type: 'file'},
					{src: ['Base Folder/files/*'], dest: 'files/', type: 'file'},
					{src: ['Base Folder/files/*'], dest: '/files/deep/folder copy/backup', type: 'file'},
//					{src: ['Base Folder/images/*'], dest: 'images/', type: 'file'},
				],
			},
		},

		prompt: {
			cascadeAuthentication: {
				options: {
					questions: [
						{
							config: 'cascadeDeploy.default.options.authentication.username',
							type: 'input',
							message: 'Username: ',
						},
						{
							config: 'cascadeDeploy.default.options.authentication.password',
							type: 'password',
							message: 'Password:',
						},
					]
				}
			}
		},

		yuidoc: {
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					paths: 'tasks/',
					outdir: 'docs/'
				}
			},
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js'],
		},

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	// https://npmjs.org/package/grunt-contrib-yuidoc
	// http://yui.github.io/yuidoc/syntax/index.html
	grunt.loadNpmTasks('grunt-contrib-yuidoc');

	grunt.loadNpmTasks('grunt-prompt');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean', 'cascadeDeploy', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);
	
	grunt.registerTask('deploy', ['prompt:cascadeAuthentication', 'cascadeDeploy']);

};
