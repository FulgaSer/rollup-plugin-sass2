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

### Base Example
```js
// bundle all styles imports from javascript in one file "dest/app.css"
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

### Custom file
```js
// bundle all styles imports from javascript in one file "css/default.css"
import sass from 'rollup-plugin-sass2';

export default {
    input:'src/app.js',
    output:{
        format:'esm',//any format
        file:'dest/app.js'
    },
    plugins: [
        sass({ 
            outFile:'css/default.css'
        })
    ]
};
```

### Example without javascript 
```js
// bundle all in one file "css/main.css"
import sass from 'rollup-plugin-sass2';

export default {
    input:'src/main.scss',
    output:{
        format:'esm',// only esm format support
        file:'css/main.css'
    },
    plugins: [
        sass()
    ]
};
```

### Multiple export example  
```js
//rollup.config.js
import sass from 'rollup-plugin-sass2';
export default {
    input:'src/app.js',
    output:{
        format:'esm',//any format
        dir:'dest'
    },
    plugins: [
        sass()
    ]
};
```
```js
//src/app.js
import './styles/main.scss';
import './styles/default.scss';

/*
 rollup create files:
    "dest/app.js"
    "dest/main.css"
    "dest/default.css"
*/
```
### Custom Folder
```js
import sass from 'rollup-plugin-sass2';

export default {
    input:'src/app.js',
    output:{
        format:'esm',
        file:'src/app.js'
    },
    plugins: [
        sass({outDir:'css'})
    ]
};
```

## Watch example 
package.json
```json
{
  "scripts": {
      "build": "rollup -c -w"
  }
}
```