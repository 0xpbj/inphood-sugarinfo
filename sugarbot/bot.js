const botBuilder = require('claudia-bot-builder')
const facebookMachine = require('./modules/stateMachine.js')
const fbTemplate = botBuilder.fbTemplate
const utils = require('./modules/utils.js')
const fire = require('./modules/firebaseUtils.js')
const constants = require('./modules/constants.js')
const firebase = require('firebase')
if (firebase.apps.length === 0) {
  var config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  }
  firebase.initializeApp(config);
  console.log('%%%%%%%%%%%%%%%%%%%%%%%', firebase.app().name)
}
const bailArr = ['main menu', 'refresh', 'reset', 'start', 'hey', 'menu', '?', 'hi', 'hello', 'back', 'cancel', 'clear', 'exit', 'start over']

module.exports = botBuilder(function (request, originalApiRequest) {
  if (request.type === 'facebook') {
    // return 'hello world'
    console.log('***************************', request)
    console.log('***************************', originalApiRequest)
    const userId = request.originalRequest.sender.id
    var messageText = request.text ? request.text.toLowerCase() : null
    if (bailArr.indexOf(messageText) > -1) {
      if (firebase.auth().currentUser) {
        return utils.otherOptions(true)
      }
      else {
        return firebase.auth().signInAnonymously()
        .then(() => {
          return utils.otherOptions(true)
        })
        .catch(error => {
          console.log('Login Error', error)
        })
      }
    }
    else {
      if (firebase.auth().currentUser) {
        return facebookMachine.bot(request, messageText, userId)
      }
      return firebase.auth().signInAnonymously()
      .then(() => {
        return facebookMachine.bot(request, messageText, userId)
      })
      .catch(error => {
        console.log('Login Error', error)
      })
    }
  }
}, { platforms: ['facebook'] })