const constants = require('./constants.js')

const requestPromise = require('request-promise')
const {Wit} = require('node-wit')
const witClient = new Wit({accessToken: process.env.WIT_TOKEN})

const oc = require('./conversations/originalConv.js')
const sdc = require('./conversations/sevenDayConv.js')
const dO = require('./conversations/dayOne.js')

exports.msgTxtProcessor = function(firebase, messageText, userId,
                                   favorites, timezone, name, timestamp, date) {
  // console.log('Entering wit proccessing area for: ', messageText)

  return witClient.message(messageText, {})
  .then((data) => {
    console.log('Processing Wit.ai data...')
    const newConv = true
    if (newConv && userId === constants.testUsers[1]) {
      console.log('  with day 1 / 7 challenge conversation module.')
      return dO.processWit(firebase, data,
                           messageText, userId,
                           favorites, timezone, name, timestamp, date)
      // console.log('  with seven day challenge conversation module.')
      // return sdc.processWit(firebase, data,
      //                       messageText, userId,
      //                       favorites, timezone, name, timestamp, date)
    } else {
      console.log('  with original conversation module.')
      return oc.processWit(firebase, data,
                           messageText, userId,
                           favorites, timezone, name, timestamp, date)
    }})
  .catch(error => {console.log('Wit.ai Error: ', error)});
}
