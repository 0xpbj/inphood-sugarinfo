const botBuilder = require('claudia-bot-builder');
const fire = require('./firebaseUtils.js')
const utils = require('./utils.js')
const sugarUtils = require('./sugarUtils.js')
const fbTemplate = botBuilder.fbTemplate;
const nutrition = require ('./nutritionix.js')

exports.fdaProcess = function (firebase, userId, barcode, date, fulldate) {
  console.log('FDA Process', userId, barcode)
  const frequest = require('request-promise')
  let fdaOptions = {
    uri: 'https://api.nal.usda.gov/ndb/search/',
    method: 'GET',
    qs: {
      format: 'json',
      q: barcode,
      sort: 'n',
      max: 2,
      offset: 0,
      api_key: process.env.FDA_API_KEY
    },
    json: true,
    resolveWithFullResponse: true
  }
  return frequest(fdaOptions)
  .then(fdaResult => {
    const foodName = fdaResult.body.list.item[0].name
    const ndbno = fdaResult.body.list.item[0].ndbno
    let report = utils.getUsdaReport(ndbno)
    return report.then(fdaResponse => {
      console.log('FDA RESPONSE', fdaResponse)
      const {
        error,
        sugarPerServing,
        carbsPerServing,
        fiberPerServing,
        sugarPerServingStr,
        carbsPerServingStr,
        fiberPerServingStr,
        ingredientsSugarsCaps
      } = fdaResponse
      if (sugarPerServing && ingredientsSugarsCaps) {
        let sugarData = {
          foodName,
          photo: [''],
          sugarPerServingStr,
          carbsPerServingStr,
          fiberPerServingStr,
          cleanText: foodName,
          ingredientsSugarsCaps,
          sugar: sugarPerServing,
          carbs: carbsPerServing,
          fiber: fiberPerServing,
          psugar: sugarPerServing,
          nsugar: 0,
          sugarArr: [{nsugar: 0, psugar: sugarPerServing}],
          carbsArr: [carbsPerServing],
          fiberArr: [fiberPerServing],
        }
        return fire.addSugarToFirebase(firebase, userId, date, fulldate, barcode, sugarData)
      }
      else if (error) {
        throw 'fda response was undefined'
      }
    })
  })
  .catch(error => {
    var options = {
      uri: 'https://api.nutritionix.com/v1_1/item?upc=' + barcode + '&appId=' + process.env.NUTRITIONIX_APP_ID + '&appKey=' + process.env.NUTRITIONIX_API_KEY,
      method: 'GET',
      json: true,
      resolveWithFullResponse: true,
    }
    console.log('calling nutritionix')
    const request = require('request-promise')
    return request(options)
    .then(result => {
      console.log('Result from nutritionix', result)
      console.log('Result body from nutritionix', result.body)
      const {body} = result
      console.log('BODY', body)
      const {
        nf_sugars,
        nf_total_carbohydrate,
        nf_dietary_fiber,
        nf_serving_size_qty,
        nf_serving_size_unit,
        nf_serving_weight_grams,
        brand_name
      } = body
      let foodSugar = nf_sugars ? Math.round(nf_sugars) : 0
      let foodFiber = nf_dietary_fiber ? Math.round(nf_dietary_fiber) : 0
      let foodCarbs = nf_total_carbohydrate ? Math.round(nf_total_carbohydrate) : 0
      let ingredientsSugarsCaps = sugarUtils.capitalizeSugars(body.nf_ingredient_statement)
      let tailStr = nf_serving_size_qty + ' ' + nf_serving_size_unit + ' (' + nf_serving_weight_grams + 'g) serving'
      let sugarPerServingStr = foodSugar + 'g sugars in ' + tailStr
      let fiberPerServingStr = foodFiber + 'g fibers in ' + tailStr
      let carbsPerServingStr = foodCarbs + 'g carbs in ' + tailStr
      console.log('sanity check\n\n\n\n')
      let sugarData = {
        sugar: foodSugar,
        carbs: foodCarbs,
        fiber: foodFiber,
        psugar: foodSugar,
        nsugar: 0,
        sugarArr: [{nsugar: 0, psugar: foodSugar}],
        carbsArr: [foodCarbs],
        fiberArr: [foodFiber],
        sugarPerServingStr,
        carbsPerServingStr,
        fiberPerServingStr,
        foodName: brand_name,
        cleanText: brand_name,
        ingredientsSugarsCaps,
        photo: [''],
      }
      return fire.addSugarToFirebase(firebase, userId, date, fulldate, barcode, sugarData)
    })
    .catch(ferror => {
      console.log('final fallback on firebase', ferror)
      var missRef = firebase.database().ref("/global/sugarinfoai/missing/" + barcode)
      return missRef.once("value")
      .then(function(snapshot) {
        if (snapshot.exists()) {
          let psugar = snapshot.child('psugar').val()
          let nsugar = snapshot.child('nsugar').val()
          let fiber = snapshot.child('fiber').val()
          let carbs = snapshot.child('carbs').val()
          let sugarData = {
            sugar,
            carbs,
            fiber,
            psugar: 'unknown',
            nsugar: 'unknown',
            sugarArr: [{nsugar, psugar}],
            carbsArr: [carbs],
            fiberArr: [fiber],
            sugarPerServingStr: '',
            carbsPerServingStr: '',
            fiberPerServingStr: '',
            foodName: '',
            cleanText: '',
            ingredientsSugarsCaps: '',
            photo: []
          }
          return fire.addSugarToFirebase(firebase, userId, date, fulldate, barcode, sugarData)
        }
        else {
          return [
            "Looks like you got me...I have no idea what you're eating",
            new fbTemplate.Button("Would you like to manually enter the sugar amount? We can store it for future use 🙂")
            .addButton('Yes  ✅', 'manual sugar track with upc')
            .addButton('No  ❌', 'other options')
            .get()
          ]
        }
      })
      .catch((error) => {
        console.log('Error: ', error)
      })
    })
  })
}

exports.processLabelImage = function(firebase, url, userId, date, timestamp) {
  let encoding = 'base64'
  var fbOptions = {
    encoding: encoding,
    uri: url,
    method: 'GET',
    gzip: true,
    json: false,
    resolveWithFullResponse: true,
    headers: {Authorization: "Bearer " + process.env.FACEBOOK_BEARER_TOKEN}
  }
  const request = require('request-promise')
  return request(fbOptions)
  .then(result => {
    var isJpg = url.indexOf(".jpg")
    const barcode = (isJpg > -1) ? 'data:image/jpg;base64,' + result.body : 'data:image/png;base64,' + result.body
    return utils.getBarcodeAsync({
      numOfWorkers: 0,  // Needs to be 0 when used within node
      inputStream: {
        size: 800  // restrict input-size to be 800px in width (long-side)
      },
      decoder: {
        readers: ["upc_reader"] // List of active readers
      },
      locate: true, // try to locate the barcode in the image
      src: barcode // or 'data:image/jpg;base64,' + data
    })
    .then(response => {
      return exports.fdaProcess(firebase, userId, response, date, timestamp)
    })
    .catch(() => {
      return "I couldn't read that barcode. Try taking another picture or manually enter the barcode"
    })
  })
  .catch(err => {
    console.log("Error: ", err)
    return [
      'Looks like you confused me...can you help me out?',
      uitls.otherOptions(false)
    ]
  })
}
