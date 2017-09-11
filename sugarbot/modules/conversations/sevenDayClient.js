const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

function valIfExistsOr(snapshot, childPath, valIfUndefined = undefined) {
  if (snapshot.child(childPath).exists()) {
    return snapshot.child(childPath).val()
  }
  return valIfUndefined
}

exports.processWit = function(firebase, snapshot, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Conversation sevenDayClient: ' + featureString)

  const profileRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/")

  if (featureString === 'start') {
    // STATE 000:
    return fire.trackUserProfile(firebase, userId)
    .then(() => {
      return profileRef.once("value")
      .then(function(npSnapshot) {
        const userName = valIfExistsOr(npSnapshot, 'first_name', '')
        return "Hello " + userName + ", I’m sugarinfoAI!\n"
      })
    })
  } else {
    return messageText
  }
}
