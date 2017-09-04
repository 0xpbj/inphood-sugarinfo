const image = require('./imageUtils.js')
const timeUtils = require('./timeUtils.js')
const constants = require('./constants.js')

const mtp = require('./msgTxtProcessor.js')

const firebase = require('firebase')

exports.bot = function(request, messageText, userId) {
  const tempRef = firebase.database().ref("/global/sugarinfoai/" + userId)
  return tempRef.once("value")
  .then(function(snapshot) {
    const favorites = snapshot.child('/myfoods/').val()
    const timezone = snapshot.child('/profile/timezone').val() ? snapshot.child('/profile/timezone').val() : -7
    const name = snapshot.child('/profile/first_name').val() ? snapshot.child('/profile/first_name').val() : ""
    let {timestamp} = request.originalRequest
    //
    // if (constants.testUsers.includes(userId)) {
    //   console.log('SETTING BACK TIME FOR AC LOGGING')
    //   timestamp = timestamp - 1000 * 60 * 60 * 24
    // }

    const date = timeUtils.getUserDateString(timestamp, timezone)
    var messageAttachments = (request.originalRequest && request.originalRequest.message) ? request.originalRequest.message.attachments : null
    if (messageText && !isNaN(messageText)) {
      return image.fdaProcess(userId, messageText, date, timestamp)
    } else if (messageText) {
      return mtp.msgTxtProcessor(messageText, userId,
                                 favorites, timezone, name, timestamp, date)
    } else if (messageAttachments) {
      const {url} = messageAttachments[0].payload
      return image.processLabelImage(url, userId, date, timestamp)
    }
  })
}
