//
// Globals:
//
////////////////////////////////////////////////////////////////////////////////

// TODO: these should probably be closures / closured
var tz;
var sugarIntakeRef;
var myFoodsRef;
var myFoodsDict;
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

  let totalRef = sugarIntakeRef.child('dailyTotal');
  totalRef.set({nsugar: nSugarTotal, psugar: pSugarTotal});
}

function getRemovedHtml(foodName) {
  return '<p style="color: red; padding-left:5px">We deleted ❌&nbsp;&nbsp;<u>' + foodName + '</u> from your food journal 📒&nbsp;.</p>';
}

function getWrappedRemovedHtml(foodName) {
  let html = ' \
    <div class="row"> \
      <div class="col-xs-9" style="padding-left: 5px"> \
        <h4> \
          ' + foodName+ ' \
        </h4> \
      </div> \
    </div> \
    <div class="row"> \
      <div class="col-xs-12" style="height:10px; border-top: 1px solid black"></div> \
    </div> \
    <div class="row"> \
      ' + getRemovedHtml(foodName) + ' \
    </div>';

  return html;
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

    // 4. Show the user that the item was deleted.
    let newSugarIntakeDict = snapshot.val();
    let foodName = newSugarIntakeDict[lastKey].foodName;
    document.getElementById("lastFoodItem").innerHTML = getWrappedRemovedHtml(foodName);
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

  let newPSugarValue = inputField.value;
  if (inputField.value) {

    if (id === 'all') {
      // Handle the singleItemHtml use case
      let lastFoodRef = sugarIntakeRef.child(lastKey);
      lastFoodRef.once('value', function(snapshot) {
        // 1. Update the firebase values for the food item's total and processed
        // sugars:
        let nutritionData = snapshot.val();
        let currNSugarValue = (nutritionData.hasOwnProperty('nsugar')) ?  nutritionData.nsugar : 0;
        let newTotalSugarValue = currNSugarValue + newPSugarValue;

        let pSugarRef = lastFoodRef.child('psugar');
        pSugarRef.set(parseFloat(newPSugarValue));

        let totalSugarRef = lastFoodRef.child('sugar');
        totalSugarRef.set(parseFloat(newTotalSugarValue));

        // 2. Calculate the new total sugar for the day.
        // 3. Update firebase with:
        //    - the new daily sugar total
        sugarIntakeRef.once('value', function(snapshot) {
          updateTotalSugar(snapshot);
        });

        // 4. Update the firebase favorites values, if they exist
        if (myFoodsDict) {
          let cleanText = nutritionData.hasOwnProperty('cleanText') ? 
            nutritionData.cleanText : ''
          if (cleanText !== '') {
            // Sanitize the text for firebase--i.e. replace '/' etc. with '_'
            let sanoText = subSlashes(cleanText)
            if (sanoText in myFoodsDict) {
              logIt('Found ' + sanoText + ' in myFoodsDict.')
              let mfRef = myFoodsRef.child(sanoText)
              mfRef.child('psugar').set(parseFloat(newPSugarValue))
              mfRef.child('sugar').set(parseFloat(newTotalSugarValue))
            }
          }
        }
      });
    } else {
      // Handle the multiItemHtml use case

      // 1. Update the sub-ingredients processed sugar
      //    * assume new psugar / nsugar format
      //
      let lastFoodRef = sugarIntakeRef.child(lastKey);
      let sugarArrayRef = lastFoodRef.child('sugarArr');
      let sugarChangedRef = sugarArrayRef.child(id);
      let pSugarChangedRef = sugarChangedRef.child('psugar');
      pSugarChangedRef.set(parseFloat(newPSugarValue));

      // 2. Update the main entry's psugar/nsugar numbers:
      //    * can probably factor this into code above that does same thing
      //      for single entry use case
      //
      lastFoodRef.once('value', function(snapshot) {
        let nutritionData = snapshot.val();
        let totalPSugar = 0;
        for (let sugarNode of nutritionData.sugarArr) {
          totalPSugar += sugarNode.psugar;
        }
        let pSugarRef = lastFoodRef.child('psugar');
        pSugarRef.set(parseFloat(totalPSugar));

        const totalSugar = parseFloat(totalPSugar) + nutritionData.nsugar;
        let totalSugarRef = lastFoodRef.child('sugar');
        totalSugarRef.set(totalSugar);

        // 3. Update the daily total sugar values:
        //
        sugarIntakeRef.once('value', function(snapshot) {
          updateTotalSugar(snapshot);
        });

        // 4. Simultaneously, update the html sugar values for this main entry:
        //
        let sugarAddedField = document.getElementById('sugarAdded');
        sugarAddedField.innerHTML = parseFloat(totalPSugar);
        let sugarTotalField = document.getElementById('sugarTotal');
        sugarTotalField.innerHTML = parseFloat(totalSugar);

        // 5. Update the firebase favorites values, if they exist
        if (myFoodsDict) {
          let cleanText = nutritionData.hasOwnProperty('cleanText') ? 
            nutritionData.cleanText : ''
          if (cleanText !== '') {
            // Sanitize the text for firebase--i.e. replace '/' etc. with '_'
            let sanoText = subSlashes(cleanText)
            if (sanoText in myFoodsDict) {
              logIt('Found ' + sanoText + ' in myFoodsDict.')
              let mfRef = myFoodsRef.child(sanoText)
              mfRef.child('psugar').set(parseFloat(totalPSugar))
              mfRef.child('sugar').set(parseFloat(totalSugar))
              mfRef.child('sugarArr/' + id + '/psugar').set(parseFloat(newPSugarValue))
            }
          }
        }
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
  if (!imgPath || imgPath === '' || imgPath.includes('nix-apple-grey.png')) {
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

function singleItemHtml(foodName, nsugar, psugar, removed, photo) {
  logIt('singleItemHtml');
  let id = 'all';
  let deleteBtn = (removed) ? '' : delBtnHtml(id);
  let img = imgHtml(photo);

  let clnFoodName = foodName.replace('\n', '')

  let sugarRow;
  if (removed) {
    sugarRow = getRemovedHtml(clnFoodName);
  } else if (nsugar > 0 && psugar === 0) {
    // Naturally occuring sugars only
    sugarRow = ' \
      <div class="col-xs-9" style="padding-left:5px"> \
        <label class="control-label" style="font-size:16px">' + nsugar +  ' grams naturally occuring sugars</label> \
      </div> \
      ' + img + '';
  } else {
    // Indeterminate sugars source
    sugarRow = ' \
      <div class="col-xs-3" style="padding-left: 5px; padding-right: 5px" > \
        <input class="form-control text-right" \
               id= "' + id + '" \
               type="number" \
               style="font-size: 16px;" \
               value="' + psugar  + '" \
               oninput="handleOnInput(\'' + id + '\')" \
               min="0" max="500"/> \
      </div> \
      <div class="col-xs-6" style="padding-left:5px; font-size:16px"> \
        <label class="control-label">grams of sugars</label> \
      </div> \
      ' + img + '';
  }

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
      ' + sugarRow + ' \
    </div>';

    return html;
}

function multiItemSubIngredient(ingredient, index) {
  let img = imgHtml(ingredient.imageSrc);

  // Handle legacy firebase format and new format:
  //
  // New format:
  //    sugarArrItem {nsugar: n, psugar: m}
  // Old format:
  //    sugarArrItem: n
  //
  let nsugar = 0;
  let psugar = 0;
  if (ingredient.sugarArrItem.hasOwnProperty('nsugar')) {
    nsugar = ingredient.sugarArrItem.nsugar;
    psugar = ingredient.sugarArrItem.psugar;
  } else {
    psugar = ingredient.sugarArrItem
  }

  let sugarRow;
  if (nsugar > 0 && psugar === 0) {
    sugarRow = ' \
      <div class="col-xs-1"></div> \
      <div class="col-xs-8" style="padding-left: 0px" > \
        <label class="control-label" style="font-size:16px"> \
          ' + nsugar + ' naturally occuring sugars (g) \
        </label> \
      </div> \
      ' + img + '';
  } else {
    sugarRow = ' \
      <div class="col-xs-1"></div> \
      <div class="col-xs-3" style="padding-left: 0px; padding-right: 5px" > \
        <input class="form-control text-right" \
               id= "' + index + '" \
               type="number" \
               style="font-size: 16px;" \
               value="' + psugar + '" \
               oninput="handleOnInput(\'' + index + '\')" \
               min="0" max="100"/> \
      </div> \
      <div class="col-xs-5" style="padding-left:5px; font-size:16px"> \
        <label class="control-label">sugars (g)</label> \
      </div> \
      ' + img + '';
  }

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
      ' + sugarRow + ' \
    </div>';

  return html;
}

function multiItemHtml(foodName, nSugar, pSugar, removed, subIngredients = []) {
  logIt('multiItemHtml');
  logIt('-------------------------');
  if (removed) {
    logIt('  in removed');
    return getWrappedRemovedHtml(foodName);
  } else {
    let deleteBtnAll = delBtnHtml();
    let sugarTotal = nSugar + pSugar;

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
        <div class="col-xs-9" style="padding-left: 5px; font-size:16px"> \
          <p><b><span id="sugarAdded">' + pSugar+ '</span> estimated added sugars.</b></p> \
          <p><span id="sugarNatural">' + nSugar + '</span> naturally occuring sugars.</p> \
          <p><span id="sugarTotal">' + sugarTotal + '</span> total sugars.</p> \
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
}

//
// Initialization code:
//
////////////////////////////////////////////////////////////////////////////////

function processValuesFromDb(sugarIntakeDict) {
  logIt('processValuesFromDb');
  logIt('-------------------------------');

  if (sugarIntakeDict && lastKey) {
    logIt('  processing lastKey of sugarIntakeDict');

    const lastItem = sugarIntakeDict[lastKey];

    const {
      cleanText,
      foodName,
      removed,
      nsugar,
      psugar,
      sugar,
      photo,
      sugarArr
    } = lastItem;
    const sugarTotal = Math.round(psugar);
    const iphoto = (photo) ? photo[0] : '';

    const singleItemUseCase = ((sugarArr === null) ||
                              (sugarArr === undefined) ||
                              (sugarArr.length === 1));

    let html = '';
    if (singleItemUseCase) {
      html = singleItemHtml(cleanText, nsugar, psugar, removed, iphoto);
    } else {
      // TODO: can probably replace with 'cleanName' from firebase (all over the
      // place)
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
          sugarArrItem: sugarArr[index],
          imageSrc : photoArr[index]
        }
        subIngredients.push(ingredient);
      }
      html = multiItemHtml(cleanText, nsugar, psugar, removed, subIngredients);
    }
    document.getElementById("lastFoodItem").innerHTML=html;
  }
}

function initPageValuesFromDb(userRef) {
  logIt('initPageValuesFromDb');
  logIt('-------------------------------');

  let target = document.getElementById('lastFoodItem');
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
      let sugarIntakeDict = intakeSnapshot.val();
      if (sugarIntakeDict) {

        // 3. Get the most recent item logged by the user today:
        //
        //  Note:  sugarIntakeDict is a dict of uniqueified time based keys followed by
        //         one user defined key: 'dailyTotal'. We should be able to iterate
        //         through this dictionary and choose the 2nd last element to
        //         consistently find the last item a user ate. The last element will be
        //         'dailyTotal'.
        //
        const keyArr = Object.keys(sugarIntakeDict);
        const dictLength = keyArr.length;
        if (dictLength < 2) {
          console.log('Unexpected error. Found underpopulated intake dictionary.');
          return;
        }

        lastKey = keyArr[dictLength - 2]
        if (lastKey === 'dailyTotal') {
          console.log('Unexpected error. Retrieved daily total from intake dictionary as last intake key.');
          return;
        }

        logIt('lastKey not dailyTotal = ' + lastKey);
        processValuesFromDb(sugarIntakeDict);
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

  // 4. Simultaneously get the user's favorite foods:
  //
  myFoodsRef = userRef.child('myfoods')
  myFoodsRef.once('value', function(myFoodsSnapshot) {
    myFoodsDict = myFoodsSnapshot.val()
    return
  });
}
