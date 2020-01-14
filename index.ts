import * as path from 'path';
import * as fs from 'fs';
import * as sass from 'node-sass';
import * as resolve from 'resolve';

const CSS_EXT=['.scss','.sass','.css'];
const CSS_URL=/url\(([^)]*)\)/gi;
const FILE_EXT=/\.[a-z]{2,4}$/i;

interface SassImporter{
    (url:string,prev?:string,done?:Function):{file:string,contents:string};
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
    let styles={};

    return {
        name: 'sass',
        load(id) {
            if(!support(id)) return null;

            let self=this;
            let result = sass.renderSync(Object.assign({},options,{
                file:id,
                importer:[function (url,importer) {
                    let dir = path.dirname(importer);
                    let file = resolve.sync(path.resolve(dir, url), { extensions: CSS_EXT });
                    let contents = fs.readFileSync(file, 'utf8');

                    self.addWatchFile(file);
                    return {file:file, contents:rebaseAssets(contents,path.dirname(file),dir)};
                }].concat(options.importer).filter((item)=>item)
            }));
            return result.css.toString();
        },
        transform(code,id){
            if(support(id)){
                styles[id]=code;
                return `export default ${JSON.stringify(code)}`
            }
        },
        generateBundle(output,bundle){
            if(options.outDir || output.dir) {
                let dir = path.resolve(options.outDir || output.dir);

                mkdir(dir);
                forEach(styles,function (style,file) {
                    let dest = path.resolve(dir, path.basename(file));

                    fs.writeFile(dest, rebaseAssets(style, path.dirname(file), dir), function (err) {
                        if (err) console.log(red(err.code));
                        else console.log(green('created ' + path.relative(__dirname, dest)));
                    });
                });

                return
            }

            if(options.outFile || output.file){
                let file=options.outFile || output.file;
                let dir=path.dirname(file);
                let css='';

                forEach(styles,function (style,file) {
                    css += rebaseAssets(style, path.dirname(file), dir);
                });
                if(support(output.file)){
                    let name=path.basename(output.file);
                    bundle[name].code=css;
                }
                else {
                    let dest=file.replace(FILE_EXT, '.css');

                    mkdir(dir);
                    fs.writeFile(dest, css, function (err) {
                        if (err) console.log(red(err.code));
                        else console.log(green('created ' + path.relative(__dirname, dest)));
                    });
                }
            }

        }
    }
}

function support(url){
    for(let i=0;i < CSS_EXT.length;i++){
        if(url.match(new RegExp(CSS_EXT[i]+'$'))) return true;
    }
    return false;
}

function rebaseAssets(content:string,base:string,newbase:string):string{
    return content.replace(CSS_URL, function (e, match) {
        let asset = match.replace(/["']/g, '').trim();

        if (!path.isAbsolute(asset)) {
            let file = path.resolve(base, asset);
            let relative = path.relative(newbase, file);

            asset = relative.replace(/\\/g, "/");
        }
        return "url('" + asset + "')";
    });
}

function forEach<T>(obj:T,iteraction:Function,context?:any) {
    if(obj){
        for(let key in obj){
            if(obj.hasOwnProperty(key)){
                iteraction.call(context,obj[key],key);
            }
        }
    }
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
        }
    }
}
