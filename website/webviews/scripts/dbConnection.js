// Test mode:
var test = true;

// Messenger user's page id:
var psid;


(function(d, s, id) {
  logIt('messengerExtensions');
  logIt('-------------------------------');
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "//connect.facebook.com/en_US/messenger.Extensions.js";
  fjs.parentNode.insertBefore(js, fjs);
} (document, 'script', 'Messenger'));

// Asynchronous init function on window object called by FB on load to get values from FB messenger
// scoped to this page.
window.extAsyncInit = function() {
  logIt('extAsyncInit called');
  logIt('-------------------------------');
  MessengerExtensions.getUserID(
    function success(uids) {
      psid = uids.psid;

      logIt('  success. psid = ' + psid);

      initAndAuthDb();
      initValuesFromDb(psid);
    },
    function error(err, errorMessage) {
      console.log(errorMessage);
    }
  );
}

function initAndAuthDb() {
  logIt('initAndAuthDb');
  logIt('-------------------------------');
  firebase.initializeApp({
    apiKey: 'AIzaSyBQTHsQA5GuDG7Ttk17o3LBQfXjn7MtUQ8',
    authDomain: 'inphooddb-e0dfd.firebaseapp.com',
    databaseURL: 'https://inphooddb-e0dfd.firebaseio.com',
  });

  firebase.auth().signInAnonymously().catch(function(error) {
    logIt('   error:');
    logIt(error);
    console.log(error);
  });
}

function initValuesFromDb(psid) {
  logIt('initValuesFromDb');
  logIt('-------------------------------');
  let userRef = firebase.database().ref('global/sugarinfoai/' + psid);

  initPageValuesFromDb(userRef)
}

var spinner;
function testInit() {
  if (test) {
    logIt('SPOOFING extAsyncInit called (test is true)');
    logIt('-------------------------------');
    const AC = 1547345815338571;
    psid = AC;
    initAndAuthDb();
    initValuesFromDb(psid);
  }
}

//testInit();
