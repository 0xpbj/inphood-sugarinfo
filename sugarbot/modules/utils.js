const Quagga = require('quagga').default;
const reqProm = require('request-promise')
const sugarUtils = require('./sugarUtils.js')
const botBuilder = require('claudia-bot-builder');
const fbTemplate = botBuilder.fbTemplate;

// Duplicated out of webview FoodJournalEntry:
// TODO: unify
// TODO: probably better to move this elsewhere and dynamically update when
// needed (otherwise, each keypress results in all this being run.)
//
exports.updateTotalSugar = function(snapshot, dailyTotalRef) {
  let newSugarIntakeDict = snapshot.val();
  let nSugarTotal = 0;
  let pSugarTotal = 0;

  const keyArr = Object.keys(newSugarIntakeDict);
  for (let key of keyArr) {

    const intakeEntry = newSugarIntakeDict[key]
    if (key === 'dailyTotal' ||
        intakeEntry.removed) {
      continue;
    }

    nSugarTotal += intakeEntry.hasOwnProperty('nsugar') ? intakeEntry.nsugar : 0
    pSugarTotal += intakeEntry.hasOwnProperty('psugar') ? intakeEntry.psugar : intakeEntry.sugar
  }

  dailyTotalRef.set({nsugar: nSugarTotal, psugar: pSugarTotal});
}

exports.boundsChecker = function(input, weight) {
  let num = input
  if (typeof(input) === "string") {
    num = parseInt(input)
  }
  if (weight) {
    if (num > 20 && num < 400) {
      return num
    }
    return -1
  }
  else if (num > -1 && num < 150) {
    return num
  }
  return -1
}

exports.getBarcodeAsync = function(param){
  return new Promise((resolve, reject) => {
    Quagga.decodeSingle(param, (data) => {
      console.log(data)
      if (typeof(data) === 'undefined') {
        return reject('error');
      }
      else if (!data.codeResult) {
        return reject('error');
      }
      resolve(data.codeResult.code);
    })
  })
}

exports.getUsdaReport = function(ndbno) {
  // TODO: refactor api_key and URLs to config.js type area.
  const usdaReportReq = {
    uri: 'https://api.nal.usda.gov/ndb/reports/',
    method: 'GET',
    qs: {
      ndbno: ndbno.toString(),
      type: 'f',
      format: 'json',
      api_key: process.env.FDA_API_KEY
    },
    json: true,
    resolveWithFullResponse: true
  }

  let result = {
    error: undefined,
    ingredients: undefined,
    ingredientsSugarsCaps: undefined,
    sugarPerServing: undefined,
    carbsPerServing: undefined,
    fiberPerServing: undefined,
    sugarPerServingStr: undefined,
    carbsPerServingStr: undefined,
    fiberPerServingStr: undefined
  }

  const SUGAR_NUTRIENT_ID = '269'
  const CARBS_NUTRIENT_ID = '205'
  const FIBER_NUTRIENT_ID = '291'

  return reqProm(usdaReportReq)
  .then(usdaReportResult => {
    result.ingredients = usdaReportResult.body.report.food.ing.desc
    result.ingredientsSugarsCaps = sugarUtils.capitalizeSugars(result.ingredients)
    const nutrients = usdaReportResult.body.report.food.nutrients
    for (let nutrient of nutrients) {
      console.log(nutrient.nutrient_id)
      // Assume first measure will suffice
      let measure = nutrient.measures[0]
      let eunit = measure.eunit
      if (nutrient.measures.length > 0 && nutrient.nutrient_id === SUGAR_NUTRIENT_ID) {
        let sugarPerServing = ''
        sugarPerServing += measure.value + eunit + ' '
        sugarPerServing += nutrient.name.toLowerCase().replace(/,.*/g, '')
        sugarPerServing += ' in a '
        sugarPerServing += measure.qty + ' ' + measure.label
        sugarPerServing += ' (' + measure.eqv + eunit + ') serving'
        result.sugarPerServingStr = sugarPerServing
        result.sugarPerServing = measure.value
        console.log('Sugar block')
      }
      else if (nutrient.measures.length > 0 && nutrient.nutrient_id === CARBS_NUTRIENT_ID) {
        let carbsPerServing = ''
        carbsPerServing += measure.value + eunit + ' '
        carbsPerServing += nutrient.name.toLowerCase().replace(/,.*/g, '')
        carbsPerServing += ' in a '
        carbsPerServing += measure.qty + ' ' + measure.label
        carbsPerServing += ' (' + measure.eqv + eunit + ') serving'
        result.carbsPerServingStr = carbsPerServing
        result.carbsPerServing = measure.value
        console.log('Carbs block')
      }
      else if (nutrient.measures.length > 0 && nutrient.nutrient_id === FIBER_NUTRIENT_ID) {
        let fiberPerServing = ''
        fiberPerServing += measure.value + eunit + ' '
        fiberPerServing += nutrient.name.toLowerCase().replace(/,.*/g, '')
        fiberPerServing += ' in a '
        fiberPerServing += measure.qty + ' ' + measure.label
        fiberPerServing += ' (' + measure.eqv + eunit + ') serving'
        result.fiberPerServingStr = fiberPerServing
        result.fiberPerServing = measure.value
        console.log('Fiber block')
      }
    }
    console.log(result)
    console.log('---')
    console.log('Ingredients: ' + result.ingredientsSugarsCaps)
    return result
  })
  .catch(error => {
    const errMsg = 'USDA Report Request failed' + error
    console.log(errMsg)
    result.error = errMsg
    return result
  })
}

exports.otherOptions = function(option) {
  if (option === true) {
    return [
      "Welcome back! I'm here to help you understand sugar 🤓",
      new fbTemplate.Button("Here are your options")
        .addButton('Add to Journal ✏️', 'journal')
        .addButton('Favorite Meals ❤️', 'my favorites')
        .get()
    ]
  }
  else {
    return new fbTemplate.Button('What would you like to do next?')
      .addButton('Add to Journal ✏️', 'journal')
      .addButton('Favorite Meals ❤️', 'my favorites')
      .get();
  }
}

exports.randomSugarFacts = function() {
  const data = sugarUtils.getSugarFact()
  console.log('Random sugar fact', data)
  return [
    new fbTemplate.ChatAction('typing_on').get(),
    new fbTemplate.Pause(100).get(),
    data.fact,
    data.source
  ]
}

exports.todaysSugarRecipe = function(dateVal) {
  const date = new Date(dateVal)
  const message = "Here's your daily sugar free recipe for " + date.toDateString()
  const data = sugarUtils.getSugarRecipe(date)
  console.log('Datevalue', date)
  console.log('Todays sugar recipe', data)
  return [
    new fbTemplate.ChatAction('typing_on').get(),
    new fbTemplate.Pause(100).get(),
    message,
    data.recipe + ': ' + data.link
  ]
}

exports.sendShareButton = function() {
  return new fbTemplate.Generic()
    .addBubble('sugarinfoAI 🕵️ ', 'Find and track (hidden) sugars in your diet')
    .addUrl('https://www.facebook.com/sugarinfoAI/')
    .addImage('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/sugar.jpg')
    .addShareButton()
    .get()
}

exports.sendReminder = function() {
  return new fbTemplate.Button('What time works best?')
    .addButton('1 hours', 'time1')
    .addButton('3 hours', 'time3')
    .addButton('5 hours', 'time5')
    .get()
}

exports.trackMood = function() {
  return new fbTemplate.Button('Would you like to record your mood?')
  .addButton('🙂', 'positive mood')
  .addButton('😐', 'neutral mood')
  .addButton('🙁', 'negative mood')
  .addButton('Not now  ❌', 'not now mood')
  .get();
}

exports.trackAlertness = function() {
  return new fbTemplate.Button('Would you like to record your alertness?')
  .addButton('😳', 'very alert')
  .addButton('😐', 'typical alertness')
  .addButton('😴', 'drowsy')
  .addButton('Not now  ❌', 'not now alertness')
  .get();
}

exports.parseMyFavorites = function(favorites, more) {
  let favArr = []
  console.log('Favorites', favorites, favorites.length)
  let myFavs = new fbTemplate.List()
  myFavs.addBubble('My Favorites Meals', 'Here are your most commonly added meals')
  .addImage('https://d1q0ddz2y0icfw.cloudfront.net/chatbotimages/favorite.jpg')
  for (let object in favorites) {
    let length = Object.keys(favorites[object].date).length
    favArr.push({length, object})
  }
  favArr.sort(function(a, b) {
    return (a.length > b.length)
  })
  var revArr = favArr.reverse()
  let i = 0
  for (let it of revArr) {
    if (!more && i === 3)
      break
    else if (more && i === 6)
      break
    i++
    if (more && i < 4) {
      continue
    }
    let name = it.object.cleanText ? it.object.cleanText : it.object
    myFavs.addBubble('Meal #' + i, name.toLowerCase())
    .addButton('Add Meal', it.object)
  }
  console.log('fav arr', favArr.length, more)
  if (more || favArr.length < 4) {
    return myFavs.get()
  }
  else {
    return myFavs.addListButton('View More', 'more favorites').get()
  }
}
