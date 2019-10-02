var utils = require('rollup-pluginutils');
var sass=require('node-sass');

module.exports=function(options) {
    if ( options === void 0 ) options = {};

    var filter = utils.createFilter( ['**/*.css', '**/*.scss', '**/*.sass'], options.exclude);

    return {
        name: 'sass',
        transform: function transform (code, id) {
            if (!filter(id)) return;


            return ''
        },
        generateBundle: function(opts) {

        }
    }
};