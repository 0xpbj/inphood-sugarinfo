
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

// app.get('/', function (req, res) {
//   res.send('Hello World!')
// })

function queue_notification(dbNotQueue, currentTimeMs, timeHrs, userId, notificationType = 'reminder') {
  if (testMode && !constants.testUsers.includes(userId)) {
    return
  }
  const notificationTimeMs = testMode ?
    currentTimeMs + timeHrs * 60 * 1000 :
    currentTimeMs + timeHrs * 60 * 60 * 1000
  const dbNotQueueTime = dbNotQueue.child(notificationTimeMs)
  console.log('Adding ' + userId + ' to notification_queue at time ' + notificationTimeMs)
  const notification = {
    userId: userId,
    notificationType: notificationType
  }
  dbNotQueueTime.set(notification)
}

function send_notification(userId) {
  if (testMode && !constants.testUsers.includes(userId)) {
    return
  }

  const url = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + accessToken
  const message = {
    "attachment" : {
      "type" : "template",
         "payload":{
           "template_type":"button",
           "text":"⏰ Hi! You asked me to remind you to track a meal now.",
           "buttons":[
             {
               "type":"postback",
               "title":"Add to Journal ✏️",
               "payload":"journal"
             },
             {
               "type":"postback",
               "title":"Favorite Meals ❤️",
               "payload":"my favorites"
             }
           ]
        }
      }
    }

  let options = {
    uri: url,
    json: true,
    method: 'POST',
    body: {
      'recipient' : {
        'id' : userId
      },
      'message' : message
    },
    resolveWithFullResponse: true,
  }

  console.log('Notifying user ' + userId)

  return requestPromise(options)
  .then(result => {
    let body = result.body
    console.log('Message sent.')
    console.log('Recieved response:')
    console.log(body)
  })
  .catch(error => {
    console.log('Error sending message:')
    console.log(error)
  })
}

function queueReportJob(userId) {
  // Send a report job to the firebase queue for the reportServer

  if (testMode && !constants.testUsers.includes(userId)) {
    return
  }

  console.log('Requesting report for userId: ' + userId)
  console.log('------------------------------------------------')
  const reportRequest = {
    userId: userId,
    userTimeStamp: Date.now()
  }
  const dbReportQueue = firebase.database().ref("/global/sugarinfoai/reportQueue")
  const dbReportQueueRequest = dbReportQueue.push()
  dbReportQueueRequest.set(reportRequest)
}

function setupNotification(mealType) {
  switch(mealType) {
    case 'breakfast': {
      const breakfastTip = constants.generateTip(constants.breakfastAlerts)
      return {
        "attachment" : {
          "type" : "template",
          "payload":{
            "template_type":"button",
            "text":breakfastTip,
            "buttons":[{
              "type":"postback",
              "title":"Let's do it! ⌨️",
              "payload":"describe breakfast"
            }]
          }
        }
      }
    }
    case 'lunch': {
      const lunchTip = constants.generateTip(constants.lunchAlerts)
      return {
        "attachment" : {
          "type" : "template",
          "payload":{
            "template_type":"button",
            "text":lunchTip,
            "buttons":[{
              "type":"postback",
              "title":"Aaaalrighty then ⌨️",
              "payload":"describe lunch"
            }]
          }
        }
      }
    }
    case 'dinner': {
      const dinnerTip = constants.generateTip(constants.dinnerAlerts)
      return {
        "attachment" : {
          "type" : "template",
          "payload":{
            "template_type":"button",
            "text":dinnerTip,
            "buttons":[{
              "type":"postback",
              "title":"Hurry up, I'm sleepy ⌨️",
              "payload":"describe dinner"
            }]
          }
        }
      }
    }
    default: {
      const defaultTip = constants.generateTip(constants.defaultAlerts)
      return {
        "attachment" : {
          "type" : "template",
          "payload":{
            "template_type":"button",
            "text":defaultTip,
            "buttons":[{
              "type":"postback",
              "title":"Describe Food ⌨️",
              "payload":"food question"
            }]
          }
        }
      }
    }
  }
}

function send_tracking_notification(userId, mealType) {
  if (testMode && !constants.testUsers.includes(userId)) {
    return
  }
  const message = setupNotification(mealType)
  const url = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + accessToken
  const options = {
    uri: url,
    json: true,
    method: 'POST',
    body: {
      'recipient' : {
        'id' : userId
      },
      'message' : message
    },
    resolveWithFullResponse: true,
  }
  const textOptions = {
    uri: url,
    json: true,
    method: 'POST',
    body: {
      'recipient' : {
        'id' : userId
      },
      'message' : {
        text: constants.generateTip(constants.reminderTips)
      }
    },
    resolveWithFullResponse: true,
  }
  console.log('Notifying user ' + userId)
  return requestPromise(textOptions)
  .then(result => {
    return requestPromise(options)
    const body = result.body
    console.log('Message sent.')
    console.log('Recieved response:')
    console.log(body)
  })
  .catch(error => {
    console.log('Error sending message:')
    console.log(error)
  })
}

function dequeue_notifications() {
  // Assumes firebase has been signed into elsewhere (i.e. in the call to app.listen
  // by the time this code runs):
  const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
  const dbNotQueue = dbSugarInfo.child('notification_queue')

  // Monitor the notification_queue and compare the times in it to Date.now(). If
  // the times are less than Date.now(), send the user a friendly reminder
  // with a curl.
  const currentTimeMs = Date.now()
  // console.log('The current time in ms is: ' + currentTimeMs)

  return dbNotQueue.once('value',
    function(snapshot) {
      const notificationQueue = snapshot.val()
      for (let timeMs in notificationQueue) {
        if (timeMs <= currentTimeMs) {
          const userId = notificationQueue[timeMs].userId
          const notificationType = notificationQueue[timeMs].notificationType

          if (testMode && !constants.testUsers.includes(userId)) {
            continue
          }

          console.log('  Time to message user ' + notificationQueue[timeMs] +
                      '('+ timeMs +') notificationType: ' + notificationType)

          if (notificationType === 'reminder') {
            send_notification(userId)
          }
          else if (notificationType === 'report') {
            queueReportJob(userId)
          }
          else if (notificationType === 'trackingBreakfast') {
            send_tracking_notification(userId, 'breakfast')
          }
          else if (notificationType === 'trackingLunch') {
            send_tracking_notification(userId, 'lunch')
          }
          else if (notificationType === 'trackingDinner') {
            send_tracking_notification(userId, 'dinner')
          }
          else if (notificationType === 'noTrackingMessage') {
            // TODO:
          }
          // 2. Remove this entry from the notification_queue
          //
          const dbNotQueueTime = dbNotQueue.child(timeMs)
          dbNotQueueTime.set(null)
        }
      }
    },
    function(errorObject) {
      console.log('Failed to read notification_queue from firebase: ' +
                  errorObject.code)
    })
}

// At 8:45pm message a user with:
//   - Their daily report if they logged food that day.
//   - A message about tracking if they did not log food that day and:
//       - Meet facebook's criteria for a contactible person
//
// Psuedocode:
//   - At the mid-point of every hour, walk the sugarinfoai/<id> list looking for
//     profiles.
//   - Collect the timezone from the profile.
//   - If the timezone for the profile shows that the current time is ~8:00pm
//     local time:
//       - If a user has tracked food that day, schedule a report to be sent
//         to them at 8:45pm
//       - If a user has not tracked food that day, schedule a message about
//         the benefits of tracking and ask if they would like to track their
//         dinner?
//           - punt on this for now; talk to PBJ about how to do it within
//             FB rules/guidelines.
//           - it's safe to message someone who tracked that day
//
function scheduleReports() {
  console.log('scheduleReports')

  const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
  const dbNotQueue = dbSugarInfo.child('notification_queue')

  return dbSugarInfo.once('value',
    function(snapshot) {
      const sugarInfoAI = snapshot.val()
      for (let userId in sugarInfoAI) {
        const currentTimeUTC = Date.now()

        if (testMode && !constants.testUsers.includes(userId)) {
          continue
        }

        let userSugarInfoAI = sugarInfoAI[userId]
        if ('sugarIntake' in userSugarInfoAI &&
            'profile' in userSugarInfoAI &&
            'timezone' in userSugarInfoAI.profile) {

          const timeZone = userSugarInfoAI.profile.timezone
          const userTimeObj = timeUtils.getUserTimeObj(currentTimeUTC, timeZone)

          // If it's 19:xx local time, then if the user tracked something, schedule
          // a report notification for them in an hour
          //
          if (userTimeObj.hour === 19) {
            const userDate = timeUtils.getUserDateString(currentTimeUTC, timeZone)
            if (userDate in userSugarInfoAI.sugarIntake) {
              console.log('User ' + userId + ' logged meals today (' +
                          userDate + '). Scheduling a report notification.')

              queue_notification(dbNotQueue, currentTimeUTC, 1, userId, 'report')
            }
          }
        }
      }
    }
  )
}

function scheduleTracking() {
  console.log('scheduleTracking')
  const dbSugarInfo = firebase.database().ref('/global/sugarinfoai/')
  const dbNotQueue = dbSugarInfo.child('notification_queue')

  return dbSugarInfo.once('value', function(snapshot) {
    const sugarInfoAI = snapshot.val()
    for (let userId in sugarInfoAI) {
      const currentTimeUTC = Date.now()
      if (testMode && !constants.testUsers.includes(userId)) {
        console.log('testMode is on--skipping user: ' + userId)
        continue
      }
      console.log('  processing userId: ' + userId)
      const userSugarInfoAI = sugarInfoAI[userId]
      if ('sugarIntake' in userSugarInfoAI &&
          'profile' in userSugarInfoAI &&
          'timezone' in userSugarInfoAI.profile) {
        const timeZone = userSugarInfoAI.profile.timezone
        const userTimeObj = timeUtils.getUserTimeObj(currentTimeUTC, timeZone)
        const userDate = timeUtils.getUserDateString(currentTimeUTC, timeZone)

        // Skip this user if they didn't track yesterday either (b/c we would have sent
        // them a notification already yesterday and don't want to be irritating):
        const yesterdayTimeUTC = currentTimeUTC - (1000 * 60 * 60 * 24)
        const yesterdayUserDate = timeUtils.getUserDateString(yesterdayTimeUTC, timeZone)
        if (!userSugarInfoAI.sugarIntake.hasOwnProperty(yesterdayUserDate)) {
          console.log('  skipping userId (didn\'t track yest.): ' + userId)
          continue
        }

        if (!userSugarInfoAI.sugarIntake.hasOwnProperty(userDate)) {
          console.log('  User ' + userId + ' has not logged breakfast (' +
                      userDate + ').')
          if (userTimeObj.hour === 10) {
            console.log('   Scheduling a breakfast notification.')
            const dbTrackRef = dbSugarInfo.child(userId + '/trackingNotifications/' + userDate + '/breakfast')
            dbTrackRef.set(Date.now())
            queue_notification(dbNotQueue, currentTimeUTC, 0, userId, 'trackingBreakfast')
          } else {
            console.log('  Not scheduling breakfast notification (userHour must be 10, = ' + userTimeObj.hour + ')')
          }
        }
        else if ((Object.keys(userSugarInfoAI.sugarIntake[userDate]).length < 2) &&
                 !(userSugarInfoAI.trackingNotifications.hasOwnProperty(userDate) &&
                   userSugarInfoAI.trackingNotifications[userDate].hasOwnProperty('breakfast'))) {
          console.log('  User ' + userId + ' has not logged lunch (' +
                      userDate + ').')
          if (userTimeObj.hour === 15) {
            console.log('  Scheduling a lunch notification.')
            const dbTrackRef = dbSugarInfo.child(userId + '/trackingNotifications/' + userDate + '/lunch')
            dbTrackRef.set(Date.now())
            queue_notification(dbNotQueue, currentTimeUTC, 0, userId, 'trackingLunch')
          } else {
            console.log('  Not scheduling lunch notification (userHour must be 15, = ' + userTimeObj.hour + ')')
          }
        }
        else if ((Object.keys(userSugarInfoAI.sugarIntake[userDate]).length < 3) &&
                 !(userSugarInfoAI.trackingNotifications.hasOwnProperty(userDate) &&
                   (userSugarInfoAI.trackingNotifications[userDate].hasOwnProperty('breakfast') ||
                    userSugarInfoAI.trackingNotifications[userDate].hasOwnProperty('lunch')))) {
          console.log('  User ' + userId + ' has not logged dinner (' +
                      userDate + ').')
          if (userTimeObj.hour === 20) {
            console.log('  Scheduling a dinner notification.')
            const dbTrackRef = dbSugarInfo.child(userId + '/trackingNotifications/' + userDate + '/dinner')
            dbTrackRef.set(Date.now())
            queue_notification(dbNotQueue, currentTimeUTC, 0, userId, 'trackingDinner')
          } else {
            console.log('  Not scheduling dinner notification (userHour must be 20, = ' + userTimeObj.hour + ')')
          }
        }
        else {
          console.log('  Nothing to say....')
        }
      }
    }
  })
}

function scheduleTriggers() {

}

app.listen(3000, function () {
  console.log('App listening on port 3000!')
  // This code listens to the 'reminders' child of our user's firebase data. If
  // a reminder appears, it creates an entry for that user in our notification_queue
  // and removes the 'reminders' entry for the user.
  //
  return firebase.auth().signInAnonymously()
  .then(() => {
    const notificationJob = schedule.scheduleJob('0 * * * * *', sendTriggers)
    const reportJob = schedule.scheduleJob('0 * * * * *', scheduleTriggers)

    const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
    const dbSevenDayChal = dbSugarInfo.child('sevenDayChallenge')

    const dbReminders = dbSugarInfo.child('reminders')
    const dbNotQueue = dbSugarInfo.child('notification_queue')

    return dbReminders.on('child_added', function(snapshot, prevChildKey) {
      const currentTimeMs = Date.now()
      const userId = snapshot.key
      const ssVal = snapshot.val()

      // queue_notification(dbNotQueue, currentTimeMs, 1, userId)

        // Remove the reminder keys/values from firebase
      console.log('Deleting reminder entries after scheduling for user ' + userId)
      const dbRemindersUser = dbReminders.child(userId)
      dbRemindersUser.set(null)

      return
    })
  })
})
