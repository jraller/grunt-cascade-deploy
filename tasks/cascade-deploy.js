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
	var nextList = [],
		done,
		soap = require('soap-cascade'),
		fs = require('fs'),
		path = require('path'),
		inquirer = require('inquirer'),
		client = {},
		soapArgs = {
			authentication: {
				password: '',
				username: ''
			},
			identifier: {
				path: {
					path: '',
					siteName: ''
				},
				type: 'file',
				recycled: 'false'
			}
		},
		questions = [
			{
				type: 'input',
				name: 'username',
				message: 'Username: ',
				'default': 'yourUsernameHereIfYouWant'
			},
			{
				type: 'password',
				name: 'password',
				message: 'Password: '
			}
		];

	function enstack() {
		var todo;
		if (arguments.length > 0) {
			if (!Array.isArray(arguments['0'])) {
				todo = [arguments];
			} else {
				todo = [];
				arguments['0'].forEach(function (item) {
					todo.push(item);
				});
			}
			nextList = todo.concat(nextList);
		}
	}

	function next() {
		var todo,
			current,
			task,
			args = {};
		if (arguments.length > 0) {
			if (!Array.isArray(arguments['0'])) {
				todo = [arguments];
			} else {
				todo = [];
				arguments['0'].forEach(function (item) {
					todo.push(item);
				});
			}
			nextList = todo.concat(nextList);
		}
		if (nextList.length > 0) {
			current = Array.prototype.slice.apply(nextList.shift());
			task = current[0];
			args = current.slice(1);
			task.apply(null, args);
		}
	}

	function die() {
		nextList = [];
	}

	function report(message) {
		if (typeof message === 'string') {
			grunt.log.writeln(message);
		} else {
			grunt.log.writeFlags(message);
		}
		next();
	}

	function handleError(err, caller) {
		die();
		if (!caller) {
			caller = 'A function';
		}
		next([
			[report, caller + ' responded with: ' + err.message],
			[done]
		]);
	}

	function createAsset(asset) {
		grunt.log.writeln('create Asset: ' + asset.path);

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
		// later handle types other than file
		client.create(createArgs, function (err, response) {
			if (err) {
				next(handleError, err, 'create');
			} else {
				if (response.createReturn.success.toString() === 'true') {
					next();
				} else {
					grunt.log.writeln(response.createReturn.message);
					next(report, 'failed to create ' + asset.path);
				}
			}
		});
	}

	function checkFolder(path, site) {
		if (path.slice(0, 1) !== '/') {
			path = '/' + path;
		}
		var readArgs = soapArgs,
			parent;
		readArgs.identifier.path.path = path;
		readArgs.identifier.path.siteName = site;
		readArgs.identifier.type = 'folder';

		client.read(soapArgs, function (err, response) {
			if (err) {
				next(handleError, err, 'read folder');
			} else {
				if (response.readReturn.success.toString() === 'true') { // we've found a good folder
					next();
				} else {
					parent = path.substring(0, path.lastIndexOf('/'));
					enstack(createAsset, {
						'path': path.substring(path.lastIndexOf('/')),
						'site': site,
						'dest': parent,
						'type': 'folder'
					});
					if (path.indexOf('/') !== -1) {
						checkFolder(parent, site);
					} else {
						grunt.log.writeln('we ran out of path to check?');
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

		if (asset.dest.slice(-1) === '/') {
			asset.dest = asset.dest.substr(0, asset.dest.length - 1);
		}

		soapArgs.identifier.path.path = path.join(asset.dest, assetName).replace(/\\/g, '/'); // shouldn't need this replace
		soapArgs.identifier.path.siteName = asset.site;
		soapArgs.identifier.type = asset.type;
		client.read(soapArgs, function (err, response) {
			if (err) {
				next(handleError, err, 'read');
			} else {
				if (response.readReturn.success.toString() === 'true') {
					server = new Buffer(response.readReturn.asset.file.data, 'base64');
					local = fs.readFileSync(asset.path);
					if (local.length !== server.length || local.toString('utf8') !== server.toString('utf8')) {
						editArgs = {};
						editArgs.authentication = soapArgs.authentication;
						editArgs.asset = {};
						editArgs.asset[asset.type] = {};
						editArgs.asset[asset.type].id = response.readReturn.asset.file.id;
						editArgs.asset[asset.type].name = assetName;
						editArgs.asset[asset.type].parentFolderPath = asset.dest;
						editArgs.asset[asset.type].siteName = asset.site;
						editArgs.asset[asset.type].data = local.toString('base64');
						client.edit(editArgs, function (err, response) {
							if (err) {
								next(handleError, err, 'edit');
							} else {
								if (response.editReturn.success.toString() === 'true') {
									next(report, soapArgs.identifier.path.path + ' was edited');
								} else {
									next(report, 'msg:' + response.editReturn.message);
								}
							}
						});
					} else {
						next(report, soapArgs.identifier.path.path + ' had no changes');
					}
				} else {
					missingMessage = 'Unable to identify an entity based on provided entity path \'' + soapArgs.identifier.path.path + '\' and type \'' + soapArgs.identifier.type + '\'';
					if (response.readReturn.message === missingMessage) {
						// check folder path and then create copy
						next([
							[checkFolder, asset.dest, asset.site],
							[createAsset, asset]
						]);
					} else {
						next(report, response.readReturn.message);
					}
				}
			}
		});
	}

	function createClient() {
		var url = grunt.config('cascadeDeploy.default.options.url'),
			ws = '/ws/services/AssetOperationService?wsdl';
		soap.createClient(url + ws, function (err, clientObj) {
			if (err) {
				handleError(err, 'createClient');
			} else {
				grunt.log.writeln('Client created');
				client = clientObj;
				next();
			}
		});
	}

	function bugUser() {
		inquirer.prompt(questions, function (answers) {
			soapArgs.authentication.username = answers.username;
			soapArgs.authentication.password = answers.password;
			next();
		});
	}

	grunt.registerMultiTask('cascadeDeploy', 'Deploy assets to Casacde Server.', function () {
		// Merge task-specific and/or target-specific options with these defaults.
		var done = this.async(),
			url = grunt.config('cascadeDeploy.default.options.url'),
			wsPath = '/ws/services/AssetOperationService?wsdl',
			tasks = [];
		tasks.push([bugUser]); // prompt user
		tasks.push([createClient]); // create client
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
//		tasks.push(uploadReport);
		tasks.push([done]);
		next(tasks); // begin executing the task queue
	});
};
