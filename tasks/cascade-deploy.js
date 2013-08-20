/*
* grunt-cascade-deploy
* https://github.com/jraller/grunt-cascade-deploy
*
* Copyright (c) 2013 Jason Aller
* Licensed under the MIT license.
*/

/*jslint node: true */

'use strict';

module.exports = function (grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	var nextList = [],
		soap = require('soap-cascade'), // https://npmjs.org/package/soap-js - apply patch - https://github.com/milewise/node-soap/issues/143
		client = {},
		soapArgs = {
			authentication: {
				password: '',
				username: ''
			},
			identifier: {
				path: {
					path: '',
					siteName: 'SOAP'
				},
				type: 'folder',
				recycled: false
			}
		};

	function next() {
		var todo,
			current,
			task,
			args = {};
		if (arguments.length > 0) { // if we were called with something to add to the list
			if (!Array.isArray(arguments['0'])) { // if it was not an array make it into one
				todo = [arguments];
			} else { // break out the array
				todo = [];
				arguments['0'].forEach(function (item) {
					todo.push(item);
				});
			}
			nextList = todo.concat(nextList); // add the items to the front of the array and Wes suggests unshifting these onto the existing array as being faster
		}
		if (nextList.length > 0) { // if there are things to process
			current = Array.prototype.slice.apply(nextList.shift());
			task = current[0];
			args = current.slice(1);
			task.apply(null, args);
		}
	}

	function report(message) {
		if (typeof message === 'string') {
			console.log(message);
		} else {
			console.dir(message);
		}
		next();
	}

	function handleError(err) {
		if (err.code === 'ECONNRESET') {
			report('SAW ECONNRESET');
	//		next(report, 'SAW ECONNRESET');
	//		next(); // should be fixed in nodejs v0.11+
		} else {
			next(report, err);
		}
	}

	function handleAsset(asset) {
		console.log(asset.path, asset.site, asset.dest, asset.type);
		next();
	}

	grunt.registerMultiTask('cascadeDeploy', 'Deploy assets to Casacde Server.', function () {
	// Merge task-specific and/or target-specific options with these defaults.
		var done = this.async(),
			url = grunt.config('cascadeDeploy.default.options.url'),
			wsPath = '/ws/services/AssetOperationService?wsdl',
			tasks = [];

		grunt.config.requires('cascadeDeploy');

		// require prompt:cascadeAuthentication to have been run

		console.log(grunt.config('cascadeDeploy.default.options.authentication.username'));
		console.log(grunt.config('cascadeDeploy.default.options.authentication.password'));

		this.files.forEach(function (f) {

			// process specified files.
			f.src.filter(function (filepath) {
				// Warn on and remove invalid source files (if nonull was set).
				var exists = false;
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					exists = false;
				} else {
					exists = true;
				}
				return exists;
			}).map(function (filepath) {
				tasks.push(
					[
						handleAsset,
						{
							'path': filepath,
							'site': f.site || grunt.config('cascadeDeploy.default.options.site'),
							'dest': f.dest,
							'type': f.type
						}
					]
				);
			});
		});

		soap.createClient(url + wsPath, function (err, newClient) {
			if (err) {
				next(handleError, err);
			} else {
				client = newClient;
				next(tasks);
//				next(uploadReport);
				next(done);
			}
		});
	});
};
