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
		fs = require('fs'),
		path = require('path'),
		client = {},
		soapArgs = {
			authentication: {
				password: '',
				username: ''
			},
			identifier: {
				path: {
					path: '/index',
					siteName: 'Jason'
				},
				type: 'file',
				recycled: 'false'
			}
		};


	function enstack() {
		var todo;
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
	}

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

	/*
	starting with the root folder read and create folders as needed until full path is built and then create the asset;
	*/
	function createAsset(asset) {
		console.log('create Asset: ' + asset.path);

		var createArgs = {},
			local,
			assetName = path.basename(asset.path);

		createArgs.authentication = soapArgs.authentication;
		createArgs.asset = {};
		createArgs.asset[asset.type] = {};
		createArgs.asset[asset.type].name = assetName;
		if (asset.dest === '') {
			asset.dest = '/';
		}
		createArgs.asset[asset.type].parentFolderPath = asset.dest;
		createArgs.asset[asset.type].siteName = asset.site;

		if (asset.type === 'file') {
			local = fs.readFileSync(asset.path, {encoding: 'base64'});
			createArgs.asset[asset.type].data = local;
		}

		client.create(createArgs, function (err, response) {
			if (err) {
				next(handleError, err);
			} else {
				if (response.createReturn.success.toString() === 'true') {
					next();
				} else {
					console.log(response.createReturn.message);
					next(report, 'failed to create ' + asset.path);
				}
			}
		});
	}

	function checkFolder(path, site) {
		if (path.slice(0, 1) !== '/') {
			path = '/' + path;
		}
//		console.log('check folder: ' + path);

		var readArgs = soapArgs,
			parent;
		readArgs.identifier.path.path = path;
		readArgs.identifier.path.siteName = site;
		readArgs.identifier.type = 'folder';

		client.read(soapArgs, function (err, response) {
			if (err) {
				next(handleError, err);
			} else {
				if (response.readReturn.success.toString() === 'true') {
					// we've found a good folder
					next();
				} else {
//					console.log('enstack the creation of ' + path);
					parent = path.substring(0, path.lastIndexOf('/'));

					enstack(createAsset, {
						'path': path.substring(path.lastIndexOf('/')),
						'site': site,
						'dest': parent,
						'type': 'folder'
					});
					if (path.indexOf('/') !== -1) { // only checking for / here in path
						checkFolder(parent, site);
					} else {
						console.log('we ran out of path to check?');
						next();
					}
				}
			}
		});
	}

	function handleAsset(asset) {
		var server,
			local,
			editArgs,
			missingMessage = '',
			assetName = path.basename(asset.path);

		if (asset.dest.slice(-1) === '\\' || asset.dest.slice(-1) === '/') { // should this be only / ?
			asset.dest = asset.dest.substr(0, asset.dest.length - 1);
		}

		soapArgs.identifier.path.path = path.join(asset.dest, assetName).replace(/\\/g, '/');
		soapArgs.identifier.path.siteName = asset.site;
		soapArgs.identifier.type = asset.type;

//		console.log('processing: ' + soapArgs.identifier.path.path);

		client.read(soapArgs, function (err, response) {
			if (err) {
				next(handleError, err);
			} else {
				if (response.readReturn.success.toString() === 'true') {

					// now read

					server = new Buffer(response.readReturn.asset.file.data, 'base64');
					local = fs.readFileSync(asset.path);

					if (local.length !== server.length || local.toString('utf8') !== server.toString('utf8')) {
						// edit copy

						editArgs = {};
						editArgs.authentication = soapArgs.authentication;
						editArgs.asset = {};
						editArgs.asset[asset.type] = {};
						editArgs.asset[asset.type].id = response.readReturn.asset.file.id;
						editArgs.asset[asset.type].name = assetName;
						editArgs.asset[asset.type].parentFolderPath = asset.dest;
						editArgs.asset[asset.type].siteName = asset.site;
						editArgs.asset[asset.type].data = local.toString('base64');

//						console.dir(editArgs);

						client.edit(editArgs, function (err, response) {
							if (err) {
								next(handleError, err);
							} else {
								// did we get a success return?
								if (response.editReturn.success.toString() === 'true') {
									next(report, soapArgs.identifier.path.path + ' was edited');
								} else {
									next(report, 'msg:' + response.editReturn.message);
								}
							}
						});
//						next(report, asset.path + ' needs to be uploaded');
					} else {
						// was already there
						next(report, soapArgs.identifier.path.path + ' had no changes');
					}

//					next(report, response.readReturn.asset.file);
				} else {
					missingMessage = 'Unable to identify an entity based on provided entity path \'' + soapArgs.identifier.path.path + '\' and type \'' + soapArgs.identifier.type + '\'';
					if (response.readReturn.message === missingMessage) {
						// check folder path and then create copy

						next([
							[checkFolder, asset.dest, asset.site],
							[createAsset, asset]
						]);

//						next(report, 'server didn\'t have a copy of ' + soapArgs.identifier.path.path);
					} else {
						next(report, response.readReturn.message);
					}
				}
			}
		});
	}

	grunt.registerMultiTask('cascadeDeploy', 'Deploy assets to Casacde Server.', function () {
	// Merge task-specific and/or target-specific options with these defaults.
		var done = this.async(),
			url = grunt.config('cascadeDeploy.default.options.url'),
			wsPath = '/ws/services/AssetOperationService?wsdl',
			tasks = [];

		grunt.config.requires('cascadeDeploy');

		// require prompt:cascadeAuthentication to have been run
		grunt.task.requires('prompt:cascadeAuthentication');

		soapArgs.authentication.username = grunt.config('cascadeDeploy.default.options.authentication.username');
		soapArgs.authentication.password = grunt.config('cascadeDeploy.default.options.authentication.password');

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
//				tasks.push(uploadReport);
				tasks.push([report, 'end of process with report']);
				tasks.push([done]);
//				console.dir(tasks);
				next(tasks);
			}
		});
	});
};
