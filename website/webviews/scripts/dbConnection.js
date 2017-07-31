// Messenger user's page id:
var psid;

var spinner;

// Function to insert Facebook Messenger Extensions
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
  // old keys:
  //    apiKey: 'AIzaSyBQTHsQA5GuDG7Ttk17o3LBQfXjn7MtUQ8',
  //
  firebase.initializeApp({
    apiKey: 'AIzaSyC6q3xNF48k98N-SkJOnkryA8J3ZeYOJPg',
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
  
  logIt('  getting firebase user reference');
  let userRef = firebase.database().ref('global/sugarinfoai/' + psid);

  logIt('  calling initPageValuesFromDb');
  initPageValuesFromDb(userRef)
}

function testInit() {
  if (simulatedInit) {
    logIt('SPOOFING extAsyncInit called (simulatedInit is true)');
    logIt('-------------------------------');
    const AC = 1547345815338571;
    const PBJ = 1322516797796635;
    psid = AC;
    initAndAuthDb();
    initValuesFromDb(psid);
  }
}

if (simulatedInit) {
  testInit();
}
