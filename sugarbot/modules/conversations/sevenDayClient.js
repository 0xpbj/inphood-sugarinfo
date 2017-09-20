const constants = require('./../constants.js')
const hookedConstants = require('./../hookedConstants.js')
const fire = require('./../firebaseUtils.js')
const nutrition = require ('./../nutritionix.js')
const timeUtils = require('./../timeUtils.js')
const utils = require('./../utils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

function initChallengeData(firebase, userId, dbProfilePath, userTime, mealEvent) {
  const sevenDayChalData = {
    startTime: userTime,
    day: 1,
    context: mealEvent,
    phase: 'trigger',
    nextPhase: 'action'
  }
  utils.updateChallengeData(firebase, userId, sevenDayChalData)

  // Copy in the user's profile data. Do it asynchronously to prevent delays/
  // blocking.
  dbProfilePath.once('value', function(profileSnapshot) {
    utils.updateChallengeData(firebase, userId, {profile: profileSnapshot.val()})
  })
}

function getInitialGreeting(userName, messageDelay, buttonName) {
  const intro =
    "Hi " + userName + ", I’m sugarinfoAI 👨‍💻.\n" +
    "I have a 7-day challenge to lower your risk of " +
    "heart attack 💔 and type 2 diabetes 💉."
  const description =
    "We'll track your average daily sugar " +
    "and work to lower it, if necessary."
  return [
    intro,
    new fbTemplate.ChatAction('typing_on').get(),
    new fbTemplate.Pause(messageDelay).get(),
    new fbTemplate.Button(description)
    .addButton(buttonName + '🏆🏅🏆', buttonName)
    .get()
  ]
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

function processDCommands(firebase, messageText, sdSnapshot, userId, userTime) {
  // AC's debug / server simulation bot function:
  switch(messageText.toLowerCase()) {
    case 'd-incday': {
      // Increment the current day in the challenge manually
      const currDay = utils.ssValIfExistsOr(sdSnapshot, 'day')
      const incrDay = currDay + 1
      utils.updateChallengeData(firebase, userId, {day: incrDay})
      return 'dbg: incremented day to ' + incrDay
    }
    case 'ds-meadv' : {
      // Toggles the meal event advance mode. Under normal circumstances,
      // the current/next meal event determination depends on the current time.
      // This toggles between that and a mode where it just goes sequentially
      // to the next meal event automatically.
      let newMeAdv = 'time'
      if (meAdv === 'time') {
        newMeAdv = 'sequential'
      }
      utils.updateChallengeData(firebase, userId, {dbg: {mealEventAdvance: newMeAdv}})
      return 'dbg: meal adance mode ' + newMeAdv
    }
    case 'ds-calcday': {
      // Updates the current day in the challenge
      //   (simulates a cron job in the server that calculates user time at
      //    *:01 daily and then determines the user's challenge day by
      //    subtracting the date day)
      const startDateDay = utils.ssValIfExistsOr(sdSnapshot, 'startTime/day')
      const currDateDay = userTime.day
      // Now that we have both date days, calculate the current day of the
      // challenge:
      const currDay = 1 + currDateDay - startDateDay
      utils.updateChallengeData(firebase, userId, {day: currDay})
      return 'dbg: updated current day to ' + currDay + ' (based on calc.)'
    }
    case 'ds-trigger': {
      // Outputs the next trigger question expected from the server
      //  (actual server code would look at context to see if it matches
      //   the trigger statement it's about to send--this is in case a user
      //   entered data before the trigger question arrived so we wouldn't
      //   ask them to track breakfast if they did already, e.g.:
      //   if (mealEvent === context) {
      //     // ask the trigger
      //   } else {
      //     // otherwise skip to next trigger time
      //   }
      const context = utils.ssValIfExistsOr(sdSnapshot, 'context')
      switch(context) {
        case utils.mealEvents[0]: {
          return "Good morning! I hope you had a good breakfast. What did you eat?" +
                 " (e.g. bacon and eggs)"
        }
        case utils.mealEvents[1]: {
          return "Good afternoon! I was so busy, I skipped lunch 😐--what did you eat?"
        }
        case utils.mealEvents[2]: {
          return "Nice to see you back again. What did you eat for dinner?"
        }
        default: {
          return 'dbg: no trigger for context=' + context
        }
      }
    }
    case 'dv-trigger': {
      // Tell the server to process user triggers.
      utils.updateChallengeData(firebase, 'server', {request: {functionName: 'processUserTriggers'}})
      return 'dbg: issuing trigger request to server'
    }
    case 'dv-updateday': {
      // Tell the server to process user days.
      utils.updateChallengeData(firebase, 'server', {request: {functionName: 'processUserDays'}})
      return 'dbg: issuing day advance request to server'
    }
    case 'dv-breakfast': {
      utils.updateChallengeData(firebase, userId, {simUserHour: 10})
      return 'dbg: simulating breakfast reminder hour for user'
    }
    case 'dv-lunch': {
      utils.updateChallengeData(firebase, userId, {simUserHour: 14})
      return 'dbg: simulating lunch reminder hour for user'
    }
    case 'dv-dinner': {
      utils.updateChallengeData(firebase, userId, {simUserHour: 19})
      return 'dbg: simulating dinner reminder hour for user'
    }
    case 'dv-clearhour': {
      utils.updateChallengeData(firebase, userId, {simUserHour: null})
      return 'dbg: clearing simulated user hour'
    }
    case 'dv-tbreakfast': {
      let simulatedTime = userTime
      simulatedTime.hour = 10
      utils.updateChallengeData(firebase, 'server', {request: {
                                  functionName: 'processUserTriggers',
                                  simulatedTime: simulatedTime}})

      return 'dbg: issuing trigger breakfast request to server'
    }
    case 'dv-tlunch': {
      let simulatedTime = userTime
      simulatedTime.hour = 14
      utils.updateChallengeData(firebase, 'server', {request: {
                                  functionName: 'processUserTriggers',
                                  simulatedTime: simulatedTime}})

      return 'dbg: issuing trigger lunch request to server'
    }
    case 'dv-tdinner': {
      let simulatedTime = userTime
      simulatedTime.hour = 19
      utils.updateChallengeData(firebase, 'server', {request: {
                                  functionName: 'processUserTriggers',
                                  simulatedTime: simulatedTime}})

      return 'dbg: issuing trigger dinner request to server'
    }
    default: {
      // No-op (go to regular bot function)
      return undefined
    }
  }
}

exports.processWit = function(firebase, data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  const startChallengeButton = 'Start Challenge'
  const threeSeconds = 3 * 1000
  const featureString = data.entities.features ?
                        data.entities.features[0].value : data._text

  console.log('Conversation sevenDayClient: ' + featureString)

  const sugarinfoRef = firebase.database().ref("/global/sugarinfoai")
  const profileRef = sugarinfoRef.child(userId + "/profile")
  const sevenDayChalRef = sugarinfoRef.child("sevenDayChallenge/" + userId)

  let userTime = timeUtils.getUserTimeObj(Date.now(), timezone)

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
        const userName = utils.ssValIfExistsOr(npSnapshot, 'first_name', '')
        // if (npSnapshot.child('challenge').val() === 'in progress') {
        //   return [
        //     'Welcome back to the 7-day challenge ' + userName,
        //     getInitTriggerQuestion(mealEvent)
        //   ]
        // }
        profileRef.update({challenge: 'in progress'})
        return getInitialGreeting(userName, threeSeconds, startChallengeButton)
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

      // Simulating time (hour specifically--modify userTime if
      // value specified in FBase):
      const simUserHour = utils.ssValIfExistsOr(sdSnapshot, 'simUserHour')
      let simTime = undefined
      if (simUserHour) {
        simTime = userTime
        simTime.hour = simUserHour
      }

      let mealEvent = utils.calculateMealEvent(timezone, simTime)
      let meAdv = utils.ssValIfExistsOr(sdSnapshot, 'dbg/mealEventAdvance')
      if (meAdv === 'sequential') {
        mealEvent = utils.ssValIfExistsOr(sdSnapshot, 'context')
      }

      // AC's debug / server simulation bot function:
      const dMessage =
        processDCommands(firebase, messageText, sdSnapshot, userId, userTime)
      if (dMessage) {
        return dMessage
      }

      // Regular bot function:
      if (messageText.toLowerCase() === startChallengeButton.toLowerCase()) {
        console.log('  initializing user\'s seven day challenge data')
        //
        // Special case--user has pressed button 'Start the challenge':
        //   The trigger question will come from Lambda instead of the server for
        //   this special case.
        //
        initChallengeData(firebase, userId, profileRef, userTime, mealEvent)
        return getInitTriggerQuestion(mealEvent)
      }
      // if user ignores item and wants to track something else
      else if (messageText.toLowerCase() === 'describe food') {
        return 'Great! Tell me what you would like to track.'
      }
      else {
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
        let prevPhase = utils.ssValIfExistsOr(sdSnapshot, 'phase')
        let phase = utils.ssValIfExistsOr(sdSnapshot, 'nextPhase')
        switch (phase) {
          case 'action': {
            utils.updateChallengeData(firebase,
              userId, {phase: 'action', nextPhase: 'reward'})
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
            console.log('+++++++++++++++++++++++++++Am I in action?')
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
            const challengeDay = sdSnapshot.child('day').val()
            let iRes = sdSnapshot.child('investmentResponse/day' + challengeDay + '/context').val()
            if (!iRes)
              iRes = 0
            const investmentArr = hookedConstants.investmentArr[challengeDay]
            const investmentQuestion = investmentArr[iRes]
            switch (featureString) {
              case 'ignore last item': {
                // TODO: if the user ignores adding an item, should we give them
                //       a chance to track another item? (afterall, we're trying
                //       to get them to track all three meals)
                utils.updateChallengeData(firebase,
                  userId, {phase: 'trigger', nextPhase: 'action'})

                return [new fbTemplate.Button("Ok, would you like to track something else?")
                        .addButton('Yes ✅', 'describe food')
                        .get()]
              }
              case 'add last item': {
                // TODO: we need to update the challenge data to indicate that
                //       one of the three key contexts is complete (as regards
                //       tracking).
                utils.updateChallengeData(firebase,
                  userId, {phase: 'reward', nextPhase: 'invest'})

                // Add the last item, but hide the response.
                fire.addLastItem(firebase, userId, date)
                if (investmentQuestion === 'alert') {
                  return utils.trackAlertness()
                }
                else if (investmentQuestion === 'mood') {
                  return utils.trackMood()
                }
                // else {
                //   const goodbyeResp = "Great, I'll talk to you again " +
                //                 getNextMealEventRespSuffix(mealEvent) + "!"
                //   return goodbyeResp
                // }
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
            console.log('mealEvent:' + mealEvent)
            console.log('nextMealEvent:' + getNextMealEvent(mealEvent))
            console.log('resp sfx:' + getNextMealEventRespSuffix(mealEvent))
            // Store the user's response in firebase
            const challengeDay = sdSnapshot.child('day').val()
            let iRes = sdSnapshot.child('investmentResponse/day' + challengeDay + '/context').val()
            if (!iRes)
              iRes = 0
            utils.updateChallengeData(
              firebase, userId,
              {phase: 'invest', nextPhase: 'action',
               context: getNextMealEvent(mealEvent)}
            )
            sevenDayChalRef.child('investmentResponse/day' + challengeDay).update({
              context: iRes + 1
            })
            sevenDayChalRef.child('investmentResponse/day' + challengeDay + '/' + iRes).update({
              messageText,
            })
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
