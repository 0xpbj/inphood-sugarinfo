var http = require('http')
const firebase       = require('../sugarbot/node_modules/firebase')
const requestPromise = require('../sugarbot/node_modules/request-promise')
const constants = require('../sugarbot/modules/constants.js')
const timeUtils = require('../sugarbot/modules/timeUtils.js')

if (firebase.apps.length === 0) {
  firebase.initializeApp({
    apiKey: 'AIzaSyC6q3xNF48k98N-SkJOnkryA8J3ZeYOJPg',
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
  return firebase.auth().signInAnonymously()
  .then(() => {
    return firebase.database().ref("/global/sugarinfoai/")
    .once("value")
    .then(function(snapshot) {
      console.log('\n\n\n\nMY SNAPSHOT', snapshot)
      return 'snapshot read successfully'
    })
    .catch(error => {
      console.log('\n\n\n\nSNAPSHOT ERROR', error)
      return 'snapshot read failed'
    })
  })
  .catch(error => {
    console.log('AUTH ERROR', error)
  })
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this code.')
