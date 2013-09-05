# grunt-cascade-deploy

> Cascade Server Web Services Deploy

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-cascade-deploy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cascade-deploy');
```

## The "cascade" task

### Overview
In your project's Gruntfile, add a section named `cascadeDeploy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  cascadeDeploy: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Roadmap

Initial release with:
* deploy files (.js, .css, images, documents)
* create supporting folder path
* for existing files compare local to server and only edit if needed.

Future releases:
* deploy additional asset types template, page, configuration set, content type, formats

Not planned for this tool:
* Site setup tool - perhaps as a separate tool
* data definition migrations - between versions of a DD, page with DD to Structured Data Block, etc

## Release History
_(Nothing yet)_
