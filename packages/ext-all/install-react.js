const path = require('path')
const fs = require('fs-extra')

console.log('Running install-react')

var nodeDir = path.resolve(__dirname)
var currDir = process.cwd()

var pkg = (fs.existsSync(currDir + '/package.json') && JSON.parse(fs.readFileSync(currDir + '/package.json', 'utf-8')) || {});
var isReact = pkg.dependencies['react-scripts']

if (isReact != undefined) {
  //var fromDir = path.resolve(nodeDir, 'react')
  fs.copy(path.resolve(nodeDir, 'react', 'public'), path.resolve(currDir, 'public'), function (err) {
    if (err){
      console.log('An error occured while copying the react/public folder')
      return console.error(err)
    }
  })
  fs.copy(path.resolve(nodeDir, 'common', 'public'), path.resolve(currDir, 'public'), function (err) {
    if (err){
      console.log('An error occured while copying the common/public folder')
      return console.error(err)
    }
  });
  fs.copy(path.resolve(nodeDir, 'react', 'src'), path.resolve(currDir, 'src'), function (err) {
    if (err){
      console.log('An error occured while copying the src folder')
      return console.error(err)
    }
    console.log('Install completed')
  });
}
else {
  console.log('Install NOT completed')
}
