var http = require('http');

http.createServer(function (request, response) {
  const utils = require('../utils.js')
  return utils.addSugarToFirebase('1322516797796635')
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this code.')
