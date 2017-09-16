
// Requirements:
//
// Manage progress for users participating in a 7 day sugar challenge (i.e.
// understand and update state).
//
// Send out trigger notifications:
//   - breakfast (if not logged)
//     - if logged, then investment question (or PBJ pulls that)
//   - lunch (if not logged)
//     - if logged, then investment question (or PBJ pulls that)
//   - dinner (if not logged)
//     - if logged, then investment question (or PBJ pulls that)
//   - nightly report
//     - block the regular nightly report


const express = require('express')
const app = express()
const schedule = require('node-schedule')
const requestPromise = require('request-promise')
const constants = require('../sugarbot/modules/constants.js')
const timeUtils = require('../sugarbot/modules/timeUtils.js')
const utils = require('../sugarbot/modules/utils.js')

let dotEnvConfig = require('dotenv').config({path: '.env-production'})

// production token
const accessToken = dotEnvConfig.FACEBOOK_BEARER_TOKEN

const firebase = require('firebase')
if (firebase.apps.length === 0) {
  firebase.initializeApp({
    apiKey: dotEnvConfig.FIREBASE_API_KEY,
    authDomain: dotEnvConfig.FIREBASE_AUTH_DOMAIN,
    databaseURL: dotEnvConfig.FIREBASE_DATABASE_URL,
    projectId: dotEnvConfig.FIREBASE_PROJECT_ID,
    storageBucket: dotEnvConfig.FIREBASE_STORAGE_BUCKET
  })
}

function valIfExistsOr(snapshot, childPath, valIfUndefined = undefined) {
  if (snapshot.child(childPath).exists()) {
    return snapshot.child(childPath).val()
  }
  return valIfUndefined
}

function isProcessUsersSkipKey(key, restrictToDevs) {
  if (key === 'server') {
    return true
  }

  if (restrictToDevs && !constants.testUsers.includes(key)) {
    return true
  }

  return false
}

function getTriggerContext(userTime) {
  switch (userTime.hour) {
    case 10:
      return utils.mealEvents[0]
    case 14:
      return utils.mealEvents[1]
    case 19:
      return utils.mealEvents[2]
    default:
      return undefined
  }
}

function getTriggerMessage(context, userName) {
  // TODO: introduce some variance (i.e. talk about the weather or some
  //       non-controversial news in the greeting.)
  switch (context) {
    case utils.mealEvents[0]: {
      return "Good morning " + userName + ". Tell me what you had for breakfast?"
    }
    case utils.mealEvents[1]: {
      return "Good afternoon " + userName + ". What did you eat for lunch?"
    }
    case utils.mealEvents[2]: {
      return "Good evening " + userName + ". What did you have for dinner?"
    }
    default: {
      return "Hi " + userName + ". Tell me what you've been eating since " +
             "chatted last?"
    }
  }
}

function messageUser(userId, message) {
  const url = 'https://graph.facebook.com/v2.6/me/messages?access_token=' +
              dotEnvConfig.FACEBOOK_BEARER_TOKEN

  const options = {
    uri: url,
    json: true,
    method: 'POST',
    body: {
      'recipient' : {'id' : userId},
      'message' : {'text' : message}},
    resolveWithFullResponse: true,
  }

  console.log('Sending trigger message to ' + userId)
  requestPromise(options)
  .then(result => {console.log('Message sent. Response:\n' + result.body)})
  .catch(error => {console.log('Error sending message:\n' + error)})
}

function sendTriggerMessage(userId, userName, userTime, currentTimeUTC) {
  const triggerContext = getTriggerContext(userTime)
  if (!triggerContext) {
    continue
  }

  // Update the user data regardless of it's current values to match
  // the context we are triggering.
  //   TODO: check to see if a user already completed the current context.
  //
  let updateData = {
    context: triggerContext,
    phase: 'invest',
    nextPhase: 'action',
    lastTriggerUTC: currentTimeUTC
  }
  utils.updateChallengeData(userId, updateData)

  messageUser(userId, getTriggerMessage(triggerContext, userName))
}

function incrementChallengeDay(userId, day, userTime, startTime) {
  const currentDay = 1 + userTime.day - startTime.day
  if (day !== currentDay) {
    utils.updateChallengeData(userId, {day: currentDay})
  }
}

function processUsers(sendTriggers, incrementDays, restrictToDevs = false) {
  const currentTimeUTC = Date.now()
  const dbRefSevenDayChallenge =
    firebase.database().ref('/global/sugarinfoAI/sevenDayChallenge')

  return dbRefSevenDayChallenge.once('value',
    function(sdcSnapshot) {
      for (let key in sdcSnapshot) {
        if (isProcessUsersSkipKey(key, restrictToDevs)) {
          continue
        }
        const userId = key

        const userData = sdcSnapshot.child(userId).val()
        if (! 'profile' in userData) {
          // TODO: error / determine user's time zone.
          continue
        }

        const userName = userData[profile].first_name
        const timeZone = userData[profile].timezone
        const userTime = timeUtils.getUserTimeObj(currentTimeUTC, timeZone)

        if (sendTriggers) {
          sendTriggerMessage(userId, userName, userTime, currentTimeUTC)
        }

        const day = userData.day
        const startTime = userData.startTime
        if (incrementDays) {
          incrementChallengeDay(userId, day, userTime, startTime)
        }
      }
    }
  )
}

function processUserTriggers(restrictToDevs = false) {
  const sendTriggers = true
  processUsers(sendTriggers, false, restrictToDevs)
}

function processUserDays(restrictToDevs = false) {
  const incrementDays = true
  processUsers(false, incrementDays, restrictToDevs)
}

const port = 3000

app.listen(port, function () {
  console.log('App listening on port ' + port + '!')

  return firebase.auth().signInAnonymously()
  .then(() => {
    const challengeDayJob =
      schedule.scheduleJob('1 * * * *', processUserDays)
    const sendTriggerJob =
      schedule.scheduleJob('20 * * * *', processUserTriggers)

    const dbRefServerControl =
      firebase.database().ref('/global/sugarinfoai/sevenDayChallenge/server')

    return dbRefServerControl.on(
      'child_added', function(snapshot, prevChildKey) {
        const functionName = valIfExistsOr(snapshot, 'functionName')
        const simulateTime = valIfExistsOr(snapshot, 'simulateTime')

        // TODO: code to invoke processUserDays and processUserTriggers
      }
    )
  })
})
