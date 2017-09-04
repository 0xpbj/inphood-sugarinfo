const utils = require('./../utils.js')
const fire = require('./../firebaseUtils.js')
const timeUtils = require('./../timeUtils.js')

const botBuilder = require('claudia-bot-builder')
const fbTemplate = botBuilder.fbTemplate

exports.processWit = function(data,
                              messageText, userId,
                              favorites, timezone, name, timestamp, date) {
  // console.log('In sevenDayWitProcessing:')

  return 'My name is sugarinfoAI. Nice to meet you ' + name
  // Day 1:
  // Start out by saying hello and briefly giving the value prop.
  // Then get right to tracking day 1.
  // Remind them again automatically at next meal time.
  // Send a report, but before that or in that, explain maximum sugar.
  //    Set a goal.
  //    Future: wizard to help them calculate target sugar.
  // Congratulate them on journey to health. Mention reminder tomorrow morning.
  //
  // Day 2:
}
