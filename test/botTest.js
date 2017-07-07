var http = require('http');
const botBuilder = require('../sugarBot/node_modules/claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate
const ocrUtils = require('../sugarBot/modules/ocrUtils.js')
const sugarUtils = require('../sugarBot/modules/sugarUtils.js')
const utils = require('../sugarBot/modules/utils.js')
const fire = require('../sugarBot/modules/firebaseUtils.js')
const image = require('../sugarBot/modules/imageUtils.js')
const nutrition = require ('../sugarBot/modules/nutritionix.js')
const constants = require('../sugarBot/modules/constants.js')
const timeUtils = require('../sugarBot/modules/timeUtils.js')

const firebase = require('../sugarBot/node_modules/firebase')
const fbConfig = {
  apiKey: 'AIzaSyBQTHsQA5GuDG7Ttk17o3LBQfXjn7MtUQ8',
  authDomain: 'inphooddb-e0dfd.firebaseapp.com',
  databaseURL: 'https://inphooddb-e0dfd.firebaseio.com',
  projectId: 'inphooddb-e0dfd',
  storageBucket: 'inphooddb-e0dfd.appspot.com',
  messagingSenderId: '529180412076'
}
if (firebase.apps.length === 0) {
  firebase.initializeApp(fbConfig)
}

http.createServer(function (request, response) {
  console.log('Starting server')
  const dateVal = 1497368855147
  let userId = 1322516797796635
  return firebase.auth().signInAnonymously()
  .then(() => {
    const tempRef = firebase.database().ref("/global/sugarinfoai/" + userId)
    return tempRef.once("value")
    .then(function(snapshot) {
      const sugarCheckerFlag = snapshot.child('/temp/data/sugar/flag').val()
      const questionFlag = snapshot.child('/temp/data/question/flag').val()
      const upcFlag = snapshot.child('/temp/data/upc/flag').val()
      const missingUPC = snapshot.child('/temp/data/missingUPC/flag').val()
      const manual = snapshot.child('/temp/data/manual/flag').val()
      const cvFlag = snapshot.child('/temp/data/cv/flag').val()
      const goalSugar = snapshot.child('/temp/data/preferences/goalSugar').val()
      const weight = snapshot.child('/temp/data/preferences/weight').val()
      const goalWeight = snapshot.child('/temp/data/preferences/goalWeight').val()
      const cheatDay = snapshot.child('/temp/data/cheatDay/flag').val()
      const myCheatDay = snapshot.child('/preferences/currentCheatDay').val()
      const favFlag = snapshot.child('/temp/data/favorites/flag').val()
      const favorites = snapshot.child('/myfoods/').val()

      let timezone = snapshot.child('/profile/timezone').val()
      let first_name = snapshot.child('/profile/first_name').val()
      // should only happens once...unless user updates profile
      if (!first_name && !isTestBot) {
        fire.trackUserProfile(userId)
      }
      // defaults to PST
      if (!timezone) {
        timezone = -7
      }
      // const {timestamp} = request.originalRequest
      const timestamp = Date.now()
      const date = timeUtils.getUserDateString(timestamp, timezone)
      // const messageAttachments = (request.originalRequest && request.originalRequest.message) ? request.originalRequest.message.attachments : null
      let messageText = '2 apples'
      if (messageText) {
        switch (messageText) {
          case 'debug_user_time': {
            if (isTestBot || constants.testUsers.includes(userId)) {
              console.log('REQUEST -----------------------------------------')
              console.log(request)
              return [
                "date: " + date,
                "time: " + timeUtils.getUserTimeString(timestamp, timezone)
              ]
            }
          }
          case 'journal': {
            return utils.otherOptions(false)
          }
          case 'report':
          case 'my report': {
            console.log('REPORT ------------------------------------------------')
            const reportRequest = {
              reportType: 'dailySummary',
              userId: userId,
              userTimeStamp: timestamp
            }
            console.log('  adding report request to firebase')
            const dbReportQueue = firebase.database().ref("/global/sugarinfoai/reportQueue")
            const dbReportQueueRequest = dbReportQueue.push()
            dbReportQueueRequest.set(reportRequest)
            console.log('  returning')
            return 'A report is on the way.'
          }
          case 'favorites':
          case 'my favorites': {
            if (!favorites) {
              return 'Favorites are shown once you add meals to your journal'
            }
            return tempRef.child('/temp/data/favorites').update({
              flag: true
            })
            .then(() => {
              return utils.parseMyFavorites(favorites)
            })
          }
          default: {
            if (!Number.isNaN(Number(messageText))) {
              return image.fdaProcess(userId, messageText, date, timestamp)
            }
            else {
              return nutrition.getNutritionix(messageText, userId, date, timestamp, timezone)
            }
            // return [
            //   new fbTemplate
            //   .Image('http://i.imgur.com/uhHyYvP.gif')
            //   .get(),
            //   nutrition.getNutritionix(messageText, userId, timezone)
            // ]
          }
        }
      }
      else if (messageAttachments) {
        const {url} = messageAttachments[0].payload
        return image.processLabelImage(url, userId, date, timestamp)
      }
    })
  })
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this code.')
