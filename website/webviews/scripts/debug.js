// TODO: add some js in here that autoruns and inserts an element at the bottom
// of the dom where all this stuff is to get written too. At the moment you have
// to add it manually like so:
//
//    <!-- debug o/p -->
//    </div>
//      <p id="rtLog"></p>
//    </div>
//
function logIt(someText) {
  document.getElementById('rtLog').innerHTML += someText + '<br>';
}
