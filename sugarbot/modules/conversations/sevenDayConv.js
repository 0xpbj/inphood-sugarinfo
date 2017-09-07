const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

const sevenDayChalStates = {
  unknown:      'User not asked yet',
  participate:  'User will participate',
  decline:      'User declines'
}

exports.processWit = function(firebase, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Seven day challenge conversation module: ' + featureString)

  const profileRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/")
  const sevenDayRef = profileRef.child('sevenDayChallenge')
  const lastStateRef = sevenDayRef.child('lastState')
  const trackWeightRef = sevenDayRef.child('trackWeight') // Yes, No
  const statusRef = sevenDayRef.child('status')   // Done, Participating, Opted-out etc.

  if (featureString === 'start') {
    // STATE 000:
    return fire.trackUserProfile(firebase, userId)
    .then(() => {
      return profileRef.once("value")
      .then(function(snapshot) {
        lastStateRef.set('000')

        const userName = snapshot.child('first_name').exists() ?
                         ' ' + snapshot.child('first_name') .val() : ''

        const intro1 = "Hi" + userName + ", I’m sugarinfoAI."
        const intro2 = "I have a 7-day challenge to lower your risk of " +
                       "heart attack and type 2 diabetes."
        const intro3 = "Want to hear more?"

        // TODO: when we get this dialog right, insert delays and chat actions
        return [
          intro1,
          intro2,
          intro3
        ]
      })
    })
  } else {
    return profileRef.once("value")
    .then(function(snapshot) {
      const lastState = snapshot.child('sevenDayChallenge/lastState').exists() ?
                        snapshot.child('sevenDayChallenge/lastState').val() : undefined

      // TODO handle lastState undefined
      switch (lastState) {

        case '000': {
          if (featureString === 'yes') {
            const gender = snapshot.child('gender').exists() ?
                           snapshot.child('gender').val() : undefined

            let response1 = 'The American Heart Association recommends no more '
            if (gender === 'female') {
              // STATE 001:
              lastStateRef.set('001')
              response1 += 'than 25g (6 teaspoons) of added sugar daily for ' +
                           'most females.'
            } else if (gender === 'male') {
              // STATE 002:
              lastStateRef.set('002')
              response1 += 'than 36g (9 teaspoons) of added sugar daily for ' +
                           'most males.'
            } else {
              // STATE 003:
              lastStateRef.set('003')
              response1 += 'than 25g (6 teaspoons) or 36g (9 teaspoons) of ' +
                           'added sugar daily for most females or males, ' +
                           'respectively.'
            }

            const response3 = 'For the next 7 days, lets see if you can ' +
                              'eat less added sugar than this recommendation.'

            // TODO: when we get this dialog right, insert delays and chat actions
            return [
              response1,
              'Most people eat more than double this amount daily!',
              response3,
              'Ready?'
            ]
          } else if (featureString === 'no') {
            // TODO: exit
            return ""
          } else {
            return "I don't understand your response. Want to hear more? (yes or no)"
          }
        }

        case '001' :
        case '002' : {
          if (featureString === 'yes') {
            // STATE 004:
            lastStateRef.set('004')
            return [
              "Excellent!",
              "When you tell me what you've eaten, I'll tell you approximately how much added sugar is in it.",
              "I'll also give you the option to add it to your daily food journal.",
              "Let's try it out--tell me what you've eaten today (e.g. pancakes and syrup)?"
            ]
          } else if (featureString === 'no') {
            // TODO: why, later, exit
            return ""
          } else {
            return "I don't understand your response. Ready to try the " +
                   "challenge? (yes or no)"
          }
        }

        case '003': {
          if (featureString === 'yes') {
            // STATE 005:
            lastStateRef.set('005')
            // TODO:     Button (36g males) | Button (25g females) --> 008
            return [
              "Excellent!",
              "What is the appropriate daily added sugar limit recommendation for you?"
            ]
          } else if (featureString === 'no') {
            // TODO: why, later, exit
            return ""
          } else {
            return "I don't understand your response. Ready to try the " +
                   "challenge? (yes or no)"
          }
        }

        case '004': {
          // TODO: the nutritionix result actually dictates if we're in state 6 or state 7 here.
          //       need to resolve that--assume state 6 for now.
          // STATE 006:
          lastStateRef.set('006')
          return nutrition.getNutritionix(firebase, messageText, userId, date, timestamp)
        }

        case '005': {
          return ""
        }

        case '006': {
          return ""
        }

        case '007': {
          return ""
        }

        case '008': {
          return ""
        }

        default: {
          return ""
        }
      }

    })
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
