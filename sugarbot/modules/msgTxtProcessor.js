const constants = require('./constants.js')

const requestPromise = require('request-promise')
const {Wit} = require('node-wit')
const witClient = new Wit({accessToken: process.env.WIT_TOKEN})

const oc = require('./conversations/originalConv.js')
const sdc = require('./conversations/sevenDayConv.js')

exports.msgTxtProcessor = function(messageText, userId,
                       favorites, timezone, name, timestamp, date) {
  // console.log('Entering wit proccessing area for: ', messageText)

  return witClient.message(messageText, {})
  .then((data) => {
    const newConv = false
    if (newConv && userId === constants.testUsers[0]) {
      return sdc.processWit(data,
                            messageText, userId,
                            favorites, timezone, name, timestamp, date)
    } else {
      return oc.processWit(data,
                           messageText, userId,
                           favorites, timezone, name, timestamp, date)
    }})
  .catch(error => {console.log('Wit.ai Error: ', error)});
}
