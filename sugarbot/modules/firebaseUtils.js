const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const utils = require('./utils.js')
const sugarUtils = require('./sugarUtils.js')
const constants = require('./constants.js')
const nutrition = require ('./nutritionix.js')

const requestPromise = require('request-promise')
const firebase = require('firebase')

exports.sugarResponse = function(userId, foodName, sugarPercentage) {
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
            "template_type":"list",
            "elements":[
              {
                "title": foodName,
                "image_url": "https://d1q0ddz2y0icfw.cloudfront.net/progressBars/" + sugarPercentage + ".png",
                "default_action": {
                  "url": "https://www.inphood.com/webviews/FoodJournalEntry.html",
                  "type": "web_url",
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall",
                  "webview_share_button": "show",
                },
                "buttons":[
                  {
                    "title": "Edit",
                    "url": "https://www.inphood.com/webviews/FoodJournalEntry.html",
                    "type": "web_url",
                    "messenger_extensions": true,
                    "webview_height_ratio": "tall",
                    "webview_share_button": "show",
                  }
                ]
              },
              {
                "title": "Tracking Reward",
                "subtitle": "Tip, fact, recipe, etc.",
                "image_url": "https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/gift.jpeg",
                "buttons":[
                  {
                    "title": "Claim",
                    "type":"postback",
                    "payload":"reward"
                  }
                ]
              },
              {
                "title": "Setup Reminder",
                "subtitle": "1, 3, 5 hours",
                "image_url": "https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/reminder.jpeg",
                "buttons":[
                  {
                    "title": "Setup",
                    "type":"postback",
                    "payload":"set a reminder"
                  }
                ]
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

function subSlashes( str ) {
  if (str) {
    return str.replace(/[\/\.$#\[\]]/g, '_');
  }
  return ''
}

exports.addLastItem = function(userId, date) {
  const currSugarIntakeRef = firebase.database().ref(
    "/global/sugarinfoai/" + userId + "/sugarIntake/" + date);
  console.log('Trying to access ' + currSugarIntakeRef.toString());
  return currSugarIntakeRef.once("value")
  .then(function(currSugarIntakeSnapshot) {
    let currSugarIntake = currSugarIntakeSnapshot.val();
    if (!currSugarIntake) {
      console.log('Error accessing sugarIntake for unremove / undelete of item.');
      return;
    }

    // 3. Get the most recent item logged by the user today.
    //    Note:  sugarIntakeDict is a dict of uniqueified time based keys followed by
    //         one user defined key: 'dailyTotal'. We should be able to iterate
    //         through this dictionary and choose the 2nd last element to
    //         consistently find the last item a user ate. The last element will be
    //         'dailyTotal'.
    //
    const keyArr = Object.keys(currSugarIntake);
    const dictLength = keyArr.length;
    if (dictLength < 2) {
      console.log('Unexpected state machine error. Found underpopulated intake dictionary.');
      return;
    }
    const lastKey = keyArr[dictLength - 2]
    if (lastKey === 'dailyTotal') {
      console.log('Unexpected state machine error. Retrieved daily total from intake dictionary as last intake key.');
      return;
    }

    // 4. Set the removed key to true on the most recent item and messages
    //    the user that we've deleted their entry.
    //
    const lastFoodRef = currSugarIntakeRef.child(lastKey);
    const lastFoodRemovedRef = lastFoodRef.child('removed');
    lastFoodRemovedRef.set(false);

    // This next promise is purposely concurrent to the return etc. below (i.e.
    // don't keep the user waiting for this).
    return currSugarIntakeRef.once("value")
    .then(function(updatedSugarIntakeSnapshot) {
      let updatedSugarIntake = updatedSugarIntakeSnapshot.val();
      if (updatedSugarIntake) {
        const dailyTotalRef = firebase.database().ref(
          "/global/sugarinfoai/" + userId + "/sugarIntake/" + date + "/dailyTotal");
        utils.updateTotalSugar(updatedSugarIntakeSnapshot, dailyTotalRef);
        return dailyTotalRef.once("value")
        .then(function(dailyTotalSnapShot) {
          const dailyTotalDict = dailyTotalSnapShot.val();
          if (dailyTotalDict) {
            const psugar = dailyTotalDict.psugar;
            return firebase.database().ref("/global/sugarinfoai/" + userId + "/preferences/currentGoalSugar").once("value")
            .then(function(psnapshot) {
              let goalSugar = psnapshot.val()
              if (!goalSugar)
                goalSugar = 36
              let sugarPercentage = Math.ceil(psugar*100/goalSugar)
              const cleanFoodName = currSugarIntake[lastKey].cleanText;
              return exports.sugarResponse (userId, cleanFoodName, sugarPercentage)
              // .then(() => {
              //   return [
              //     constants.generateTip(),
              //     new fbTemplate.Button("Would you like to setup a reminder to track your next meal?")
              //     .addButton('Alright ✅', 'set a reminder')
              //     .addButton('Not now  ❌', 'notime')
              //     .get()
              //   ];
              // })
            })
          }
        });
      }
    });
  })
  .catch(error => {
    console.log('AC Error', error)
  });
}

exports.addSugarToFirebase = function(userId, date, fulldate, barcode, data, favorite = false) {
  var userRef = firebase.database().ref("/global/sugarinfoai/" + userId)
  return userRef.once("value")
  .then(function(snapshot) {
    const {
      photo,
      sugar,
      carbs,
      fiber,
      psugar,
      nsugar,
      sugarArr,
      carbsArr,
      fiberArr,
      foodName,
      cleanText,
      sugarPerServingStr,
      carbsPerServingStr,
      fiberPerServingStr,
      ingredientsSugarsCaps
    } = data
    userRef.child("/sugarIntake/" + date).push({
      photo,
      sugar,
      carbs,
      fiber,
      psugar,
      nsugar,
      removed: true,
      sugarArr,
      carbsArr,
      fiberArr,
      foodName,
      cleanText,
      sugarPerServingStr,
      carbsPerServingStr,
      fiberPerServingStr,
      ingredientsSugarsCaps,
      timestamp: fulldate,
    })
    const goalWeight = snapshot.child('/preferences/currentGoalWeight').val()
    let goalSugar = snapshot.child('/preferences/currentGoalSugar').val()
    let val = snapshot.child('/sugarIntake/' + date + '/dailyTotal/').val()
    if (!val)
      val = {nsugar: 0, psugar: 0}
    if (!goalSugar)
      goalSugar = 36
    console.log('###########################\nDATA BEING ADDED TO JOURNAL', data)
    const newNSugar = parseInt(val.nsugar) + parseInt(nsugar)
    const newPSugar = parseInt(val.psugar) + parseInt(psugar)
    let cleanPath = subSlashes(cleanText)
    return userRef.child('/myfoods/' + cleanPath).update({
      photo,
      sugar,
      carbs,
      fiber,
      psugar,
      nsugar,
      sugarArr,
      carbsArr,
      fiberArr,
      foodName,
      cleanText,
      sugarPerServingStr,
      carbsPerServingStr,
      fiberPerServingStr,
      ingredientsSugarsCaps
    })
    .then(() => {
      return userRef.child('/myfoods/' +  cleanPath + '/date').push({
        timestamp: Date.now(),
      })
      .then(() => {
        return userRef.child('/sugarIntake/' + date + '/dailyTotal/').update({ nsugar: newNSugar, psugar: newPSugar })
        .then(() => {
          if (favorite) {
            return exports.addLastItem(userId, date)
          }
          const sugarPercentage = Math.ceil(psugar*100/goalSugar)
          const roundSugar = Math.round(psugar)
          if (ingredientsSugarsCaps && ingredientsSugarsCaps !== 'unknown' && roundSugar >= 3) {
            return [
              'Ingredients (sugars in caps): ' + ingredientsSugarsCaps,
              'Sugar Visualization: 🍪🍭🍩🍫',
              new fbTemplate
              .Image(sugarUtils.getGifUrl(roundSugar))
              .get(),
              new fbTemplate.Button("Would you like to add the item to your journal?")
              .addButton('Add Item ✅', 'add last item')
              .addButton('Ignore Item ❌', 'ignore last item')
              .get()
            ]
          }
          else if (roundSugar > 2) {
            return [
              'Sugar Visualization: 🍪🍭🍩🍫',
              new fbTemplate
              .Image(sugarUtils.getGifUrl(roundSugar))
              .get(),
              new fbTemplate.Button("Would you like to add the item to your journal?")
              .addButton('Add Item ✅', 'add last item')
              .addButton('Ignore Item ❌', 'ignore last item')
              .get()
            ]
          }
          else if (ingredientsSugarsCaps && ingredientsSugarsCaps !== 'unknown' && roundSugar > 0) {
            return [
              'Ingredients (sugars in caps): ' + ingredientsSugarsCaps,
              roundSugar + 'g of sugar found',
              new fbTemplate.Button("Would you like to add the item to your journal?")
              .addButton('Add Item ✅', 'add last item')
              .addButton('Ignore Item ❌', 'ignore last item')
              .get()
            ]
          }
          else if (roundSugar > 0) {
            return [
              roundSugar + 'g of natural sugars found',
              new fbTemplate.Button("Would you like to add the item to your journal?")
              .addButton('Add Item ✅', 'add last item')
              .addButton('Ignore Item ❌', 'ignore last item')
              .get()
            ]
          }
          else if (psugar === 0) {
            const roundNSugar = Math.round(nsugar)
            let reply = (roundNSugar) ? roundNSugar + 'g of natural sugars found.\nCongratulations! 🎉🎉 No refined sugars found!' 
              : 'Congratulations! 🎉🎉 No refined sugars found!'
            return [
              reply,
              new fbTemplate.Button("Would you like to add the item to your journal?")
              .addButton('Add Item ✅', 'add last item')
              .addButton('Ignore Item ❌', 'ignore last item')
              .get()
            ]
          }
        })
      })
    })
  })
  .catch((error) => {
    console.log('Error', error)
  })
}

exports.findMyFavorites = function(favoriteMeal, userId, date, fulldate) {
  const cleanFavMeal = subSlashes(favoriteMeal);
  let objRef = firebase.database().ref('/global/sugarinfoai/' + userId + '/myfoods/' + cleanFavMeal + '/')
  return objRef.once("value")
  .then(function(snapshot) {
    const favorite = true
    if (snapshot.exists()) {
      return exports.addSugarToFirebase(userId, date, fulldate, '', snapshot.val(), favorite)
    }
    else {
      return nutrition.getNutritionix(favoriteMeal, userId, date, fulldate)
    }
  })
  .catch(error => {
    console.log('Errors', error)
  })
}

exports.trackUserProfile = function(userId) {
  var fbOptions = {
    uri: 'https://graph.facebook.com/v2.6/' + userId,
    method: 'GET',
    json: true,
    qs: {
      fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
      access_token: 'EAAJhTtF5K30BAObDIIHWxtZA0EtwbVX6wEciIZAHwrwBJrXVXFZCy69Pn07SoyzZAeZCEmswE0jUzamY7Nfy71cZB8O7BSZBpTZAgbDxoYEE5Og7nbkoQvMaCafrBkH151s4wl91zOCLbafkdJiWLIc6deW9jSZBYdjh2NE4JbDSZBAwZDZD'
    },
    resolveWithFullResponse: true
  }
  const request = require('request-promise')
  return request(fbOptions)
  .then(result => {
    console.log('User Data Fetched', result)
    const data = result.body
    // console.log('Data', data)
    const {first_name, last_name, profile_pic, locale, timezone, gender} = data
    var userRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile")
    return userRef.update({
      first_name,
      last_name,
      profile_pic,
      locale,
      timezone,
      gender,
      userId,
      // is_payment_enabled
    })
  })
  .catch(error => {
    console.log('Something went wrong', error)
  })
}
