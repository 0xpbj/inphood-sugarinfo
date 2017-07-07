exports.writeReportToS3 = function(date, userId, snapshot) {
  const S3 = require('aws-sdk').S3
  const s3 = new S3({
    accessKeyId:     'AKIAJQGBMJOHENSKGD4A',
    secretAccessKey: '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',
    region: 'us-west-2',
  })

  // Messenger Extensions script (required in html loaded in webview)
  //
  const msgrExtensionsScript = ' \
    <script> \
      (function(d, s, id) { \
        var js, fjs = d.getElementsByTagName(s)[0]; \
        if (d.getElementById(id)) { \
          return; \
        } \
        js = d.createElement(s); \
        js.id = id; \
        js.src = "//connect.facebook.com/en_US/messenger.Extensions.js"; \
        fjs.parentNode.insertBefore(js, fjs); \
      } (document, \'script\', \'Messenger\')); \
    </script>'
  
  const shareScript = ' \
    <script> \
      window.fbAsyncInit = function() { \
        FB.init({ \
          appId            : "669941103143805", \
          autoLogAppEvents : true, \
          xfbml            : true, \
          version          : "v2.9" \
        }); \
        FB.AppEvents.logPageView(); \
      }; \
      (function(d, s, id){ \
         var js, fjs = d.getElementsByTagName(s)[0]; \
         if (d.getElementById(id)) {return;} \
         js = d.createElement(s); js.id = id; \
         js.src = "//connect.facebook.net/en_US/sdk.js"; \
         fjs.parentNode.insertBefore(js, fjs); \
       }(document, "script", "facebook-jssdk")); \
      document.getElementById("shareBtn").onclick = function() { \
        FB.ui({ \
          method: "share", \
          href: "https://www.inphood.com/reports/1322516797796635/267733510.html", \
        }, function(response){}); \
      } \
    </script>'

  // Create HTML for the reports we wish to see:
  // 1. (MVP) List of items for the day
  // 2. Pie-chart showing amount consumed vs. goal / remaining
  // 3. Progress on weight vs sugar Consumption
  //
  const title = 'Sugar Info - ' + date
  const hasData = snapshot.exists() &&
                  snapshot.child('sugarIntake').exists() &&
                  snapshot.child('sugarIntake/' + date).exists()

  const progBarHeight = '40px'

  console.log('writeReportToS3: hasData = ' + hasData)
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
    const totalSugarToday = sugarConsumptionToday['dailyTotal'].sugar
    let sugarGoal = snapshot.child('preferences').exists() &&
                      snapshot.child('preferences/currentGoalSugar').exists() ?
                      snapshot.child('preferences/currentGoalSugar').val() : undefined

    if (sugarGoal === undefined) {
      console.log('ERROR: UNDEFINED SUGAR GOAL - DEFAULTING TO PBJ 40')
      sugarGoal = 40
    }

    const progBarColor = (totalSugarToday <= sugarGoal) ?
      'progress-bar-success' : 'progress-bar-danger'

    const progress = Math.round(100.0 * totalSugarToday / sugarGoal)
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
      const foodName = (sugarConsumptionToday[key].hasOwnProperty('foodName')) ?
        sugarConsumptionToday[key].foodName : ''
      const photoArr = sugarConsumptionToday[key].photo
      const sugarArr = sugarConsumptionToday[key].sugarArr
      const totalSugar = sugarConsumptionToday[key].sugar

      const singleItemUseCase = ((sugarArr === null) ||
                                 (sugarArr === undefined) ||
                                 (sugarArr.length === 1))

      if (singleItemUseCase) {
        const measure = (totalSugar > 1) ? 'grams' : 'gram'
        const sugarLine = (totalSugar !== null && totalSugar !== undefined) ?
          '<small>(' + totalSugar + ' ' + measure + ' sugars)</small>' : ''

        const imgSrc = (photoArr) ? photoArr[0] : '../assets/blank.png'
        const imgHtml = '<img src="' + imgSrc + '" class="media-object" alt="Sample Image" width="64" height="64">'

        sugarConsumptionReport += ' \
          <li class="list-group-item justify-content-between"> \
            <div class="media"> \
              <div class="media-body"> \
                <h5 class="media-heading">' + foodName.replace('\n', '') + '</h5> \
                ' + sugarLine + ' \
              </div> \
              <div class="media-right"> \
                ' + imgHtml + ' \
              </div> \
            </div> \
          </li>'
      } else {  // Multi-item use case:
        const measure = (totalSugar > 1) ? 'grams' : 'gram'
        const sugarLine = (totalSugar !== null && totalSugar !== undefined) ?
          '<small>(' + totalSugar + ' ' + measure + ' sugars)</small>' : ''
        // TODO: trim out the last '\n' in title food name, then replace
        //       remaining '\n' with ','
        let titleFoodName = foodName.replace(/\n$/g, '')
        titleFoodName = titleFoodName.replace(/\n/g, ', ')

        const foods = titleFoodName.split(', ')
        // Indented lines
        let indentedConsumptionReport = ''
        for (let index = 0; index < foods.length; index++) {
          const measure = (sugarArr[index] > 1) ? 'grams' : 'gram'
          const indentedSugarLine = (sugarArr[index]) ?
            '<small>(' + sugarArr[index] + ' ' + measure + ' sugars)</small>' : ''
          const imgSrc = (photoArr[index]) ? photoArr[index] : '../assets/blank.png'
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

        const imgHtml = '<img src="../assets/blank.png" class="media-object" alt="Sample Image" width="64" height="64">'
        // Main line
        sugarConsumptionReport += ' \
          <li class="list-group-item justify-content-between"> \
            <div class="media"> \
              <div class="media-body"> \
                <h5 class="media-heading">' + titleFoodName + '</h5> \
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
            ' + totalSugarToday + ' grams sugar \
          </div> \
        </div> \
      </li>'
    sugarConsumptionReport += '</ul>'
  }


  let sugarHistoryChart = ''
  const hasChartData = snapshot.exists() &&
                       snapshot.child('sugarIntake').exists()

  if (hasChartData) {
    const sugarConsumptionHistory = snapshot.child('sugarIntake').val()

    // sugarHistoryChart += '<ul>'
    let dataDaySugar = []
    for (let day in sugarConsumptionHistory) {
      const dateMs = Date.parse(day)
      const sugarG = sugarConsumptionHistory[day].dailyTotal.sugar
      dataDaySugar.push({dateMs: dateMs, sugarG: sugarG, dayString: day})
    }

    dataDaySugar.sort(function(a, b) {
      return a.dateMs - b.dateMs
    })

    labels = '['
    data = '['
    for (let index in dataDaySugar) {
      let dateSugarDay = dataDaySugar[index]
      // sugarHistoryChart += '<li>' + dateSugarDay.dateMs + ', ' + dateSugarDay.sugarG + '</li>'
      if (index != dataDaySugar.length - 1) {
        labels += '"", '
        data += dateSugarDay.sugarG + ', '
      } else {
        labels += '""]'
        data += dateSugarDay.sugarG + ']'
      }
    }

    // sugarHistoryChart += '<ul>'

    sugarHistoryChart += ' \
    <div> \
      <canvas id="sugarHistoryChart"/> \
      <script> \
        $(function () { \
          var data = { \
            labels: ' + labels + ', \
            datasets: [ \
              { \
                label: "Sugar (grams)", \
                fillColor: "rgba(151,187,205,0.2)", \
                strokeColor: "rgba(151,187,205,1)", \
                pointColor: "rgba(151,187,205,1)", \
                pointStrokeColor: "#fff", \
                pointHighlightFill: "#fff", \
                pointHighlightStroke: "rgba(151,187,205,1)", \
                data: ' + data + ' \
              } \
            ] \
          }; \
   \
          var option = { \
           responsive: true, \
          }; \
   \
          var ctx = document.getElementById("sugarHistoryChart").getContext("2d"); \
          var myLineChart = new Chart(ctx).Line(data, option); \
        }); \
    </script> \
   \
    </div> '
  }



  const sectionSpacer = '<div style="height: 10px;">&nbsp</div>'

  const reportHtml = ' \
  <!DOCTYPE html> \
  <html lang="en"> \
    <head> \
      <meta charset="utf-8"> \
      <meta http-equiv="X-UA-Compatible" content="IE=edge"> \
      <meta name="viewport" content="width=device-width, initial-scale=1"> \
      <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags --> \
   \
      <title>' + date + '</title> \
   \
      <!-- Bootstrap --> \
      <link href="../../lib/bootstrap/css/bootstrap.min.css" rel="stylesheet"> \
      <!-- jQuery (necessary for Bootstrap\'s JavaScript plugins) --> \
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script> \
      <!-- Include all compiled plugins (below), or include individual files as needed --> \
      <script src="../../lib/bootstrap/js/bootstrap.min.js"></script> \
      <!-- MDB core JavaScript --> \
      <script type="text/javascript" src="../../lib/mdbootstrap/js/mdb.min.js"></script> \
   \
      <!-- Font Awesome --> \
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.0/css/font-awesome.min.css"> \
   \
      <!-- Material Design Bootstrap --> \
      <link href="../../lib/mdbootstrap/css/mdb.min.css" rel="stylesheet"> \
   \
      <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries --> \
      <!-- WARNING: Respond.js doesn\'t work if you view the page via file:// --> \
      <!--[if lt IE 9]> \
        <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script> \
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script> \
      <![endif]--> \
    </head> \
    <body>' + msgrExtensionsScript + ' \
      <div style="padding-right: 10px; padding-left: 10px;"> \
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
        ' + sugarHistoryChart + ' \
   \
        ' + sectionSpacer + ' \
        <h4 class="text-left">Sugar History</h4> \
        ' + sugarConsumptionReport + ' \
   \
      </div> \
    </body>' + shareScript + ' \
  </html> '

  const now = new Date(Date.now())
  const datum = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0, 0)
  const offset = Date.now() - datum.getTime()

  const params = {
    Bucket: 'www.inphood.com',
    Key: 'reports/' + userId + '/' + offset + '.html',
    // Key: 'reports/' + userId + '.html',
    Body: reportHtml,
    ContentType: 'text/html',
    ACL: 'public-read'
  }

  const s3promise = s3.upload(params).promise()
  return s3promise
  .then(info => {
    const dataUrl = 'https://' + params.Bucket + '/' + params.Key
    // const dataUrl = 'https://' + params.Bucket + '/' + 'reports/test/reportBootstrapImg.html'
    return dataUrl
  })
  .catch(error => console.log(error));
}
