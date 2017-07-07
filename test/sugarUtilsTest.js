var http = require('http');

http.createServer(function (request, response) {
  const sugarUtils = require('../sugarUtils.js')

  // Basic test of getSugarII
  const isSugarTests = {
    "sugar cane" : {
      expected : "cane sugar"
    },
    "cane sugar" : {
      expected : "cane sugar"
    },
    "sugar cane syrup" : {
      expected : "cane sugar syrup"
    },
    "sugar syrup cane" : {
      expected : "cane sugar syrup"
    },
    "sagar syrop cone" : {
      expected : "cane sugar syrup"
    },
    "sugar muskovodo" : {
      expected : "muscovado sugar"
    },
    "d-ribose" : {
      expected : "d-ribose"
    },
    "glucose-fuctose" : {
      expected : "glucose-fructose"
    },
    "fructose glucose" : {
      expected : "glucose-fructose"
    },
    "molasses    blakstrap" : {
      expected : "blackstrap molasses"
    },
    "moltodekstrin" : {
      expected : "maltodextrin"
    },
    "organic maltodextrin" : {
      expected : "maltodextrin"
    },
    "organic dried maltodextrin" : {
      expected : "maltodextrin"
    },
    "dried organic d-ribose" : {
      expected : "d-ribose"
    },
    "organic dried cane syrup" : {
      expected : "cane syrup"
    },
    "organic cane syrup" : {
      expected : "cane syrup"
    }
  }
  console.log('Testing getSugarII:')
  console.log('---------------------------------------------------------------')
  for (let testSugar in isSugarTests) {
    console.log('testSugar: ', testSugar)
    const result = sugarUtils.getSugarII(testSugar)
    const expected = isSugarTests[testSugar].expected


    if (result !== expected) {
      console.log('  FAIL: did not find ', expected, ' for ', testSugar)
    } else {
      console.log('  PASS: found ', expected, ' for ', testSugar)
    }
  }
  console.log('beer test:')
  console.log('---------------------------------------------------------------')
  console.log('getSugarII(\'beer\') = ', sugarUtils.getSugarII('beer'))


  return
}).listen(8080)

console.log('Server started')
console.log('Navigate to http://127.0.0.1:8080/ and refresh to trigger this code.')
