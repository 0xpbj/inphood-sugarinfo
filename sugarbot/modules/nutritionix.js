const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;
const utils = require('./utils.js')
const sugarUtils = require('./sugarUtils.js')
const fire = require('./firebaseUtils.js')
const wolf = require('./wolframUtils.js')
const names = require('./foodNames.js')
const firebase = require('firebase')

function cleanQuestion(messageText) {
  return messageText.replace('sugar', '')
}

function randomUmame() {
  const arr = [
    'Ugh—I haven’t had my coffee yet. Could you press one of the buttons above or type ‘startmeup’ to get a list of things I can do for you without coffee?',
    'Oh oh—you caught me watching YouTube and not paying attention. Could you hit one of the buttons above or type ‘pay attention’ to get a list of what I can do for you today?',
    'Woah—I just nodded off after an epic lunch and missed what you said. Can you hit one of the buttons or type ‘wakeup’ to see what I can do for you?'
  ]
  let size = arr.length
  const number = Math.floor(Math.random()*(size-1+1)+1)
  return arr[number]
}

exports.getNutritionix = function(messageText, userId, date, fulldate) {
  const url = 'https://trackapi.nutritionix.com/v2/natural/nutrients'
  const request = require('request-promise')
  const cleanText = cleanQuestion(messageText)
  let nutOptions = {
    uri: url,
    json: true,
    method: 'POST',
    body: {
      "query": cleanText,
      //fix this to be based on user timezone
      "timezone": "US/Western"
    },
    resolveWithFullResponse: true,
    headers: {
      'Content-Type': "application/json", 
      'x-app-id': process.env.NUTRITIONIX_APP_ID, 
      'x-app-key': process.env.NUTRITIONIX_API_KEY
    }
  }
  return request(nutOptions)
  .then(result => {
    let {foods} = result.body
    let psugar = 0
    let nsugar = 0
    let processedSugars = ''
    let foodName = ''
    let naturalSugars = ''
    let zeroSugar = ''
    let thumb = []
    let sugar = 0
    let carbs = 0
    let fiber = 0
    let sugarArr = []
    let carbsArr = []
    let fiberArr = []
    for (let food of foods) {
      let nxsugar = 0
      let pxsugar = 0
      const {
        upc, 
        nf_sugars, 
        nf_total_carbohydrate,
        nf_dietary_fiber,
        nix_brand_name, 
        nix_brand_id, 
        nf_ingredient_statement, 
        food_name, 
        serving_qty, 
        serving_unit, 
        meal_type, 
        photo
      } = food
      let foodSugar = nf_sugars ? Math.round(nf_sugars) : 0
      console.log('*************************')
      console.log(food)
      if (foodSugar === 0) {
        zeroSugar += '    - 0g sugar in ' + serving_qty + ' ' + serving_unit + ' of ' + food_name +'\n'
        foodName += food_name + '\n'
      }
      else if (upc || nix_brand_name || nix_brand_id || nf_ingredient_statement || names.getNatural(food_name) == -1) {
        console.log('Processed', food_name)
        psugar += foodSugar
        pxsugar += foodSugar
        processedSugars += '    - ' + foodSugar + 'g sugars in ' + serving_qty + ' ' + serving_unit + ' of ' + food_name + '\n'
        foodName += food_name + '\n'
      }
      else if (foodSugar) {
        nsugar += foodSugar
        nxsugar += foodSugar
        naturalSugars +=  '    - ' + foodSugar + 'g natural sugars in ' + serving_qty + ' ' + serving_unit + ' of ' + food_name + '\n'
        foodName += food_name + '\n'
      }
      if (photo.thumb !== '') {
        thumb.push(photo.thumb)
      }
      else {
        thumb.push('')
      }
      sugar += nf_sugars
      carbs += nf_total_carbohydrate
      fiber += nf_dietary_fiber
      sugarArr.push({nsugar: nxsugar, psugar: pxsugar})
      carbsArr.push(nf_total_carbohydrate)
      fiberArr.push(nf_dietary_fiber)
    }
    let sugarPerServingStr = 'That has about ' + psugar + 'g of sugars. Here\'s a breakdown of your meal: \n'
    if (processedSugars !== '') {
      sugarPerServingStr += processedSugars
    }
    if (naturalSugars !== '') {
      sugarPerServingStr += '\n\n*NOTE* These sugars are not counted against your daily allotment.\n'
      sugarPerServingStr += '  ' + nsugar + 'g of natural sugars\n' + naturalSugars
    }
    if (zeroSugar !== '') {
      sugarPerServingStr += zeroSugar
    }
    let carbsPerServingStr = 'That has about ' + carbs + 'g of carbs.'
    let fiberPerServingStr = 'That has about ' + fiber + 'g of fiber.'
    let sugarData = {
      sugar,
      carbs,
      fiber,
      psugar,
      nsugar,
      sugarArr,
      carbsArr,
      fiberArr,
      foodName,
      cleanText,
      sugarPerServingStr,
      carbsPerServingStr,
      fiberPerServingStr,
      photo: thumb,
      ingredientsSugarsCaps: 'unknown'
    }
    return fire.addSugarToFirebase(userId, date, fulldate, '', sugarData)
  })
  .catch(error => {
    // return [
    //   "We couldn\'t match any of your foods",
    // ]
    return wolf.getWolfram(messageText, userId)
  })
}