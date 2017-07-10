var http = require('http')
const firebase       = require('../sugarbot/node_modules/firebase')
const requestPromise = require('../sugarbot/node_modules/request-promise')
const constants = require('../sugarbot/modules/constants.js')
const timeUtils = require('../sugarbot/modules/timeUtils.js')

if (firebase.apps.length === 0) {
  firebase.initializeApp({
    apiKey: 'AIzaSyBQTHsQA5GuDG7Ttk17o3LBQfXjn7MtUQ8',
    authDomain: 'inphooddb-e0dfd.firebaseapp.com',
    databaseURL: 'https://inphooddb-e0dfd.firebaseio.com',
    projectId: 'inphooddb-e0dfd',
    storageBucket: 'inphooddb-e0dfd.appspot.com',
    messagingSenderId: '529180412076'
  })
}
const testMode = true

http.createServer(function (request, response) {
  console.log('Starting server')
  let introTip = constants.generateTip(constants.randomAlerts)
  console.log(introTip)
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this code.')
