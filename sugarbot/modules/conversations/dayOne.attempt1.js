const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

const mealEvents = ['breakfast', 'lunch', 'dinner', 'snack']
const state000 = ['Tell me more', 'Start the challenge']
const state001 = ['Start the challenge']

// Calculate the state transition given the last state and
// user input.
function getState(lastState, featureString, lastMealEvent) {
  switch (lastState) {
    case '000': {
      if (featureString === state000[0]) {
        return '001'
      } else if (featureString === state000[1]) {
        return '002'
      }
      return '000'
    }
    case '001': {
      if (featureString === state001[0]) {
        return '002'
      }
    }
    case '002': {
      switch (lastMealEvent) {
        case mealEvents[0]: return '003'
        case mealEvents[1]: return '004'
        case mealEvents[2]: return '005'
        default: return '008'
      }
    }
    case '003': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '009'
    }
    case '004': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '006'
    }
    case '005': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '007'
    }
    case '006': {

    }
    case '007': {

    }
    case '008': {

    }
    case '009': {

    }
    default: {
      // TODO: handle situation with unknown state. Likely want to take user to
      //       start of this day or something more intelligent.
      return '000'
    }
  }
}

function calculateMealEvent(timezone) {
  const userTime = timeUtils.getUserTimeObj(Date.now(), timezone)
  const {hour} = userTime
  if (hour > 4 && hour < 12) {
    return mealEvents[0]
  } else if (hour >= 12 && hour < 5) {
    return mealEvents[1]
  } else if (hour >= 6 && hour < 22) {
    return mealEvents[2]
  }
  return mealEvents[3]
}

function valIfExistsOr(snapshot, childPath, valIfUndefined = undefined) {
  if (snapshot.child(childPath).exists()) {
    return snapshot.child(childPath).val()
  }
  return valIfUndefined
}

exports.processWit = function(firebase, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Conversation dayOne: ' + featureString)

  const profileRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/")
  const sevenDayRef = profileRef.child('sevenDayChallenge')
  const lastStateRef = sevenDayRef.child('lastState')
  const lastMealEventRef = sevenDayRef.child('lastMealEvent')

  if (featureString === 'start') {
    // STATE 000:
    return fire.trackUserProfile(firebase, userId)
    .then(() => {
      return profileRef.once("value")
      .then(function(snapshot) {
        lastStateRef.set('000')

        const userName = valIfExistsOr(snapshot, 'first_name', '')

        const intro1 = "Hi" + userName + ", I’m sugarinfoAI."
        const intro2 = "I have a 7-day challenge to lower your risk of " +
                       "heart attack and type 2 diabetes."
        const buttons = "(" + state000[0] + ") | (" + state000[1] + ")"

        // TODO: when we get this dialog right, insert delays and chat actions
        return [
          intro1,
          intro2,
          buttons
        ]
      })
    })
  } else {
    return profileRef.once("value")
    .then(function(snapshot) {
      const lastState = valIfExistsOr(snapshot, 'sevenDayChallenge/lastState')
      const lastMealEvent = valIfExistsOr(snapshot, 'sevenDayChallenge/lastMealEvent')

      const state = getState(lastState, featureString, lastMealEvent);

      lastStateRef.set(state)
      switch (state) {
        case '000': {
          const buttons = "(" + state000[0] + ") | (" + state000[1] + ")"
          return [
            "I didn't understand you're response. Please try one of these buttons:",
            buttons
          ]
        }
        case '001': {
          const buttons = "(" + state001[0] + ")"
          return [
            "{TODO: more information}",
            buttons
          ]
        }
        case '002': {
          const mealEvent = calculateMealEvent(timezone)
          lastMealEventRef.set(mealEvent)

          const prompt = "Tell us about your " + mealEvent +
                         " ? (e.g. caesar salad, coffee with cream)"
          return [prompt]
        }
        case '003': {
          const autoAdd = true
          const progressBar = false
          const visualization = false
          return nutrition.getNutritionixWOpts(
            firebase, messageText, userId, date, timestamp,
            autoAdd, progressBar, visualization)
        }
        case '004': {

        }
        case '005': {

        }
        case '006': {

        }
        case '007': {

        }
        case '008': {

        }
        case '009': {

        }
        default: {
          // TODO - something that makes sense if we get to this unexpected state.
        }
      }
    })
  }
}
