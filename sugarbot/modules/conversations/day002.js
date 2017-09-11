const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

const currDay = 2
const nextDay = currDay + 1

// TODO: Day 1 notification system
//  - morning notificaiton scheduled by Day 0 interaction
//  - maybe lunch notification also scheduled by Day 0 interaction?
//
// Alternate ideas:
//  - notification system schedules all notifications and controls course thread level
//    state machine, while thread control their own internal states.
//  - if a thread is abandoned, the next notification resets the conversation, understands
//    what information we have and do not have and drives thread conversations
//

// Calculate the state transition given the last state and
// user input.
function getState(lastState, featureString, messageText, mealEvent, lastNotType) {
  console.log('getState: lastState='+lastState+', featureString='+featureString+', mealEvent='+mealEvent+', lastNotType='+lastNotType)
  switch (lastState) {
    case 'start': {
      if (lastNotType === utils.mealEvents[0]) {
        if (mealEvent === utils.mealEvents[1]) {
          return '003'
        } else {
          return '000'
        }
      } else if (lastNotType === utils.mealEvents[1]) {
        return '004'
      }
    }
    case '000': {
      return '001'
    }
    case '001': {
      return '002'
    }
    case '002': {return '006'}
    case '003': {return '004'}
    case '004': {return '005'}
    case '005': {return '006'}
    case '006': {return '999'}
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

exports.processWit = function(firebase, snapshot, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Conversation day00' + currDay + ': ' + featureString)

  const profileRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/")
  const sevenDayRef = profileRef.child('sevenDayChallenge')
  const lastStateRef = sevenDayRef.child('lastState')
  const dayRef = sevenDayRef.child('day')
  const cravingsRef = sevenDayRef.child('challengeCravings')

  const lastState = valIfExistsOr(snapshot, 'sevenDayChallenge/lastState')
  const lastNotType = valIfExistsOr(snapshot, 'sevenDayChallenge/lastNotType')

  const mealEvent = utils.calculateMealEvent(timezone)
  const state = getState(lastState, featureString, messageText, mealEvent, lastNotType);

  lastStateRef.set(state)
  switch (state) {
    case '000': {
      let messages = ['What are some common foods that you have cravings for?']
      const autoAdd = true
      const progressBar = false
      const visualization = false
      const delayMessages = true
      // TODO: PBJ look into adding argument to getNutritionixWOpts that gets
      //       a nutrition fact.
      return nutrition.getNutritionixWOpts(
                  firebase, messageText, userId, date, timestamp,
                  autoAdd, progressBar, visualization, messages, delayMessages)
    }
    case '001': {
      cravingsRef.set(messageText)
      // TODO: set reminder
      const divider = ' '
      const fakeReminder = '(simulated notification) What did you have for lunch?'
      return ['Thanks for sharing that. Talk to you after lunch.',
              divider,
              fakeReminder]
    }
    case '002': {
      // TODO: set reminder
      let messages = ['Great! Talk to you after dinner.']

      const autoAdd = true
      const progressBar = false
      const visualization = false
      const delayMessages = true
      // TODO: PBJ look into adding argument to getNutritionixWOpts that gets
      //       a nutrition fact.
      return nutrition.getNutritionixWOpts(
                  firebase, messageText, userId, date, timestamp,
                  autoAdd, progressBar, visualization, messages, delayMessages)
    }
    case '003': {
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
}
