const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const utils = require('./utils.js')
const sugarUtils = require('./sugarUtils.js')
const constants = require('./constants.js')
const nutrition = require ('./nutritionix.js')
const hookedConstants = require('./hookedConstants.js')

const requestPromise = require('request-promise')

exports.sugarResponse = function(userId, foodName, sugarPercentage) {
  const wvImgUrl = constants.bucketRoot + '/progressBars/' + sugarPercentage + '.png'
  const wvUrl = constants.wvBucketRoot + '/webviews/FoodJournalEntry.html'
  const wvGiftImgUrl = constants.bucketRoot + '/chatbotimages/gift.jpeg'
  const wvReminderImgUrl = constants.bucketRoot + '/chatbotimages/reminder.jpeg'
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
                "image_url": wvImgUrl,
                "default_action": {
                  "url": wvUrl,
                  "type": "web_url",
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall",
                  "webview_share_button": "show",
                },
                "buttons":[
                  {
                    "title": "Edit",
                    "url": wvUrl,
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
                "image_url": wvGiftImgUrl,
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
                "image_url": wvReminderImgUrl,
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

exports.addLastItemChallenge = function(firebase, userId, date) {
  const objRef = firebase.database().ref('/global/sugarinfoai/sevenDayChallenge/' + userId)
  return objRef.once("value")
  .then(function(snapshot) {
    const challengeDay = snapshot.child('day').val()
    const challengeMeal = snapshot.child('context').val()
    const rewardOptions = hookedConstants.rewards[challengeDay][challengeMeal]
    let userResponse = ''

    //sugar fact
    if (rewardOptions['fact']) {
      userResponse += utils.randomSugarFacts().data + '\n' + utils.randomSugarFacts().source
    }
    //sugar free recipe
    if (rewardOptions['recipe']) {
      userResponse += utils.todaysSugarRecipe(date).recipe + ': ' + utils.todaysSugarRecipe(date).link
    }

    const userRef =
      firebase.database().ref("/global/sugarinfoai/" + userId);

    return userRef.once("value")
    .then(function(snapshot) {
      let currSugarIntake = snapshot.child("/sugarIntake/" + date).val();

      // A. Get the most recent item logged by the user today.
      //    Note:  sugarIntakeDict is a dict of uniqueified time based keys followed by
      //         one user defined key: 'dailyTotal'. We should be able to iterate
      //         through this dictionary and choose the 2nd last element to
      //         consistently find the last item a user ate. The last element will be
      //         'dailyTotal'.
      //
      const keyArr = Object.keys(currSugarIntake);
      const dictLength = keyArr.length;
      if (dictLength < 2) {
        console.log('Unexpected error. Found underpopulated intake dictionary.');
        return;
      }
      const lastKey = keyArr[dictLength - 2]
      if (lastKey === 'dailyTotal') {
        console.log('Unexpected error. Retrieved daily total from intake dictionary as last intake key.');
        return;
      }
      // B. Set the removed key to true on the most recent item and messages
      //    the user that we've deleted their entry.
      //
      const lastFoodRef = userRef.child("/sugarIntake/" + date + '/' + lastKey);
      const lastFoodRemovedRef = lastFoodRef.child('removed');
      lastFoodRemovedRef.set(false);

      // #ReadMeBhardwaj:  Gotta run this promise everytime b/c it sums up
      //                   the sugar totals or TODO: refactor that code out.
      //                   I threw your progress bar predicate in here so
      //                   the calculation would happen.
      //
      return exports.getYourSugarNumbers(firebase, userId, date, currSugarIntake)
      .then((sugarPercentage) => {
        //progress bar logic
        if (!rewardOptions['bar']) {
          const wvImgUrl = constants.bucketRoot + '/progressBars/' + sugarPercentage + '.png'
          return [
            userResponse,
            new fbTemplate.Image(wvImgUrl).get()
          ]
        } else {
          return userResponse
        }
      })
    })
  })
}

exports.addLastItem = function(firebase, userId, date) {
  const userRef = firebase.database().ref(
    "/global/sugarinfoai/" + userId);
  return userRef.once("value")
  .then(function(snapshot) {
    if (snapshot.child("profile/challenge").val() === 'in progress') {
      return exports.addLastItemChallenge(firebase, userId, date)
    }
    let currSugarIntake = snapshot.child("/sugarIntake/" + date).val();
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
    const lastFoodRef = userRef.child("/sugarIntake/" + date + '/' + lastKey);
    const lastFoodRemovedRef = lastFoodRef.child('removed');
    lastFoodRemovedRef.set(false);
    // This next promise is purposely concurrent to the return etc. below (i.e.
    // don't keep the user waiting for this).
    const cleanFoodName = currSugarIntake[lastKey].cleanText;
    return exports.getYourSugarNumbers(firebase, userId, date, currSugarIntake)
    .then((sugarPercentage) => {
      console.log('Sugar Percentage', sugarPercentage)
      return exports.sugarResponse (userId, cleanFoodName, sugarPercentage)
    })
  })
  .catch(error => {
    console.log('AC Error', error)
  });
}

exports.getYourSugarNumbers = function(firebase, userId, date, currSugarIntake) {
  console.lgo('getYourSugarNumbers:')
  const userRef = firebase.database().ref(
    "/global/sugarinfoai/" + userId);
  return userRef.child("/sugarIntake/" + date).once("value")
  .then(function(updatedSugarIntakeSnapshot) {
    let updatedSugarIntake = updatedSugarIntakeSnapshot.val();
    if (updatedSugarIntake) {
      const dailyTotalRef = firebase.database().ref(
        "/global/sugarinfoai/" + userId + "/sugarIntake/" + date + "/dailyTotal");
      console.log('  calling updateTotalSugar')
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
            return Math.ceil(psugar*100/goalSugar)
          })
        }
      });
    }
  });
}

exports.addSugarToFirebase = function(firebase, userId, date, fulldate, barcode, data, favorite) {
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
    const challenge = (snapshot.child("profile/challenge").val() === 'in progress')
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
            return exports.addLastItem(firebase, userId, date)
          }
          const objRef = firebase.database().ref('/global/sugarinfoai/sevenDayChallenge/' + userId)
          return objRef.once("value")
          .then(function(snapshot) {
            const challengeDay = snapshot.child('day').val()
            const challengeMeal = snapshot.child('context').val()
            const rewardData = challenge ? hookedConstants.rewards[challengeDay] : null
            const rewardOptions = challenge ? rewardData[challengeMeal] : null
            const sugarPercentage = Math.ceil(psugar*100/goalSugar)
            const roundSugar = Math.round(psugar)
            if (ingredientsSugarsCaps && ingredientsSugarsCaps !== 'unknown' && roundSugar >= 3) {
              let retArr = [
                'Ingredients (sugars in caps): ' + ingredientsSugarsCaps,
                roundSugar + 'g of sugar found']
              if ((challenge && rewardOptions['visual']) || !challenge) {
                retArr.push('Sugar Visualization: 🍪🍭🍩🍫')
                retArr.push(new fbTemplate.Image(sugarUtils.getGifUrl(roundSugar)).get())
              }
              retArr.push(new fbTemplate.Button("Would you like to add the item to your journal?")
                              .addButton('Add Item ✅', 'add last item')
                              .addButton('Ignore Item ❌', 'ignore last item')
                              .get())
              return retArr
            }
            else if (roundSugar > 2) {
              let retArr = [
                roundSugar + 'g of sugar found']
              console.log('reward options', rewardOptions)
              if ((challenge && rewardOptions['visual']) || !challenge) {
                retArr.push('Sugar Visualization: 🍪🍭🍩🍫')
                retArr.push(new fbTemplate.Image(sugarUtils.getGifUrl(roundSugar)).get())
              }
              retArr.push(new fbTemplate.Button("Would you like to add the item to your journal?")
                              .addButton('Add Item ✅', 'add last item')
                              .addButton('Ignore Item ❌', 'ignore last item')
                              .get())
              return retArr
            }
            else if (ingredientsSugarsCaps && ingredientsSugarsCaps !== 'unknown' && roundSugar > 0) {
              let retArr = [
                'Ingredients (sugars in caps): ' + ingredientsSugarsCaps,
                roundSugar + 'g of sugar found'
              ]
              retArr.push(new fbTemplate.Button("Would you like to add the item to your journal?")
                          .addButton('Add Item ✅', 'add last item')
                          .addButton('Ignore Item ❌', 'ignore last item')
                          .get())
              return retArr
            }
            else if (roundSugar > 0) {
              let retArr = [roundSugar + 'g of sugars found']
              retArr.push(new fbTemplate.Button("Would you like to add the item to your journal?")
                              .addButton('Add Item ✅', 'add last item')
                              .addButton('Ignore Item ❌', 'ignore last item')
                              .get())
              return retArr
            }
            else if (psugar === 0) {
              const roundNSugar = Math.round(nsugar)
              let reply = (roundNSugar) ? roundNSugar + 'g of natural sugars found.\nCongratulations! 🎉🎉 No refined sugars found!'
                : 'Congratulations! 🎉🎉 No refined sugars found!'

              let retArr = [reply]
              retArr.push(new fbTemplate.Button("Would you like to add the item to your journal?")
                              .addButton('Add Item ✅', 'add last item')
                              .addButton('Ignore Item ❌', 'ignore last item')
                              .get())
              return retArr
            }
          })
        })
      })
    })
  })
  .catch((error) => {
    console.log('Error', error)
  })
}

exports.findMyFavorites = function(firebase, favoriteMeal, userId, date, fulldate) {
  const cleanFavMeal = subSlashes(favoriteMeal);
  console.log('findMyFavorites:')
  console.log(firebase.apps)
  let objRef = firebase.database().ref('/global/sugarinfoai/' + userId + '/myfoods/' + cleanFavMeal + '/')
  return objRef.once("value")
  .then(function(snapshot) {
    const favorite = true
    if (snapshot.exists()) {
      return exports.addSugarToFirebase(firebase, userId, date, fulldate, '', snapshot.val(), favorite)
    }
    else {
      return nutrition.getNutritionix(firebase, favoriteMeal, userId, date, fulldate)
    }
  })
  .catch(error => {
    console.log('Errors', error)
  })
}

exports.trackUserProfile = function(firebase, userId) {
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
    // console.log('User Data Fetched', result)
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
