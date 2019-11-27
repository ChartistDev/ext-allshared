{
    "name": "@sencha/ext-{framework}{bundle}",
    "version": "7.1.0",
    "main2": "ext-{framework}{bundle}.module.js",
    "main": "index.js",
    "private": false,
    "bin": {
      "ext-{framework}{bundle}": "./bin/ext-{framework}{bundle}.js"
    },
    "scripts": {
      "watch": "npx babel ./src --out-dir ./dist --watch",
      "build": "npx babel ./src --out-dir ./dist",
      "prepare": "npm run build"
    },
    "homepage": "https://github.com/sencha/ext-{framework}#readme",
    "peerDependencies": {},
    "dependencies": {},
    "devDependencies": {
      "@sencha/ext-runtime-base": "~7.1.0",
      "object-assign": "~4.1.0",
      "pascal-case": "~2.0.1",
      "script-loader": "^0.7.2",
      "comment-json": "^2.2.0",
      "@babel/runtime": "^7.6.2",
      "html-parsed-element": "^0.4.0",
      "@babel/cli": "^7.6.2",
      "@babel/core": "^7.6.2",
      "@babel/plugin-proposal-class-properties": "^7.5.5",
      "@babel/plugin-proposal-decorators": "^7.6.0",
      "@babel/plugin-proposal-export-namespace-from": "^7.5.2",
      "@babel/plugin-proposal-function-sent": "^7.5.0",
      "@babel/plugin-proposal-json-strings": "^7.2.0",
      "@babel/plugin-proposal-numeric-separator": "^7.2.0",
      "@babel/plugin-proposal-throw-expressions": "^7.2.0",
      "@babel/plugin-syntax-dynamic-import": "^7.2.0",
      "@babel/plugin-syntax-import-meta": "^7.2.0",
      "@babel/plugin-transform-runtime": "^7.6.2",
      "@babel/preset-env": "^7.6.2"
    },
    "repository": {
      "type": "git",
      "url": "git+https://github.com/sencha/ext-{framework}{bundle}"
    },
    "keywords": [],
    "author": "Sencha",
    "license": "ISC"
  }