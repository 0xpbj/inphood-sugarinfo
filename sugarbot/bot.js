const botBuilder = require('claudia-bot-builder')
const facebookMachine = require('./modules/stateMachine.js')
const fbTemplate = botBuilder.fbTemplate
const utils = require('./modules/utils.js')
const fire = require('./modules/firebaseUtils.js')

const constants = require('./modules/constants.js')
const firebase = require('firebase')
if (firebase.apps.length === 0) {
  firebase.initializeApp(constants.fbConfig)
}

const bailArr = ['main menu', 'refresh', 'reset', 'start', 'hey', 'menu', '?', 'help', 'hi', 'hello', 'back', 'cancel', 'clear', 'exit', 'start over']

module.exports = botBuilder(function (request, originalApiRequest) {
  // return 'hello world'
  if (request.type === 'facebook') {
    console.log('***************************', request)
    console.log('***************************', originalApiRequest)
    // const userId = request.originalRequest.sender.id
    const userId = '1322516797796635'
    var messageText = request.text ? request.text.toLowerCase() : null
    if (bailArr.indexOf(messageText) > -1) {
      if (firebase.auth().currentUser) {
        firebase.database().ref("/global/sugarinfoai/" + userId).child('/temp/data/').remove()
      }
      else {
        firebase.auth().signInAnonymously()
        .then(() => {
          firebase.database().ref("/global/sugarinfoai/" + userId).child('/temp/data/').remove()
        })
        .catch(error => {
          console.log('Login Error', error)
        })
      }
      return utils.otherOptions(true)
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
}, { platforms: ['facebook'] });
