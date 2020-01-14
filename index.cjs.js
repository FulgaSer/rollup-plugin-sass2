'use strict';

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
    var styles = {};
    return {
        name: 'sass',
        load: function (id) {
            if (!support(id))
                return null;
            var self = this;
            var result = sass.renderSync(Object.assign({}, options, {
                file: id,
                importer: [function (url, importer) {
                        var dir = path.dirname(importer);
                        var file = resolve.sync(path.resolve(dir, url), { extensions: CSS_EXT });
                        var contents = fs.readFileSync(file, 'utf8');
                        self.addWatchFile(file);
                        return { file: file, contents: rebaseAssets(contents, path.dirname(file), dir) };
                    }].concat(options.importer).filter(function (item) { return item; })
            }));
            return result.css.toString();
        },
        transform: function (code, id) {
            if (support(id)) {
                styles[id] = code;
                return "export default " + JSON.stringify(code);
            }
        },
        generateBundle: function (output, bundle) {
            if (options.outFile || output.file) {
                var file = options.outFile || output.file;
                var dir_1 = path.dirname(file);
                var css_1 = '';
                forEach(styles, function (style, file) {
                    css_1 += rebaseAssets(style, path.dirname(file), dir_1);
                });
                if (support(output.file)) {
                    var name_1 = path.basename(output.file);
                    bundle[name_1].code = css_1;
                }
                else {
                    var dest_1 = file.replace(FILE_EXT, '.css');
                    mkdir(dir_1);
                    fs.writeFile(dest_1, css_1, function (err) {
                        if (err)
                            console.log(red(err.code));
                        else
                            console.log(green('created ' + path.relative(__dirname, dest_1)));
                    });
                }
            }
            if (options.outDir || output.dir) {
                var dir_2 = path.resolve(options.outDir || output.dir);
                mkdir(dir_2);
                forEach(styles, function (style, file) {
                    var dest = path.resolve(dir_2, path.basename(file));
                    fs.writeFile(dest, rebaseAssets(style, path.dirname(file), dir_2), function (err) {
                        if (err)
                            console.log(red(err.code));
                        else
                            console.log(green('created ' + path.relative(__dirname, dest)));
                    });
                });
            }
        }
    };
}
function support(url) {
    for (var i = 0; i < CSS_EXT.length; i++) {
        if (url.match(new RegExp(CSS_EXT[i] + '$')))
            return true;
    }
    return false;
}
function rebaseAssets(content, base, newbase) {
    return content.replace(CSS_URL, function (e, match) {
        var asset = match.replace(/["']/g, '').trim();
        if (!path.isAbsolute(asset)) {
            var file = path.resolve(base, asset);
            var relative = path.relative(newbase, file);
            asset = relative.replace(/\\/g, "/");
        }
        return "url('" + asset + "')";
    });
}
function forEach(obj, iteraction, context) {
    if (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                iteraction.call(context, obj[key], key);
            }
        }
    }
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
        }
    }
}

module.exports = sassPlugin;
