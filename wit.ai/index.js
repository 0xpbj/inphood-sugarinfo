const fs = require('fs'),
  readline = require('readline')
const stemmer = require('porter-stemmer').stemmer

function validateSamples(samples) {
  const request = require('request-promise')
  return request('https://api.wit.ai/samples?v=20170307', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer 5U2IZIRU6IH7RIHEN3ASU3LPFE5JY3S4',
      'Content-Type': 'application/json',
    },
    body: samples,
    json: true,
    resolveWithFullResponse: true
  })
  .then(result => result)
  .catch(error => console.log('Wit.ai Error: ', error))
}

var rd = readline.createInterface({
    input: fs.createReadStream('./foodNames.json'),
    // output: process.stdout,
    console: false
});

rd.on('line', function(text) {
  validateSamples([{
    text,
    entities: [
      {
        entity: 'features',
        value: 'nutrition'
      }
    ]
  }])
  .then(result => {
    // console.log('Result: ', result)
  })
});