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
  cascadeDeploy: { // this identifies the cascadeDeploy section
    'default': { // a callable deployment configuration, you can have more than one
      options: {
        url: '', // required http(s)://cascade.yourdomain.edu
        site: '' // optional, a default setting for site that can be overridden by the files section
      },
      files: [
        {src: [], site: '', dest: '', type: 'file'},
        {src: [], site: '', dest: '', type: 'file', rewriteLinks: true, maintainAbsoluteLinks: true},
        //src globable name pattern for local files
        //site only needed if overriding options.site
        //dest -- a cascade folder path eg '/_internal'
        //type -- for now always file
      ]
    }
  }
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

* 2014-07-20 added options for rewriteLinks and maintainAbsoluteLinks
* 2013-09-17 version 0.2.0 launched at Cascade Server Users Conference #csuc13
