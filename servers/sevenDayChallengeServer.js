
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

let dotEnvConfig = require('dotenv').config({path: './.env-production'})

// production token
const accessToken = process.env.FACEBOOK_BEARER_TOKEN

const firebase = require('firebase')
if (firebase.apps.length === 0) {
  console.log('DEBUG: FIREBASE_API_KEY= ' + process.env.FIREBASE_API_KEY)
  firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  })
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
              process.env.FACEBOOK_BEARER_TOKEN

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
    return
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
  utils.updateChallengeData(firebase, userId, updateData)

  console.log('Sending trigger message to ' + userId + " at userTime: " + userTime)
  messageUser(userId, getTriggerMessage(triggerContext, userName))
}

function incrementChallengeDay(userId, day, userTime, startTime) {
  const currentDay = 1 + userTime.day - startTime.day
  if (day !== currentDay) {
    console.log('      incrementing challenge day for ' + userId)
    utils.updateChallengeData(firebase, userId, {day: currentDay})
  }
}

function processUsers(sendTriggers, incrementDays,
                      restrictToDevs = false, simulatedTime = undefined) {
  console.log('processUsers called:')

  const currentTimeUTC = Date.now()
  const dbRefSevenDayChallenge =
    firebase.database().ref('global/sugarinfoai/sevenDayChallenge')

  return dbRefSevenDayChallenge.once('value',
    function(sdcSnapshot) {
      let sdcData = sdcSnapshot.val()
      for (let key in sdcData) {
        if (isProcessUsersSkipKey(key, restrictToDevs)) {
          continue
        }
        const userId = key
        console.log('   processing userId: ' + userId)

        const userData = sdcData[userId]
        if (! userData.hasOwnProperty('profile')) {
          // TODO: error / determine user's time zone.
          continue
        }

        const userName = userData['profile'].first_name
        const timeZone = userData['profile'].timezone
        let userTime = timeUtils.getUserTimeObj(currentTimeUTC, timeZone)
        // Simulating time (hour specifically--modify userTime if
        // value specified in FBase):
        if (userData.hasOwnProperty('simUserHour')) {
          userTime.hour = userData.simUserHour
        }
        if (simulatedTime) {
          userTime = simulatedTime
        }

        console.log('      userTime hour = ' + userTime.hour)
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

function processUserTriggers(restrictToDevs = false, simulatedTime = undefined) {
  console.log('processUserTriggers called')

  const sendTriggers = true
  processUsers(sendTriggers, false, restrictToDevs, simulatedTime)
}

function processUserDays(restrictToDevs = false, simulatedTime = undefined) {
  console.log('processUserDays called')

  const incrementDays = true
  processUsers(false, incrementDays, restrictToDevs, simulatedTime)
}

const port = 3000

app.listen(port, function () {
  console.log('App listening on port ' + port + '!')

  return firebase.auth().signInAnonymously()
  .then(() => {
   const challengeDayJob =
     schedule.scheduleJob('1 * * * *', processUserDays)
   const sendTriggerJob =
     schedule.scheduleJob('7 * * * *', processUserTriggers)

    const dbRefServerControl =
      firebase.database().ref('/global/sugarinfoai/sevenDayChallenge/server')

    return dbRefServerControl.on(
      'child_added', function(scSnapshot, prevChildKey) {

        console.log('Server control instruction recieved.')

        console.log('   ' + scSnapshot.key + ': ' + scSnapshot.val())
        const functionName = utils.ssValIfExistsOr(scSnapshot, 'functionName')
        const simulatedTime = utils.ssValIfExistsOr(scSnapshot, 'simulatedTime')
        const restrictToDevs = true

        console.log('   functionName ' + functionName +
                    ', simulatedTime ' + simulatedTime)
        switch(functionName) {
          case 'processUserDays': {
            // Clear the request from FBase...
            const dbRefServerControlRequest = dbRefServerControl.child('request')
            dbRefServerControlRequest.set(null)

            processUserDays(restrictToDevs, simulatedTime)
            break
          }
          case 'processUserTriggers': {
            // Clear the request from FBase...
            const dbRefServerControlRequest = dbRefServerControl.child('request')
            dbRefServerControlRequest.set(null)

            processUserTriggers(restrictToDevs, simulatedTime)
            break
          }
          default: {}
        }
      }
    )
  })
})
