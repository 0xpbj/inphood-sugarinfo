//
// Globals:
//
////////////////////////////////////////////////////////////////////////////////

var tz;


//
// Action handlers:
//
// Notes: action handlers recieve an id which can be one of:
//        'all' or '0' --> 'n' (n EI > 0)
////////////////////////////////////////////////////////////////////////////////

function updateDbValue(key) {
  logIt('updateDbValue');
  logIt('------------------------------------------------------------------------------------------');
  if (psid === null) {
    return
  }

  let ele = document.getElementById(key);
  logIt('ele type = ' + ele.getAttribute("type"));
  let value = null;
  if (ele.getAttribute("type") === "number" ||
      ele.getAttribute("type") === "text") {
    value = ele.value;
  } else if (ele.getAttribute("type") === "checkbox") {
    value = ele.checked;
  }

  logIt('  ' + key + '(key), ' + value + '(value)');

  if (value !== null) {
    let preferencesRef = firebase.database().ref('global/sugarinfoai/' + psid + '/preferences');

    logIt('  writing value');
    let keyRef = preferencesRef.child(key);
    keyRef.set(value);

    if (key === 'currentWeight') {
      // Also need to write to the current date formatted string (TODO)
      //logIt('tz: ' + tz);
    }
  }
}

function handleOnInput(id) {

}

function handleSwitchChange(id) {

}

//
// Small HTML templates:
//
////////////////////////////////////////////////////////////////////////////////

function getEditableField(id, description, initialValue, min=0, max=100) {
  let html = ' \
    <div class="row" style="font-size:16px"> \
      <div class="col-xs-5"> \
        <input id="' + id + '"  \
               class="form-control text-right"  \
               type="number"  \
               value="' + initialValue + '"  \
               oninput="handleOnInput(\'' + id + '\')" \
               min="' + min + '"  \
               max="' + max + '"/>  \
      </div> \
      <div class="col-xs-7"> \
        <label class="control-label">' + description + '</label> \
      </div> \
    </div>';

  return html
}

function getSwitch(id, description, initialValue) {
  let state=''
  if (initialValue) {
    state='checked'
  }

  let html = ' \
    <div class="row"> \
      <div class="col-xs-5 text-right"> \
        <input id="' + id + '" \
               type="checkbox" \
               ' + state + ' \
               onchange="handleSwitchChange(\'' + id + '\')"/> \
      </div> \
      <div class="col-xs-7" style="font-size:16px"> \
        <label class="control-label">' + description + '</label> \
      </div> \
    </div>';

  return html
}
//
// Initialization code:
//
////////////////////////////////////////////////////////////////////////////////

function initPageValuesFromDb(userRef) {
  logIt('initPageValuesFromDb');
  logIt('-------------------------------');

  let preferencesRef = userRef.child('preferences');

  preferencesRef.once('value', function(snapshot) {
    let preferences = snapshot.val();
    document.getElementById('currentGoalSugar').setAttribute("value", preferences.currentGoalSugar);
    document.getElementById('currentGoalWeight').setAttribute("value", preferences.currentGoalWeight);
    document.getElementById('currentWeight').setAttribute("value", preferences.currentWeight);

    if (preferences.nightlySummary === true) {
      let checkBoxObj = document.getElementById('nightlySummary');
      checkBoxObj.setAttribute("checked", "checked");

      let evt = new Event('change');
      checkBoxObj.dispatchEvent(evt);
    }
  });

  let profileTzRef = firebase.database().ref('global/sugarinfoai/' + psid + '/profile/timezone');
  profileTzRef.once('value', function(snapshot) {
    tz = snapshot.val();
  });
}
