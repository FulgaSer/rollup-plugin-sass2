interface SassImporter {
    (url: string, prev?: string, done?: Function): {
        file: string;
        contents: string;
    };
}
interface SassOptions {
    data?: string;
    exclude?: string[];
    outFile?: string;
    outDir?: string;
    importer?: SassImporter | SassImporter[];
    functions?: {
        [fnName: string]: Function;
    };
    indentWidth?: number;
    outputStyle?: string;
    indentedSyntax?: boolean;
    sourceMap?: boolean | string;
    sourceComments?: boolean;
    precision?: number;
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
export default function sassPlugin(options?: SassOptions): {
    name: string;
    load(id: any): any;
    transform(code: any, id: any): string;
    generateBundle(output: any, bundle: any): void;
};
export {};
