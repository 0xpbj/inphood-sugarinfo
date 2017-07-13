// Test mode:
var showLog = false;
var simulatedInit = false;

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
  if (showLog) {
    let ele = document.getElementById('rtLog')

    if (ele.tagName === 'SCRIPT') {
      const pEle = document.createElement("P");
      pEle.id="rtLog";

      divEle = document.createElement("DIV");
      divEle.style = 'margin: 3px; padding: 5px; border: black solid 1px';
      divEle.appendChild(pEle);
      
      ele.parentNode.replaceChild(divEle, ele);
      ele = divEle;
    }
    
    ele.innerHTML += someText + '<br>';
  }
}
