//
// Globals:
//
////////////////////////////////////////////////////////////////////////////////

var spinner;

//
// Action handlers:
//
// Notes: action handlers recieve an id which can be one of:
//        'all' or '0' --> 'n' (n EI > 0)
////////////////////////////////////////////////////////////////////////////////

//
// Small HTML templates:
//
////////////////////////////////////////////////////////////////////////////////

//
// Large HTML templates:
//
////////////////////////////////////////////////////////////////////////////////

function getFavoritesHtml(myFoods) {
  
  let html = ''

  const keyArr = Object.keys(myFoods)
  const lastKey = keyArr[keyArr.length-1]

  // Create a sorted 

  html += ' \
    <div class="row" style="padding-bottom:5px; margin-bottom:10px; border-bottom: 2px solid black"> \
        <div class="col-xs-7 text-left" style="font-size:16px"> \
          <b>Food</b> \
        </div> \
        <div class="col-xs-2 text-left" style="font-size:16px"> \
          <b>Sugars</b> \
        </div> \
        <div class="col-xs-3 text-right"> \
        </div> \
    </div>'

  for (let key in myFoods) {
    const food = myFoods[key]
    const rowStyle = (key !== lastKey) ?
      "padding-bottom:5px; margin-bottom:10px; border-bottom: 1px solid black" : ""

    html += ' \
      <div class="row" style="' + rowStyle + '"> \
        <div class="col-xs-7 text-left" style="font-size:16px"> \
          ' + food.cleanText + ' \
        </div> \
        <div class="col-xs-2 text-center" style="font-size:16px"> \
          ' + food.psugar + 'g \
        </div> \
        <div class="col-xs-3 text-right"> \
          <button type="button" class="btn btn-success">Choose</button> \
        </div> \
      </div>'
  }


  return html;
}

//
// Initialization code:
//
////////////////////////////////////////////////////////////////////////////////

function initPageValuesFromDb(userRef) {
  logIt('initPageValuesFromDb');
  logIt('-------------------------------');
  
  const target = document.getElementById('myFavorites');

  spinner = new Spinner().spin(target);
  logIt('spinner on');
 
  // Get the user's favorite foods and initialize the favorites webview with them:
  //
  let myFoodsRef = userRef.child('myfoods');
  myFoodsRef.once('value', function(snapshot) {
    let myFoods = snapshot.val();

    const favoritesHtml= getFavoritesHtml(myFoods)

    spinner.stop();
    logIt('spinner off');

    // Replace the empty html with our form that has proper
    // initial values from firebase.
    document.getElementById('myFavorites').innerHTML=favoritesHtml
  });
}
