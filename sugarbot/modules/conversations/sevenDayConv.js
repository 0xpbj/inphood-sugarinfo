const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

exports.processWit = function(firebase, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Seven day challenge conversation module.')
  console.log('  ' + featureString)

  switch (featureString) {
    case 'start': {
      return fire.trackUserProfile(firebase, userId)
      .then(() => {
        return firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/").once("value")
        .then(function(snapshot) {
          let intro = ''
          if (snapshot.child('first_name').exists()) {
            intro = 'Hi ' + snapshot.child('first_name').val() + ', I’m sugarinfoAI!'
          }
          else {
            intro = 'Hi, I’m sugarinfoAI!'
          }
          return [
            intro,
            'I am here to help you understand how much sugar is in your diet.',
            new fbTemplate.ChatAction('typing_on').get(),
            new fbTemplate.Pause(500).get(),
            new fbTemplate.Button('Let\'s get started: ')
            .addButton('Learn About Sugar', 'sugar information')
            .addButton('ChatBot Features', 'tell me more')
            .get()
          ]
        })
      })
    }
  }
  // Day 1:
  // Start out by saying hello and briefly giving the value prop.
  // Then get right to tracking day 1.
  // Remind them again automatically at next meal time.
  // Send a report, but before that or in that, explain maximum sugar.
  //    Set a goal.
  //    Future: wizard to help them calculate target sugar.
  // Congratulate them on journey to health. Mention reminder tomorrow morning.
  //
  // Day 2:
}
