var http = require('http');
var levenshtein = require('fast-levenshtein');

// Source: https://authoritynutrition.com/56-different-names-for-sugar/
const sugarNames = [
  'sugar',
  'sucrose',
  'high-fructose corn syrup',
  'hfcs',
  'agave nectar',
  'beet sugar',
  'blackstrap molasses',
  'brown sugar',
  'buttered syrup',
  'cane juice crystals',
  'cane sugar',
  'caramel',
  'carob syrup',
  'castor sugar',
  'coconut sugar',
  'confectioner\'s sugar',
  'powdered sugar',
  'date sugar',
  'demarara sugar',
  'evaporated cane juice',
  'florida crystals',
  'fruit juice',
  'fruit juice concentrate',
  'golden sugar',
  'golden syrup',
  'grape sugar',
  'honey',
  'icing sugar',
  'invert sugar',
  'maple syrup',
  'molasses',
  'muscovado sugar',
  'panela sugar',
  'raw sugar',
  'refiner\'s syrup',
  'sorghum syrup',
  'sucanat',
  'treacle sugar',
  'turbinado sugar',
  'yellow sugar',
  'barley malt',
  'brown rice syrup',
  'corn syrup',
  'corn syrup solids',
  'dextrin',
  'dextrose',
  'diastatic malt',
  'ethyl maltol',
  'glucose',
  'glucose solids',
  'lactose',
  'malt syrup',
  'maltodextrin',
  'maltose',
  'rice syrup',
  'cryrstalline fructose',
  'fructose',
  'd-ribose',
  'galactose'
]

// Iterate over all of the sugar names getting a levenshtein distance for each one
// compared to anIngredient. Return the closest matching one.
//
function getSugar(anIngredient) {
  const levThreshold = 2
  let minLev = levThreshold
  let matchingSugar = ''

  for (let sugarName of sugarNames) {
    let lev = levenshtein.get(anIngredient, sugarName)

    if (lev <= minLev) {
      minLev = lev
      matchingSugar = sugarName
    }
  }

  return matchingSugar
}

function processText(text) {
  // Crappy attempt #1:
  //  1. lowercase text
  let lcText = text //text.toLowerCase()

  //  2. stip out linefeeds, _, ~, = (and any other bizarre stuff we observe OCR injecting/recognizing)
  let strippedText = lcText.replace(/[\n_~=]/g, '')

  //  3. stip out anything up to 'ingredients: ' if found
  let remainingText = strippedText.replace(/.*ingredients:/i, '')

  //  4. switch out '(' ')' for ','
  let comma4parenText = remainingText.replace(/[()]/g, ',')

  //  5. split on ',' to array of ingredients
  let ingredientsText = comma4parenText.split(',')

  //  6. trim spaces/whitespace from edges of ingredients
  //  7. measure the levenshtein distance of each sugarName to the current ingredient
  //     and select the highest scoring one above a threshold (i.e. lev distance < 4)
  //
  for (let ingredient of ingredientsText) {
    const lcTrimmedIngredient = ingredient.toLowerCase().trim()
    const sugar = getSugarII(lcTrimmedIngredient)
    if (sugar !== '') {
      console.log('Found sugar ', sugar, ' (', lcTrimmedIngredient, ')')
    }
  }
}

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
  const fs = require('fs')

  const testImages = ['ingredients.no-sugars.jpg',
                      'ingredients.half-sugars.jpg',
                      'ingredients.all-sugars.jpg']

  for (let testImageFile of testImages) {
    console.log('Queuing ', testImageFile, ':')
    var jpegFromDisk = fs.readFileSync(testImageFile)

    Tesseract.recognize(jpegFromDisk)
    // .progress(message => console.log('TMessage: ', message))
    // .catch(err => console.log('TErr: ', err))
    .then(result => {
      // console.log('Result ------------------------------------------------------')
      // console.log('Result: ', result)
      // console.log('')
      let text = ''
      console.log('')
      console.log('Sugars found in ', testImageFile, ':')
      console.log('-------------------------------------------------------------')
      for (let paragraph of result.paragraphs) {
        text += paragraph.text
      }
      processText(text)
    })
// .finally(resultOrError => console.log('TFinally: ', resultOrError))
  }
  return
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this bot.')
