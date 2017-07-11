//
// Globals:
//
////////////////////////////////////////////////////////////////////////////////

var tz;
var sugarIntakeRef;
var sugarIntakeDict;
var lastKey;

//
// Misc.::
//
////////////////////////////////////////////////////////////////////////////////

// Styling for spinners/number input and switch
//$('.form-control').bootstrapNumber({
//  center:false
//});

// TODO: probably better to move this elsewhere and dynamically update when
// needed (otherwise, each keypress results in all this being run.)
//
function updateTotalSugar(snapshot) {
  let newSugarIntakeDict = snapshot.val();
  let sugarTotal = 0;
  
  const keyArr = Object.keys(newSugarIntakeDict);
  for (let key of keyArr) {
//    logIt('     key: ' + key);
//    logIt('     rmv: ' + newSugarIntakeDict[key].removed);
    if (key === 'dailyTotal' ||
        newSugarIntakeDict[key].removed) {
      continue;
    }

    sugarTotal += newSugarIntakeDict[key].sugar;
//    logIt('    ' + sugarTotal);
  }

//  logIt('new total = ' + sugarTotal);
  let totalRef = sugarIntakeRef.child('dailyTotal');
  totalRef.set({sugar: sugarTotal});
}

//
// Action handlers:
//
// Notes: action handlers recieve an id which can be one of:
//        'all' or '0' --> 'n' (n EI > 0)
////////////////////////////////////////////////////////////////////////////////

function handleDeleteClick() {
  if (!sugarIntakeRef && !lastKey) {
    console.log('Error accessingfirebase for sugarIntake deletion.');
    return;
  }

  // 1. Update firebase with:
  //    - a flag saying the item was deleted in Firebase
  let foodRef = sugarIntakeRef.child(lastKey);
  let foodRemovedFlagRef = foodRef.child('removed');
  foodRemovedFlagRef.set(true);

  // 2. Calculate the new total sugar for the day.
  // 3. Update firebase with:
  //    - the new daily sugar value
  sugarIntakeRef.once('value', function(snapshot) {
    updateTotalSugar(snapshot);
  });
}

// TODO: refactor
function handleOnInput(id) {
  if (!sugarIntakeRef && !lastKey) {
    console.log('Error accessingfirebase for sugarIntake deletion.');
    return;
  }

  let inputField = document.getElementById(id);

//  logIt('id: ' + id);
//  logIt('inputField.value: ' + inputField.value);

  let newValue = inputField.value;
  if (inputField.value) {
    if (id === 'all') {
      // 1. Update firebase with:
      //    - the new value the user entered
      let foodRef = sugarIntakeRef.child(lastKey);
      let foodRemovedFlagRef = foodRef.child('sugar');
      foodRemovedFlagRef.set(parseInt(newValue));

      // 2. Calculate the new total sugar for the day.
      // 3. Update firebase with:
      //    - the new daily sugar total
      sugarIntakeRef.once('value', function(snapshot) {
        updateTotalSugar(snapshot);
      });
    } else {
      // TODO: check id EI (i.e. integer)
      // 1. Update firebase with:
      //    - the new value the user entered
      let foodRef = sugarIntakeRef.child(lastKey);
      let sugarArrayRef = foodRef.child('sugarArr');
      let sugarChangedRef = sugarArrayRef.child(id);
      sugarChangedRef.set(parseInt(newValue));

      // 2. Calculate a new total sugar for the journaled item
      //    and a new daily sugar total and update firebase
      sugarIntakeRef.once('value', function(snapshot) {
        let sugarIntake = snapshot.val()

        let foodData = sugarIntake[lastKey]
        let foodSugarTotal = 0;
        for (let sugar of foodData.sugarArr) {
          foodSugarTotal += parseInt(sugar);
//          logIt('foodSugarTotal is ' + foodSugarTotal);
        }

//        logIt('Calculating total sugar:');
        let sugarTotal = 0;
        const keyArr = Object.keys(sugarIntake);
        for (let key of keyArr) {
//          logIt('     key: ' + key);
//          logIt('     rmv: ' + sugarIntake[key].removed);
//          logIt('herereree');
          if (key === 'dailyTotal' ||
              sugarIntake[key].removed) {
            continue;
          }

          if (key === lastKey) {
//            logIt('Calculating from AC:');
            sugarTotal += foodSugarTotal;;
          } else {
//            logIt('Calculating from Firebase:');
            sugarTotal += sugarIntake[key].sugar;
          }
        }

//        logIt('new food total = ' + foodSugarTotal);
        let subTotalRef = foodRef.child('sugar');
        subTotalRef.set(foodSugarTotal);

//        logIt('new total = ' + sugarTotal);
        let totalRef = sugarIntakeRef.child('dailyTotal');
        totalRef.set({sugar: sugarTotal});

        // 3.Update the current page:
        //
        let sugarTotalField = document.getElementById('sugarTotal');
        sugarTotalField.innerHTML = sugarTotal
      });
    }
  }
}

//
// Small HTML templates:
//
////////////////////////////////////////////////////////////////////////////////

function delBtnHtml() {
  let html = ' \
    <button type="button" \
            class="btn btn-link pull-right" \
            style="color:red" \
            onclick="handleDeleteClick()">(remove)</button>';

  return html
}

function undoBtnHtml() {
  let html = ' \
    <button type="button" \
            class="btn btn-link pull-right" \
            style="color:red" \
            onclick="handleUndoClick()">(remove)</button>';

  return html
}

function imgHtml(imgPath) {
  if (imgPath.includes('nix-apple-grey.png') || imgPath === '') {
    return '';
  }

  let html = ' \
    <div class="col-xs-3"> \
      <img src="' + imgPath + '" class="pull-right" alt="food image" width="64" height="64"> \
    </div>';
  
  return html;
}

//
// Large HTML templates:
//
////////////////////////////////////////////////////////////////////////////////

function singleItemHtml(foodName, sugarTotal, photo) {
  logIt('singleItemHtml');
  let id = 'all';
  let deleteBtn = delBtnHtml(id);
  let img = imgHtml(photo);

  let clnFoodName = foodName.replace('\n', '')

  let html = ' \
    <div class="row"> \
      <div class="col-xs-9" style="padding-left: 5px"> \
        <h4> \
          ' + clnFoodName + ' \
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
        <input class="form-control text-right" \
               id= "' + id + '" \
               type="number" \
               value="' + sugarTotal + '" \
               oninput="handleOnInput(\'' + id + '\')" \
               min="0" max="100"/> \
      </div> \
      <div class="col-xs-6" style="padding-left:5px"> \
        <label class="control-label">grams of sugars</label> \
      </div> \
      ' + img + ' \
    </div>';

    return html;
}

function multiItemSubIngredient(ingredient, index) {
  let img = imgHtml(ingredient.imageSrc);

  html = ' \
    <!-- spacer --> \
    <div style="height:10px"></div> \
    \
    <!-- sub item ' + index + ' --> \
    <div class="row"> \
      <!-- empty column for indent: --> \
      <div class="col-xs-1"></div> \
      <div class="col-xs-8" style="padding-left: 0px"> \
        <h4> \
          ' + ingredient.foodName + ' \
        </h4> \
      </div> \
      <div class="col-xs-3" style="padding-left: 0px"> \
      <!--delete button placeholder--> \
      </div> \
    </div> \
    <!-- light gray delimitting line row --> \
    <div class="row"> \
      <!-- empty column for indent: --> \
      <div class="col-xs-1"></div> \
      <div class="col-xs-11" style="height:10px; border-top: 1px solid lightgray"></div> \
    </div> \
    <div class="row"> \
      <div class="col-xs-1"></div> \
      <div class="col-xs-3" style="padding-left: 0px; padding-right: 5px" > \
        <input class="form-control text-right" \
               id= "' + index + '" \
               type="number" \
               value="' + ingredient.sugarTotal + '" \
               oninput="handleOnInput(\'' + index + '\')" \
               min="0" max="100"/> \
      </div> \
      <div class="col-xs-5" style="padding-left:5px"> \
        <label class="control-label">sugars (g)</label> \
      </div> \
      ' + img + ' \
    </div>';

  return html;
}

function deletedItem() {
  let undoBtnAll = undoBtnHtml();
  let html = ' \
    <div class="row"> \
      <div class="col-xs-9" style="padding-left: 5px"> \
        <h4> DELETED ENTRY </h4> \
      </div> \
      <div class="col-xs-3"> \
        ' + undoBtnAll + ' \
      </div> \
    </div> \
    <!-- spacer --> \
    <div style="height:5px"></div>';
}

function multiItemHtml(foodName, sugarTotal, subIngredients = [], sugarPerServingStr) {
  let deleteBtnAll = delBtnHtml();

  let html = ' \
    <div class="row"> \
      <div class="col-xs-9" style="padding-left: 5px"> \
        <h4> \
          ' + foodName + ' \
        </h4> \
      </div> \
      <div class="col-xs-3"> \
        ' + deleteBtnAll + ' \
      </div> \
    </div> \
    <div class="row"> \
      <div class="col-xs-12" style="height:10px; border-top: 1px solid black"></div> \
    </div> \
    <div class="row"> \
      <div class="col-xs-9" style="padding-left: 5px"> \
        ' + sugarPerServingStr  + ' \
      </div> \
    </div> \
    <!-- spacer --> \
    <div style="height:5px"></div>';

  let subItemCount = 0;
  for (let ingredient of subIngredients) {
    html += multiItemSubIngredient(ingredient, subItemCount);
    subItemCount++;
  }

  return html;
}

//
// Initialization code:
//
////////////////////////////////////////////////////////////////////////////////

function processValuesFromDb() {
  logIt('processValuesFromDb');

  if (sugarIntakeDict && lastKey) {
    logIt('  non null sugarIntakeDict and lastKey');

    const lastItem = sugarIntakeDict[lastKey];

    const {
      foodName,
      removed,
      psugar,
      sugarPerServingStr,
      photo,
      sugarArr
    } = lastItem;
    const sugarTotal = Math.round(psugar);
    const sugarPerServingStr = sugarPerServingStr;
    const iphoto = (photo) ? photo[0] : '';

    const singleItemUseCase = ((sugarArr === null) ||
                              (sugarArr === undefined) ||
                              (sugarArr.length === 1));
    
    let html = '';
    if (singleItemUseCase) {
      html = singleItemHtml(foodName, sugarTotal, iphoto, sugarPerServingStr);
    }
    else if (removed !== null && removed === true) {
      html = deletedItem()
    }
    else {
      let titleFoodName = foodName.replace(/\n$/g, '');
      titleFoodName = titleFoodName.replace(/\n/g, ', ');
      logIt('titleFoodName: ' + titleFoodName);
      let photoArr = photo;
      let subIngredients = [];
      const foods = titleFoodName.split(', ');
      logIt('foods.length = ' + foods.length);

      for (let index = 0; index < foods.length; index++) {
        let ingredient = {
          foodName : foods[index],
          sugarTotal : sugarArr[index],
          imageSrc : photoArr[index]
        }
        subIngredients.push(ingredient);
      }
      html = multiItemHtml(titleFoodName, sugarTotal, subIngredients, sugarPerServingStr);
    }
    document.getElementById("lastFoodItem").innerHTML=html;
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
        processValuesFromDb();
        spinner.stop();
        logIt('spinner off');
      } else {
        logIt('sugarIntakeDict is null');
        // TODO: page error
        spinner.stop();
        logIt('spinner off');
        return;
      }
    });
  });
}
