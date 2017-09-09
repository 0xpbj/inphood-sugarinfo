// const config = require('dotenv').config({path: '../.env-test'})
// for (const key in config) {
//   process.env[key] = process.env[key] || config[key]
// }
// console.log('CONFIG', config)
// console.log('PROCESSENV', process.env)
const express = require('express')
const app = express()
const schedule = require('node-schedule')
const requestPromise = require('request-promise')
const constants = require('../sugarbot/modules/constants.js')
const timeUtils = require('../sugarbot/modules/timeUtils.js')

const testMode = false
// production token
const accessToken = 'EAAJhTtF5K30BABsLODz0w5Af5hvd1SN9TZCU0E9OapZCKuZAOMugO2bNDao8JDe8E3cPQrJGLWWfL0sMxsq4MSTcZBbgGEjqa68ggSZCmZAFhGsFPFkWGUlYwAZB2ZCOrPPgdxS612ck5Rv8SrHydJihKQGsPLQSc1yYtBkncIpbOgZDZD'
// test token
// const accessToken = 'EAAJhTtF5K30BAObDIIHWxtZA0EtwbVX6wEciIZAHwrwBJrXVXFZCy69Pn07SoyzZAeZCEmswE0jUzamY7Nfy71cZB8O7BSZBpTZAgbDxoYEE5Og7nbkoQvMaCafrBkH151s4wl91zOCLbafkdJiWLIc6deW9jSZBYdjh2NE4JbDSZBAwZDZD'

// Setting this up as standard firebase client:
//   - https://firebase.google.com/docs/web/setup
// Though it may make more sense to set it up as admin/priviledged environment:
//   - https://firebase.google.com/docs/admin/setup
//
// TODO: make it use the .env loader for constants below
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



app.listen(3000, function () {
  console.log('App listening on port 3000!')
  return firebase.auth().signInAnonymously()
  .then(() => {
    console.log('Signed in to firebase')
    const dbSugarInfo = firebase.database().ref('/global/sugarinfoai')
    const dbReminders = dbSugarInfo.child('reminders')
    const dbNotQueue = dbSugarInfo.child('notification_queue')

    const currentTimeMs = Date.now()

    const AC = 0
    const BJ = 1
    const userId = constants.testUsers[BJ]

    console.log('queing report for user ' + userId)
    queueReportJob(userId)
    return
  })
})
