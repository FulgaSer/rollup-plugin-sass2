# Rollup Plugin for Sass
Bundle sass,scss and css files\
Folder support \
Watch mode support\
Rebase relative assets 

## Installation
```bash
npm install rollup-plugin-sass2 --save-dev 
```
## Options
See the Node Sass [options](https://github.com/sass/node-sass#options), except for file.

## Usage
```js
// rollup.config.js
// export styles to "dest/app.css"
import sass from 'rollup-plugin-sass2';

export default {
    input:'src/app.js',
    output:{
        format:'esm',
        file:'dest/app.js'
    },
    plugins: [
        sass()
    ]
};
```
## Export to custom file 
```js
// rollup.config.js
import sass from 'rollup-plugin-sass2';

export default {
    input:'src/app.js',
    output:{
        format:'esm',
        file:'dest/app.js'
    },
    plugins: [
        sass({ 
            outFile:'css/default.css'
        })
    ]
};
```