// Gasket function to handle old and new firebase organization for dailyTotal.
//
// Old:
//   dailyTotal
//     sugar <n>g
//
// New:
//   dailyTotal
//     nsugar: <n>g
//     psugar: <p>g
//
function getDailyProcessedSugar(dailyTotalObj) {
  return dailyTotalObj.hasOwnProperty('psugar') ?
    dailyTotalObj.psugar : dailyTotalObj.sugar;
}


function getReportHtml(date, snapshot) {
  
  // Create HTML for the reports we wish to see:
  // 1. (MVP) List of items for the day
  // 2. Pie-chart showing amount consumed vs. goal / remaining
  // 3. Progress on weight vs sugar Consumption
  //
  const title = 'Sugar Info - ' + date
  const hasData = snapshot.exists() &&
                  snapshot.child('sugarIntake').exists() &&
                  snapshot.child('sugarIntake/' + date).exists() &&
                  snapshot.child('sugarIntake/' + date + '/dailyTotal').exists()

  const progBarHeight = '40px'

  logIt('getReportHtml: hasData = ' + hasData)
  // Progress Bar Issues / TODOs:
  //  - when %age is low (i.e. < 5%, it may be hard to read the label amount)
  //  - when %age is over 100%, consider doing the multiple bars approach shown here:
  //      https://v4-alpha.getbootstrap.com/components/progress/
  //      - could show the 1st 100% as normal and then the next n% as danger colored
  //
  let sugarProgressBar = ''
  let sugarConsumptionReport = ''
  let percentSugarToday = 0

  if (!hasData) {
    sugarProgressBar += ' \
      <div class="progress-bar" role="progressbar" style="background: transparent; color: black; width: 100%; height: ' + progBarHeight + '; line-height: 40px;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"> \
        <h5 class="text-center" style="vertical-align: middle; display: inline-block;">0%</h5> \
      </div>'

    sugarConsumptionReport += '<p>You have not added any foods to your journal today.</p>'
  } else {
    const sugarConsumptionToday = snapshot.child('sugarIntake/' + date).val()
    const totalProcessedSugarToday =
      getDailyProcessedSugar(sugarConsumptionToday['dailyTotal']);
    let sugarGoal = snapshot.child('preferences').exists() &&
                      snapshot.child('preferences/currentGoalSugar').exists() ?
                      snapshot.child('preferences/currentGoalSugar').val() : undefined

    if (sugarGoal === undefined) {
      logIt('ERROR: UNDEFINED SUGAR GOAL - DEFAULTING TO Heart Assoc. 36')
      sugarGoal = 36
    }

    const progBarColor = (totalProcessedSugarToday <= sugarGoal) ?
      'progress-bar-success' : 'progress-bar-danger'

    const progress = Math.round(100.0 * totalProcessedSugarToday / sugarGoal)
    percentSugarToday = progress
    const progBarAriaNow = progress.toString()
    const progBarWidth = progBarAriaNow + '%'
    if (progress < 1) {
      sugarProgressBar += ' \
        <div class="progress-bar" role="progressbar" style="background: transparent; color: black; width: 100%; height: ' + progBarHeight + '; line-height: ' + progBarHeight + ';" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"> \
          <h5 class="text-center" style="vertical-align: middle; display: inline-block;">0%</h5> \
        </div>'
    } else if (progress > 100) {
      const overage = Math.round(progress) - 100
      const mainWidth = Math.round(95 * (100 / Math.round(progress)))
      const overWidth = 95 - mainWidth + 1

      sugarProgressBar += ' \
        <div class="progress-bar progress-bar-success" role="progressbar" style="width: ' + mainWidth + '%; height: ' + progBarHeight + '; line-height: ' + progBarHeight + ';" aria-valuenow="' + mainWidth + '" aria-valuemin="0" aria-valuemax="100"> \
          <h5 class="text-center" style="vertical-align: middle; display: inline-block;">100%</h5> \
        </div> \
        <div class="progress-bar progress-bar-danger" role="progressbar" style="width: ' + overWidth + '%; height: ' + progBarHeight + '; line-height: ' + progBarHeight + ';" aria-valuenow="' + overWidth + '" aria-valuemin="0" aria-valuemax="100"> \
          <h5  class="text-center" style="vertical-align: middle; display: inline-block;">+' + overage + '%</h5> \
        </div>'
    } else {
      sugarProgressBar += ' \
        <div class="progress-bar ' + progBarColor + '" role="progressbar" style="width: ' + progBarWidth + '; height: ' + progBarHeight + '; line-height: ' + progBarHeight + ';" aria-valuenow="' + progBarAriaNow + '" aria-valuemin="0" aria-valuemax="100"> \
          <h5 class="text-center" style="vertical-align: middle; display: inline-block;">' + progBarWidth + '</h5> \
        </div>'
    }


    sugarConsumptionReport += '<ul class="list-group">'

    for (let key in sugarConsumptionToday) {
      if (key === 'dailyTotal') {
        continue
      }

      const itemConsumed = sugarConsumptionToday[key]
      if (itemConsumed.hasOwnProperty('removed') && itemConsumed.removed) {
        continue
      }

      // Two use cases:
      // 1. Single item use case.
      //      - length of photo array and sugarArr will be 1
      //      - foodName will contain zero or one '\n'
      //      --> display on one line with image, g sugar, and time
      //
      // 2. Multi-item use case.
      //      - length of photo array > 1, sugarArr > 1
      //      - foodName will contain > 1 '\n'
      //      --> display aggregate on first line with total sugar, no picture, time
      //        --> indented display each sub-component
      //
      const userFoodName = (itemConsumed.hasOwnProperty('cleanText')) ?  itemConsumed.cleanText : ''
      const foodName = (itemConsumed.hasOwnProperty('foodName')) ?
        itemConsumed.foodName : ''
      const photoArr = itemConsumed.photo
      const sugarArr = itemConsumed.sugarArr
      const totalProcessedSugar = itemConsumed.psugar

      const singleItemUseCase = ((sugarArr === null) ||
                                 (sugarArr === undefined) ||
                                 (sugarArr.length === 1))
      
      const blankPath = './assets/blank.png'

      if (singleItemUseCase) {
        const measure = (totalProcessedSugar > 1) ? 'grams' : 'gram'
        const sugarLine = (totalProcessedSugar !== null && totalProcessedSugar !== undefined) ?
          '<small>(' + totalProcessedSugar + ' ' + measure + ' sugars)</small>' : ''

        const imgSrc = (photoArr) ? photoArr[0] : blankPath
        const imgHtml = '<img src="' + imgSrc + '" class="media-object" alt="Sample Image" width="64" height="64">'

        sugarConsumptionReport += ' \
          <li class="list-group-item justify-content-between"> \
            <div class="media"> \
              <div class="media-body"> \
                <h5 class="media-heading">' + userFoodName + '</h5> \
                ' + sugarLine + ' \
              </div> \
              <div class="media-right"> \
                ' + imgHtml + ' \
              </div> \
            </div> \
          </li>'
      } else {  // Multi-item use case:
        const measure = (totalProcessedSugar > 1) ? 'grams' : 'gram'
        const sugarLine = (totalProcessedSugar !== null && totalProcessedSugar !== undefined) ?
          '<small>(' + totalProcessedSugar + ' ' + measure + ' sugars)</small>' : ''
        // TODO: trim out the last '\n' in title food name, then replace
        //       remaining '\n' with ','
        let titleFoodName = foodName.replace(/\n$/g, '')
        titleFoodName = titleFoodName.replace(/\n/g, ', ')

        const foods = titleFoodName.split(', ')
        // Indented lines
        let indentedConsumptionReport = ''
        for (let index = 0; index < foods.length; index++) {
          const processedSugar = sugarArr[index].psugar;
          const measure = (processedSugar > 1) ? 'grams' : 'gram';
          const indentedSugarLine = (processedSugar) ?
            '<small>(' + processedSugar + ' ' + measure + ' sugars)</small>' : ''
          const imgSrc = (photoArr[index]) ? photoArr[index] : blankPath
          const indentedImgHtml = '<img src="' + imgSrc + '" class="media-object" alt="Sample Image" width="64" height="64">'

          indentedConsumptionReport += ' \
            <div class="media"> \
              <div class="media-left">&nbsp;&nbsp;&nbsp;</div> \
              <div class="media-body"> \
                <h6 class="media-heading">' + foods[index] + '</h6> \
                ' + indentedSugarLine + ' \
              </div> \
              <div class="media-right"> \
                ' + indentedImgHtml + ' \
              </div> \
            </div>'
        }

        const imgHtml = '<img src="' + blankPath + '" class="media-object" alt="Sample Image" width="64" height="64">'
        // Main line
        sugarConsumptionReport += ' \
          <li class="list-group-item justify-content-between"> \
            <div class="media"> \
              <div class="media-body"> \
                <h5 class="media-heading">' + userFoodName + '</h5> \
                ' + sugarLine + ' \
              </div> \
              <div class="media-right"> \
                ' + imgHtml + ' \
              </div> \
            </div> \
            ' + indentedConsumptionReport + ' \
          </li>'
      }

    }


    sugarConsumptionReport += ' \
      <li class="list-group-item justify-content-between"> \
      </li> \
  \
      <li class="list-group-item active justify-content-between"> \
        <div class="media"> \
          <div class="media-left"> \
            <h4 class="media-heading">Total</h4> \
          </div> \
          <div class="media-body text-right"> \
            ' + totalProcessedSugarToday + ' grams sugar \
          </div> \
        </div> \
      </li>'
    sugarConsumptionReport += '</ul>'
  }

  const sectionSpacer = '<div style="height: 10px;">&nbsp</div>'

  const reportHtml = ' \
        <div class="row"> \
          <div class="col-xs-6 text-left"> \
            <h3>Sugar Report</h3> \
          </div> \
          <div class="col-xs-6 text-right"> \
            <div id="shareBtn" class="btn btn-primary clearfix">Share</div> \
          </div> \
        </div> \
   \
        ' + sectionSpacer + ' \
        <h4 class="text-left">Sugar Today (' + percentSugarToday + '% of maximum)</h4> \
        <div class="progress" style="height: ' + progBarHeight + ';"> \
        ' + sugarProgressBar + ' \
        </div> \
   \
        ' + sectionSpacer + ' \
        <h4 class="text-left">Sugar Journal</h4> \
        <div> \
          <canvas id="sugarHistoryChart"/> \
        </div> \
   \
        ' + sectionSpacer + ' \
        <h4 class="text-left">Sugar History</h4> \
        ' + sugarConsumptionReport; 
  
  return reportHtml
}

function populateGraph(snapshot) {
  logIt('Creating sugarHistoryChart')
  let sugarHistoryChart = ''
  const hasChartData = snapshot.exists() &&
                       snapshot.child('sugarIntake').exists()

  if (hasChartData) {
    const sugarConsumptionHistory = snapshot.child('sugarIntake').val()

    let dataDaySugar = []
    for (let day in sugarConsumptionHistory) {
      const dateMs = Date.parse(day)
      const dailyTotal = sugarConsumptionHistory[day].dailyTotal
      if (!dailyTotal) {
        logIt('dailyTotal is missing for ' + day + ' for user ')
        continue
      }
      const sugarG = getDailyProcessedSugar(dailyTotal);
      dataDaySugar.push({dateMs: dateMs, sugarG: sugarG, dayString: day})
    }

    dataDaySugar.sort(function(a, b) {
      return a.dateMs - b.dateMs
    })

    var labels = []
    var plotData = []
    for (let index in dataDaySugar) {
      let dateSugarDay = dataDaySugar[index]
      labels.push("")
      plotData.push(dateSugarDay.sugarG)
    }

    var data = { 
      labels: labels, 
      datasets: [ 
        { 
          label: "Sugar (grams)", 
          fillColor: "rgba(151,187,205,0.2)", 
          strokeColor: "rgba(151,187,205,1)", 
          pointColor: "rgba(151,187,205,1)", 
          pointStrokeColor: "#fff", 
          pointHighlightFill: "#fff", 
          pointHighlightStroke: "rgba(151,187,205,1)", 
          data: plotData 
        } 
      ] 
    }; 

    var option = { 
     responsive: true, 
    }; 

    var ctx = document.getElementById("sugarHistoryChart").getContext("2d"); 
    var myLineChart = new Chart(ctx).Line(data, option); 
  }
}

function weirdFbAnonFunction(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0]; 
  if (d.getElementById(id)) {return;} 
  js = d.createElement(s); js.id = id; 
  js.src = "//connect.facebook.net/en_US/sdk.js"; 
  fjs.parentNode.insertBefore(js, fjs); 
}

function makeShareButtonWork() {
  logIt('Trying to get dom node for shareBtn:')
  logIt('  ' + document.getElementById("shareBtn"))
  document.getElementById("shareBtn").onclick = function() { 
    FB.ui({ 
      method: "share", 
      href: "https://www.inphood.com/reports/1322516797796635/267733510.html", 
    }, function(response){}); 
  } 
}

function initPageValuesFromDb(userRef) {
  logIt('initPageValuesFromDb');
  logIt('-------------------------------');

  const target = document.getElementById('myReport')
    let spinner = new Spinner().spin(target);
  logIt('spinner on');

  return userRef.once('value')
  .then(function(userSnapshot) {
    if (userSnapshot) {
      const userTimeZone = userSnapshot.child('/profile/timezone').val()
      const firstName = userSnapshot.child('/profile/first_name').val()
      const date = getUserDateString(Date.now(), userTimeZone)

      let myReportHtml = getReportHtml(date, userSnapshot)
      spinner.stop();
      logIt('spinner off');

      // Replace the empty html with our form that has proper
      // initial values from firebase.
      document.getElementById('titleDate').innerHTML = date
      target.innerHTML = myReportHtml
      
      populateGraph(userSnapshot)
      weirdFbAnonFunction(document, "script", "facebook-jssdk") 
      makeShareButtonWork()
    } else {
      spinner.stop();
      logIt('spinner off');

      logIt('Error: userSnapshot is null or undefined');
    }
  })
}
