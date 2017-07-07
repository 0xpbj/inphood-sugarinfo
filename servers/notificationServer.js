const express = require('express')
const app = express()
const schedule = require('node-schedule')
const requestPromise = require('request-promise')
const constants = require('../sugarbot/modules/constants.js')
const timeUtils = require('../sugarbot/modules/timeUtils.js')

const testMode = false

// Setting this up as standard firebase client:
//   - https://firebase.google.com/docs/web/setup
// Though it may make more sense to set it up as admin/priviledged environment:
//   - https://firebase.google.com/docs/admin/setup
//
var firebase = require('firebase')
if (firebase.apps.length === 0) {
  console.log('InitializingApp on firebase with config')
  firebase.initializeApp(constants.fbConfig)
}

// app.get('/', function (req, res) {
//   res.send('Hello World!')
// })

function queue_notification(
  dbNotQueue, currentTimeMs, timeHrs, userId, notificationType = 'reminder') {

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

  const accessToken = 'EAAJhTtF5K30BABsLODz0w5Af5hvd1SN9TZCU0E9OapZCKuZAOMugO2bNDao8JDe8E3cPQrJGLWWfL0sMxsq4MSTcZBbgGEjqa68ggSZCmZAFhGsFPFkWGUlYwAZB2ZCOrPPgdxS612ck5Rv8SrHydJihKQGsPLQSc1yYtBkncIpbOgZDZD'
  const url = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + accessToken
  // const message = {
  //     'text' : '⏰ Hi! You asked me to remind you to track a meal now.'
  // }
  const message = {
    "text":"⏰ Hi! You asked me to remind you to track a meal now.\nTap \'Journal\' to do that:",
//     "quick_replies":[
//       {
//         "content_type":"text",
//         "title":"Journal ✏️",
//         "payload":"journal"
//       },
//       {
//         "content_type":"text",
//         "title":"Knowledge 📚",
//         "payload":"sugar knowledge"
//       },
//       {
//         "content_type":"text",
//         "title":"My Preferences ⚙️",
//         "payload":"preferences"
//       }
//     ]
      "buttons":[
      {
        "type":"postback",
        "title":"Journal ✏️",
        "payload":"journal"
      },
      {
        "type":"postback",
        "title":"Report ‍💻",
        "payload":"report"
      },
      {
        "type":"postback",
        "title":"Settings ⚙️",
        "payload":"settings"
      }
    ]
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
    reportType: 'dailySummary',
    userId: userId,
    userTimeStamp: Date.now()
  }
  const dbReportQueue = firebase.database().ref("/global/sugarinfoai/reportQueue")
  const dbReportQueueRequest = dbReportQueue.push()
  dbReportQueueRequest.set(reportRequest)
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
          } else if (notificationType === 'report') {
            queueReportJob(userId)
          } else if (notificationType === 'noTrackingMessage') {
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
    })
}


app.listen(3000, function () {
  console.log('App listening on port 3000!')

  // Start our cron like task here that sends notifications
  const notificationJob = schedule.scheduleJob('0 * * * * *', dequeue_notifications)

  // Start a separate cron like task here that schedules 'report' notifications
  // automatically:
  const reportJob = schedule.scheduleJob('45 * * * *', scheduleReports)

  // This code listens to the 'reminders' child of our user's firebase data. If
  // a reminder appears, it creates an entry for that user in our notification_queue
  // and removes the 'reminders' entry for the user.
  //
  return firebase.auth().signInAnonymously()
  .then(() => {

    const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
    const dbReminders = dbSugarInfo.child('reminders')
    const dbNotQueue = dbSugarInfo.child('notification_queue')

    // TODO: add logic here to detect reminders that are very old and schedule
    //       them appropriately as done in the report server.
    return dbReminders.on('child_added', function(snapshot, prevChildKey) {
      // Get the key and snapshot value and do the following:
      // 1. schedule a notification to occur at the specified time.
      //    -- do this by inserting it into a firebase notification_queue containing:
      //    - notifications
      //      - time1 : userid1
      //      - time2 : userid2
      //      - ...
      //
      const currentTimeMs = Date.now()

      const userId = snapshot.key
      if (!testMode ||
          (testMode && (constants.testUsers.includes(userId)))) {
        const ssVal = snapshot.val()

        if ('time1' in ssVal) {
          queue_notification(dbNotQueue, currentTimeMs, 1, userId)
        }
        if ('time3' in ssVal) {
          queue_notification(dbNotQueue, currentTimeMs, 3, userId)
        }
        if ('time5' in ssVal) {
          queue_notification(dbNotQueue, currentTimeMs, 5, userId)
        }
        if ('timeTomorrow' in ssVal) {
          queue_notification(dbNotQueue, currentTimeMs, 24, userId)
        }

        // 2. remove the reminder keys/values from firebase
        //
        console.log('Deleting reminder entries after scheduling for user ' + userId)
        const dbRemindersUser = dbReminders.child(userId)
        dbRemindersUser.set(null)
      }
    })

  })
})
