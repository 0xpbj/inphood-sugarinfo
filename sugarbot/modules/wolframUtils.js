exports.getWolfram = function(messageText, userId) {
  const url = 'http://api.wolframalpha.com/v1/result?appid=' + process.env.WOLFRAM_API_ID + '&i=' + encodeURI(messageText)
  const request = require('request-promise')
  let wolfOptions = {
    uri: url,
    method: 'GET',
    resolveWithFullResponse: true
  }
  return request(wolfOptions)
  .then(result => {
    return [
      'Um...I\'m a sugar information chatbot remember... 🤔',
      'Here\'s what I found: ' + result.body,
      'Now let\'s keep the topic on food shall we 🤓'
    ]
  })
  .catch(error => {
    return "Hmm....can you please re-phrase your food question (ex: 'how much sugar in a apple?')"
  })
}