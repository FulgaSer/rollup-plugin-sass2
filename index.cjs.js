'use strict';

var rollupPluginutils = require('rollup-pluginutils');
var path = require('path');
var fs = require('fs');
var sass = require('node-sass');
var resolve = require('resolve');

var CSS_EXT = ['.scss', '.sass', '.css'];
var CSS_URL = /url\(([^)]*)\)/gi;
var FILE_EXT = /\.[a-z]{2,4}$/i;
/**
 * @param {Object} options
 * @param {string} options.data
 * @param {Function|Function[]} options.importer
 * @param {string[]} options.exclude
 * @param {Function[]} options.functions
 * @param {Function[]} options.includePaths
 * @param {string} options.outputStyle
 * @param {string} options.outFile
 * @param {string} options.outDir
 * @param {number} options.indentWidth
 * @param {boolean} options.indentedSyntax
 * @param {string} options.indentType
 * @param {number} options.precision
 * @param {string|boolean} options.sourceMap
 * @param {boolean} options.sourceComments
 */
function sassPlugin(options) {
    if (options === void 0) { options = {}; }
    var filter = rollupPluginutils.createFilter(['**/*.css', '**/*.scss', '**/*.sass'], options.exclude);
    var styles = {};
    return {
        name: 'sass',
        load: function (id) {
            if (!filter(id))
                return;
            var base = path.dirname(id);
            var result = sass.renderSync(Object.assign({}, options, {
                file: id,
                importer: array_merge(function (url, prev) {
                    var dir = prev === 'stdin' ? base : path.dirname(prev);
                    var file = resolve.sync(path.resolve(dir, url), { extensions: CSS_EXT });
                    var contents = fs.readFileSync(file, 'utf8');
                    return {
                        file: file,
                        contents: rebase_assets(file, base, contents)
                    };
                }, options.importer)
            }));
            styles[id] = result.css.toString();
            result.stats.includedFiles.map(this.addWatchFile, this);
            return '';
        },
        generateBundle: function (output) {
            if (options.outDir || output.dir) {
                var base_1 = path.resolve(options.outDir || output.dir);
                mkdir(base_1);
                Object.keys(styles).forEach(function (style) {
                    var file = path.basename(style).replace(FILE_EXT, '.css');
                    var dest = path.resolve(base_1, file);
                    fs.writeFile(dest, rebase_assets(style, base_1, styles[style]), function (err) {
                        if (err)
                            console.error(red(err.code));
                        else
                            console.log(green('created ' + path.relative(__dirname, dest)));
                    });
                });
                return;
            }
            if (options.outFile || output.file) {
                var dest_1 = options.outFile || output.file;
                var base_2 = path.dirname(dest_1);
                var css_1 = '';
                mkdir(base_2);
                Object.keys(styles).forEach(function (style) {
                    css_1 += rebase_assets(style, base_2, styles[style]);
                });
                if (!filter(dest_1))
                    dest_1 = dest_1.replace(FILE_EXT, '.css');
                setTimeout(function () {
                    fs.writeFile(dest_1, css_1, function (err) {
                        if (err)
                            console.error(red(err.code));
                        else
                            console.log(green('created ' + path.relative(__dirname, dest_1)));
                    });
                });
            }
        }
    };
}
function rebase_assets(file, base, content) {
    return content.replace(CSS_URL, function (e, match) {
        var asset = match.replace(/["']/g, '').trim();
        if (!path.isAbsolute(asset)) {
            var assetFile = path.resolve(path.dirname(file), asset);
            var assetRelative = path.relative(base, assetFile);
            asset = assetRelative.replace(/\\/g, "/");
        }
        return "url('" + asset + "')";
    });
}
function array_merge() {
    var arr, i;
    for (i = 0, arr = []; i < arguments.length; i++) {
        if (arguments[i] !== void (0)) {
            arr.push(arguments[i]);
        }
    }
    return arr;
}
function red(text) {
    return '\x1b[1m\x1b[31m' + text + '\x1b[0m';
}
function green(text) {
    return '\x1b[1m\x1b[32m' + text + '\x1b[0m';
}
function mkdir(dir) {
    if (fs.existsSync(dir))
        return;
    try {
        fs.mkdirSync(dir);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            mkdir(path.dirname(dir));
            mkdir(dir);
        }
    }
}

module.exports = sassPlugin;
