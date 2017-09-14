const image = require('./imageUtils.js')
const timeUtils = require('./timeUtils.js')
const constants = require('./constants.js')

const mtp = require('./msgTxtProcessor.js')

exports.bot = function(firebase, request, messageText, userId) {
  const userRef = firebase.database().ref("/global/sugarinfoai/" + userId)
  return userRef.once("value")
  .then(function(snapshot) {
    const favorites = snapshot.child('/myfoods/').val()
    const timezone = snapshot.child('/profile/timezone').val() ? snapshot.child('/profile/timezone').val() : -7
    const name = snapshot.child('/profile/first_name').val() ? snapshot.child('/profile/first_name').val() : ""
    let {timestamp} = request.originalRequest
    // if (constants.testUsers.includes(userId)) {
    //   console.log('SETTING BACK TIME FOR AC LOGGING')
    //   timestamp = timestamp - 1000 * 60 * 60 * 24
    // }
    // if (messageText === 'start7') {
    //   userRef.child('profile').update({challenge: 'in progress'})
    // }
    // else if (messageText === 'stop7') {
    //   userRef.child('profile').update({challenge: 'stopped'})
    // }
    const date = timeUtils.getUserDateString(timestamp, timezone)
    var messageAttachments = (request.originalRequest && request.originalRequest.message) ? request.originalRequest.message.attachments : null
    if (messageText && !isNaN(messageText)) {
      return image.fdaProcess(firebase, userId, messageText, date, timestamp)
    } else if (messageText) {
      return mtp.msgTxtProcessor(firebase, messageText, userId,
                                 favorites, timezone, name, timestamp, date)
    } else if (messageAttachments) {
      const {url} = messageAttachments[0].payload
      return image.processLabelImage(firebase, url, userId, date, timestamp)
    }
  })
}
