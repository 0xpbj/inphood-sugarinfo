var http = require('http');
const utils = require('../sugarBot/modules/utils.js')

http.createServer(function (request, response) {

  const rp = require('../sugarBot/node_modules/request-promise')
  const ocrUtils = require('../sugarBot/modules/ocrUtils.js')

  const testImages = ['./images/jam.jpg']

  for (let testImageFile of testImages) {
    console.log('Queuing ', testImageFile, ':')
    let jpegFromDisk = ocrUtils.base64_encode(testImageFile)
    const isJpg = (testImageFile.indexOf(".jpg") > -1)
    const barcodeData = (isJpg) ?
      'data:image/jpg;base64,' + jpegFromDisk :
      'data:image/png;base64,' + jpegFromDisk

    return utils.getBarcodeAsync({
      numOfWorkers: 0,  // Needs to be 0 when used within node
      inputStream: {
        size: 800  // restrict input-size to be 800px in width (long-side)
      },
      decoder: {
        readers: ["upc_reader"] // List of active readers
      },
      locate: true, // try to locate the barcode in the image
      src: barcodeData // or 'data:image/jpg;base64,' + data
    })
    .then(response => {
      // console.log('Code in then block', response)

      const usdaUpcSearchRequest = {
        uri: 'https://api.nal.usda.gov/ndb/search/',
        method: 'GET',
        qs: {
          format: 'json',
          q: response,
          sort: 'n',
          max: 2,
          offset: 0,
          api_key: 'hhgb2UmFJsDxzsslo5ZlNHyR6vIZIbEXO83lMTRt'
        },
        json: true,
        resolveWithFullResponse: true
      }

      console.log('Launching USDA request:')
      const frequest = require('../sugarBot/node_modules/request-promise')

      return frequest(usdaUpcSearchRequest)
      .then(usdaUpcSearchResult => {
        console.log('USDA UPC Search request successful:')
        console.log('---------------------------------------------------------')
        // 1. Check to see if we got any results from fda (i.e. is
        //    usdaUpcSearchResult.body.list empty?)
        if (usdaUpcSearchResult.body.list.item.length <= 0) {
          return 'Item not found in USDA DB'
        }

        // 2. Assume that the first result is the correct one (it's UPC so there
        //    should only be one anyway)
        const itemName = usdaUpcSearchResult.body.list.item[0].name
        const itemNdbno = usdaUpcSearchResult.body.list.item[0].ndbno
        console.log(itemNdbno)
        const itemDbSrc = usdaUpcSearchResult.body.list.item[0].ds

        // 3. Fetch the ingredients for the item.
        //    a. call the USDA database a second time with the ndbno number
        //    b. process that response for a list of ingredients, sugars, errors
        return utils.getUsdaReport(itemNdbno)
      })
      .catch(error => {
        console.log('USDA UPC Search request failed', error)
        return 'Item not found in USDA DB'
      })
    })
    .catch(() => {
    return 'NULL BARCODE'
    })
  }
  return
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this bot.')
