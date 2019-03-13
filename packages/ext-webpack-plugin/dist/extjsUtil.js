"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._getDefaultVars = _getDefaultVars;
exports._afterCompile = _afterCompile;
exports._prepareForBuild = _prepareForBuild;

function _getDefaultVars() {
  return {
    rebuild: true,
    watchStarted: false,
    firstTime: true,
    browserCount: 0,
    cwd: process.cwd(),
    extPath: '.',
    pluginErrors: [],
    lastNumFiles: 0,
    lastMilliseconds: 0,
    lastMillisecondsAppJson: 0,
    files: ['./app.json'],
    dirs: ['./app', './packages']
  };
}

function _afterCompile(compilation, vars, options) {
  var verbose = options.verbose;

  var logv = require('./pluginUtil').logv;

  logv(verbose, 'FUNCTION extjs _afterCompile');

  const path = require('path');

  let {
    files,
    dirs
  } = vars;
  const {
    cwd
  } = vars;
  files = typeof files === 'string' ? [files] : files;
  dirs = typeof dirs === 'string' ? [dirs] : dirs;

  const {
    fileDependencies,
    contextDependencies
  } = _getFileAndContextDeps(compilation, files, dirs, cwd, options);

  if (files.length > 0) {
    fileDependencies.forEach(file => {
      compilation.fileDependencies.add(path.resolve(file));
    });
  }

  if (dirs.length > 0) {
    contextDependencies.forEach(context => {
      compilation.contextDependencies.add(context);
    });
  }
}

function _getFileAndContextDeps(compilation, files, dirs, cwd, options) {
  var verbose = options.verbose;

  var logv = require('./pluginUtil').logv;

  logv(verbose, 'FUNCTION _getFileAndContextDeps');

  const uniq = require('lodash.uniq');

  const isGlob = require('is-glob');

  const {
    fileDependencies,
    contextDependencies
  } = compilation;
  const isWebpack4 = compilation.hooks;
  let fds = isWebpack4 ? [...fileDependencies] : fileDependencies;
  let cds = isWebpack4 ? [...contextDependencies] : contextDependencies;

  if (files.length > 0) {
    files.forEach(pattern => {
      let f = pattern;

      if (isGlob(pattern)) {
        f = glob.sync(pattern, {
          cwd,
          dot: true,
          absolute: true
        });
      }

      fds = fds.concat(f);
    });
    fds = uniq(fds);
  }

  if (dirs.length > 0) {
    cds = uniq(cds.concat(dirs));
  }

  return {
    fileDependencies: fds,
    contextDependencies: cds
  };
}

function _prepareForBuild(app, vars, options, output, compilation) {
  try {
    const log = require('./pluginUtil').log;

    const logv = require('./pluginUtil').logv;

    logv(options, '_prepareForBuild');

    const fs = require('fs');

    const recursiveReadSync = require('recursive-readdir-sync');

    var watchedFiles = [];

    try {
      watchedFiles = recursiveReadSync('./app').concat(recursiveReadSync('./packages'));
    } catch (err) {
      if (err.errno === 34) {
        console.log('Path does not exist');
      } else {
        throw err;
      }
    }

    var currentNumFiles = watchedFiles.length;
    logv(options, 'watchedFiles: ' + currentNumFiles);
    var doBuild = true;
    logv(options, 'doBuild: ' + doBuild);
    vars.lastMilliseconds = new Date().getTime();
    var filesource = 'this file enables client reload';
    compilation.assets[currentNumFiles + 'FilesUnderAppFolder.md'] = {
      source: function () {
        return filesource;
      },
      size: function () {
        return filesource.length;
      }
    };
    logv(options, 'currentNumFiles: ' + currentNumFiles);
    logv(options, 'vars.lastNumFiles: ' + vars.lastNumFiles);
    logv(options, 'doBuild: ' + doBuild);

    if (currentNumFiles != vars.lastNumFiles || doBuild) {
      vars.rebuild = true;
      var bundleDir = output.replace(process.cwd(), '');

      if (bundleDir.trim() == '') {
        bundleDir = './';
      }

      log(app + 'Building Ext bundle at: ' + bundleDir);
    } else {
      vars.rebuild = false;
    }

    vars.lastNumFiles = currentNumFiles;
  } catch (e) {
    console.log(e);
    compilation.errors.push('_prepareForBuild: ' + e);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9leHRqc1V0aWwuanMiXSwibmFtZXMiOlsiX2dldERlZmF1bHRWYXJzIiwicmVidWlsZCIsIndhdGNoU3RhcnRlZCIsImZpcnN0VGltZSIsImJyb3dzZXJDb3VudCIsImN3ZCIsInByb2Nlc3MiLCJleHRQYXRoIiwicGx1Z2luRXJyb3JzIiwibGFzdE51bUZpbGVzIiwibGFzdE1pbGxpc2Vjb25kcyIsImxhc3RNaWxsaXNlY29uZHNBcHBKc29uIiwiZmlsZXMiLCJkaXJzIiwiX2FmdGVyQ29tcGlsZSIsImNvbXBpbGF0aW9uIiwidmFycyIsIm9wdGlvbnMiLCJ2ZXJib3NlIiwibG9ndiIsInJlcXVpcmUiLCJwYXRoIiwiZmlsZURlcGVuZGVuY2llcyIsImNvbnRleHREZXBlbmRlbmNpZXMiLCJfZ2V0RmlsZUFuZENvbnRleHREZXBzIiwibGVuZ3RoIiwiZm9yRWFjaCIsImZpbGUiLCJhZGQiLCJyZXNvbHZlIiwiY29udGV4dCIsInVuaXEiLCJpc0dsb2IiLCJpc1dlYnBhY2s0IiwiaG9va3MiLCJmZHMiLCJjZHMiLCJwYXR0ZXJuIiwiZiIsImdsb2IiLCJzeW5jIiwiZG90IiwiYWJzb2x1dGUiLCJjb25jYXQiLCJfcHJlcGFyZUZvckJ1aWxkIiwiYXBwIiwib3V0cHV0IiwibG9nIiwiZnMiLCJyZWN1cnNpdmVSZWFkU3luYyIsIndhdGNoZWRGaWxlcyIsImVyciIsImVycm5vIiwiY29uc29sZSIsImN1cnJlbnROdW1GaWxlcyIsImRvQnVpbGQiLCJEYXRlIiwiZ2V0VGltZSIsImZpbGVzb3VyY2UiLCJhc3NldHMiLCJzb3VyY2UiLCJzaXplIiwiYnVuZGxlRGlyIiwicmVwbGFjZSIsInRyaW0iLCJlIiwiZXJyb3JzIiwicHVzaCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztBQUVPLFNBQVNBLGVBQVQsR0FBMkI7QUFDaEMsU0FBTztBQUNMQyxJQUFBQSxPQUFPLEVBQUUsSUFESjtBQUVMQyxJQUFBQSxZQUFZLEVBQUcsS0FGVjtBQUdMQyxJQUFBQSxTQUFTLEVBQUcsSUFIUDtBQUlMQyxJQUFBQSxZQUFZLEVBQUcsQ0FKVjtBQUtMQyxJQUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQ0QsR0FBUixFQUxBO0FBTUxFLElBQUFBLE9BQU8sRUFBRSxHQU5KO0FBT0xDLElBQUFBLFlBQVksRUFBRSxFQVBUO0FBUUxDLElBQUFBLFlBQVksRUFBRSxDQVJUO0FBU0xDLElBQUFBLGdCQUFnQixFQUFFLENBVGI7QUFVTEMsSUFBQUEsdUJBQXVCLEVBQUUsQ0FWcEI7QUFXTEMsSUFBQUEsS0FBSyxFQUFFLENBQUMsWUFBRCxDQVhGO0FBWUxDLElBQUFBLElBQUksRUFBRSxDQUFDLE9BQUQsRUFBUyxZQUFUO0FBWkQsR0FBUDtBQWNEOztBQUVNLFNBQVNDLGFBQVQsQ0FBdUJDLFdBQXZCLEVBQW9DQyxJQUFwQyxFQUEwQ0MsT0FBMUMsRUFBbUQ7QUFDeEQsTUFBSUMsT0FBTyxHQUFHRCxPQUFPLENBQUNDLE9BQXRCOztBQUNBLE1BQUlDLElBQUksR0FBR0MsT0FBTyxDQUFDLGNBQUQsQ0FBUCxDQUF3QkQsSUFBbkM7O0FBQ0FBLEVBQUFBLElBQUksQ0FBQ0QsT0FBRCxFQUFTLDhCQUFULENBQUo7O0FBQ0EsUUFBTUcsSUFBSSxHQUFHRCxPQUFPLENBQUMsTUFBRCxDQUFwQjs7QUFDQSxNQUFJO0FBQUVSLElBQUFBLEtBQUY7QUFBU0MsSUFBQUE7QUFBVCxNQUFrQkcsSUFBdEI7QUFDQSxRQUFNO0FBQUVYLElBQUFBO0FBQUYsTUFBVVcsSUFBaEI7QUFDQUosRUFBQUEsS0FBSyxHQUFHLE9BQU9BLEtBQVAsS0FBaUIsUUFBakIsR0FBNEIsQ0FBQ0EsS0FBRCxDQUE1QixHQUFzQ0EsS0FBOUM7QUFDQUMsRUFBQUEsSUFBSSxHQUFHLE9BQU9BLElBQVAsS0FBZ0IsUUFBaEIsR0FBMkIsQ0FBQ0EsSUFBRCxDQUEzQixHQUFvQ0EsSUFBM0M7O0FBQ0EsUUFBTTtBQUNKUyxJQUFBQSxnQkFESTtBQUVKQyxJQUFBQTtBQUZJLE1BR0ZDLHNCQUFzQixDQUFDVCxXQUFELEVBQWNILEtBQWQsRUFBcUJDLElBQXJCLEVBQTJCUixHQUEzQixFQUFnQ1ksT0FBaEMsQ0FIMUI7O0FBSUEsTUFBSUwsS0FBSyxDQUFDYSxNQUFOLEdBQWUsQ0FBbkIsRUFBc0I7QUFDcEJILElBQUFBLGdCQUFnQixDQUFDSSxPQUFqQixDQUEwQkMsSUFBRCxJQUFVO0FBQ2pDWixNQUFBQSxXQUFXLENBQUNPLGdCQUFaLENBQTZCTSxHQUE3QixDQUFpQ1AsSUFBSSxDQUFDUSxPQUFMLENBQWFGLElBQWIsQ0FBakM7QUFDRCxLQUZEO0FBR0Q7O0FBQ0QsTUFBSWQsSUFBSSxDQUFDWSxNQUFMLEdBQWMsQ0FBbEIsRUFBcUI7QUFDbkJGLElBQUFBLG1CQUFtQixDQUFDRyxPQUFwQixDQUE2QkksT0FBRCxJQUFhO0FBQ3ZDZixNQUFBQSxXQUFXLENBQUNRLG1CQUFaLENBQWdDSyxHQUFoQyxDQUFvQ0UsT0FBcEM7QUFDRCxLQUZEO0FBR0Q7QUFDRjs7QUFFRCxTQUFTTixzQkFBVCxDQUFnQ1QsV0FBaEMsRUFBNkNILEtBQTdDLEVBQW9EQyxJQUFwRCxFQUEwRFIsR0FBMUQsRUFBK0RZLE9BQS9ELEVBQXdFO0FBQ3RFLE1BQUlDLE9BQU8sR0FBR0QsT0FBTyxDQUFDQyxPQUF0Qjs7QUFDQSxNQUFJQyxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JELElBQW5DOztBQUNBQSxFQUFBQSxJQUFJLENBQUNELE9BQUQsRUFBUyxpQ0FBVCxDQUFKOztBQUNBLFFBQU1hLElBQUksR0FBR1gsT0FBTyxDQUFDLGFBQUQsQ0FBcEI7O0FBQ0EsUUFBTVksTUFBTSxHQUFHWixPQUFPLENBQUMsU0FBRCxDQUF0Qjs7QUFFQSxRQUFNO0FBQUVFLElBQUFBLGdCQUFGO0FBQW9CQyxJQUFBQTtBQUFwQixNQUE0Q1IsV0FBbEQ7QUFDQSxRQUFNa0IsVUFBVSxHQUFHbEIsV0FBVyxDQUFDbUIsS0FBL0I7QUFDQSxNQUFJQyxHQUFHLEdBQUdGLFVBQVUsR0FBRyxDQUFDLEdBQUdYLGdCQUFKLENBQUgsR0FBMkJBLGdCQUEvQztBQUNBLE1BQUljLEdBQUcsR0FBR0gsVUFBVSxHQUFHLENBQUMsR0FBR1YsbUJBQUosQ0FBSCxHQUE4QkEsbUJBQWxEOztBQUNBLE1BQUlYLEtBQUssQ0FBQ2EsTUFBTixHQUFlLENBQW5CLEVBQXNCO0FBQ3BCYixJQUFBQSxLQUFLLENBQUNjLE9BQU4sQ0FBZVcsT0FBRCxJQUFhO0FBQ3pCLFVBQUlDLENBQUMsR0FBR0QsT0FBUjs7QUFDQSxVQUFJTCxNQUFNLENBQUNLLE9BQUQsQ0FBVixFQUFxQjtBQUNuQkMsUUFBQUEsQ0FBQyxHQUFHQyxJQUFJLENBQUNDLElBQUwsQ0FBVUgsT0FBVixFQUFtQjtBQUFFaEMsVUFBQUEsR0FBRjtBQUFPb0MsVUFBQUEsR0FBRyxFQUFFLElBQVo7QUFBa0JDLFVBQUFBLFFBQVEsRUFBRTtBQUE1QixTQUFuQixDQUFKO0FBQ0Q7O0FBQ0RQLE1BQUFBLEdBQUcsR0FBR0EsR0FBRyxDQUFDUSxNQUFKLENBQVdMLENBQVgsQ0FBTjtBQUNELEtBTkQ7QUFPQUgsSUFBQUEsR0FBRyxHQUFHSixJQUFJLENBQUNJLEdBQUQsQ0FBVjtBQUNEOztBQUNELE1BQUl0QixJQUFJLENBQUNZLE1BQUwsR0FBYyxDQUFsQixFQUFxQjtBQUNuQlcsSUFBQUEsR0FBRyxHQUFHTCxJQUFJLENBQUNLLEdBQUcsQ0FBQ08sTUFBSixDQUFXOUIsSUFBWCxDQUFELENBQVY7QUFDRDs7QUFDRCxTQUFPO0FBQUVTLElBQUFBLGdCQUFnQixFQUFFYSxHQUFwQjtBQUF5QlosSUFBQUEsbUJBQW1CLEVBQUVhO0FBQTlDLEdBQVA7QUFDRDs7QUFFTSxTQUFTUSxnQkFBVCxDQUEwQkMsR0FBMUIsRUFBK0I3QixJQUEvQixFQUFxQ0MsT0FBckMsRUFBOEM2QixNQUE5QyxFQUFzRC9CLFdBQXRELEVBQW1FO0FBQ3hFLE1BQUk7QUFDRixVQUFNZ0MsR0FBRyxHQUFHM0IsT0FBTyxDQUFDLGNBQUQsQ0FBUCxDQUF3QjJCLEdBQXBDOztBQUNBLFVBQU01QixJQUFJLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JELElBQXJDOztBQUNBQSxJQUFBQSxJQUFJLENBQUNGLE9BQUQsRUFBUyxrQkFBVCxDQUFKOztBQUNBLFVBQU0rQixFQUFFLEdBQUc1QixPQUFPLENBQUMsSUFBRCxDQUFsQjs7QUFDQSxVQUFNNkIsaUJBQWlCLEdBQUc3QixPQUFPLENBQUMsd0JBQUQsQ0FBakM7O0FBQ0EsUUFBSThCLFlBQVksR0FBQyxFQUFqQjs7QUFDQSxRQUFJO0FBQUNBLE1BQUFBLFlBQVksR0FBR0QsaUJBQWlCLENBQUMsT0FBRCxDQUFqQixDQUEyQk4sTUFBM0IsQ0FBa0NNLGlCQUFpQixDQUFDLFlBQUQsQ0FBbkQsQ0FBZjtBQUFrRixLQUF2RixDQUNBLE9BQU1FLEdBQU4sRUFBVztBQUFDLFVBQUdBLEdBQUcsQ0FBQ0MsS0FBSixLQUFjLEVBQWpCLEVBQW9CO0FBQUNDLFFBQUFBLE9BQU8sQ0FBQ04sR0FBUixDQUFZLHFCQUFaO0FBQW9DLE9BQXpELE1BQStEO0FBQUMsY0FBTUksR0FBTjtBQUFXO0FBQUM7O0FBQ3hGLFFBQUlHLGVBQWUsR0FBR0osWUFBWSxDQUFDekIsTUFBbkM7QUFDQU4sSUFBQUEsSUFBSSxDQUFDRixPQUFELEVBQVMsbUJBQW1CcUMsZUFBNUIsQ0FBSjtBQUNBLFFBQUlDLE9BQU8sR0FBRyxJQUFkO0FBRUFwQyxJQUFBQSxJQUFJLENBQUNGLE9BQUQsRUFBUyxjQUFjc0MsT0FBdkIsQ0FBSjtBQUVBdkMsSUFBQUEsSUFBSSxDQUFDTixnQkFBTCxHQUF5QixJQUFJOEMsSUFBSixFQUFELENBQVdDLE9BQVgsRUFBeEI7QUFDQSxRQUFJQyxVQUFVLEdBQUcsaUNBQWpCO0FBQ0EzQyxJQUFBQSxXQUFXLENBQUM0QyxNQUFaLENBQW1CTCxlQUFlLEdBQUcsd0JBQXJDLElBQWlFO0FBQy9ETSxNQUFBQSxNQUFNLEVBQUUsWUFBVztBQUFDLGVBQU9GLFVBQVA7QUFBa0IsT0FEeUI7QUFFL0RHLE1BQUFBLElBQUksRUFBRSxZQUFXO0FBQUMsZUFBT0gsVUFBVSxDQUFDakMsTUFBbEI7QUFBeUI7QUFGb0IsS0FBakU7QUFLQU4sSUFBQUEsSUFBSSxDQUFDRixPQUFELEVBQVMsc0JBQXNCcUMsZUFBL0IsQ0FBSjtBQUNBbkMsSUFBQUEsSUFBSSxDQUFDRixPQUFELEVBQVMsd0JBQXdCRCxJQUFJLENBQUNQLFlBQXRDLENBQUo7QUFDQVUsSUFBQUEsSUFBSSxDQUFDRixPQUFELEVBQVMsY0FBY3NDLE9BQXZCLENBQUo7O0FBRUEsUUFBSUQsZUFBZSxJQUFJdEMsSUFBSSxDQUFDUCxZQUF4QixJQUF3QzhDLE9BQTVDLEVBQXFEO0FBQ25EdkMsTUFBQUEsSUFBSSxDQUFDZixPQUFMLEdBQWUsSUFBZjtBQUNBLFVBQUk2RCxTQUFTLEdBQUdoQixNQUFNLENBQUNpQixPQUFQLENBQWV6RCxPQUFPLENBQUNELEdBQVIsRUFBZixFQUE4QixFQUE5QixDQUFoQjs7QUFDQSxVQUFJeUQsU0FBUyxDQUFDRSxJQUFWLE1BQW9CLEVBQXhCLEVBQTRCO0FBQUNGLFFBQUFBLFNBQVMsR0FBRyxJQUFaO0FBQWlCOztBQUM5Q2YsTUFBQUEsR0FBRyxDQUFDRixHQUFHLEdBQUcsMEJBQU4sR0FBbUNpQixTQUFwQyxDQUFIO0FBQ0QsS0FMRCxNQU1LO0FBQ0g5QyxNQUFBQSxJQUFJLENBQUNmLE9BQUwsR0FBZSxLQUFmO0FBQ0Q7O0FBQ0RlLElBQUFBLElBQUksQ0FBQ1AsWUFBTCxHQUFvQjZDLGVBQXBCO0FBQ0QsR0FwQ0QsQ0FxQ0EsT0FBTVcsQ0FBTixFQUFTO0FBQ1BaLElBQUFBLE9BQU8sQ0FBQ04sR0FBUixDQUFZa0IsQ0FBWjtBQUNBbEQsSUFBQUEsV0FBVyxDQUFDbUQsTUFBWixDQUFtQkMsSUFBbkIsQ0FBd0IsdUJBQXVCRixDQUEvQztBQUNEO0FBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIlxuXG5leHBvcnQgZnVuY3Rpb24gX2dldERlZmF1bHRWYXJzKCkge1xuICByZXR1cm4ge1xuICAgIHJlYnVpbGQ6IHRydWUsXG4gICAgd2F0Y2hTdGFydGVkIDogZmFsc2UsXG4gICAgZmlyc3RUaW1lIDogdHJ1ZSxcbiAgICBicm93c2VyQ291bnQgOiAwLFxuICAgIGN3ZDogcHJvY2Vzcy5jd2QoKSxcbiAgICBleHRQYXRoOiAnLicsXG4gICAgcGx1Z2luRXJyb3JzOiBbXSxcbiAgICBsYXN0TnVtRmlsZXM6IDAsXG4gICAgbGFzdE1pbGxpc2Vjb25kczogMCxcbiAgICBsYXN0TWlsbGlzZWNvbmRzQXBwSnNvbjogMCxcbiAgICBmaWxlczogWycuL2FwcC5qc29uJ10sXG4gICAgZGlyczogWycuL2FwcCcsJy4vcGFja2FnZXMnXVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfYWZ0ZXJDb21waWxlKGNvbXBpbGF0aW9uLCB2YXJzLCBvcHRpb25zKSB7XG4gIHZhciB2ZXJib3NlID0gb3B0aW9ucy52ZXJib3NlXG4gIHZhciBsb2d2ID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9ndlxuICBsb2d2KHZlcmJvc2UsJ0ZVTkNUSU9OIGV4dGpzIF9hZnRlckNvbXBpbGUnKVxuICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG4gIGxldCB7IGZpbGVzLCBkaXJzIH0gPSB2YXJzXG4gIGNvbnN0IHsgY3dkIH0gPSB2YXJzXG4gIGZpbGVzID0gdHlwZW9mIGZpbGVzID09PSAnc3RyaW5nJyA/IFtmaWxlc10gOiBmaWxlc1xuICBkaXJzID0gdHlwZW9mIGRpcnMgPT09ICdzdHJpbmcnID8gW2RpcnNdIDogZGlyc1xuICBjb25zdCB7XG4gICAgZmlsZURlcGVuZGVuY2llcyxcbiAgICBjb250ZXh0RGVwZW5kZW5jaWVzLFxuICB9ID0gX2dldEZpbGVBbmRDb250ZXh0RGVwcyhjb21waWxhdGlvbiwgZmlsZXMsIGRpcnMsIGN3ZCwgb3B0aW9ucyk7XG4gIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgZmlsZURlcGVuZGVuY2llcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICBjb21waWxhdGlvbi5maWxlRGVwZW5kZW5jaWVzLmFkZChwYXRoLnJlc29sdmUoZmlsZSkpO1xuICAgIH0pXG4gIH1cbiAgaWYgKGRpcnMubGVuZ3RoID4gMCkge1xuICAgIGNvbnRleHREZXBlbmRlbmNpZXMuZm9yRWFjaCgoY29udGV4dCkgPT4ge1xuICAgICAgY29tcGlsYXRpb24uY29udGV4dERlcGVuZGVuY2llcy5hZGQoY29udGV4dCk7XG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBfZ2V0RmlsZUFuZENvbnRleHREZXBzKGNvbXBpbGF0aW9uLCBmaWxlcywgZGlycywgY3dkLCBvcHRpb25zKSB7XG4gIHZhciB2ZXJib3NlID0gb3B0aW9ucy52ZXJib3NlXG4gIHZhciBsb2d2ID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9ndlxuICBsb2d2KHZlcmJvc2UsJ0ZVTkNUSU9OIF9nZXRGaWxlQW5kQ29udGV4dERlcHMnKVxuICBjb25zdCB1bmlxID0gcmVxdWlyZSgnbG9kYXNoLnVuaXEnKVxuICBjb25zdCBpc0dsb2IgPSByZXF1aXJlKCdpcy1nbG9iJylcblxuICBjb25zdCB7IGZpbGVEZXBlbmRlbmNpZXMsIGNvbnRleHREZXBlbmRlbmNpZXMgfSA9IGNvbXBpbGF0aW9uO1xuICBjb25zdCBpc1dlYnBhY2s0ID0gY29tcGlsYXRpb24uaG9va3M7XG4gIGxldCBmZHMgPSBpc1dlYnBhY2s0ID8gWy4uLmZpbGVEZXBlbmRlbmNpZXNdIDogZmlsZURlcGVuZGVuY2llcztcbiAgbGV0IGNkcyA9IGlzV2VicGFjazQgPyBbLi4uY29udGV4dERlcGVuZGVuY2llc10gOiBjb250ZXh0RGVwZW5kZW5jaWVzO1xuICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgIGZpbGVzLmZvckVhY2goKHBhdHRlcm4pID0+IHtcbiAgICAgIGxldCBmID0gcGF0dGVyblxuICAgICAgaWYgKGlzR2xvYihwYXR0ZXJuKSkge1xuICAgICAgICBmID0gZ2xvYi5zeW5jKHBhdHRlcm4sIHsgY3dkLCBkb3Q6IHRydWUsIGFic29sdXRlOiB0cnVlIH0pXG4gICAgICB9XG4gICAgICBmZHMgPSBmZHMuY29uY2F0KGYpXG4gICAgfSlcbiAgICBmZHMgPSB1bmlxKGZkcylcbiAgfVxuICBpZiAoZGlycy5sZW5ndGggPiAwKSB7XG4gICAgY2RzID0gdW5pcShjZHMuY29uY2F0KGRpcnMpKVxuICB9XG4gIHJldHVybiB7IGZpbGVEZXBlbmRlbmNpZXM6IGZkcywgY29udGV4dERlcGVuZGVuY2llczogY2RzIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9wcmVwYXJlRm9yQnVpbGQoYXBwLCB2YXJzLCBvcHRpb25zLCBvdXRwdXQsIGNvbXBpbGF0aW9uKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgbG9nID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9nXG4gICAgY29uc3QgbG9ndiA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ3ZcbiAgICBsb2d2KG9wdGlvbnMsJ19wcmVwYXJlRm9yQnVpbGQnKVxuICAgIGNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxuICAgIGNvbnN0IHJlY3Vyc2l2ZVJlYWRTeW5jID0gcmVxdWlyZSgncmVjdXJzaXZlLXJlYWRkaXItc3luYycpXG4gICAgdmFyIHdhdGNoZWRGaWxlcz1bXVxuICAgIHRyeSB7d2F0Y2hlZEZpbGVzID0gcmVjdXJzaXZlUmVhZFN5bmMoJy4vYXBwJykuY29uY2F0KHJlY3Vyc2l2ZVJlYWRTeW5jKCcuL3BhY2thZ2VzJykpfVxuICAgIGNhdGNoKGVycikge2lmKGVyci5lcnJubyA9PT0gMzQpe2NvbnNvbGUubG9nKCdQYXRoIGRvZXMgbm90IGV4aXN0Jyk7fSBlbHNlIHt0aHJvdyBlcnI7fX1cbiAgICB2YXIgY3VycmVudE51bUZpbGVzID0gd2F0Y2hlZEZpbGVzLmxlbmd0aFxuICAgIGxvZ3Yob3B0aW9ucywnd2F0Y2hlZEZpbGVzOiAnICsgY3VycmVudE51bUZpbGVzKVxuICAgIHZhciBkb0J1aWxkID0gdHJ1ZVxuICAgIFxuICAgIGxvZ3Yob3B0aW9ucywnZG9CdWlsZDogJyArIGRvQnVpbGQpXG5cbiAgICB2YXJzLmxhc3RNaWxsaXNlY29uZHMgPSAobmV3IERhdGUpLmdldFRpbWUoKVxuICAgIHZhciBmaWxlc291cmNlID0gJ3RoaXMgZmlsZSBlbmFibGVzIGNsaWVudCByZWxvYWQnXG4gICAgY29tcGlsYXRpb24uYXNzZXRzW2N1cnJlbnROdW1GaWxlcyArICdGaWxlc1VuZGVyQXBwRm9sZGVyLm1kJ10gPSB7XG4gICAgICBzb3VyY2U6IGZ1bmN0aW9uKCkge3JldHVybiBmaWxlc291cmNlfSxcbiAgICAgIHNpemU6IGZ1bmN0aW9uKCkge3JldHVybiBmaWxlc291cmNlLmxlbmd0aH1cbiAgICB9XG5cbiAgICBsb2d2KG9wdGlvbnMsJ2N1cnJlbnROdW1GaWxlczogJyArIGN1cnJlbnROdW1GaWxlcylcbiAgICBsb2d2KG9wdGlvbnMsJ3ZhcnMubGFzdE51bUZpbGVzOiAnICsgdmFycy5sYXN0TnVtRmlsZXMpXG4gICAgbG9ndihvcHRpb25zLCdkb0J1aWxkOiAnICsgZG9CdWlsZClcblxuICAgIGlmIChjdXJyZW50TnVtRmlsZXMgIT0gdmFycy5sYXN0TnVtRmlsZXMgfHwgZG9CdWlsZCkge1xuICAgICAgdmFycy5yZWJ1aWxkID0gdHJ1ZVxuICAgICAgdmFyIGJ1bmRsZURpciA9IG91dHB1dC5yZXBsYWNlKHByb2Nlc3MuY3dkKCksICcnKVxuICAgICAgaWYgKGJ1bmRsZURpci50cmltKCkgPT0gJycpIHtidW5kbGVEaXIgPSAnLi8nfVxuICAgICAgbG9nKGFwcCArICdCdWlsZGluZyBFeHQgYnVuZGxlIGF0OiAnICsgYnVuZGxlRGlyKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhcnMucmVidWlsZCA9IGZhbHNlXG4gICAgfVxuICAgIHZhcnMubGFzdE51bUZpbGVzID0gY3VycmVudE51bUZpbGVzXG4gIH1cbiAgY2F0Y2goZSkge1xuICAgIGNvbnNvbGUubG9nKGUpXG4gICAgY29tcGlsYXRpb24uZXJyb3JzLnB1c2goJ19wcmVwYXJlRm9yQnVpbGQ6ICcgKyBlKVxuICB9XG59XG4iXX0=