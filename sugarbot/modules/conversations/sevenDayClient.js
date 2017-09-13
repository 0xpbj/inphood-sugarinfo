const constants = require('./../constants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

function valIfExistsOr(snapshot, childPath, valIfUndefined = undefined) {
  if (snapshot.child(childPath).exists()) {
    return snapshot.child(childPath).val()
  }
  return valIfUndefined
}

function updateChallengeData(dbPath, keyValueDict) {
  dbPath.update(keyValueDict)
}

function initChallengeData(dbPath, userTime, mealEvent) {
  const sevenDayChalData = {
    startTime: userTime,
    day: 1,
    context: mealEvent,
    phase: 'trigger',
    nextPhase: 'action'
  }
  updateChallengeData(dbPath, sevenDayChalData)
}

function getInitTriggerQuestion(mealEvent) {
  if (mealEvent !== utils.mealEvents[3]) {
    return 'Tell me what you ate for ' + mealEvent +
           '? (e.g. eggs and 3 pancakes with syrup)'
  } else {
    return 'Tell me about a recent snack? (e.g. celery with cheez whiz)'
  }
}

function getNextMealEvent(mealEvent) {
  if (mealEvent === utils.mealEvents[0]) {
    return utils.mealEvents[1]
  } else if (mealEvent === utils.mealEvents[1]) {
    return utils.mealEvents[2]
  } else {
    return utils.mealEvents[0]
  }
}

function getNextMealEventRespSuffix(mealEvent) {
  return 'after ' + getNextMealEvent(mealEvent) +
         ((mealEvent === utils.mealEvents[2]) ? ', tomorrow' : '')
}

exports.processWit = function(firebase, snapshot, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const startChallengeButton = 'Start the challenge'
  const threeSeconds = 3 * 1000
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Conversation sevenDayClient: ' + featureString)

  const sugarinfoRef = firebase.database().ref("/global/sugarinfoai")
  const profileRef = sugarinfoRef.child(userId + "/profile")
  const sevenDayChalRef = sugarinfoRef.child("sevenDayChallenge/" + userId)

  const mealEvent = utils.calculateMealEvent(timezone)
  const userTime = timeUtils.getUserTimeObj(Date.now(), timezone)

  if (featureString === 'start') {
    //
    // Handle the initial action when the user clicks 'Get Started'
    //
    return fire.trackUserProfile(firebase, userId)
    .then(() => {
      return profileRef.once("value")
      .then(function(npSnapshot) {
        //
        // if user restarts conversation by hitting 'get started'
        //
        const userName = valIfExistsOr(npSnapshot, 'first_name', '')
        // if (npSnapshot.child('challenge').val() === 'in progress') {
        //   return [
        //     'Welcome back to the 7-day challenge ' + userName,
        //     getInitTriggerQuestion(mealEvent)
        //   ]
        // }
        return profileRef.update({challenge: 'in progress'})
        .then(() => {
          const intro =
            "Hi " + userName + ", I’m sugarinfoAI.\n" +
            "I have a 7-day challenge to lower your risk of " +
            "heart attack and type 2 diabetes."
          const description =
            "When you tell me what you've eaten, I'll tell you approximately " +
            "how much added sugar is in it. We'll learn the average daily sugar " +
            "that you consume and work to lower it, if necessary."
          return [
            intro,
            new fbTemplate.ChatAction('typing_on').get(),
            new fbTemplate.Pause(threeSeconds).get(),
            new fbTemplate.Button(description)
            .addButton(startChallengeButton, startChallengeButton)
            .get()
          ]
        })
      })
    })
  }
  else {
    //
    // Handle other user actions, for example:
    //   1. user answers a question that we trigger
    //   2. user logs a meal from a question that we trigger
    //   3. user does not provide an appropriate answer (go back to options a
    //      user can provide)
    //
    // The behavior in this code is roughly:
    //   1. Server sends a trigger question (i.e.> what's breakfast?)  (OR less
    //      typically, user types something before trigger, we then look at
    //      server variable to understand context and respond appropriately.)
    //   2. User performs action in response to trigger (i.e. < bacon and eggs)
    //   3. Lambda provides result with add/ignore prompt
    //   4. Lambda issues an investment question (i.e. what are your cravings?)
    //   5. User answers investment question (i.e. ice cream ice cream ice cream)
    //   6. Lambda stores investment question answer and responds (i.e. thanks,
    //      I'll keep that in mind, talk to you later.)
    //   7. Lambda updates context
    //
    console.log('featureString='+featureString+', messageText='+messageText)
    return sevenDayChalRef.once("value")
    .then(function(sdSnapshot) {
      console.log('read from sevenDayChalRef')
      if (messageText.toLowerCase() === startChallengeButton.toLowerCase()) {
        console.log('  initializing user\'s seven day challenge data')
        //
        // Special case--user has pressed button 'Start the challenge':
        //   The trigger question will come from Lambda instead of the server for
        //   this special case.
        //
        initChallengeData(sevenDayChalRef, userTime, mealEvent)
        return getInitTriggerQuestion(mealEvent)
      } else {
        console.log('  in regular processing')
        //
        // Regular operation happens here. Processing is determined by
        // the state (phase and nextPhase) stored in Firebase.
        // This is essentially a three-state state-machine:
        //
        //     action --> reward --> invest ---
        //        ^                           |
        //        |                           |
        //        -----------------------------
        //
        // Some transitions however are not shown and cause some states to
        // be revisited until a certain condition is met (i.e. nutritionix
        // is able to recognize a food.)
        //
        let prevPhase = valIfExistsOr(sdSnapshot, 'phase')
        let phase = valIfExistsOr(sdSnapshot, 'nextPhase')
        switch (phase) {
          case 'action': {
            updateChallengeData(sevenDayChalRef,
                                {phase: 'action', nextPhase: 'reward'})
            //
            // Thoughts (TODO): the values below fed into nutritionix, will
            //                  probably need to come from firebase because
            //                  at various points in the flow, the values will
            //                  change to add more functionality. The change
            //                  will be initiated by the server.
            // day1: sugar metric
            // day2: sugar metric + sugar facts 2x
            // day3: sugar metric + progress bar (b,d), facts (l)
            // day4: sugar metric + progress bar + fact (b, d), visual (l)
            // day5: sugar metric + progress bar + sugar visual (b, d), fact (l)
            // day6: sugar metric + visuals, fact (l)
            // day7: sugar metric + progress bar + recipe (b), facts (l), visual (d)
            const progressBar = false
            const visualization = false
            const challengeDay = sdSnapshot.child('day').val()
            const messages = []
            return nutrition.getNutritionix(
                        firebase, messageText, userId, 
                        date, timestamp)
          }
          case 'reward': {
            // TODO: we need to see if the nutritionix result was okay (to do that
            //       we might modify it to write a status to firebase when it is
            //       done indicating success or failure)
            //       That status should push us into the default processing case
            //       or another one to handle unexpected input.
            const investmentQuestion = "So, I'm curious, what are the reasons" +
                                       " you are doing this sugar challenge?"
            switch (featureString) {
              case 'ignore last item': {
                // TODO: if the user ignores adding an item, should we give them
                //       a chance to track another item? (afterall, we're trying
                //       to get them to track all three meals)
                updateChallengeData(sevenDayChalRef,
                                    {phase: 'reward', nextPhase: 'invest'})
                return ['Ok, no problem',
                        new fbTemplate.ChatAction('typing_on').get(),
                        new fbTemplate.Pause(threeSeconds).get(),
                        investmentQuestion]
              }
              case 'add last item': {
                // TODO: we need to update the challenge data to indicate that
                //       one of the three key contexts is complete (as regards
                //       tracking).
                updateChallengeData(sevenDayChalRef,
                                    {phase: 'reward', nextPhase: 'invest'})

                // Add the last item, but hide the response.
                const noResponse = true
                fire.addLastItem(firebase, userId, date, noResponse)

                return ['Done!',
                        new fbTemplate.ChatAction('typing_on').get(),
                        new fbTemplate.Pause(threeSeconds).get(),
                        investmentQuestion]
              }
              default: {
                // ???
                // TODO: what to do if the user doesn't hit a button to add/ignore
                //       the nutritionix result?
                return ''
              }
            }
          }
          case 'invest': {
            // Store the user's response in firebase
            updateChallengeData(sevenDayChalRef,
                                {phase: 'invest',
                                 nextPhase: 'action',
                                 context: getNextMealEvent(mealEvent),
                                 investmentResponse: messageText})

            const goodbyeResp = "I'll talk to you again " +
                                getNextMealEventRespSuffix(mealEvent) + "!"
            return ["Thanks for sharing that with me. I'll keep it " +
                    "in mind.",
                    new fbTemplate.ChatAction('typing_on').get(),
                    new fbTemplate.Pause(threeSeconds).get(),
                    goodbyeResp]
          }
          default: {
            // Need to figure out context if we get here.
          }
        }
      }
      return ''
    })
  }
}
