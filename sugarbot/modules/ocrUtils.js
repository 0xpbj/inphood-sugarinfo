var http = require('http');
const sugarUtils = require('./sugarUtils.js')

// function to encode file data to base64 encoded string
// from https://stackoverflow.com/questions/28834835/readfile-in-base64-nodejs
exports.base64_encode = function(file) {
    const fs = require('fs')
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
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
    const sugar = sugarUtils.getSugarII(lcTrimmedIngredient)
    if (sugar !== '') {
      console.log('Found sugar ', sugar, ' (', lcTrimmedIngredient, ')')
    }
  }
}

// Returns the text up to End-of-line that proceeds the given prefix. For example,
//  given:
//    text = "0%\nSugars og\nProtein"
//    prefix = "Sugars"
//  this method returns: "og"
//
function getAtomFollowingTextToEOL(text, prefix) {
  const regex = new RegExp(prefix + "(.*?)\n")
  let match = regex.exec(text)
  if (!match || match.length < 2) {
    return ""
  }
  // console.log('getAtomFollowingTextToEOL -------------------------------------')
  // console.log('prefix: ' + match[1].trim())
  // console.log('')
  return match[1].trim()
}

//  Returns the number of grams from the provided text, for example:
//    '10g'      ---> returns 10
//    '11 g'     ---> returns 11
//    '12'       ---> returns 12
//    '27grams'  ---> returns 27
//    '30 grams' ---> returns 30
//
//  It's case insensitive so 10G works the same as 10g
//  It's non-greedy so the first match is returned when there is a pair, for example:
//    '10g is less than 12 grams' ---> returns 10
//
function getFirstNumberFromText(text) {
  const lcText = text.toLowerCase()
  const isolatedGrams = lcText.replace(/.*?([0-9]+).*/g, '$1')
  return parseFloat(isolatedGrams)
}

exports.processGvResponse = function(responses) {
  let text = ''
  let pictureData = {}

  for (let response of responses.responses) {
    //  Structure:
    //
    //    response
    //      textAnnotations
    //        ...
    //      fullTextAnnotations
    //        pages
    //          [{
    //            property: ...
    //            width: 1234
    //            height: 4032
    //            blocks: [...]
    //          }]
    //        text: 'sjfldjfd \n ljdlfjd'
    //
    //
    const fullTextAnnotation = response.fullTextAnnotation
    text = fullTextAnnotation.text

    // assume only one response
    break
  }

  // Crappy attempt #1.1:

  // 1. lowercase text
  const lcText = text.toLowerCase()
  // console.log('************Google Vision String: ', lcText)

  // 2. try to get nutrition label information:
  //  a. serving size
  //  b. servings per
  //  c. sugars
  const servingSizeAtom = getAtomFollowingTextToEOL(lcText, 'serving size')
  const servingsPerAtom = getAtomFollowingTextToEOL(lcText, 'servings per')
  const sugarsAtom = getAtomFollowingTextToEOL(lcText, 'sugars')
  if (sugarsAtom !== '' && servingSizeAtom !== '') {
    console.log('You will consume ' + sugarsAtom + ' in one serving, ' + servingSizeAtom + '.')
  }

  // TODO: further processing of atoms (i.e. convert to numbers/units etc.)
  pictureData.servingSize = servingSizeAtom
  pictureData.servingsPer = servingsPerAtom
  pictureData.sugars = getFirstNumberFromText(sugarsAtom)
  console.log(pictureData.sugars)

  // 3. stip out everything up to 'ingredients: ' if found
  const lcTextAfterIngredients = lcText.replace(/.*ingredients(:?)/i, '')

  // 4. strip out linefeeds
  // 5. split on ',' to array of ingredients
  //    TODO: Google vision doesn't seem to see commas properly. We'll need to
  //          work on finding ingredients in the entire trimmed string instead
  //          of this current splitting method
  const lcIngredients = lcTextAfterIngredients.replace(/\n/g, '').split(',')

  // 6. trim spaces/whitespace from edges of ingredients
  // 7. measure the levenshtein distance of each sugarName to the current ingredient
  //     and select the highest scoring one above a threshold (i.e. lev distance < 4)
  //
  pictureData.sugarsFound = []
  let sugarsFound = false
  for (let ingredient of lcIngredients) {
    const lcTrimmedIngredient = ingredient.trim()
    const sugar = sugarUtils.getSugarII(lcTrimmedIngredient)
    if (sugar !== '') {
      sugarsFound = true
      console.log('Found sugar ', sugar, ' (', lcTrimmedIngredient, ')')
      let sugarString = sugar + ' (' + lcTrimmedIngredient + ')'
      pictureData.sugarsFound.push(sugarString)
    }
  }
  if (!sugarsFound) {
    console.log('No sugars found in ingredients for this image.')
  }

  return pictureData
}
