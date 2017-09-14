const constants = require('./constants.js')

const requestPromise = require('request-promise')
const {Wit} = require('node-wit')
const witClient = new Wit({accessToken: process.env.WIT_TOKEN})

const oc = require('./conversations/originalConv.js')
const sdc = require('./conversations/sevenDayClient.js')

function valIfExistsOr(snapshot, childPath, valIfUndefined = undefined) {
  if (snapshot.child(childPath).exists()) {
    return snapshot.child(childPath).val()
  }
  return valIfUndefined
}

exports.msgTxtProcessor = function(firebase, messageText, userId,
                                   favorites, timezone, name, timestamp, date) {
  // console.log('Entering wit proccessing area for: ', messageText)

  return witClient.message(messageText, {})
  .then((data) => {
    console.log('Processing Wit.ai data...')
    const newConv = false
    const AC = 0
    const BJ = 1
    if (newConv && (userId === constants.testUsers[BJ])) {
    // if (newConv && constants.testUsers.includes(userId)) {
      const profileRef = firebase.database().ref("/global/sugarinfoai/" + userId + "/profile/")
      return profileRef.once("value")
      .then(function(snapshot) {
        return sdc.processWit(firebase, snapshot, data,
                                 messageText, userId,
                                 favorites, timezone, name, timestamp, date)
      })
    } else {
      console.log('  with original conversation module.')
      return oc.processWit(firebase, data,
                           messageText, userId,
                           favorites, timezone, name, timestamp, date)
    }})
  .catch(error => {console.log('Wit.ai Error: ', error)});
}
