const ocrUtils = require('./ocrUtils.js')
const sugarUtils = require('./sugarUtils.js')
const utils = require('./utils.js')
const fire = require('./firebaseUtils.js')
const image = require('./imageUtils.js')
const nutrition = require ('./nutritionix.js')
const timeUtils = require('./timeUtils.js')
const constants = require('./constants.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

const requestPromise = require('request-promise')
const sentiment = require('sentiment');

const firebase = require('firebase')
const isTestBot = false
const {Wit} = require('node-wit')
const witClient = new Wit({accessToken: process.env.WIT_TOKEN})

exports.bot = function(request, messageText, userId) {
  const tempRef = firebase.database().ref("/global/sugarinfoai/" + userId)
  return tempRef.once("value")
  .then(function(snapshot) {
    const favorites = snapshot.child('/myfoods/').val()
    const timezone = snapshot.child('/profile/timezone').val() ? snapshot.child('/profile/timezone').val() : -7
    const {timestamp} = request.originalRequest
    const date = timeUtils.getUserDateString(timestamp, timezone)
    var messageAttachments = (request.originalRequest && request.originalRequest.message) ? request.originalRequest.message.attachments : null
    if (messageText && !isNaN(messageText)) {
      return image.fdaProcess(userId, messageText, date, timestamp)
    }
    else if (messageText) {
      console.log('Entering wit proccessing area for: ', messageText)
      return witClient.message(messageText, {})
      .then((data) => {
        console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
        // const funcString = data.entities.intent[0].value
        const featureString = data.entities.features ? data.entities.features[0].value : data._text
        console.log('FEATURE STRING', featureString)
        switch (featureString) {
          case 'start': {
            return fire.trackUserProfile(userId)
            .then(() => {
              return firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/").once("value")
              .then(function(snapshot) {
                let intro = ''
                if (snapshot.child('first_name').exists()) {
                  intro = 'Hi ' + snapshot.child('first_name').val() + ', I’m sugarinfoAI! I can help you understand how much sugar you are eating and help you bring it within recommended limits. Would you like that?'
                }
                else {
                  intro = 'Hi, I’m sugarinfoAI! I can help you understand how much sugar you are eating and help you bring it within recommended limits. Would you like that?'
                }
                return new fbTemplate.Button(intro)
                .addButton('Tell me more', 'tell me more')
                .addButton('Let\'s track', 'start food question')
                .get()
              })
            })
          }
          case 'report animation': {
            return new fbTemplate
            .Image('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/report.gif')
            .get()
          }
          case 'label animation': {
            return new fbTemplate
            .Image('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/ingredient.gif')
            .get()
          }
          case 'track animation': {
            return new fbTemplate
            .Image('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/track.gif')
            .get()
          }
          case 'favorite animation': {
            return 'in progress'
          }
          case 'learn more':
          case 'need help':
          case 'help':
          case 'confused':
          case 'tell me more': {
            return [
              'Ok, here are a few helpful animations for you 📚',
              new fbTemplate.List()
                .addBubble('Track Meals', 'Learn how to track meals with our chatbot')
                  .addImage('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/measure.jpg')
                  .addButton('Learn More', 'track animation')
                .addBubble('Ingredient Label', 'Find hidden processed sugars')
                  .addImage('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/sugar.jpg')
                  .addButton('Learn More', 'label animation')
                .addBubble('My Favorites', 'Quick add favorite meals')
                  .addImage('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/favorite.jpg')
                  .addButton('Learn More', 'favorite animation')
                .addBubble('Daily Reports', 'Check your daily progress')
                  .addImage('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/arrows.jpg')
                  .addButton('Learn More', 'report animation')
                .get()
            ]
          }
          case '1 hour':
          case 'time1': {
            const time = timestamp + (1*3600*1000)
            return firebase.database().ref("/global/sugarinfoai/reminders/" + userId).update({
              time1: time
            })
            .then(() => {
              return [
                "Great I'll remind you in a hour! You can still add meals when you please.",
                utils.otherOptions(false)
              ]
            })
          }
          case '3 hours':
          case 'time3': {
            const time = timestamp + (3*3600*1000)
            return firebase.database().ref("/global/sugarinfoai/reminders/" + userId).update({
              time3: time
            })
            .then(() => {
              return [
                "Great I'll remind you in 3 hours! You can still add meals when you please.",
                utils.otherOptions(false)
              ]
            })
          }
          case '5 hours':
          case 'time5': {
            const time = timestamp + (5*3600*1000)
            return firebase.database().ref("/global/sugarinfoai/reminders/" + userId).update({
              time5: time
            })
            .then(() => {
              return [
                "Great I'll remind you in 5 hours! You can still add meals when you please.",
                utils.otherOptions(false)
              ]
            })
          }
          case 'don\'t ask':
          case 'notime': {
            return tempRef.child('/preferences/nextReminder').remove()
            .then(() => {
              return [
                "Ok I will not remind you! You can still add meals when you please.",
                utils.otherOptions(false)
              ]
            })
          }
          case 'reset':
          case 'say adios': {
            return 'No problem! If you have any questions later just type: help'
          }
          case 'journal': {
            return new fbTemplate.Button('I\'m all ears! How would you like to enter your meal?')
            .addButton('Describe Food ⌨️', 'food question')
            .addButton('Scan UPC Code 🔬', 'label')
            // .addButton('Photo 🥗', 'send food picture')
            .get()
          }
          case 'report': {
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
          case 'scan upc code':
          case 'label': {
            return [
              new fbTemplate
              .Image('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/upc.jpg')
              .get(),
              "Please send me a photo of the UPC 📷 or type the number manually ⌨️"
            ]
          }
          case 'favorite':
          case 'my favorites': {
            if (!favorites) {
              return 'Favorites are shown once you add meals to your journal'
            }
            return utils.parseMyFavorites(favorites, false)
          }
          case 'more favorites': {
            console.log('MORE FAVORITES')
            console.log('-----------------------------')
            console.log('  favorites.length: ' + favorites.length)
            for (let key in favorites) {
              console.log('  ' + key)
            }
            if (favorites.length > 3) {
              return utils.parseMyFavorites(favorites, true)
            }
            return 'No more favorites to display.'
          }
          case 'start food question': {
            const timeUser = timeUtils.getUserTimeObj(Date.now(), timezone)
            let mealInfo = '? (e.g: almonds and cranberries)'
            let mealType = 'snack'
            const {hour} = timeUser
            if (hour > 4 && hour < 13) {
              mealType = 'breakfast'
              mealInfo = ' this morning? (e.g: I had two eggs, avocado, and toast)'
            }
            else if (hour > 12 && hour < 18) {
              mealType = 'lunch'
              mealInfo = ' this afternoon? (e.g: chicken sandwich and cola)'
            }
            else if (hour > 17 && hour < 23) {
              mealType = 'dinner'
              mealInfo = ' this evening? (e.g: Kale, spinach, tomatoes, cheese, and dressing)'
            }
            return [
              'Great! Tell me what you ate' + mealInfo,
              // new fbTemplate
              // .Image('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/upc.jpg')
              // .get(),
              // 'Remember you can send me a picture of the UPC label 📷 or type the number manually ⌨️ for your convinience.'
            ]
          }
          case 'food question':
          case 'describe food': {
            const timeUser = timeUtils.getUserTimeObj(Date.now(), timezone)
            let mealInfo = '? (e.g: almonds and cranberries)'
            let mealType = 'snack'
            const {hour} = timeUser
            if (hour > 4 && hour < 13) {
              mealType = 'breakfast'
              mealInfo = ' this morning? (e.g: I had two eggs, avocado, and toast)'
            }
            else if (hour > 12 && hour < 18) {
              mealType = 'lunch'
              mealInfo = ' this afternoon? (e.g: chicken sandwich and cola)'
            }
            else if (hour > 17 && hour < 23) {
              mealType = 'dinner'
              mealInfo = ' this evening? (e.g: Kale, spinach, tomatoes, cheese, and dressing)'
            }
            return 'Great! Tell me what you ate' + mealInfo
          }
          case 'describe breakfast':
          case 'describe lunch':
          case 'describe dinner': {
            return 'Food description or UPC Label photo, the choice is yours'
          }
          case 'nutrition': {
            return fire.findMyFavorites(messageText, userId, date, timestamp)
          }
          case 'recipe': {
            const {timestamp} = request.originalRequest
            return utils.todaysSugarRecipe(timestamp)
          }
          case 'facts': {
            return utils.randomSugarFacts()
          }
          case 'knowledge': {
            return new fbTemplate.Button('What would you like to know?')
            .addButton('Facts 🎲', 'random sugar facts')
            .addButton('Recipes 📅', 'recipe')
            .addButton('Processed? 🍭', 'Processed Sugar?')
            .get()
          }
          case 'add last item': {
            // #OhNoItsJake! This code is a dup of js in FoodJournalEntry.js for
            //               webviews. I don't know of a good way to share it
            //               here so I'm duplicating it for now. (It does an un
            //               -remove instead of a remove though.)
            //
            // 1. Get user's TZ to get today's date in their region.
            //    - this is done for us here in: 'date'

            // 2. Get their current sugarIntake dict for today's date.
            //
            return fire.addLastItem(userId, date)
          }
          case 'set a reminder': {
            return utils.sendReminder()
          }
          case 'delete':
          case 'delete last item': {
            return 'Feature in progress....'
          }
          case 'settings': {
            console.log('DEBUG WEBVIEW SETTINGS:')
            console.log('-------------------------------------------------------')
            const wvMsg = {
              uri: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.FACEBOOK_BEARER_TOKEN,
              json: true,
              method: 'POST',
              body: {
                'recipient':{
                  'id': userId
                },
                'message':{
                  'attachment':{
                    'type':'template',
                    "payload":{
                      "template_type":"generic",
                      "elements":[
                         {
                          "title":"Settings",
                          "image_url":"https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/arrows.jpg",
                          "subtitle":"Webview settings",
                          "default_action": {
                            "url": 'https://s3-us-west-1.amazonaws.com/www.inphood.com/webviews/Settings.html',
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
          }
          case 'share': {
            return utils.sendShareButton()
          }
          default: {
            return nutrition.getNutritionix(messageText, userId, date, timestamp)
          }
        }
      })
      .catch(error => {
        console.log('Wit.ai Error: ', error)
      });
    }
    else if (messageAttachments) {
      const {url} = messageAttachments[0].payload
      return image.processLabelImage(url, userId, date, timestamp)
    }
  })
}
