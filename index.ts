import {createFilter} from 'rollup-pluginutils';
import * as path from 'path';
import * as fs from 'fs';
import * as sass from 'node-sass';
import * as resolve from 'resolve';

const CSS_EXT=['.scss','.sass','.css'];
const CSS_URL=/url\(([^)]*)\)/gi;
const FILE_EXT=/\.[a-z]{2,4}$/i;

interface SassImporter{
    (url:string,prev:string,done:Function);
}

interface SassOptions {
    data?:string;
    exclude?:string[];
    outFile?:string;
    outDir?:string;
    importer?:SassImporter|SassImporter[];
    functions?:{[fnName:string]:Function}
    indentWidth?:number;
    outputStyle?:string;
    indentedSyntax?:boolean;
    sourceMap?:boolean|string;
    sourceComments?:boolean;
    precision?:number;
}

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
export default function sassPlugin(options:SassOptions = {}) {
    let filter = createFilter( ['**/*.css', '**/*.scss', '**/*.sass'],options.exclude);
    let styles={};

    return {
        name: 'sass',
        load(id) {
            if (!filter(id)) return;

            let base=path.dirname(id);
            let result = sass.renderSync(Object.assign({},options,{
                file:id,
                importer:array_merge(function (url,prev) {
                    let dir=prev==='stdin'?base:path.dirname(prev);
                    let file=resolve.sync(path.resolve(dir,url),{extensions:CSS_EXT});
                    let contents=fs.readFileSync(file,'utf8');

                    return {
                        file:file,
                        contents:rebase_assets(path.dirname(file),base,contents)
                    }
                },options.importer)
            }));
            styles[id]=result.css.toString();
            result.stats.includedFiles.map(this.addWatchFile,this);
            return ''
        },
        generateBundle(output){
            if(options.outDir || output.dir){
                let base=path.resolve(options.outDir || output.dir);

                mkdir(base);

                Object.keys(styles).forEach(function (style) {
                    let file=path.basename(style).replace(FILE_EXT,'.css');
                    let dest=path.resolve(base,file);

                    fs.writeFile(dest,rebase_assets(style,base,styles[style]),function (err) {
                        if (err) console.error(red(err.code));
                        else console.log(green('created '+path.relative(__dirname,dest)));
                    });
                });
                return
            }
            if(options.outFile || output.file){
                let dest=options.outFile || output.file;
                let base=path.dirname(dest);
                let css='';

                mkdir(base);
                Object.keys(styles).forEach(function (style) {
                    css+=rebase_assets(style, base, styles[style])
                });

                if(!filter(dest)) dest=dest.replace(FILE_EXT,'.css');
                setTimeout(function () {
                    fs.writeFile(dest,css,function (err) {
                        if (err)  console.error(red(err.code));
                        else console.log(green('created '+path.relative(__dirname,dest)));
                    });
                });
            }
        }
    }
}

function rebase_assets(file:string,base:string,content:string) {
    return content.replace(CSS_URL,function (e,match) {
        let asset=match.replace(/["']/g,'').trim();

        if(!path.isAbsolute(asset)){
            let assetFile=path.resolve(path.dirname(file),asset);
            let assetRelative=path.relative(base,assetFile);

            asset=assetRelative.replace(/\\/g,"/");
        }
        return "url('"+asset+"')";
    })
}

function array_merge(...args:any[]);

function array_merge() {
    let arr,i;

    for(i=0,arr=[];i < arguments.length;i++){
        if(arguments[i]!==void(0)){
            arr.push(arguments[i]);
        }
    }
    return arr;
}

function red (text:string) {
    return '\x1b[1m\x1b[31m' + text + '\x1b[0m'
}

function green(text:string) {
    return '\x1b[1m\x1b[32m' + text + '\x1b[0m'
}

function mkdir(dir:string) {
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