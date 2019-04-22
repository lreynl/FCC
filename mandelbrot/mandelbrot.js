//Mandelbrot set generator
//Click to center, use buttons to zoom in/out
var canv = document.getElementById('canv');
var ctx = canv.getContext('2d');
var W = window.innerWidth;
var H = window.innerHeight;
ctx.canvas.width = W;
ctx.canvas.height = H;
ctx.imageSmoothingEnabled = true;
var center = {X: 0, Y: 0};//for resizing
var initBounds = {X: -2, Y: -1, Xu: 4, Yu: 2};
var lowerBounds = {X: -2, Y: -1};
var upperBounds = {X: 4, Y: 2};
var zoomAmount = 0.5;
var escapeMax = 1000;
var RGB = [];

function Complex(re, im) {
  this.real = re || 0;
  this.imag = im || 0;
}

Complex.prototype.square = function() {
  //a² + 2abi + (bi)²
  var temp = this.real;
  this.real = this.real * this.real - this.imag * this.imag;
  this.imag = 2 * temp * this.imag;
};

Complex.prototype.add = function(re, im) {
  this.real += re;
  this.imag += im;
};

Complex.prototype.magnitude = function() {
  return Math.sqrt(this.real * this.real + this.imag * this.imag);
};

//make an array of rgb values to avoid a string concat in the inner loop later
function buildRgb(RGB) {
  var tempStr = "";
  for(var i = 0; i < 256; i++) {
    if(i < 16) {
      tempStr = "#" + "0" + i.toString(16) + "0" + i.toString(16) + "0" + i.toString(16);      
    } else {
      tempStr = "#" + i.toString(16) + i.toString(16) + i.toString(16);
    }
    RGB.push(tempStr);
  }
}

function doMand() {
  var esc = 0;//temp
  var loops = 0;
  for(var i = 0; i < H; i++) {
    for(var j = 0; j < W; j++) {
      loops = findEscape(lowerBounds.X + (j * upperBounds.X) / W, lowerBounds.Y + (i * upperBounds.Y) / H);
      if(loops != escapeMax) {
        //ctx.fillStyle = 'rgb('+ 2*Math.round((loops / escapeMax) * 255) + ',' + 2*Math.round((loops / escapeMax) * 255)+ ',' + 2*Math.round((loops / escapeMax) * 255)+')';
        ctx.fillStyle = RGB[Math.round((loops / escapeMax) * 255)];//seems to work
        //ctx.fillStyle = RGB[255];
        ctx.fillRect(j, i, 1, 1);//1px square
      }    
    }
  }
}

function findEscape(re, im) {
  if(cardCheck(re, im)) return escapeMax;
  var z = new Complex(0, 0);
  var counter = 0;
  do {
    //z = z² + c
    z.square();
    z.add(re, im);
    counter++;
  } while(z.real * z.real + z.imag * z.imag <= 4 && counter < escapeMax);
  return counter;
}

function toCenter(ev) {
  center.X = lowerBounds.X + (upperBounds.X / W) * ev.clientX;
  center.Y = lowerBounds.Y + (upperBounds.Y / H) * ev.clientY;
  lowerBounds.X = center.X - upperBounds.X / 2;
  lowerBounds.Y = center.Y - upperBounds.Y / 2;
  draw();
}

function zoomIn() {
  upperBounds.X *= zoomAmount;
  upperBounds.Y *= zoomAmount;
  lowerBounds.X = center.X - upperBounds.X / 2;
  lowerBounds.Y = center.Y - upperBounds.Y / 2;
  var z = $(zoom).html();
  z *= 1 / zoomAmount;
  $(zoom).html(z);
  draw();
}

function zoomOut() {
  upperBounds.X /= zoomAmount;
  upperBounds.Y /= zoomAmount;
  lowerBounds.X = center.X - upperBounds.X / 2;
  lowerBounds.Y = center.Y - upperBounds.Y / 2;
  var z = $(zoom).html();
  z *= zoomAmount;
  $(zoom).html(z);
  draw();
}

function full() {
  lowerBounds.X = initBounds.X;
  lowerBounds.Y = initBounds.Y;
  upperBounds.X = initBounds.Xu;
  upperBounds.Y = initBounds.Yu;
  center.X = 0;
  center.Y = 0;
  $(zoom).html(1);  
  draw();
}

//checks whether point is in either the cardioid
//or largest bulb. 
function cardCheck(re, im) {
  var q = Math.pow(re - 1 / 4, 2) + Math.pow(im, 2);
  return q * (q + (re - 1 / 4)) <= ((1 / 4) * Math.pow(im, 2));
}

function draw() {
  escapeMax = parseInt($(cycles).val());
  ctx.clearRect(0, 0, canv.width, canv.height);
  doMand();
  $(re).html("Re " + center.X);
  $(im).html("Im " + center.Y);
}

$('#canv').on('mousedown', function(e) {
  toCenter(e);
});
$('#in').click(zoomIn);
$('#out').click(zoomOut);
$('#full').click(full);

$(document).ready(function() {  
  $(cycles).val(escapeMax);
  buildRgb(RGB);
  //console.log(RGB);
  draw();
});
