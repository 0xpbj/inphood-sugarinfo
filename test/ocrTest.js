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

  const rp = require('request-promise')
  const ocrUtils = require('../ocrUtils.js')

  // const testImages = ['ingredients.no-sugars.jpg',
  //                     'ingredients.half-sugars.jpg',
  //                     'ingredients.all-sugars.jpg']

  // const testImages = ['./test/images/hemp_milk_sm.jpg']
  const testImages = ['./test/images/issues/no-sugars-nlabel.jpg']
  // const testImages = ['./test/images/kodiak_cakes.jpg']
  // const testImages = ['./test/images/ingredients.half-sugars.jpg']

  for (let testImageFile of testImages) {
    console.log('Queuing ', testImageFile, ':')
    var jpegFromDisk = ocrUtils.base64_encode(testImageFile)

    var gaOptions = {
      method: 'POST',
      uri: 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBQTHsQA5GuDG7Ttk17o3LBQfXjn7MtUQ8',
      body: {
        "requests": [
          {
            "image": {
               "content": jpegFromDisk
            },
            "features": [
              {
                "type": "TEXT_DETECTION"
              }
            ]
          }
        ]
      },
      json: true
    }

    rp(gaOptions)
    .then(responses => {
      const pictureData = ocrUtils.processGvResponse(responses)
      console.log('pictureData.sugars: ', pictureData.sugars)

      // // console.log('Responses: ', responses)
      // for (let response of responses.responses) {
      //   //  Structure:
      //   //
      //   //    response
      //   //      textAnnotations
      //   //        ...
      //   //      fullTextAnnotations
      //   //        pages
      //   //          [{
      //   //            property: ...
      //   //            width: 1234
      //   //            height: 4032
      //   //            blocks: [...]
      //   //          }]
      //   //        text: 'sjfldjfd \n ljdlfjd'
      //   //
      //   //
      //   const fullTextAnnotation = response.fullTextAnnotation
      //   const text = fullTextAnnotation.text
      //
      //   ocrUtils.processGvText(text)
      // }
    })
    .catch(err => {
      console.log('Error: ' + err)
    })
  }
  return
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this bot.')
