const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

const currDay = 1
const nextDay = currDay + 1

const state000 = ['Tell me more', 'Start the challenge']
const state001 = ['Start the challenge']

const investment01 = "So, I'm curious--what are the reasons you're doing this challenge?"

// TODO: AC finish this (under construction)
//
// function scheduleReminder(firebase, timeMs, notificationType, userId, message) {
//   const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
//   const dbNotQueue = dbSugarInfo.child('notification_queue')
//
//   // Check to see if there is an entry where we are writing to in the notification_queue
//   // If so, check the next ms.
//   // When we find an entry, write the notificationType, userId, and message to
//   // that location.
//
//   dbNotQueue.child(timeMs).update({
//     notificationType: "message",
//     userId: userId,
//     message: message
//   })
// }

// Calculate the state transition given the last state and
// user input.
function getState(lastState, featureString, messageText, lastMealEvent) {
  console.log('getState: lastState='+lastState+', featureString='+featureString+', lastMealEvent='+lastMealEvent)
  switch (lastState) {
    case '000': {
      if (messageText.toLowerCase() === state000[0].toLowerCase()) {
        return '001'
      } else if (messageText.toLowerCase() === state000[1].toLowerCase()) {
        return '002'
      }
      return '000'
    }
    case '001': {
      if (messageText.toLowerCase() === state001[0].toLowerCase()) {
        return '002'
      }
    }
    case '002': {
      switch (lastMealEvent) {
        case utils.mealEvents[0]: return '003'
        case utils.mealEvents[1]: return '007'
        default: return '009'
      }
    }
    case '003': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '004'
    }
    case '004': {
      return '005'
    }
    case '005': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '006'
    }
    case '006': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '999'
    }
    case '007': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '008'
    }
    case '008': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '009'
    }
    case '009': {
      // TODO: need to handle error in getNutritionixWOpts where wolfram result is returned
      //       (steer the user to re-enter data)
      return '010'
    }
    case '010': {
      return '999'
    }
    default: {
      // TODO: handle situation with unknown state. Likely want to take user to
      //       start of this day or something more intelligent.
      return '999'
    }
  }
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

  console.log('Conversation day001: ' + featureString)

  const profileRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/")
  const sevenDayRef = profileRef.child('sevenDayChallenge')
  const lastStateRef = sevenDayRef.child('lastState')
  const dayRef = sevenDayRef.child('day')
  const lastMealEventRef = sevenDayRef.child('lastMealEvent')

  if (featureString === 'start' || messageText === 'demo reset') {
    // STATE 000:
    return fire.trackUserProfile(firebase, userId)
    .then(() => {
      return profileRef.once("value")
      .then(function(snapshot) {
        lastStateRef.set('000')
        dayRef.set(1)
        lastMealEventRef.set('')

        const userName = valIfExistsOr(snapshot, 'first_name', '')

        const intro1 = "Hi " + userName + ", I’m sugarinfoAI.\n"
        const intro2 = "I have a 7-day challenge to lower your risk of " +
                       "heart attack and type 2 diabetes."
        const buttons = "(" + state000[0] + ") | (" + state000[1] + ")"

        // TODO: when we get this dialog right, insert delays and chat actions
        // return [
        //   intro1,
        //   intro2,
        //   buttons
        // ]
        return new fbTemplate.Button(intro1+intro2)
            .addButton(state000[0], state000[0])
            .addButton(state000[1], state000[1])
            .get()
      })
    })
  } else {
    return profileRef.once("value")
    .then(function(snapshot) {
      const lastState = valIfExistsOr(snapshot, 'sevenDayChallenge/lastState')
      const lastMealEvent = valIfExistsOr(snapshot, 'sevenDayChallenge/lastMealEvent')

      const state = getState(lastState, featureString, messageText, lastMealEvent);

      lastStateRef.set(state)
      switch (state) {
        case '000': {
          const buttons = "(" + state000[0] + ") | (" + state000[1] + ")"
          // return [
          //   "I didn't understand you're response. Please try one of these buttons:",
          //   buttons
          // ]
          return new fbTemplate.Button("I didn't understand you're response. Please try one of these buttons:")
            .addButton(state000[0], state000[0])
            .addButton(state000[1], state000[1])
            .get()
        }
        case '001': {
          const buttons = "(" + state001[0] + ")"
          // return [
          //   "{TODO: more information}",
          //   buttons
          // ]
          return new fbTemplate.Button(
            "When you tell me what you've eaten, I'll tell you approximately " +
            "how much added sugar is in it. We'll learn the average daily sugar " +
            "that you consume and work to lower it, if necessary.")
            .addButton(state000[1], state000[1])
            .get()
        }
        case '002': {
          const mealEvent = utils.calculateMealEvent(timezone)
          lastMealEventRef.set(mealEvent)
          console.log('Determined mealEvent = ' + mealEvent)

          const prompt = "Tell me about your " + mealEvent +
                         " ? (e.g. caesar salad, coffee with cream)"
          return [prompt]
        }
        case '003': {
          const autoAdd = true
          const progressBar = false
          const visualization = false
          const messages = ['...',
                            investment01]
          return nutrition.getNutritionixWOpts(
                      firebase, messageText, userId, date, timestamp,
                      autoAdd, progressBar, visualization, messages)
        }
        case '004': {
          const reasonsRef = sevenDayRef.child('challengeReasons')
          // TODO: may need to clean messageText for firebase limitations on chars?
          reasonsRef.set(messageText)
          // TODO: set reminder
          const divider = ' '
          const fakeReminder = '(simulated notification) What did you have for lunch?'
          return ["Thanks! I'll keep that in mind. I'll also ask about your " +
                  "lunch in a while. Have a good day!",
                  divider,
                  fakeReminder]
        }
        case '005': {
          // TODO: set reminder
          const divider = ' '
          const fakeReminder = '(simulated notification) What did you have for dinner?'
          const messages = ["Great! Talk to you after dinner.",
                            divider,
                            fakeReminder]

          const autoAdd = true
          const progressBar = false
          const visualization = false
          return nutrition.getNutritionixWOpts(
                      firebase, messageText, userId, date, timestamp,
                      autoAdd, progressBar, visualization, messages)
        }
        case '006': {
          // TODO: set reminder
          const divider = ' '
          const fakeReminder = '(simulated notification) Next day breakfast question?'
          const messages = ["Great job today! Talk to you tomorrow.",
                            divider,
                            fakeReminder]

          const autoAdd = true
          const progressBar = false
          const visualization = false
          dayRef.set(nextDay)
          return nutrition.getNutritionixWOpts(
                      firebase, messageText, userId, date, timestamp,
                      autoAdd, progressBar, visualization, messages)
        }
        case '007': {
          const autoAdd = true
          const progressBar = false
          const visualization = false
          const messages = ['...',
                            "While we're at it, what did you have for breakfast?"]
          return nutrition.getNutritionixWOpts(
                      firebase, messageText, userId, date, timestamp,
                      autoAdd, progressBar, visualization, messages)
        }
        case '008': {
          // TODO: set reminder
          const divider = ' '
          const fakeReminder = '(simulated notification) What did you have for dinner?'
          const messages = ["Great! Talk to you after dinner.",
                            divider,
                            fakeReminder]

          const autoAdd = true
          const progressBar = false
          const visualization = false
          return nutrition.getNutritionixWOpts(
                      firebase, messageText, userId, date, timestamp,
                      autoAdd, progressBar, visualization, messages)
        }
        case '009': {
          const messages = [investment01]
          const autoAdd = true
          const progressBar = false
          const visualization = false
          return nutrition.getNutritionixWOpts(
                      firebase, messageText, userId, date, timestamp,
                      autoAdd, progressBar, visualization, messages)
        }
        case '010': {
          const reasonsRef = sevenDayRef.child('challengeReasons')
          // TODO: may need to clean messageText for firebase limitations on chars?
          reasonsRef.set(messageText)
          // TODO: set reminder
          const divider = ' '
          const fakeReminder = '(simulated notification) Next day breakfast question?'
          dayRef.set(nextDay)
          return ["Thanks! I'll keep that in mind. Great job today!",
                  "I'll talk to you tomorrow.",
                  divider,
                  fakeReminder]
        }
        default: {
          // TODO - something that makes sense if we get to this unexpected state.
          console.log('Oh oh! Unexpected state reached --> ' + state)
          return
        }
      }
    })
  }
}
