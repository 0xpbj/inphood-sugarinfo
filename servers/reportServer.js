const express = require('express')
const app = express()
const schedule = require('node-schedule')
const requestPromise = require('request-promise')

const constants = require('../sugarbot/modules/constants.js')
const timeUtils = require('../sugarbot/modules/timeUtils.js')
const wvUtils = require('./webviewUtils.js')
const dailyReportUtils = require('./reportUtils.js')

// Setting this up as standard firebase client:
//   - https://firebase.google.com/docs/web/setup
// Though it may make more sense to set it up as admin/priviledged environment:
//   - https://firebase.google.com/docs/admin/setup
//
// TODO: configure constants below to come from .env file (common)
var firebase = require('firebase')
if (firebase.apps.length === 0) {
  console.log('InitializingApp on firebase with config')
  //firebase.initializeApp(process.env.FIREBASE_CONFIG)
  firebase.initializeApp({
    apiKey: 'AIzaSyC6q3xNF48k98N-SkJOnkryA8J3ZeYOJPg',
    authDomain: 'inphooddb-e0dfd.firebaseapp.com',
    databaseURL: 'https://inphooddb-e0dfd.firebaseio.com',
    projectId: 'inphooddb-e0dfd',
    storageBucket: 'inphooddb-e0dfd.appspot.com',
    messagingSenderId: '529180412076'
  })
}

// app.get('/', function (req, res) {
//   res.send('Hello World!')
// })


function processReportRequest(request) {
  if (request.reportType || request.userId) {
    const machineTime = new Date()
    console.log('current time: ' + machineTime.toString())
    console.log('  ' + request.userId + ' requested a ' +
                request.reportType + ' report at ' + request.userTimeStamp)

    const dbUserId = firebase.database().ref("/global/sugarinfoai/" + request.userId)
    const wvImgUrl = constants.bucketRoot + '/chatbotimages/arrows.jpg'
    const wvUrl = constants.wvBucketRoot + '/webviews/Report.html'
    const wvMsg = {
      uri: 'https://graph.facebook.com/v2.6/me/messages?access_token=EAAJhTtF5K30BAGso9zC5s2mtqvhT6hOIZCLealXsZBT6sFRV1v8mZBA4go2aTny0UGQWO5UVUvbmyxVZBXJHaeiVcTFgC6CTrsAIJxaYVieZCRmcOE9RNiSwZCN8oT6v6OZBi0F9jz1ay0gkl4XhAfvXdRYNnz4ETmfwKuTwyWYCQZDZD',
      json: true,
      method: 'POST',
      body: {
        'recipient':{
          'id': request.userId
        },
        'message':{
          'attachment':{
            'type':'template',
            "payload":{
              "template_type":"generic",
              "elements":[
                 {
                  "title":"Food Report",
                  "image_url": wvImgUrl,
                  "subtitle":"Breakdown of your meals",
                  "default_action": {
                    "url": wvUrl,
                    "type": "web_url",
                    "messenger_extensions": true,
                    "webview_height_ratio": "tall",
                    "webview_share_button": "hide",
                    "fallback_url": "https://www.inphood.com/"
                  }
                }
              ]
            }
          }
        }
      },
      resolveWithFullResponse: true,
      headers: {
        'Content-Type': "application/json"
      }
    }
    return requestPromise(wvMsg)
    // return dbUserId.once('value')
    // .then(function(userSnapshot) {
    //   const userTimeZone = userSnapshot.child('/profile/timezone').val()
    //   const firstName = userSnapshot.child('/profile/first_name').val()
    //   const date = timeUtils.getUserDateString(request.userTimeStamp, userTimeZone)
    //   return dailyReportUtils.writeReportToS3(date, request.userId, userSnapshot)
    //   .then(result => {
    //     const dateTime = date + ' ' +
    //       timeUtils.getUserTimeString(request.userTimeStamp, userTimeZone)
    //     return requestPromise(
    //       wvUtils.getReportWebView(request.userId, firstName, dateTime, result))
    //   })
    // })
  }
}

function processPreExistingReportRequests(reportRequests) {
  // Generate and send reports for requests less than 5 minutes old.
  // Ignore requests older than 5 minutes.
  //
  const timestampUtc = new Date().getTime()
  console.log('processPreExistingReportRequests at UTC time ' + timestampUtc)

  // Array to prevent duplicate reports being sent (in case of multiple requests)
  let reportsSentToUserIds = []

  for (let key in reportRequests) {
    const reportRequest = reportRequests[key]
    const userTimeStamp = reportRequest.userTimeStamp
    const userId = reportRequest.userId

    if ((timestampUtc - userTimeStamp) > 5 * 60 * 1000) {
      // Skip sending a report if the request is older than 5 minutes:
      console.log('Skipping report request ' + key)
      console.log('  [ ' + reportRequest.reportType +
                  ' user: ' + userId +
                  ' (' + userTimeStamp + 'ms) ]')
      console.log('  It was sent more than 5 minutes ago.')
    } else {
      // Send the report if it was made within 5 minutes, but prevent sending
      // any other reports to this user if they were also made within the 5
      // minute window:
      if (!reportsSentToUserIds.includes(userId)) {
        console.log('Sending report request ' + key)
        console.log('  [ ' + reportRequest.reportType +
                    ' user: ' + userId +
                    ' (' + userTimeStamp + 'ms) ]')

        processReportRequest(reportRequest)
        reportsSentToUserIds.push(userId)
      } else {
        console.log('Already sent report to user: ' + userId)
      }
    }
  }
}

app.listen(3010, function () {
  return firebase.auth().signInAnonymously()
  .then(() => {
    const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
    const dbReportQueue = dbSugarInfo.child('reportQueue')

    return dbReportQueue.once('value')
      .then(function(reportDataSnapShot) {
        if (reportDataSnapShot.exists()) {
          const reportRequests = reportDataSnapShot.val()

          // Clobber all requests in the queue (we have the snapshot and can
          // process them now). New requests will be handled in a subsequent
          // db access:
         dbReportQueue.set(null)

          processPreExistingReportRequests(reportRequests)
        }

        return dbReportQueue.on('child_added', function(childSnapshot, prevChildKey) {
          if (childSnapshot.exists()) {

            // Delete the firebase entry before processing.
            const dbRef = childSnapshot.ref
            dbRef.set(null)

            const reportRequest = childSnapshot.val()
            return processReportRequest(reportRequest)
          }
          return
        })
      })
  })
})
