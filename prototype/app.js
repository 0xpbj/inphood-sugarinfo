var http = require('http');

http.createServer(function (request, response) {

  // const url = 'http://cdn1.medicalnewstoday.com/content/images/articles/271157-bananas.jpg'
  const url = 'http://ucsdaim.org/wp-content/uploads/2010/04/nutritionfacts.jpg'

  let encoding = 'binary'
  var options = {
    encoding: encoding,
    uri: url,
    method: 'GET',
    gzip: true,
    json: false,
    resolveWithFullResponse: true
    // headers: {Authorization: "Bearer 'EAAJhTtF5K30BAC2EC7KfySkyNJiJfqGW7ZCi4W1CJcmFuZBVLZCA0cZCkpkZCugYvNzVfugI6rji9ZAWqjJwEvJJlgEML8xj4nbIym7CdQTNoGT7y9LobncZCduDxYMzM5MXA02x9OMZCMyoeKSGxwqclT0c168AHf8CvMFlo2E5fAZDZD'"}
  }

  const Tesseract = require('tesseract.js')
  const rp = require('request-promise')

  return rp (options)
  .then(response => {
    let imgBuffer = Buffer.from(response.body, encoding)

    return Tesseract.recognize(imgBuffer)
    // .progress(message => console.log('TMessage: ', message))
    // .catch(err => console.log('TErr: ', err))
    .then(result => {
      console.log('Result ----------------------------------------------------')
      console.log('Result: ', result)
    })
    // .finally(resultOrError => console.log('TFinally: ', resultOrError))
  })
  .catch(err => {
    console.log('Error: ' + err)
  });
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this bot.')
