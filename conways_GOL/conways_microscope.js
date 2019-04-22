//Conway's Game of Life
//
//Uses HTML5 canvas for drawing. Resizable and size & speed adjustable.
//Stores size and speed settings.
//TODO: React-bootstrap controls; properly resizing control panel;
//presets [glider gun etc]; when the slider is at the smallest size,
//sometimes the board clears and it stops - it might be a concurrency bug...

//Only because it was required...
var Mainboard = React.createClass({
  render: function() {
    return(<canvas id="canv"></canvas>);
  }
});
  
ReactDOM.render(<Mainboard />, GOL);

$(document).ready(function() {  
  var canvas = document.getElementById("canv");
  var ctx = canvas.getContext("2d");
  var board = [];
  var squareSize = 7; //px
  var boardSize = { "w": 0, "h": 0 }; //how many squares on a side
  var firstItr = true; //so board is only randomized once
  var refreshDelay = 240; //ms
  var running; //stores setTimout
  var wrap = true;//for wrap checkbox
  var generation = 0; 
  var mousePos = { "x": 0, "y": 0 }; //to store the coords
  var squareColor = '#ff0000';
  var allBlank = true;
  
  window.addEventListener('resize', function() {
    pause();
    setCanvasSize();
    run();
  });

  $('#speed').change(function() {
    if(board === []) return;
    pause();
    setSpeed();
    run();
    localStorage.setItem("speed", refreshDelay);
  });
  
  $('#size').change(function() {
    pause();
    if(setSize()) run();
    localStorage.setItem("size", squareSize)
  });
  
  $('#pause').click(pause);
  $('#go').click(go);
  $('#clear').click(clear_board);
  $('#wrap').change(unWrap);
  $('#step').click(step);

  loadPrev(); //load saved values if any
  setCanvasSize();
  run();
  $("#clear").prop('disabled', true);
  $("#pause").prop('disabled', false);

  // when square is clicked
  $('#canv').on('mousedown', function(e) {
    toggleSquare(e);
  });

  //load values from localStorage
  function loadPrev() {
    if(localStorage.getItem("speed") !== null) {
      refreshDelay = localStorage.getItem("speed");
      $("#speed").prop("value", refreshDelay);
    } else {
      setSpeed();
    }
    if(localStorage.getItem("size") !== null) {
      squareSize = localStorage.getItem("size");
      $("#size").prop("value", squareSize);
    } else {
      setSize();
    }
  }

  //called from go() -- could prob. be merged
  function run() {
    document.getElementById("canv").style.pointerEvents = 'none';
    $("#go").prop('disabled', true);
    $("#step").prop('disabled', true);
    $("#pause").prop('disabled', false);
    running = setInterval(function() {
      if (firstItr && rndArray(boardSize.w, boardSize.h)) {
        firstItr = false;
        if (clearBoard()) arrayToCanvas(boardSize.w, boardSize.h);
      } else if (nextGenArray(boardSize.w, boardSize.h)) {
        if (clearBoard()) arrayToCanvas(boardSize.w, boardSize.h);
      }
      incGeneration();
    }, refreshDelay);
  }

  //generation counter
  function incGeneration() {
    generation++;
    document.getElementById("gen").innerHTML = generation;
  }

  //gets mouse position, calculates which square that's in,
  //toggles matching array value, then redraws canvas
  function toggleSquare(ev) {
    var rect = canvas.getBoundingClientRect();
    var temp_x = ev.clientX - rect.left;
    var temp_y = ev.clientY - rect.top;
    mousePos.x = Math.floor(temp_x / squareSize);
    mousePos.y = Math.floor(temp_y / squareSize);
    board[mousePos.x][mousePos.y] = !board[mousePos.x][mousePos.y];
    if(board[mousePos.x][mousePos.y]) allBlank = false;
    clearBoard();
    arrayToCanvas(boardSize.w, boardSize.h);
  }

  //gets current window size then sets canvas size and board size --
  //linked to window resize listener
  function setCanvasSize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    boardSize.w = Math.floor(w / squareSize);
    boardSize.h = Math.floor(h / squareSize);
    //still trying to sync things...
    //if(enlargeBoard(w, h, boardSize.w, boardSize.h) && $('#pause').prop('disabled')) {
      //console.log("SETCANVASSIZE: "+boardSize.w+" "+boardSize.h);
      //arrayToCanvas(boardSize.w, boardSize.h); //keeps it from blanking on resize if paused
    //}
    enlargeBoard(w, h, boardSize.w, boardSize.h);
  }

  
  function setSpeed() {
    refreshDelay = document.getElementById("speed").value;
    $("#pause").prop('disabled', false);
  }

  function setSize() {
    var oldW = boardSize.w;
    var oldH = boardSize.h;
    //console.log("before: "+oldW + " " + oldH);
    squareSize = parseInt(document.getElementById("size").value);
    //console.log(document.getElementById("size").value);
    //console.log(squareSize);
    if(squareSize < 2) squareSize = 2;
    if(!firstItr) setCanvasSize();
    console.log("between");
    if(firstItr) return enlargeBoard(boardSize.w, boardSize.h, oldW, oldH);//trying to sync things
    //console.log("after: "+boardSize.w+ " "+boardSize.h);
    return true;
  }

  //if canvas is now bigger than the array,
  //make a new array that size; copy entries
  //from old array if they exist; otherwise
  //push 0's
  function enlargeBoard(width, height, oldWidth, oldHeight) {
    //pad 0's to each existing row
    console.log("ENLARGE BOARD");
    board.forEach(function(row) {
      for (var e = oldWidth; e < width; ++e) {
        row.push(0);
      }
    });
    //make a temp array the new length; fill with 0's
    var tempArr = [];
    for (var z = 0; z < width; ++z) {
      tempArr.push(0);
    }
    //push that blank array to arr enough times so its new length is newH
    for (var e = 0; e < height - oldHeight; ++e) {
      board.push(tempArr);
    }
    return true;
  }

  function pause() {
    document.getElementById("canv").style.pointerEvents = 'auto';
    clearInterval(running);
    $("#pause").prop('disabled', true);
    $("#go").prop('disabled', false);
    $("#step").prop('disabled', false);
    $("#clear").prop('disabled', false);
  }

  function go() {
    //go button disabled in run()
    if(allBlank) return;
    if (board.length < 2 && !firstItr) return;
    $("#pause").prop('disabled', false);
    $("#clear").prop('disabled', true);
    $("#go").prop('disabled', true);
    run();
  }

  function clear_board() {
    pause();
    board = [];
    setCanvasSize();
    blankBoard(boardSize.w, boardSize.h);
    generation = 0;
    document.getElementById("gen").innerHTML = 0;
    clearBoard();
  }

  function blankBoard(w, h) {
    var tempArr = [];
    var new_board = [];
    for (var i = 0; i < w; ++i) {
      tempArr = [];
      for (var j = 0; j < h; ++j) {
        tempArr.push(0);
      }
      new_board.push(tempArr);
    }
    board = new_board;
  }

  function unWrap() {
    wrap = !wrap;
  }

  function step() {
    if (nextGenArray(boardSize.w, boardSize.h))
      if (clearBoard()) {
        arrayToCanvas(boardSize.w, boardSize.h);
        incGeneration();
      }
  }

  function clearBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return true;
  }

  function rndArray(n, m) {
    board = [];
    var new_board = []; //DEL
    allBlank = false;
    for (var i = 0; i < n; ++i) {
      var tempArr = [];
      for (var j = 0; j < m; ++j) {
        tempArr.push(Math.floor(Math.random() * 2));
      }
      board.push(tempArr);
    }
    return true;
  }

  //calculates what the next board will be --
  //this just changes the array, then arrayToCanvas() draws it
  function nextGenArray(width, height) {
    console.log("boardSize width: "+" "+boardSize.w);
    console.log("boardSize height: "+" "+boardSize.h);
    console.log("actualsize width: "+" "+board.length);
    console.log("actualsize height: "+" "+board[0].length);

    if(allBlank) {
      pause();
      clear_board();
      return;
    }
    allBlank = true;//if the board is empty this stays true    
    var neighbors = 0;
    var new_board = [];
    var tempArr = [];
    var i_inc; //used if wrap selected
    var j_inc; //
    var i_dec; //
    var j_dec; //

    for (var i = 0; i < width; ++i) {
      tempArr = [];
      //using wrap...
      if (wrap) {
        for (var j = 0; j < height; ++j) {
          neighbors = 0;
          //the four conditions here take care of edge cases
          if (i == width - 1) i_inc = 0;
          else i_inc = i + 1;
          if (j == height - 1) j_inc = 0;
          else j_inc = j + 1;
          if (i === 0) i_dec = width - 1;
          else i_dec = i - 1;
          if (j === 0) j_dec = height - 1;
          else j_dec = j - 1;
          //check for neighboring live squares...
          if (board[i_dec][j_dec]) ++neighbors;
          if (board[i][j_dec]) ++neighbors;
          if (board[i_inc][j_dec]) ++neighbors;
          if (board[i_dec][j]) ++neighbors;
          if (board[i_inc][j]) ++neighbors;
          if (board[i_dec][j_inc]) ++neighbors;
          if (board[i][j_inc]) ++neighbors;
          if (board[i_inc][j_inc]) ++neighbors;
          //...and flip array value accordingly
          if (board[i][j]) {
            allBlank = false;//the board has at least one live square
            if (neighbors < 2) tempArr.push(0);
            if (neighbors == 2 || neighbors == 3) tempArr.push(1);
            if (neighbors > 3) tempArr.push(0);
          } else {
            if (neighbors == 3) tempArr.push(1);
            else tempArr.push(0);
          }
        }
      //no wrap...
      } else {
        for (var j = 0; j < height; ++j) {
          neighbors = 0;
          //uses evaluation order to only do possible tests --
          //that takes care of edge cases
          if (i > 0 && j > 0 && board[i - 1][j - 1]) ++neighbors;
          if (j > 0 && board[i][j - 1]) ++neighbors;
          if (j > 0 && i < width - 1 && board[i + 1][j - 1]) ++neighbors;
          if (i > 0 && board[i - 1][j]) ++neighbors;
          if (i < width - 1 && board[i + 1][j]) ++neighbors;
          if (i > 0 && j < height - 1 && board[i - 1][j + 1]) ++neighbors;
          if (j < height - 1 && board[i][j + 1]) ++neighbors;
          if (i < width - 1 && j < height - 1 && board[i + 1][j + 1]) ++neighbors;
          //flips array element based on number of neighbors
          if (board[i][j]) {
            if (neighbors < 2) tempArr.push(0);
            if (neighbors == 2 || neighbors == 3) tempArr.push(1);
            if (neighbors > 3) tempArr.push(0);
          } else {
            if (neighbors == 3) tempArr.push(1);
            else tempArr.push(0);
          }
        }
      }
      new_board.push(tempArr);
    }
    board = new_board; //I can't really do that, can I?
    //(pointer is reassigned and garbage collector handles it)
    return true;
  }

  //maps array to canvas squares
  function arrayToCanvas(width, height) {
    ctx.fillStyle = squareColor;
    for (var i = 0; i < width; ++i) {
      for (var j = 0; j < height; ++j) {
        if (board[i][j]) {
          ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
        }
      }
    }
  }

});
