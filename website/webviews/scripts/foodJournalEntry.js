// User's timezone:
var tz;

// Styling for spinners/number input and switch
//$('.form-control').bootstrapNumber({
//  center:false
//});

function deleteClicked(what) {
  logIt('deleteClicked: ' + what);
}

function delBtnHtml(targetId) {
  let html = ' \
    <button type="button" \
            class="btn btn-link pull-right" \
            style="color:red" \
            onclick="deleteClicked(\'' + targetId + '\')">(remove)</button>';

  return html
}

function delBtn(targetId) {
  document.write(delBtnHtml(targetId))
}

function singleItemHtml(foodName, sugarTotal, photo) {
  let deleteBtn = delBtnHtml('all');

  console.log(deleteBtn);

  let html = ' \
    <div class="row"> \
      <div class="col-xs-9" style="padding-left: 5px"> \
        <h4> \
          ' + foodName + ' \
        </h4> \
      </div> \
      <div class="col-xs-3"> \
        ' + deleteBtn + ' \
      </div> \
    </div> \
    <div class="row"> \
      <div class="col-xs-12" style="height:10px; border-top: 1px solid black"></div> \
    </div> \
    <div class="row"> \
      <div class="col-xs-3" style="padding-left: 5px; padding-right: 5px" > \
        <input class="form-control text-right" type="number" value="' + sugarTotal + '" min="0" max="100"/> \
      </div> \
      <div class="col-xs-6" style="padding-left:5px"> \
        <label class="control-label">grams of sugars</label> \
      </div> \
      <div class="col-xs-3"> \
        <img src="' + photo + '" class="pull-right" alt="food image" width="64" height="64"> \
      </div> \
    </div>';

    return html;
}


var sugarIntakeRef;
var sugarIntakeDict;
var lastKey;

function processValuesFromDb() {
  logIt('processValuesFromDb');

  if (sugarIntakeDict && lastKey) {
    logIt('  non null sugarIntakeDict and lastKey');

    const lastItem = sugarIntakeDict[lastKey];
    const foodName = lastItem.foodName;
    const sugarTotal = lastItem.sugar;
    const photo = lastItem.photo[0];
    
    console.log('foodName: ' + foodName);
    console.log('sugarTotal: ' + sugarTotal);
    console.log('photo: ' + photo);
    const html= singleItemHtml(foodName, sugarTotal, photo);
    document.getElementById("elaborateMe").innerHTML=html;
  }
}

function initPageValuesFromDb(userRef) {
  logIt('initPageValuesFromDb');
  logIt('-------------------------------');

  let target = document.getElementById('foodEditor');
  logIt(target);
  spinner = new Spinner().spin(target);
  logIt('spinner on');


  // Thoughts:
  //  - asking PBJ to set a 'last_key' in sugarIntake would save a lot of time
  //  - it might be troublesome on delete ops though
  //
  // Psuedocode:
  //  - get user's tz
  //  - convert to today's date in their tz
  //  - use that to get the path to their current sugarIntake
  //  - find the most recent item in their sugarIntake
  //  - access it to populate the values in the template

  // 1. Get user's TZ and convert to today's date:
  //
  let profileTzRef = userRef.child('profile/timezone');
  profileTzRef.once('value', function(profileSnapshot) {
    tz = profileSnapshot.val();

    let userDateStr = getUserDateString(Date.now(), tz);
    logIt(userDateStr);

    // 2. Get current sugarIntake dict for user from date:
    //
    sugarIntakeRef = userRef.child('sugarIntake/' + userDateStr);
    sugarIntakeRef.once('value', function(intakeSnapshot) {
      sugarIntakeDict = intakeSnapshot.val();
      if (sugarIntakeDict) {

        // 3. Get the most recent item logged by the user today:
        //
        //  Note:  sugarIntakeDict is a dict of uniqueified time based keys followed by
        //         one user defined key: 'dailyTotal'. We should be able to iterate
        //         through this dictionary and choose the 2nd last element to
        //         consistently find the last item a user ate. The last element will be
        //         'dailyTotal'.
        //
        const keyArr = Object.keys(sugarIntakeDict)
        const dictLength = keyArr.length
        if (dictLength < 2) {
          console.log('Unexpected error. Found underpopulated intake dictionary.');
          return;
        }

        lastKey = keyArr[dictLength - 2]
        if (lastKey === 'dailyTotal') {
          console.log('Unexpected error. Retrieved daily total from intake dictionary as last intake key.');
        }

        logIt('lastKey not dailyTotal = ' + lastKey);
//        const lastItem = sugarIntakeDict[lastKey];
//        const foodName = lastItem.foodName;
//        const photoArr = lastItem.photo;
//        const sugarTotal = lastItem.sugar;
//        const sugarArr = lastItem.sugarArr;
//
//        logIt('last food = ' + foodName);
        processValuesFromDb();
        spinner.stop();
        logIt('spinner off');
      } else {
        // TODO: page error
        logIt('sugarIntakeDict is null');
        return;
      }
    });
  });

//  let preferencesRef = userRef.child('preferences');
//
//  preferencesRef.once('value', function(snapshot) {
//    let preferences = snapshot.val();
//    document.getElementById('currentGoalSugar').setAttribute("value", preferences.currentGoalSugar);
//    document.getElementById('currentGoalWeight').setAttribute("value", preferences.currentGoalWeight);
//    document.getElementById('currentWeight').setAttribute("value", preferences.currentWeight);
//
//    if (preferences.nightlySummary === true) {
//      let checkBoxObj = document.getElementById('nightlySummary');
//      checkBoxObj.setAttribute("checked", "checked");
//
//      let evt = new Event('change');
//      checkBoxObj.dispatchEvent(evt);
//    }
//  });
//
//  let profileTzRef = firebase.database().ref('global/sugarinfoai/' + psid + '/profile/timezone');
//  profileTzRef.once('value', function(snapshot) {
//    tz = snapshot.val();
//  });
}
