var createFilter=require('rollup-pluginutils').createFilter;
var sass=require('node-sass');
var path=require('path');
var fs=require('fs');
var resolve=require('resolve');

var CSS_EXT=['.scss','.sass','.css'];
var CSS_URL=/url\(([^)]*)\)/gi;
var FILE_EXT=/\.[a-z]{2,4}$/i;
/**
 * @param {Object} config
 * @param {string} config.data
 * @param {Function|Function[]} config.importer
 * @param {string[]} config.exclude
 * @param {Function[]} config.functions
 * @param {Function[]} config.includePaths
 * @param {string} config.outputStyle
 * @param {string} config.outFile
 * @param {number} config.indentWidth
 * @param {boolean} config.indentedSyntax
 * @param {string} config.indentType
 * @param {number} config.precision
 * @param {string|boolean} config.sourceMap
 * @param {boolean} config.sourceComments
 */
module.exports = function(config = {}) {
    let filter = createFilter( ['**/*.css', '**/*.scss', '**/*.sass'],config.exclude);
    let styles=[];

    return {
        name: 'sass',
        load(id) {
            if (!filter(id)) return;

            let base=path.dirname(id);
            let result = sass.renderSync(Object.assign({},config,{
                file:id,
                importer:array_merge(function (url,prev) {
                    let dir=prev==='stdin'?base:path.dirname(prev);
                    let file=resolve.sync(path.resolve(dir,url),{extensions:CSS_EXT});
                    let contents=fs.readFileSync(file,'utf8');

                    return {
                        file:file,
                        contents:rebase_assets(path.dirname(file),base,contents)
                    }
                },config.importer)
            }));
            styles=styles.filter((item)=>item.file!==id);
            styles.push({
                file:id,
                base:base,
                css:result.css.toString()
            });
            result.stats.includedFiles.map(this.addWatchFile,this);
            return ''
        },
        generateBundle(options) {
            if(config.outFile || options.file){
                let dest=config.outFile || options.file;
                let base=path.dirname(dest);
                let css='';

                if(!filter(dest)){
                    dest=dest.replace(FILE_EXT,'.css');
                }
                mkdir(base);
                styles.forEach(function (style) {
                    css+=rebase_assets(style.base, base, style.css)
                });

                fs.writeFile(dest,css,function (err) {
                    if (err) {
                        console.error(red(err));
                    } else{
                        console.log(green('created '+dest+' '+size(css.length)));
                    }
                });
            }
        }
    }
};

function rebase_assets(dir1,dir2,content) {
    return content.replace(CSS_URL,function (e,match) {
        let asset=match.replace(/["']/g,'').trim();

        if(!path.isAbsolute(asset)){
            let assetFile=path.resolve(dir1,asset);
            let assetRelative=path.relative(dir2,assetFile);

            asset=assetRelative.replace(/\\/g,"/");
        }
        return "url('"+asset+"')";
    })
}

function array_merge() {
    let arr,i;

    for(i=0,arr=[];i < arguments.length;i++){
        if(arguments[i]!==void(0)){
            arr.push(arguments[i]);
        }
    }
    return arr;
}

function red (text) {
    return '\x1b[1m\x1b[31m' + text + '\x1b[0m'
}

function green (text) {
    return '\x1b[1m\x1b[32m' + text + '\x1b[0m'
}

function mkdir (dir) {
    if (fs.existsSync(dir))  return;
    try {
        fs.mkdirSync(dir)
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            mkdir(path.dirname(dir));
            mkdir(dir)
        }
    }
}

function size (bytes) {
    return bytes < 10000
        ? bytes.toFixed(0) + ' B'
        : bytes < 1024000
            ? (bytes / 1024).toPrecision(3) + ' kB'
            : (bytes / 1024 / 1024).toPrecision(4) + ' MB'
}
