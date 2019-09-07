"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._getDefaultVars = _getDefaultVars;
exports._extractFromSource = _extractFromSource;
exports._toProd = _toProd;
exports._toDev = _toDev;
exports._getAllComponents = _getAllComponents;
exports._writeFilesToProdFolder = _writeFilesToProdFolder;

function _getDefaultVars() {
  return {
    touchFile: '/src/themer.ts',
    watchStarted: false,
    buildstep: '1 of 1',
    firstTime: true,
    firstCompile: true,
    browserCount: 0,
    manifest: null,
    extPath: 'ext',
    pluginErrors: [],
    deps: [],
    usedExtComponents: [],
    rebuild: true
  };
}

function _extractFromSource(module, options, compilation, extComponents) {
  const logv = require('./pluginUtil').logv;

  const verbose = options.verbose;
  logv(verbose, 'FUNCTION _extractFromSource');
  var js = module._source._value;
  var statements = [];

  var generate = require("@babel/generator").default;

  var parse = require("babylon").parse;

  var traverse = require("ast-traverse");

  var ast = parse(js, {
    plugins: ['typescript', 'flow', 'doExpressions', 'objectRestSpread', 'classProperties', 'exportDefaultFrom', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport'],
    sourceType: 'module'
  });
  traverse(ast, {
    pre: function (node) {
      if (node.type === 'CallExpression' && node.callee && node.callee.object && node.callee.object.name === 'Ext') {
        statements.push(generate(node).code);
      }

      if (node.type === 'StringLiteral') {
        let code = node.value;

        for (var i = 0; i < code.length; ++i) {
          if (code.charAt(i) == '<') {
            if (code.substr(i, 4) == '<!--') {
              i += 4;
              i += code.substr(i).indexOf('-->') + 3;
            } else if (code.charAt(i + 1) !== '/') {
              var start = code.substring(i);
              var spaceEnd = start.indexOf(' ');
              var newlineEnd = start.indexOf('\n');
              var tagEnd = start.indexOf('>');
              var end = Math.min(spaceEnd, newlineEnd, tagEnd);

              if (end >= 0) {
                //changed this from 1 to five when adding ext- to elements
                var xtype = require('./pluginUtil')._toXtype(start.substring(5, end));

                if (extComponents.includes(xtype)) {
                  var theValue = node.value.toLowerCase();

                  if (theValue.indexOf('doctype html') == -1) {
                    var type = {
                      xtype: xtype
                    };
                    let config = JSON.stringify(type);
                    statements.push(`Ext.create(${config})`);
                  }
                }

                i += end;
              }
            }
          }
        }
      }
    }
  });
  return statements;
}

function changeIt(o) {
  const path = require('path');

  const fsx = require('fs-extra');

  const wherePath = path.resolve(process.cwd(), o.where);
  var js = fsx.readFileSync(wherePath).toString();
  var newJs = js.replace(o.from, o.to);
  fsx.writeFileSync(wherePath, newJs, 'utf-8', () => {
    return;
  });
}

function _toProd(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _toProd');

  const fsx = require('fs-extra');

  const fs = require('fs');

  const mkdirp = require('mkdirp');

  const path = require('path');

  const pathExtAngularProd = path.resolve(process.cwd(), `src/app/ext-angular-prod`);

  if (!fs.existsSync(pathExtAngularProd)) {
    mkdirp.sync(pathExtAngularProd);

    const t = require('./artifacts').extAngularModule('', '', '');

    fsx.writeFileSync(`${pathExtAngularProd}/ext-angular.module.ts`, t, 'utf-8', () => {
      return;
    });
  }

  var o = {};
  o.where = 'src/app/app.module.ts';
  o.from = `import { ExtAngularModule } from '@sencha/ext-angular'`;
  o.to = `import { ExtAngularModule } from './ext-angular-prod/ext-angular.module'`;
  changeIt(o); //   o = {}
  //   o.where = 'src/main.ts'
  //   o.from = `bootstrapModule( AppModule );`
  //   o.to = `enableProdMode();bootstrapModule(AppModule);`
  //   changeIt(o)
}

function _toDev(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _toDev');

  const path = require('path');

  const pathExtAngularProd = path.resolve(process.cwd(), `src/app/ext-angular-prod`);

  require('rimraf').sync(pathExtAngularProd);

  var o = {};
  o.where = 'src/app/app.module.ts';
  o.from = `import { ExtAngularModule } from './ext-angular-prod/ext-angular.module'`;
  o.to = `import { ExtAngularModule } from '@sencha/ext-angular'`;
  changeIt(o); //   o = {}
  //   o.where = 'src/main.ts'
  //   o.from = `enableProdMode();bootstrapModule(AppModule);`
  //   o.to = `bootstrapModule( AppModule );`
  //   changeIt(o)
}

function _getAllComponents(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _getAllComponents');

  const path = require('path');

  const fsx = require('fs-extra'); //    log(vars.app, `Getting all referenced ext-${options.framework} modules`)


  var extComponents = [];
  const packageLibPath = path.resolve(process.cwd(), 'node_modules/@sencha/ext-angular/src');
  var files = fsx.readdirSync(packageLibPath);
  files.forEach(fileName => {
    if (fileName && fileName.substr(0, 4) == 'ext-') {
      var end = fileName.substr(4).indexOf('.component');

      if (end >= 0) {
        extComponents.push(fileName.substring(4, end + 4));
      }
    }
  });
  log(vars.app, `Writing all referenced ext-${options.framework} modules`);
  return extComponents;
}

function _writeFilesToProdFolder(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _writeFilesToProdFolder');

  const path = require('path');

  const fsx = require('fs-extra');

  const packageLibPath = path.resolve(process.cwd(), 'node_modules/@sencha/ext-angular/lib');
  const pathToExtAngularProd = path.resolve(process.cwd(), `src/app/ext-angular-prod`);
  const string = 'Ext.create({\"xtype\":\"';
  vars.deps.forEach(code => {
    var index = code.indexOf(string);

    if (index >= 0) {
      code = code.substring(index + string.length);
      var end = code.indexOf('\"');
      vars.usedExtComponents.push(code.substr(0, end));
    }
  });
  vars.usedExtComponents = [...new Set(vars.usedExtComponents)];
  var writeToPathWritten = false;
  var moduleVars = {
    imports: '',
    exports: '',
    declarations: ''
  };
  vars.usedExtComponents.forEach(xtype => {
    var capclassname = xtype.charAt(0).toUpperCase() + xtype.replace(/-/g, "_").slice(1);
    moduleVars.imports = moduleVars.imports + `import { Ext${capclassname}Component } from './ext-${xtype}.component';\n`;
    moduleVars.exports = moduleVars.exports + `    Ext${capclassname}Component,\n`;
    moduleVars.declarations = moduleVars.declarations + `    Ext${capclassname}Component,\n`;
    var classFile = `ext-${xtype}.component.ts`;
    const contents = fsx.readFileSync(`${packageLibPath}/${classFile}`).toString();
    fsx.writeFileSync(`${pathToExtAngularProd}/${classFile}`, contents, 'utf-8', () => {
      return;
    });
    writeToPathWritten = true;
  });

  if (writeToPathWritten) {
    var t = require('./artifacts').extAngularModule(moduleVars.imports, moduleVars.exports, moduleVars.declarations);

    fsx.writeFileSync(`${pathToExtAngularProd}/ext-angular.module.ts`, t, 'utf-8', () => {
      return;
    });
  }

  const baseContent = fsx.readFileSync(`${packageLibPath}/eng-base.ts`).toString();
  fsx.writeFileSync(`${pathToExtAngularProd}/eng-base.ts`, baseContent, 'utf-8', () => {
    return;
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hbmd1bGFyVXRpbC5qcyJdLCJuYW1lcyI6WyJfZ2V0RGVmYXVsdFZhcnMiLCJ0b3VjaEZpbGUiLCJ3YXRjaFN0YXJ0ZWQiLCJidWlsZHN0ZXAiLCJmaXJzdFRpbWUiLCJmaXJzdENvbXBpbGUiLCJicm93c2VyQ291bnQiLCJtYW5pZmVzdCIsImV4dFBhdGgiLCJwbHVnaW5FcnJvcnMiLCJkZXBzIiwidXNlZEV4dENvbXBvbmVudHMiLCJyZWJ1aWxkIiwiX2V4dHJhY3RGcm9tU291cmNlIiwibW9kdWxlIiwib3B0aW9ucyIsImNvbXBpbGF0aW9uIiwiZXh0Q29tcG9uZW50cyIsImxvZ3YiLCJyZXF1aXJlIiwidmVyYm9zZSIsImpzIiwiX3NvdXJjZSIsIl92YWx1ZSIsInN0YXRlbWVudHMiLCJnZW5lcmF0ZSIsImRlZmF1bHQiLCJwYXJzZSIsInRyYXZlcnNlIiwiYXN0IiwicGx1Z2lucyIsInNvdXJjZVR5cGUiLCJwcmUiLCJub2RlIiwidHlwZSIsImNhbGxlZSIsIm9iamVjdCIsIm5hbWUiLCJwdXNoIiwiY29kZSIsInZhbHVlIiwiaSIsImxlbmd0aCIsImNoYXJBdCIsInN1YnN0ciIsImluZGV4T2YiLCJzdGFydCIsInN1YnN0cmluZyIsInNwYWNlRW5kIiwibmV3bGluZUVuZCIsInRhZ0VuZCIsImVuZCIsIk1hdGgiLCJtaW4iLCJ4dHlwZSIsIl90b1h0eXBlIiwiaW5jbHVkZXMiLCJ0aGVWYWx1ZSIsInRvTG93ZXJDYXNlIiwiY29uZmlnIiwiSlNPTiIsInN0cmluZ2lmeSIsImNoYW5nZUl0IiwibyIsInBhdGgiLCJmc3giLCJ3aGVyZVBhdGgiLCJyZXNvbHZlIiwicHJvY2VzcyIsImN3ZCIsIndoZXJlIiwicmVhZEZpbGVTeW5jIiwidG9TdHJpbmciLCJuZXdKcyIsInJlcGxhY2UiLCJmcm9tIiwidG8iLCJ3cml0ZUZpbGVTeW5jIiwiX3RvUHJvZCIsInZhcnMiLCJsb2ciLCJmcyIsIm1rZGlycCIsInBhdGhFeHRBbmd1bGFyUHJvZCIsImV4aXN0c1N5bmMiLCJzeW5jIiwidCIsImV4dEFuZ3VsYXJNb2R1bGUiLCJfdG9EZXYiLCJfZ2V0QWxsQ29tcG9uZW50cyIsInBhY2thZ2VMaWJQYXRoIiwiZmlsZXMiLCJyZWFkZGlyU3luYyIsImZvckVhY2giLCJmaWxlTmFtZSIsImFwcCIsImZyYW1ld29yayIsIl93cml0ZUZpbGVzVG9Qcm9kRm9sZGVyIiwicGF0aFRvRXh0QW5ndWxhclByb2QiLCJzdHJpbmciLCJpbmRleCIsIlNldCIsIndyaXRlVG9QYXRoV3JpdHRlbiIsIm1vZHVsZVZhcnMiLCJpbXBvcnRzIiwiZXhwb3J0cyIsImRlY2xhcmF0aW9ucyIsImNhcGNsYXNzbmFtZSIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJjbGFzc0ZpbGUiLCJjb250ZW50cyIsImJhc2VDb250ZW50Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0FBRU8sU0FBU0EsZUFBVCxHQUEyQjtBQUNoQyxTQUFPO0FBQ0xDLElBQUFBLFNBQVMsRUFBRSxnQkFETjtBQUVMQyxJQUFBQSxZQUFZLEVBQUcsS0FGVjtBQUdMQyxJQUFBQSxTQUFTLEVBQUUsUUFITjtBQUlMQyxJQUFBQSxTQUFTLEVBQUcsSUFKUDtBQUtMQyxJQUFBQSxZQUFZLEVBQUUsSUFMVDtBQU1MQyxJQUFBQSxZQUFZLEVBQUcsQ0FOVjtBQU9MQyxJQUFBQSxRQUFRLEVBQUUsSUFQTDtBQVFMQyxJQUFBQSxPQUFPLEVBQUUsS0FSSjtBQVNMQyxJQUFBQSxZQUFZLEVBQUUsRUFUVDtBQVVMQyxJQUFBQSxJQUFJLEVBQUUsRUFWRDtBQVdMQyxJQUFBQSxpQkFBaUIsRUFBRSxFQVhkO0FBWUxDLElBQUFBLE9BQU8sRUFBRTtBQVpKLEdBQVA7QUFjRDs7QUFFTSxTQUFTQyxrQkFBVCxDQUE0QkMsTUFBNUIsRUFBb0NDLE9BQXBDLEVBQTZDQyxXQUE3QyxFQUEwREMsYUFBMUQsRUFBeUU7QUFDOUUsUUFBTUMsSUFBSSxHQUFHQyxPQUFPLENBQUMsY0FBRCxDQUFQLENBQXdCRCxJQUFyQzs7QUFDQSxRQUFNRSxPQUFPLEdBQUdMLE9BQU8sQ0FBQ0ssT0FBeEI7QUFDQUYsRUFBQUEsSUFBSSxDQUFDRSxPQUFELEVBQVMsNkJBQVQsQ0FBSjtBQUNBLE1BQUlDLEVBQUUsR0FBR1AsTUFBTSxDQUFDUSxPQUFQLENBQWVDLE1BQXhCO0FBRUEsTUFBSUMsVUFBVSxHQUFHLEVBQWpCOztBQUVBLE1BQUlDLFFBQVEsR0FBR04sT0FBTyxDQUFDLGtCQUFELENBQVAsQ0FBNEJPLE9BQTNDOztBQUNBLE1BQUlDLEtBQUssR0FBR1IsT0FBTyxDQUFDLFNBQUQsQ0FBUCxDQUFtQlEsS0FBL0I7O0FBQ0EsTUFBSUMsUUFBUSxHQUFHVCxPQUFPLENBQUMsY0FBRCxDQUF0Qjs7QUFFQSxNQUFJVSxHQUFHLEdBQUdGLEtBQUssQ0FBQ04sRUFBRCxFQUFLO0FBQ2xCUyxJQUFBQSxPQUFPLEVBQUUsQ0FDUCxZQURPLEVBRVAsTUFGTyxFQUdQLGVBSE8sRUFJUCxrQkFKTyxFQUtQLGlCQUxPLEVBTVAsbUJBTk8sRUFPUCxrQkFQTyxFQVFQLGlCQVJPLEVBU1AsY0FUTyxFQVVQLGNBVk8sRUFXUCxlQVhPLENBRFM7QUFjbEJDLElBQUFBLFVBQVUsRUFBRTtBQWRNLEdBQUwsQ0FBZjtBQWlCQUgsRUFBQUEsUUFBUSxDQUFDQyxHQUFELEVBQU07QUFDWkcsSUFBQUEsR0FBRyxFQUFFLFVBQVVDLElBQVYsRUFBZ0I7QUFDbkIsVUFBSUEsSUFBSSxDQUFDQyxJQUFMLEtBQWMsZ0JBQWQsSUFBa0NELElBQUksQ0FBQ0UsTUFBdkMsSUFBaURGLElBQUksQ0FBQ0UsTUFBTCxDQUFZQyxNQUE3RCxJQUF1RUgsSUFBSSxDQUFDRSxNQUFMLENBQVlDLE1BQVosQ0FBbUJDLElBQW5CLEtBQTRCLEtBQXZHLEVBQThHO0FBQzVHYixRQUFBQSxVQUFVLENBQUNjLElBQVgsQ0FBZ0JiLFFBQVEsQ0FBQ1EsSUFBRCxDQUFSLENBQWVNLElBQS9CO0FBQ0Q7O0FBQ0QsVUFBR04sSUFBSSxDQUFDQyxJQUFMLEtBQWMsZUFBakIsRUFBa0M7QUFDaEMsWUFBSUssSUFBSSxHQUFHTixJQUFJLENBQUNPLEtBQWhCOztBQUNBLGFBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0YsSUFBSSxDQUFDRyxNQUF6QixFQUFpQyxFQUFFRCxDQUFuQyxFQUFzQztBQUNwQyxjQUFJRixJQUFJLENBQUNJLE1BQUwsQ0FBWUYsQ0FBWixLQUFrQixHQUF0QixFQUEyQjtBQUN6QixnQkFBSUYsSUFBSSxDQUFDSyxNQUFMLENBQVlILENBQVosRUFBZSxDQUFmLEtBQXFCLE1BQXpCLEVBQWlDO0FBQy9CQSxjQUFBQSxDQUFDLElBQUksQ0FBTDtBQUNBQSxjQUFBQSxDQUFDLElBQUlGLElBQUksQ0FBQ0ssTUFBTCxDQUFZSCxDQUFaLEVBQWVJLE9BQWYsQ0FBdUIsS0FBdkIsSUFBZ0MsQ0FBckM7QUFDRCxhQUhELE1BR08sSUFBSU4sSUFBSSxDQUFDSSxNQUFMLENBQVlGLENBQUMsR0FBQyxDQUFkLE1BQXFCLEdBQXpCLEVBQThCO0FBQ25DLGtCQUFJSyxLQUFLLEdBQUdQLElBQUksQ0FBQ1EsU0FBTCxDQUFlTixDQUFmLENBQVo7QUFDQSxrQkFBSU8sUUFBUSxHQUFHRixLQUFLLENBQUNELE9BQU4sQ0FBYyxHQUFkLENBQWY7QUFDQSxrQkFBSUksVUFBVSxHQUFHSCxLQUFLLENBQUNELE9BQU4sQ0FBYyxJQUFkLENBQWpCO0FBQ0Esa0JBQUlLLE1BQU0sR0FBR0osS0FBSyxDQUFDRCxPQUFOLENBQWMsR0FBZCxDQUFiO0FBQ0Esa0JBQUlNLEdBQUcsR0FBR0MsSUFBSSxDQUFDQyxHQUFMLENBQVNMLFFBQVQsRUFBbUJDLFVBQW5CLEVBQStCQyxNQUEvQixDQUFWOztBQUNBLGtCQUFJQyxHQUFHLElBQUksQ0FBWCxFQUFjO0FBQ1Y7QUFDRixvQkFBSUcsS0FBSyxHQUFHbkMsT0FBTyxDQUFDLGNBQUQsQ0FBUCxDQUF3Qm9DLFFBQXhCLENBQWlDVCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0IsQ0FBaEIsRUFBbUJJLEdBQW5CLENBQWpDLENBQVo7O0FBQ0Esb0JBQUdsQyxhQUFhLENBQUN1QyxRQUFkLENBQXVCRixLQUF2QixDQUFILEVBQWtDO0FBQ2hDLHNCQUFJRyxRQUFRLEdBQUd4QixJQUFJLENBQUNPLEtBQUwsQ0FBV2tCLFdBQVgsRUFBZjs7QUFDQSxzQkFBSUQsUUFBUSxDQUFDWixPQUFULENBQWlCLGNBQWpCLEtBQW9DLENBQUMsQ0FBekMsRUFBNEM7QUFDMUMsd0JBQUlYLElBQUksR0FBRztBQUFDb0Isc0JBQUFBLEtBQUssRUFBRUE7QUFBUixxQkFBWDtBQUNBLHdCQUFJSyxNQUFNLEdBQUdDLElBQUksQ0FBQ0MsU0FBTCxDQUFlM0IsSUFBZixDQUFiO0FBQ0FWLG9CQUFBQSxVQUFVLENBQUNjLElBQVgsQ0FBaUIsY0FBYXFCLE1BQU8sR0FBckM7QUFDRDtBQUNGOztBQUNEbEIsZ0JBQUFBLENBQUMsSUFBSVUsR0FBTDtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0Y7QUFDRjtBQW5DVyxHQUFOLENBQVI7QUFzQ0EsU0FBTzNCLFVBQVA7QUFDRDs7QUFFRCxTQUFTc0MsUUFBVCxDQUFrQkMsQ0FBbEIsRUFBcUI7QUFDbkIsUUFBTUMsSUFBSSxHQUFHN0MsT0FBTyxDQUFDLE1BQUQsQ0FBcEI7O0FBQ0EsUUFBTThDLEdBQUcsR0FBRzlDLE9BQU8sQ0FBQyxVQUFELENBQW5COztBQUNBLFFBQU0rQyxTQUFTLEdBQUdGLElBQUksQ0FBQ0csT0FBTCxDQUFhQyxPQUFPLENBQUNDLEdBQVIsRUFBYixFQUE0Qk4sQ0FBQyxDQUFDTyxLQUE5QixDQUFsQjtBQUNBLE1BQUlqRCxFQUFFLEdBQUc0QyxHQUFHLENBQUNNLFlBQUosQ0FBaUJMLFNBQWpCLEVBQTRCTSxRQUE1QixFQUFUO0FBQ0EsTUFBSUMsS0FBSyxHQUFHcEQsRUFBRSxDQUFDcUQsT0FBSCxDQUFXWCxDQUFDLENBQUNZLElBQWIsRUFBa0JaLENBQUMsQ0FBQ2EsRUFBcEIsQ0FBWjtBQUNBWCxFQUFBQSxHQUFHLENBQUNZLGFBQUosQ0FBa0JYLFNBQWxCLEVBQTZCTyxLQUE3QixFQUFvQyxPQUFwQyxFQUE2QyxNQUFJO0FBQUM7QUFBTyxHQUF6RDtBQUNEOztBQUVNLFNBQVNLLE9BQVQsQ0FBaUJDLElBQWpCLEVBQXVCaEUsT0FBdkIsRUFBZ0M7QUFDckMsUUFBTWlFLEdBQUcsR0FBRzdELE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0I2RCxHQUFwQzs7QUFDQSxRQUFNOUQsSUFBSSxHQUFHQyxPQUFPLENBQUMsY0FBRCxDQUFQLENBQXdCRCxJQUFyQzs7QUFDQUEsRUFBQUEsSUFBSSxDQUFDSCxPQUFPLENBQUNLLE9BQVQsRUFBaUIsa0JBQWpCLENBQUo7O0FBQ0EsUUFBTTZDLEdBQUcsR0FBRzlDLE9BQU8sQ0FBQyxVQUFELENBQW5COztBQUNBLFFBQU04RCxFQUFFLEdBQUc5RCxPQUFPLENBQUMsSUFBRCxDQUFsQjs7QUFDQSxRQUFNK0QsTUFBTSxHQUFHL0QsT0FBTyxDQUFDLFFBQUQsQ0FBdEI7O0FBQ0EsUUFBTTZDLElBQUksR0FBRzdDLE9BQU8sQ0FBQyxNQUFELENBQXBCOztBQUVBLFFBQU1nRSxrQkFBa0IsR0FBR25CLElBQUksQ0FBQ0csT0FBTCxDQUFhQyxPQUFPLENBQUNDLEdBQVIsRUFBYixFQUE2QiwwQkFBN0IsQ0FBM0I7O0FBQ0EsTUFBSSxDQUFDWSxFQUFFLENBQUNHLFVBQUgsQ0FBY0Qsa0JBQWQsQ0FBTCxFQUF3QztBQUN0Q0QsSUFBQUEsTUFBTSxDQUFDRyxJQUFQLENBQVlGLGtCQUFaOztBQUNBLFVBQU1HLENBQUMsR0FBR25FLE9BQU8sQ0FBQyxhQUFELENBQVAsQ0FBdUJvRSxnQkFBdkIsQ0FBd0MsRUFBeEMsRUFBNEMsRUFBNUMsRUFBZ0QsRUFBaEQsQ0FBVjs7QUFDQXRCLElBQUFBLEdBQUcsQ0FBQ1ksYUFBSixDQUFtQixHQUFFTSxrQkFBbUIsd0JBQXhDLEVBQWlFRyxDQUFqRSxFQUFvRSxPQUFwRSxFQUE2RSxNQUFNO0FBQ2pGO0FBQ0QsS0FGRDtBQUdEOztBQUVELE1BQUl2QixDQUFDLEdBQUcsRUFBUjtBQUNBQSxFQUFBQSxDQUFDLENBQUNPLEtBQUYsR0FBVSx1QkFBVjtBQUNBUCxFQUFBQSxDQUFDLENBQUNZLElBQUYsR0FBVSx3REFBVjtBQUNBWixFQUFBQSxDQUFDLENBQUNhLEVBQUYsR0FBUSwwRUFBUjtBQUNBZCxFQUFBQSxRQUFRLENBQUNDLENBQUQsQ0FBUixDQXRCcUMsQ0F3QnZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQzs7QUFFTSxTQUFTeUIsTUFBVCxDQUFnQlQsSUFBaEIsRUFBc0JoRSxPQUF0QixFQUErQjtBQUNwQyxRQUFNaUUsR0FBRyxHQUFHN0QsT0FBTyxDQUFDLGNBQUQsQ0FBUCxDQUF3QjZELEdBQXBDOztBQUNBLFFBQU05RCxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JELElBQXJDOztBQUNBQSxFQUFBQSxJQUFJLENBQUNILE9BQU8sQ0FBQ0ssT0FBVCxFQUFpQixpQkFBakIsQ0FBSjs7QUFDQSxRQUFNNEMsSUFBSSxHQUFHN0MsT0FBTyxDQUFDLE1BQUQsQ0FBcEI7O0FBQ0EsUUFBTWdFLGtCQUFrQixHQUFHbkIsSUFBSSxDQUFDRyxPQUFMLENBQWFDLE9BQU8sQ0FBQ0MsR0FBUixFQUFiLEVBQTZCLDBCQUE3QixDQUEzQjs7QUFDQWxELEVBQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0JrRSxJQUFsQixDQUF1QkYsa0JBQXZCOztBQUVBLE1BQUlwQixDQUFDLEdBQUcsRUFBUjtBQUNBQSxFQUFBQSxDQUFDLENBQUNPLEtBQUYsR0FBVSx1QkFBVjtBQUNBUCxFQUFBQSxDQUFDLENBQUNZLElBQUYsR0FBVSwwRUFBVjtBQUNBWixFQUFBQSxDQUFDLENBQUNhLEVBQUYsR0FBUSx3REFBUjtBQUNBZCxFQUFBQSxRQUFRLENBQUNDLENBQUQsQ0FBUixDQVpvQyxDQWN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0M7O0FBR00sU0FBUzBCLGlCQUFULENBQTJCVixJQUEzQixFQUFpQ2hFLE9BQWpDLEVBQTBDO0FBQy9DLFFBQU1pRSxHQUFHLEdBQUc3RCxPQUFPLENBQUMsY0FBRCxDQUFQLENBQXdCNkQsR0FBcEM7O0FBQ0EsUUFBTTlELElBQUksR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBUCxDQUF3QkQsSUFBckM7O0FBQ0FBLEVBQUFBLElBQUksQ0FBQ0gsT0FBTyxDQUFDSyxPQUFULEVBQWlCLDRCQUFqQixDQUFKOztBQUVBLFFBQU00QyxJQUFJLEdBQUc3QyxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxRQUFNOEMsR0FBRyxHQUFHOUMsT0FBTyxDQUFDLFVBQUQsQ0FBbkIsQ0FOK0MsQ0FRakQ7OztBQUNFLE1BQUlGLGFBQWEsR0FBRyxFQUFwQjtBQUNBLFFBQU15RSxjQUFjLEdBQUcxQixJQUFJLENBQUNHLE9BQUwsQ0FBYUMsT0FBTyxDQUFDQyxHQUFSLEVBQWIsRUFBNEIsc0NBQTVCLENBQXZCO0FBQ0EsTUFBSXNCLEtBQUssR0FBRzFCLEdBQUcsQ0FBQzJCLFdBQUosQ0FBZ0JGLGNBQWhCLENBQVo7QUFDQUMsRUFBQUEsS0FBSyxDQUFDRSxPQUFOLENBQWVDLFFBQUQsSUFBYztBQUMxQixRQUFJQSxRQUFRLElBQUlBLFFBQVEsQ0FBQ2xELE1BQVQsQ0FBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsS0FBeUIsTUFBekMsRUFBaUQ7QUFDL0MsVUFBSU8sR0FBRyxHQUFHMkMsUUFBUSxDQUFDbEQsTUFBVCxDQUFnQixDQUFoQixFQUFtQkMsT0FBbkIsQ0FBMkIsWUFBM0IsQ0FBVjs7QUFDQSxVQUFJTSxHQUFHLElBQUksQ0FBWCxFQUFjO0FBQ1psQyxRQUFBQSxhQUFhLENBQUNxQixJQUFkLENBQW1Cd0QsUUFBUSxDQUFDL0MsU0FBVCxDQUFtQixDQUFuQixFQUFzQkksR0FBRyxHQUFHLENBQTVCLENBQW5CO0FBQ0Q7QUFDRjtBQUNGLEdBUEQ7QUFRQTZCLEVBQUFBLEdBQUcsQ0FBQ0QsSUFBSSxDQUFDZ0IsR0FBTixFQUFZLDhCQUE2QmhGLE9BQU8sQ0FBQ2lGLFNBQVUsVUFBM0QsQ0FBSDtBQUNBLFNBQU8vRSxhQUFQO0FBQ0Q7O0FBRU0sU0FBU2dGLHVCQUFULENBQWlDbEIsSUFBakMsRUFBdUNoRSxPQUF2QyxFQUFnRDtBQUNyRCxRQUFNaUUsR0FBRyxHQUFHN0QsT0FBTyxDQUFDLGNBQUQsQ0FBUCxDQUF3QjZELEdBQXBDOztBQUNBLFFBQU05RCxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JELElBQXJDOztBQUNBQSxFQUFBQSxJQUFJLENBQUNILE9BQU8sQ0FBQ0ssT0FBVCxFQUFpQixrQ0FBakIsQ0FBSjs7QUFFQSxRQUFNNEMsSUFBSSxHQUFHN0MsT0FBTyxDQUFDLE1BQUQsQ0FBcEI7O0FBQ0EsUUFBTThDLEdBQUcsR0FBRzlDLE9BQU8sQ0FBQyxVQUFELENBQW5COztBQUVBLFFBQU11RSxjQUFjLEdBQUcxQixJQUFJLENBQUNHLE9BQUwsQ0FBYUMsT0FBTyxDQUFDQyxHQUFSLEVBQWIsRUFBNEIsc0NBQTVCLENBQXZCO0FBQ0EsUUFBTTZCLG9CQUFvQixHQUFHbEMsSUFBSSxDQUFDRyxPQUFMLENBQWFDLE9BQU8sQ0FBQ0MsR0FBUixFQUFiLEVBQTZCLDBCQUE3QixDQUE3QjtBQUNBLFFBQU04QixNQUFNLEdBQUcsMEJBQWY7QUFFQXBCLEVBQUFBLElBQUksQ0FBQ3JFLElBQUwsQ0FBVW1GLE9BQVYsQ0FBa0J0RCxJQUFJLElBQUk7QUFDeEIsUUFBSTZELEtBQUssR0FBRzdELElBQUksQ0FBQ00sT0FBTCxDQUFhc0QsTUFBYixDQUFaOztBQUNBLFFBQUlDLEtBQUssSUFBSSxDQUFiLEVBQWdCO0FBQ2Q3RCxNQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ1EsU0FBTCxDQUFlcUQsS0FBSyxHQUFHRCxNQUFNLENBQUN6RCxNQUE5QixDQUFQO0FBQ0EsVUFBSVMsR0FBRyxHQUFHWixJQUFJLENBQUNNLE9BQUwsQ0FBYSxJQUFiLENBQVY7QUFDQWtDLE1BQUFBLElBQUksQ0FBQ3BFLGlCQUFMLENBQXVCMkIsSUFBdkIsQ0FBNEJDLElBQUksQ0FBQ0ssTUFBTCxDQUFZLENBQVosRUFBZU8sR0FBZixDQUE1QjtBQUNEO0FBQ0YsR0FQRDtBQVFBNEIsRUFBQUEsSUFBSSxDQUFDcEUsaUJBQUwsR0FBeUIsQ0FBQyxHQUFHLElBQUkwRixHQUFKLENBQVF0QixJQUFJLENBQUNwRSxpQkFBYixDQUFKLENBQXpCO0FBRUEsTUFBSTJGLGtCQUFrQixHQUFHLEtBQXpCO0FBQ0EsTUFBSUMsVUFBVSxHQUFHO0FBQ2ZDLElBQUFBLE9BQU8sRUFBRSxFQURNO0FBRWZDLElBQUFBLE9BQU8sRUFBRSxFQUZNO0FBR2ZDLElBQUFBLFlBQVksRUFBRTtBQUhDLEdBQWpCO0FBS0EzQixFQUFBQSxJQUFJLENBQUNwRSxpQkFBTCxDQUF1QmtGLE9BQXZCLENBQStCdkMsS0FBSyxJQUFJO0FBQ3RDLFFBQUlxRCxZQUFZLEdBQUdyRCxLQUFLLENBQUNYLE1BQU4sQ0FBYSxDQUFiLEVBQWdCaUUsV0FBaEIsS0FBZ0N0RCxLQUFLLENBQUNvQixPQUFOLENBQWMsSUFBZCxFQUFvQixHQUFwQixFQUF5Qm1DLEtBQXpCLENBQStCLENBQS9CLENBQW5EO0FBQ0FOLElBQUFBLFVBQVUsQ0FBQ0MsT0FBWCxHQUFxQkQsVUFBVSxDQUFDQyxPQUFYLEdBQXNCLGVBQWNHLFlBQWEsMkJBQTBCckQsS0FBTSxnQkFBdEc7QUFDQWlELElBQUFBLFVBQVUsQ0FBQ0UsT0FBWCxHQUFxQkYsVUFBVSxDQUFDRSxPQUFYLEdBQXNCLFVBQVNFLFlBQWEsY0FBakU7QUFDQUosSUFBQUEsVUFBVSxDQUFDRyxZQUFYLEdBQTBCSCxVQUFVLENBQUNHLFlBQVgsR0FBMkIsVUFBU0MsWUFBYSxjQUEzRTtBQUNBLFFBQUlHLFNBQVMsR0FBSSxPQUFNeEQsS0FBTSxlQUE3QjtBQUNBLFVBQU15RCxRQUFRLEdBQUc5QyxHQUFHLENBQUNNLFlBQUosQ0FBa0IsR0FBRW1CLGNBQWUsSUFBR29CLFNBQVUsRUFBaEQsRUFBbUR0QyxRQUFuRCxFQUFqQjtBQUNBUCxJQUFBQSxHQUFHLENBQUNZLGFBQUosQ0FBbUIsR0FBRXFCLG9CQUFxQixJQUFHWSxTQUFVLEVBQXZELEVBQTBEQyxRQUExRCxFQUFvRSxPQUFwRSxFQUE2RSxNQUFJO0FBQUM7QUFBTyxLQUF6RjtBQUNBVCxJQUFBQSxrQkFBa0IsR0FBRyxJQUFyQjtBQUNELEdBVEQ7O0FBVUEsTUFBSUEsa0JBQUosRUFBd0I7QUFDdEIsUUFBSWhCLENBQUMsR0FBR25FLE9BQU8sQ0FBQyxhQUFELENBQVAsQ0FBdUJvRSxnQkFBdkIsQ0FDTmdCLFVBQVUsQ0FBQ0MsT0FETCxFQUNjRCxVQUFVLENBQUNFLE9BRHpCLEVBQ2tDRixVQUFVLENBQUNHLFlBRDdDLENBQVI7O0FBR0F6QyxJQUFBQSxHQUFHLENBQUNZLGFBQUosQ0FBbUIsR0FBRXFCLG9CQUFxQix3QkFBMUMsRUFBbUVaLENBQW5FLEVBQXNFLE9BQXRFLEVBQStFLE1BQUk7QUFBQztBQUFPLEtBQTNGO0FBQ0Q7O0FBRUQsUUFBTTBCLFdBQVcsR0FBRy9DLEdBQUcsQ0FBQ00sWUFBSixDQUFrQixHQUFFbUIsY0FBZSxjQUFuQyxFQUFrRGxCLFFBQWxELEVBQXBCO0FBQ0FQLEVBQUFBLEdBQUcsQ0FBQ1ksYUFBSixDQUFtQixHQUFFcUIsb0JBQXFCLGNBQTFDLEVBQXlEYyxXQUF6RCxFQUFzRSxPQUF0RSxFQUErRSxNQUFJO0FBQUM7QUFBTyxHQUEzRjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCJcblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXREZWZhdWx0VmFycygpIHtcbiAgcmV0dXJuIHtcbiAgICB0b3VjaEZpbGU6ICcvc3JjL3RoZW1lci50cycsXG4gICAgd2F0Y2hTdGFydGVkIDogZmFsc2UsXG4gICAgYnVpbGRzdGVwOiAnMSBvZiAxJyxcbiAgICBmaXJzdFRpbWUgOiB0cnVlLFxuICAgIGZpcnN0Q29tcGlsZTogdHJ1ZSxcbiAgICBicm93c2VyQ291bnQgOiAwLFxuICAgIG1hbmlmZXN0OiBudWxsLFxuICAgIGV4dFBhdGg6ICdleHQnLFxuICAgIHBsdWdpbkVycm9yczogW10sXG4gICAgZGVwczogW10sXG4gICAgdXNlZEV4dENvbXBvbmVudHM6IFtdLFxuICAgIHJlYnVpbGQ6IHRydWVcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX2V4dHJhY3RGcm9tU291cmNlKG1vZHVsZSwgb3B0aW9ucywgY29tcGlsYXRpb24sIGV4dENvbXBvbmVudHMpIHtcbiAgY29uc3QgbG9ndiA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ3ZcbiAgY29uc3QgdmVyYm9zZSA9IG9wdGlvbnMudmVyYm9zZVxuICBsb2d2KHZlcmJvc2UsJ0ZVTkNUSU9OIF9leHRyYWN0RnJvbVNvdXJjZScpXG4gIHZhciBqcyA9IG1vZHVsZS5fc291cmNlLl92YWx1ZVxuXG4gIHZhciBzdGF0ZW1lbnRzID0gW11cblxuICB2YXIgZ2VuZXJhdGUgPSByZXF1aXJlKFwiQGJhYmVsL2dlbmVyYXRvclwiKS5kZWZhdWx0XG4gIHZhciBwYXJzZSA9IHJlcXVpcmUoXCJiYWJ5bG9uXCIpLnBhcnNlXG4gIHZhciB0cmF2ZXJzZSA9IHJlcXVpcmUoXCJhc3QtdHJhdmVyc2VcIilcblxuICB2YXIgYXN0ID0gcGFyc2UoanMsIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICAndHlwZXNjcmlwdCcsXG4gICAgICAnZmxvdycsXG4gICAgICAnZG9FeHByZXNzaW9ucycsXG4gICAgICAnb2JqZWN0UmVzdFNwcmVhZCcsXG4gICAgICAnY2xhc3NQcm9wZXJ0aWVzJyxcbiAgICAgICdleHBvcnREZWZhdWx0RnJvbScsXG4gICAgICAnZXhwb3J0RXh0ZW5zaW9ucycsXG4gICAgICAnYXN5bmNHZW5lcmF0b3JzJyxcbiAgICAgICdmdW5jdGlvbkJpbmQnLFxuICAgICAgJ2Z1bmN0aW9uU2VudCcsXG4gICAgICAnZHluYW1pY0ltcG9ydCdcbiAgICBdLFxuICAgIHNvdXJjZVR5cGU6ICdtb2R1bGUnXG4gIH0pXG5cbiAgdHJhdmVyc2UoYXN0LCB7XG4gICAgcHJlOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ0NhbGxFeHByZXNzaW9uJyAmJiBub2RlLmNhbGxlZSAmJiBub2RlLmNhbGxlZS5vYmplY3QgJiYgbm9kZS5jYWxsZWUub2JqZWN0Lm5hbWUgPT09ICdFeHQnKSB7XG4gICAgICAgIHN0YXRlbWVudHMucHVzaChnZW5lcmF0ZShub2RlKS5jb2RlKVxuICAgICAgfVxuICAgICAgaWYobm9kZS50eXBlID09PSAnU3RyaW5nTGl0ZXJhbCcpIHtcbiAgICAgICAgbGV0IGNvZGUgPSBub2RlLnZhbHVlXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29kZS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGlmIChjb2RlLmNoYXJBdChpKSA9PSAnPCcpIHtcbiAgICAgICAgICAgIGlmIChjb2RlLnN1YnN0cihpLCA0KSA9PSAnPCEtLScpIHtcbiAgICAgICAgICAgICAgaSArPSA0XG4gICAgICAgICAgICAgIGkgKz0gY29kZS5zdWJzdHIoaSkuaW5kZXhPZignLS0+JykgKyAzXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUuY2hhckF0KGkrMSkgIT09ICcvJykge1xuICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBjb2RlLnN1YnN0cmluZyhpKVxuICAgICAgICAgICAgICB2YXIgc3BhY2VFbmQgPSBzdGFydC5pbmRleE9mKCcgJylcbiAgICAgICAgICAgICAgdmFyIG5ld2xpbmVFbmQgPSBzdGFydC5pbmRleE9mKCdcXG4nKVxuICAgICAgICAgICAgICB2YXIgdGFnRW5kID0gc3RhcnQuaW5kZXhPZignPicpXG4gICAgICAgICAgICAgIHZhciBlbmQgPSBNYXRoLm1pbihzcGFjZUVuZCwgbmV3bGluZUVuZCwgdGFnRW5kKVxuICAgICAgICAgICAgICBpZiAoZW5kID49IDApIHtcbiAgICAgICAgICAgICAgICAgIC8vY2hhbmdlZCB0aGlzIGZyb20gMSB0byBmaXZlIHdoZW4gYWRkaW5nIGV4dC0gdG8gZWxlbWVudHNcbiAgICAgICAgICAgICAgICB2YXIgeHR5cGUgPSByZXF1aXJlKCcuL3BsdWdpblV0aWwnKS5fdG9YdHlwZShzdGFydC5zdWJzdHJpbmcoNSwgZW5kKSlcbiAgICAgICAgICAgICAgICBpZihleHRDb21wb25lbnRzLmluY2x1ZGVzKHh0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgdmFyIHRoZVZhbHVlID0gbm9kZS52YWx1ZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICBpZiAodGhlVmFsdWUuaW5kZXhPZignZG9jdHlwZSBodG1sJykgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSB7eHR5cGU6IHh0eXBlfVxuICAgICAgICAgICAgICAgICAgICBsZXQgY29uZmlnID0gSlNPTi5zdHJpbmdpZnkodHlwZSlcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKGBFeHQuY3JlYXRlKCR7Y29uZmlnfSlgKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpICs9IGVuZFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBzdGF0ZW1lbnRzXG59XG5cbmZ1bmN0aW9uIGNoYW5nZUl0KG8pIHtcbiAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuICBjb25zdCBmc3ggPSByZXF1aXJlKCdmcy1leHRyYScpXG4gIGNvbnN0IHdoZXJlUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBvLndoZXJlKVxuICB2YXIganMgPSBmc3gucmVhZEZpbGVTeW5jKHdoZXJlUGF0aCkudG9TdHJpbmcoKVxuICB2YXIgbmV3SnMgPSBqcy5yZXBsYWNlKG8uZnJvbSxvLnRvKTtcbiAgZnN4LndyaXRlRmlsZVN5bmMod2hlcmVQYXRoLCBuZXdKcywgJ3V0Zi04JywgKCk9PntyZXR1cm59KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX3RvUHJvZCh2YXJzLCBvcHRpb25zKSB7XG4gIGNvbnN0IGxvZyA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ1xuICBjb25zdCBsb2d2ID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9ndlxuICBsb2d2KG9wdGlvbnMudmVyYm9zZSwnRlVOQ1RJT04gX3RvUHJvZCcpXG4gIGNvbnN0IGZzeCA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcbiAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXG4gIGNvbnN0IG1rZGlycCA9IHJlcXVpcmUoJ21rZGlycCcpXG4gIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcblxuICBjb25zdCBwYXRoRXh0QW5ndWxhclByb2QgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgYHNyYy9hcHAvZXh0LWFuZ3VsYXItcHJvZGApO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aEV4dEFuZ3VsYXJQcm9kKSkge1xuICAgIG1rZGlycC5zeW5jKHBhdGhFeHRBbmd1bGFyUHJvZClcbiAgICBjb25zdCB0ID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKS5leHRBbmd1bGFyTW9kdWxlKCcnLCAnJywgJycpXG4gICAgZnN4LndyaXRlRmlsZVN5bmMoYCR7cGF0aEV4dEFuZ3VsYXJQcm9kfS9leHQtYW5ndWxhci5tb2R1bGUudHNgLCB0LCAndXRmLTgnLCAoKSA9PiB7XG4gICAgICByZXR1cm5cbiAgICB9KVxuICB9XG5cbiAgdmFyIG8gPSB7fVxuICBvLndoZXJlID0gJ3NyYy9hcHAvYXBwLm1vZHVsZS50cydcbiAgby5mcm9tID0gYGltcG9ydCB7IEV4dEFuZ3VsYXJNb2R1bGUgfSBmcm9tICdAc2VuY2hhL2V4dC1hbmd1bGFyJ2BcbiAgby50byA9IGBpbXBvcnQgeyBFeHRBbmd1bGFyTW9kdWxlIH0gZnJvbSAnLi9leHQtYW5ndWxhci1wcm9kL2V4dC1hbmd1bGFyLm1vZHVsZSdgXG4gIGNoYW5nZUl0KG8pXG5cbi8vICAgbyA9IHt9XG4vLyAgIG8ud2hlcmUgPSAnc3JjL21haW4udHMnXG4vLyAgIG8uZnJvbSA9IGBib290c3RyYXBNb2R1bGUoIEFwcE1vZHVsZSApO2Bcbi8vICAgby50byA9IGBlbmFibGVQcm9kTW9kZSgpO2Jvb3RzdHJhcE1vZHVsZShBcHBNb2R1bGUpO2Bcbi8vICAgY2hhbmdlSXQobylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF90b0Rldih2YXJzLCBvcHRpb25zKSB7XG4gIGNvbnN0IGxvZyA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ1xuICBjb25zdCBsb2d2ID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9ndlxuICBsb2d2KG9wdGlvbnMudmVyYm9zZSwnRlVOQ1RJT04gX3RvRGV2JylcbiAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuICBjb25zdCBwYXRoRXh0QW5ndWxhclByb2QgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgYHNyYy9hcHAvZXh0LWFuZ3VsYXItcHJvZGApO1xuICByZXF1aXJlKCdyaW1yYWYnKS5zeW5jKHBhdGhFeHRBbmd1bGFyUHJvZCk7XG5cbiAgdmFyIG8gPSB7fVxuICBvLndoZXJlID0gJ3NyYy9hcHAvYXBwLm1vZHVsZS50cydcbiAgby5mcm9tID0gYGltcG9ydCB7IEV4dEFuZ3VsYXJNb2R1bGUgfSBmcm9tICcuL2V4dC1hbmd1bGFyLXByb2QvZXh0LWFuZ3VsYXIubW9kdWxlJ2BcbiAgby50byA9IGBpbXBvcnQgeyBFeHRBbmd1bGFyTW9kdWxlIH0gZnJvbSAnQHNlbmNoYS9leHQtYW5ndWxhcidgXG4gIGNoYW5nZUl0KG8pXG5cbi8vICAgbyA9IHt9XG4vLyAgIG8ud2hlcmUgPSAnc3JjL21haW4udHMnXG4vLyAgIG8uZnJvbSA9IGBlbmFibGVQcm9kTW9kZSgpO2Jvb3RzdHJhcE1vZHVsZShBcHBNb2R1bGUpO2Bcbi8vICAgby50byA9IGBib290c3RyYXBNb2R1bGUoIEFwcE1vZHVsZSApO2Bcbi8vICAgY2hhbmdlSXQobylcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gX2dldEFsbENvbXBvbmVudHModmFycywgb3B0aW9ucykge1xuICBjb25zdCBsb2cgPSByZXF1aXJlKCcuL3BsdWdpblV0aWwnKS5sb2dcbiAgY29uc3QgbG9ndiA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ3ZcbiAgbG9ndihvcHRpb25zLnZlcmJvc2UsJ0ZVTkNUSU9OIF9nZXRBbGxDb21wb25lbnRzJylcblxuICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG4gIGNvbnN0IGZzeCA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcblxuLy8gICAgbG9nKHZhcnMuYXBwLCBgR2V0dGluZyBhbGwgcmVmZXJlbmNlZCBleHQtJHtvcHRpb25zLmZyYW1ld29ya30gbW9kdWxlc2ApXG4gIHZhciBleHRDb21wb25lbnRzID0gW11cbiAgY29uc3QgcGFja2FnZUxpYlBhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ25vZGVfbW9kdWxlcy9Ac2VuY2hhL2V4dC1hbmd1bGFyL3NyYycpXG4gIHZhciBmaWxlcyA9IGZzeC5yZWFkZGlyU3luYyhwYWNrYWdlTGliUGF0aClcbiAgZmlsZXMuZm9yRWFjaCgoZmlsZU5hbWUpID0+IHtcbiAgICBpZiAoZmlsZU5hbWUgJiYgZmlsZU5hbWUuc3Vic3RyKDAsIDQpID09ICdleHQtJykge1xuICAgICAgdmFyIGVuZCA9IGZpbGVOYW1lLnN1YnN0cig0KS5pbmRleE9mKCcuY29tcG9uZW50JylcbiAgICAgIGlmIChlbmQgPj0gMCkge1xuICAgICAgICBleHRDb21wb25lbnRzLnB1c2goZmlsZU5hbWUuc3Vic3RyaW5nKDQsIGVuZCArIDQpKVxuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgbG9nKHZhcnMuYXBwLCBgV3JpdGluZyBhbGwgcmVmZXJlbmNlZCBleHQtJHtvcHRpb25zLmZyYW1ld29ya30gbW9kdWxlc2ApXG4gIHJldHVybiBleHRDb21wb25lbnRzXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfd3JpdGVGaWxlc1RvUHJvZEZvbGRlcih2YXJzLCBvcHRpb25zKSB7XG4gIGNvbnN0IGxvZyA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ1xuICBjb25zdCBsb2d2ID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9ndlxuICBsb2d2KG9wdGlvbnMudmVyYm9zZSwnRlVOQ1RJT04gX3dyaXRlRmlsZXNUb1Byb2RGb2xkZXInKVxuXG4gIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbiAgY29uc3QgZnN4ID0gcmVxdWlyZSgnZnMtZXh0cmEnKVxuXG4gIGNvbnN0IHBhY2thZ2VMaWJQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdub2RlX21vZHVsZXMvQHNlbmNoYS9leHQtYW5ndWxhci9saWInKVxuICBjb25zdCBwYXRoVG9FeHRBbmd1bGFyUHJvZCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBgc3JjL2FwcC9leHQtYW5ndWxhci1wcm9kYClcbiAgY29uc3Qgc3RyaW5nID0gJ0V4dC5jcmVhdGUoe1xcXCJ4dHlwZVxcXCI6XFxcIidcblxuICB2YXJzLmRlcHMuZm9yRWFjaChjb2RlID0+IHtcbiAgICB2YXIgaW5kZXggPSBjb2RlLmluZGV4T2Yoc3RyaW5nKVxuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICBjb2RlID0gY29kZS5zdWJzdHJpbmcoaW5kZXggKyBzdHJpbmcubGVuZ3RoKVxuICAgICAgdmFyIGVuZCA9IGNvZGUuaW5kZXhPZignXFxcIicpXG4gICAgICB2YXJzLnVzZWRFeHRDb21wb25lbnRzLnB1c2goY29kZS5zdWJzdHIoMCwgZW5kKSlcbiAgICB9XG4gIH0pXG4gIHZhcnMudXNlZEV4dENvbXBvbmVudHMgPSBbLi4ubmV3IFNldCh2YXJzLnVzZWRFeHRDb21wb25lbnRzKV1cblxuICB2YXIgd3JpdGVUb1BhdGhXcml0dGVuID0gZmFsc2VcbiAgdmFyIG1vZHVsZVZhcnMgPSB7XG4gICAgaW1wb3J0czogJycsXG4gICAgZXhwb3J0czogJycsXG4gICAgZGVjbGFyYXRpb25zOiAnJ1xuICB9XG4gIHZhcnMudXNlZEV4dENvbXBvbmVudHMuZm9yRWFjaCh4dHlwZSA9PiB7XG4gICAgdmFyIGNhcGNsYXNzbmFtZSA9IHh0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgeHR5cGUucmVwbGFjZSgvLS9nLCBcIl9cIikuc2xpY2UoMSlcbiAgICBtb2R1bGVWYXJzLmltcG9ydHMgPSBtb2R1bGVWYXJzLmltcG9ydHMgKyBgaW1wb3J0IHsgRXh0JHtjYXBjbGFzc25hbWV9Q29tcG9uZW50IH0gZnJvbSAnLi9leHQtJHt4dHlwZX0uY29tcG9uZW50JztcXG5gXG4gICAgbW9kdWxlVmFycy5leHBvcnRzID0gbW9kdWxlVmFycy5leHBvcnRzICsgYCAgICBFeHQke2NhcGNsYXNzbmFtZX1Db21wb25lbnQsXFxuYFxuICAgIG1vZHVsZVZhcnMuZGVjbGFyYXRpb25zID0gbW9kdWxlVmFycy5kZWNsYXJhdGlvbnMgKyBgICAgIEV4dCR7Y2FwY2xhc3NuYW1lfUNvbXBvbmVudCxcXG5gXG4gICAgdmFyIGNsYXNzRmlsZSA9IGBleHQtJHt4dHlwZX0uY29tcG9uZW50LnRzYFxuICAgIGNvbnN0IGNvbnRlbnRzID0gZnN4LnJlYWRGaWxlU3luYyhgJHtwYWNrYWdlTGliUGF0aH0vJHtjbGFzc0ZpbGV9YCkudG9TdHJpbmcoKVxuICAgIGZzeC53cml0ZUZpbGVTeW5jKGAke3BhdGhUb0V4dEFuZ3VsYXJQcm9kfS8ke2NsYXNzRmlsZX1gLCBjb250ZW50cywgJ3V0Zi04JywgKCk9PntyZXR1cm59KVxuICAgIHdyaXRlVG9QYXRoV3JpdHRlbiA9IHRydWVcbiAgfSlcbiAgaWYgKHdyaXRlVG9QYXRoV3JpdHRlbikge1xuICAgIHZhciB0ID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKS5leHRBbmd1bGFyTW9kdWxlKFxuICAgICAgbW9kdWxlVmFycy5pbXBvcnRzLCBtb2R1bGVWYXJzLmV4cG9ydHMsIG1vZHVsZVZhcnMuZGVjbGFyYXRpb25zXG4gICAgKVxuICAgIGZzeC53cml0ZUZpbGVTeW5jKGAke3BhdGhUb0V4dEFuZ3VsYXJQcm9kfS9leHQtYW5ndWxhci5tb2R1bGUudHNgLCB0LCAndXRmLTgnLCAoKT0+e3JldHVybn0pXG4gIH1cblxuICBjb25zdCBiYXNlQ29udGVudCA9IGZzeC5yZWFkRmlsZVN5bmMoYCR7cGFja2FnZUxpYlBhdGh9L2VuZy1iYXNlLnRzYCkudG9TdHJpbmcoKVxuICBmc3gud3JpdGVGaWxlU3luYyhgJHtwYXRoVG9FeHRBbmd1bGFyUHJvZH0vZW5nLWJhc2UudHNgLCBiYXNlQ29udGVudCwgJ3V0Zi04JywgKCk9PntyZXR1cm59KVxufSJdfQ==