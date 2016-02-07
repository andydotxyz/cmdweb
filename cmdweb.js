/*
  CommandWeb - a script for adding command prompts to web pages

  Adapted from test sample for termlib.js: window chrome

  Using:
  termlib.js 
  (c) Norbert Landsteiner 2005
  mass:werk - media environments
  <http://www.masswerk.at>
  
  all rights reserved

*/

var commands = new Object();
function Command(description, func) {
  this.description = description;
  this.func = func;
}
Command.prototype.invoke=function cmdinvoke(term, line) {
  if (this.func) {
    this.func(term, line);
  }
}

function registerCommand(name, desc, func) {
  commands[name] = new Command(desc, func);
}

var term = new Array();
var parser = new Parser();
// only accept double and single quotes as quote characters
parser.quoteChars = { "\"": true, "'": true };
// set "-" (minus) as the option character (same as default)
parser.optionChars = { "-": true };

var helpPage=[
  '%+r CommandWeb Help %-r - use one of the following commands:',
  ' %+iTerminal commands%-i',
  '  clear ........ clear the terminal',
  '  exit ......... close the terminal (or <ESC>)',
  '  id ........... show terminal\'s id',
  '  switch ....... switch to other terminal',
  '  help ......... show this help page',
  ' %+iWeb commands%-i',
  '  load <url>.... load the specified url (also \'location\')',
  '  reload ....... reload the current page (also \'refresh\')',
  '  google <topic> load a google search for the topic',
  ' %+iOther commands%-i'
];


function loadUrl(url) {
  if (url.indexOf('://') <= 0) {
    url = 'http://'+url;
  }

  iframe = document.getElementById('webcontent');
  iframe.src = url;
}

function termNew() {
  n = 1;
  while (term[n] && (term[n].closed == false))
    n++;

  termOpen(n);
  termPosition(n, (n-1)*20, (n-1)*20);
}

function writeCookie() {
  var cookie = "";
  for (var i = 1; i < term.length; i++) {
    if (term[i] && !term[i].closed) {

  var termdiv='terminal'+i;
  var dragobject = (document.getElementById)? document.getElementById(termdiv):document.all[termdiv];
  var xpos = parseInt(dragobject.style.left);
  var ypos = parseInt(dragobject.style.top);

      cookie += "1:" + xpos + ":" + ypos + ":;"
    }
  }

  document.cookie = "terminals="+escape(cookie);
}

function readCookie() {
  var terms = unescape(document.cookie).substr(10).split(';');

  for (var i = 0; i < terms.length - 1; i++) {
    termOpen(i+1);
    var parts = terms[i].split(':');
    termPosition(i+1, parts[1], parts[2]);
  }

  writeCookie();
}

function termOpen(n) {
  n = parseInt(n);
  if ((!n) || (isNaN(n))) n = 1;
  var termid = 'terminal'+n;
  if (!term[n]) {

    // copy the HTML
    template = document.getElementById('terminalX');
    newMarkup = template.cloneNode(true);
    newMarkup.setAttribute('id', termid);

    newMarkup.childNodes[1].childNodes[1].childNodes[2].childNodes[1].childNodes[1].setAttribute('id', 'termDiv'+n);
    newMarkup.childNodes[1].setAttribute('onmouseup', 'termBringToFront('+n+')');
    newMarkup.childNodes[1].childNodes[1].childNodes[0].childNodes[1].setAttribute('onmousedown', 'dragTerm('+n+'); return false');
    newMarkup.childNodes[1].childNodes[1].childNodes[0].childNodes[1].setAttribute('id', 'termHeader'+n);
    newMarkup.childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes[0].nodeValue = 'Terminal '+n;
    newMarkup.childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes[1].setAttribute('href', 'javascript:termClose('+n+')');
    document.documentElement.appendChild(newMarkup);

    term[n] = new Terminal(
      {
        x: 0,
        y: 0,
        cols: 80,
        rows: 24,
        id: n,
        termDiv: 'termDiv'+n,
        frameWidth: 0,
        frameColor: 'none',
        bgColor: 'none',
        crsrBlinkMode: true,
        greeting: 'The Matrix has you...',
        handler: termHandler,
        exitHandler: termChromeHide
      }
    );
    if (term[n]) {
      termChromeShow(n);
      term[n].open();
    }

  }
  else if (term[n].closed) {
    termSetChromeState(n, true);
    termChromeShow(n);
    term[n].open();
  }
  else {
    termSetChromeState(n, true);
  }
  termBringToFront(n);
  writeCookie();
}

function termPosition(n, x, y) {
  var termdiv='terminal'+n;
  var dragobject = (document.getElementById)? document.getElementById(termdiv):document.all[termdiv];

  dragobject.style.left = x+'px';
  dragobject.style.top = y+'px';
}

function termHandler() {
  this.newLine();
  parser.parseLine(this);

  var line = this.lineBuffer;
  if (line != '') {
    if (line == 'exit') this.close()
    else if (line == 'help') {
      this.write(helpPage);
      this.newLine();

      for (command in commands) {
        this.write('  ' + commands[command].description);
        this.newLine();
      }
    }
    else if (line == 'clear') this.clear();
    else if (line == 'new') termNew();
    else if (line=='switch') {
      termSwitch(this.id);
    } else if (line=='id') {
      this.write('terminal id: '+this.id);
//    } else if (this.argv[0] == 'size') {
//      this.conf.rows = this.argv[1];
//      this.maxLines = this.argv[1];
//      this.conf.cols = this.argv[2];
//      this.maxCols = this.argv[2];
    } else if (line == 'reload' || line == 'refresh') location.reload(true);
    else if (line.substr(0, 4) == 'load') {
      loadUrl(line.substr(5));
    }else if (line.substr(0, 8) == 'location'){
      loadUrl(line.substr(9));
    }else if (line.substr(0,6) == 'google') {
      iframe = document.getElementById('webcontent');
      iframe.src = 'http://www.google.co.uk/#hl=en&q='+encodeURIComponent(line.substr(7));
    }

    else {
      found = false;
      for (command in commands) {
        cmdlen = command.length;
        if (line.substring(0, cmdlen + 1) == command + ' ') {
          params = line.substring(cmdlen + 1);
          commands[command].invoke(this, params);
          found = true;
        } else if (line == command ) {
          commands[command].invoke(this, '');
          found = true;
        }
      }

      if (!found) {
        this.type('Unknown command: '+line);
      }
    }

  }

  writeCookie();
  this.prompt();
}

function termSwitch(n) {
  for (j = n+1; j < term.length; j++) {
    if (term[j] && !term[j].closed) {
      termOpen(j);
      return;
    }
  }
  for (j = 0; j < n; j++) {
    if (term[j] && !term[j].closed) {
      termOpen(j);
      return;
    }
  }
}

function termSetChromeState(n, v) {
  var header = 'termHeader'+n;
  var classname = (v)? 'termHeaderActive':'termHeaderInactive';
  if (document.getElementById) {
    var obj = document.getElementById(header);
    if (obj) obj.className = classname;
  }
  else if (document.all) {
    var obj = document.all[header];
    if (obj) obj.className = classname;
  }
  
}

function termChromeShow(n) {
  var obj;
  var div = 'terminal'+n;
  TermGlobals.setVisible(div,1);
  if (document.getElementById) {
    obj = document.getElementById(div);
  }
  else if (document.all) {
    obj = document.all[div];
  }

  if (obj) {
    obj.className = 'termShow';
  }
}

function termChromeHide() {
  var div='terminal'+this.id;
  TermGlobals.setVisible(div,0);
  if (document.getElementById) {
    var obj = document.getElementById(div);
    if (obj) obj.className = 'termHidden';
  }
  else if (document.all) {
    var obj = document.all[div];
    if (obj) obj.className = 'termHidden';
  }

  // TODO this should really switch to the most recently used not the next one...
  termSwitch(this.id);
}

function termClose(n) {
  if ((term[n]) && (term[n].closed == false)) term[n].close();
  writeCookie();
}

function termBringToFront(n) {
  for (var i=1; i<term.length; i++) {
    if ((n!=i) && (term[i])) {
      var obj=(document.getElementById)? document.getElementById('terminal'+i):document.all['terminal'+i];
      if (obj) obj.style.zIndex=1;
      termSetChromeState(i, false);
    }
  }
  var obj=(document.getElementById)? document.getElementById('terminal'+n):document.all['terminal'+n];
  if (obj) obj.style.zIndex=2;
  termSetChromeState(n, true);
  term[n].focus();

  // hack to fix cursor
  if (term[n].cursoractive) term[n].cursorOn();
  document.activeElement.blur();

//  iframe = document.getElementById('webcontent');
//  var idoc = (iframe.contentWindow || iframe.contentDocument);
//  if (idoc.document) idoc = idoc.document;

//  idoc.activeElement.blur();
}

// simple drag & drop

var dragobject=null;
var dragOfsX, dragOfsY;
var lastX, lastY;

function drag(e) {
  if (dragobject!=null) {
    if (window.event) e = window.event;
    var x = (typeof e.clientX != 'undefined')? e.clientX:e.pageX;
    var y = (typeof e.clientY != 'undefined')? e.clientY:e.pageY;
    dragobject.style.left=(x+dragOfsX-lastX)+'px';
    dragobject.style.top=(y+dragOfsY-lastY)+'px';
  }
}

function dragStart(e) {
  if (window.event) e = window.event;
  lastX = (typeof e.clientX != 'undefined')? e.clientX:e.pageX;
  lastY = (typeof e.clientY != 'undefined')? e.clientY:e.pageY;
}

function dragTerm(n) {
  termBringToFront(n)
  var div='terminal'+n;
  dragobject = (document.getElementById)? document.getElementById(div):document.all[div];
  dragOfsX = parseInt(dragobject.style.left);
  dragOfsY = parseInt(dragobject.style.top);
}

function dragRelease(e) {
  dragobject=null;
  writeCookie();
}

document.onmousemove=drag;
document.onmouseup=dragRelease;
document.onmousedown=dragStart;

// set up the iframe

var qsParam = new Array();
function qs() {
var query = window.location.search.substring(1);
var params = query.split('&');
for (var i=0; i<params.length; i++) {
var pos = params[i].indexOf('=');
if (pos > 0) {
var key = params[i].substring(0,pos);
var val = params[i].substring(pos+1);
qsParam[key] = val;
}
}
}

function cmdWebLoad() {
  qsParam['url']=null;
  qs();

  if (qsParam['url'] != null) {
    loadUrl(qsParam['url']);
  }

  readCookie();
}

function cmdWebRender(url) {
  document.write('<iframe id="webcontent" src="'+url+'">');
  document.write('  <h3>This coolness requires iframes, sorry!</h3>');
  document.write('</iframe>');

  document.write('<div id="newTerm" onmousedown="termNew(); return false"><img src="corner.png" width="75" height="75" /></div>');
  document.write('<span id="cmdTermCredits">Powered by <a href="http://handyande.co.uk/cmdweb/" target="_blank">cmdweb</a> and <a href="http://www.masswerk.at/termlib/" target="_blank">termlib.js</a></span>');

  document.write('<div id="terminalX" style="top: 0; left:0; position:absolute; visibility: hidden; z-index:1" class="termHidden">');
  document.write('  <table class="termOuterChrome" onmouseup="termBringToFront(X)" cellpadding="1" cellspacing="0">');
  document.write('    <tr>');
  document.write('      <td class="termHeaderActive" onmousedown="dragTerm(X); return false" id="termHeaderX">');
  document.write('        Terminal X');
  document.write('        <a style="float:right" href="javascript:termClose(X)" onfocus="if(this.blur)this.blur();" class="termMenu">');
  document.write('          X');
  document.write('        </a>');
  document.write('      </td>');
  document.write('    </tr>');
  document.write('    <tr>');
  document.write('      <td class="termBody">');
  document.write('        <div id="termDivX" style="position:relative;">');
  document.write('        </div>');
  document.write('      </td>');
  document.write('    </tr>');
  document.write('  </table>');
  document.write('</div>');

}
