//NIBBLED
//Rogue-like Dungeon Crawler for FCC
//
//Uses HTML5 canvas for drawing.
//
//Instructions: use u, h, j, k to move; beat the snake to get the key to the exit.
//Attack by running into enemy. Your weapon wears out as you use it, and they're
//hard to come by. Beat small enemies to raise your level.
//
//TODO: put most globals into objects; use object constructors for player and snake;
//      condense some functions such as arrayToCanvas; disable input for short interval
//      after each move; balance attack/health/powerups; snake gets longer if it eats
//      a rodent; mobile version;

//Some React because it was required...
var Mainboard = React.createClass({
    render: function() {
        return (<canvas id="canv"></canvas>);
    }
});

ReactDOM.render(<Mainboard />, NIBBLED);

$(document).ready(function() {
    var firstRun = true;
    var canvas = document.getElementById("canv");
    var ctx = canvas.getContext("2d");
    var board = [];
    var squareSize = 15; //px
    var boardSize = { "w": 0, "h": 0 }; //how many squares on a side
    var colors = { "roomColor": '#615d50',
                   "snakeColor": "#006600",
                   "wallColor": '#191919',
                   "keyColor": '#ffd700',
                   "exitColor": '#fae878',
                   "healthItemColor": '#00ff00',
                   "weaponColor": '#7f0000',
                   "rodentColor": '#907871',
                   "attackColor": '#ff0000' };
    var sharpness = 100;
    var numWeapons = 2;
    var alreadyFoundKnife = false; //so you
    var numberOfHealthItems = 5; //how many on board at once
    var healthPowerupVal = 20;
    var exitCoords = { "x1": 0, "y1": 0, "x2": 0, "y2": 0 }; //updated when board drawn
    var playerPos = { "x": 0, "y": 0 };
    var playerStats = {
        "health": 100,
        "level": 1,
        "xp": 0,
        "weapon": "nothing!",
        "haveKey": false };
    var lightRadius = 0; //squares - increases to lightRadiusMax at start
    var lightRadiusMax = 5;
    var levelUpAt = 50; //xp
    var snakeStats = { "health": 100, "level": 6, "attkAmt": 0, "initLevel": 6, "attacked": false };
    var snakeStartCoords = [{ "x": 0, "y": 0 }, //index 0 = head, max = tail
        { "x": 0, "y": 0 },
        { "x": 0, "y": 0 },
        { "x": 0, "y": 0 },
        { "x": 0, "y": 0 },
        { "x": 0, "y": 0 },
        { "x": 0, "y": 0 }];
    var snakeCoords = [];
    var snakeDamage = 18; //damage it gets from attack
    var snakeNoWeaponDamage = 12; //damage it does to you
    var snakeAlive = true;
    var rodent = { "health": 10, "level": 1, "attack": 8, "damage": 8 }; //attack given; damage taken
    var numRodents = 5; //how many there are to start
    var rodentList = {}; //stores a list of active ones to control movement
    var rodentsActive = false; //will store setInterval

    $(document).keypress(function(event) {
        doMove(String.fromCharCode(event.which));
    });

    //sets up everything
    init();

    function init() {
        //set board to size of window
        setCanvasSize();
        //generate map
        rndArray(boardSize.w, boardSize.h);
        //place player (fixed starting square)
        board[Math.round(boardSize.w / 4)][boardSize.h - 1] = 'P';
        playerPos.x = Math.round(boardSize.w / 4);
        playerPos.y = boardSize.h - 1;
        //place snake
        initSnake();
        //place rodents
        initRodents();
        //set initial stats
        playerStats.health = 100;
        playerStats.xp = 0;
        playerStats.level = 1;
        playerStats.weapon = "nothing!";
        playerStats.haveKey = false;
        lightRadius = 0;
        alreadyFoundKnife = false;
        sharpness = 100;
        $("#health").html(playerStats.health + '%');
        $("#xp").html(playerStats.xp);
        $("#level").html(playerStats.level);
        $("#weapon").html(playerStats.weapon);
        $("#status").html("Your adventure begins...");
        //place all items
        placeItems();
        start();
    }

    //called whever key pressed (moves player)
    function doMove(key) {
        switch (key) {
            //these cases test the square you're moving into, not the current square...
            case 'h':
                if (playerPos.x === 0) return;
                interactions(playerPos.x - 1, playerPos.y);
                if (board[playerPos.x - 1][playerPos.y] === 0 || board[playerPos.x - 1][playerPos.y] === 'S' || (typeof board[playerPos.x - 1][playerPos.y] !== "number" && typeof board[playerPos.x - 1][playerPos.y] !== "string")) return; //if you bump unto a rodent, snake or wall
                board[playerPos.x][playerPos.y] = 1;
                playerPos.x = parseInt(playerPos.x) - 1;
                board[playerPos.x][playerPos.y] = 'P';
                break;
            case 'u':
                if (playerPos.y === 0) return;
                interactions(playerPos.x, playerPos.y - 1);
                if (board[playerPos.x][playerPos.y - 1] === 0 || board[playerPos.x][playerPos.y - 1] === 'S' || (typeof board[playerPos.x][playerPos.y - 1] !== "number" && typeof board[playerPos.x][playerPos.y - 1] !== "string")) return;
                board[playerPos.x][playerPos.y] = 1;
                playerPos.y = parseInt(playerPos.y) - 1;
                board[playerPos.x][playerPos.y] = 'P';
                break;
            case 'j':
                if (playerPos.y == boardSize.h - 1) return;
                interactions(playerPos.x, playerPos.y + 1);
                if (board[playerPos.x][playerPos.y + 1] === 0 || board[playerPos.x][playerPos.y + 1] === 'S' || (typeof board[playerPos.x][playerPos.y + 1] !== "number" && typeof board[playerPos.x][playerPos.y + 1] !== "string")) return;
                board[playerPos.x][playerPos.y] = 1;
                playerPos.y = parseInt(playerPos.y) + 1;
                board[playerPos.x][playerPos.y] = 'P';
                break;
            case 'k':
                if (playerPos.x == boardSize.w - 1) return;
                interactions(playerPos.x + 1, playerPos.y);
                if (board[playerPos.x + 1][playerPos.y] === 0 || board[playerPos.x + 1][playerPos.y] === 'S' || (typeof board[playerPos.x + 1][playerPos.y] !== "number" && typeof board[playerPos.x + 1][playerPos.y] !== "string")) return;
                board[playerPos.x][playerPos.y] = 1;
                playerPos.x = parseInt(playerPos.x) + 1;
                board[playerPos.x][playerPos.y] = 'P';
                break;
        }
        clearBoard();
        arrayToCanvas(boardSize.w, boardSize.h);
        //make sure the exit squares are still there
        if (board[exitCoords.x1][exitCoords.y1] != 'P') {
            board[exitCoords.x1][exitCoords.y1] = 'E';
        }
        if (board[exitCoords.x2][exitCoords.y2] != 'P') {
            board[exitCoords.x2][exitCoords.y2] = 'E';
        }
    }

    //gets current window size then sets canvas size and board size
    function setCanvasSize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        boardSize.w = Math.floor(w / squareSize);
        boardSize.h = Math.floor(h / squareSize);
    }

    function clearBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return true;
    }

    //generates map
    function rndArray(n, m) {
        board = [];
        var new_board = []; //DEL
        var tempArr = [];

        //width of each of the rooms
        var rnd_len1 = Math.round(Math.random() * ((3 / 8) * n - (1 / 4) * n) + Math.round((1 / 4) * n));
        var rnd_len2 = Math.round(Math.random() * ((3 / 8) * n - (1 / 4) * n) + Math.round((1 / 4) * n));
        var rnd_len3 = Math.round(Math.random() * ((3 / 8) * n - (1 / 4) * n) + Math.round((1 / 4) * n));
        var rnd_len4 = Math.round(Math.random() * ((3 / 8) * n - (1 / 4) * n) + Math.round((1 / 4) * n));

        //position of left edges of rooms
        var rnd_start1 = Math.floor(Math.random() * ((n / 2 - rnd_len1) - 0) + 0);
        var rnd_start3 = Math.floor(Math.random() * ((n / 2 - rnd_len1) - 0) + 0);
        var rnd_start2 = Math.floor(Math.random() * ((n - rnd_len2) - n / 2) + n / 2);
        var rnd_start4 = Math.floor(Math.random() * ((n - rnd_len2) - n / 2) + n / 2);

        //this draws the rooms
        //the rooms are always half the screen height, plus or minus one
        for (var i = 0; i < n; ++i) {
            tempArr = [];
            for (var j = 0; j < m; ++j) {
                if (j <= (m / 2 - 1) && i >= rnd_start1 && i < (rnd_start1 + rnd_len1)) tempArr.push(1);
                else if (j <= (m / 2 + 1) && i >= rnd_start2 && i < (rnd_start2 + rnd_len2)) tempArr.push(1);
                else if (j > m / 2 && i >= rnd_start3 && i < (rnd_start3 + rnd_len3)) tempArr.push(1);
                else if (j > (m / 2 + 2) && i >= rnd_start4 && i < (rnd_start4 + rnd_len4)) tempArr.push(1);
                else tempArr.push(0);
            }
            board.push(tempArr);
        }
        //call with right edges of left rooms and left edges of right rooms
        makePaths(rnd_start1 + rnd_len1, rnd_start2, rnd_start3 + rnd_len3, rnd_start4);

        //place exit
        board[rnd_start2 + rnd_len2 - 1][0] = 'E';
        board[rnd_start2 + rnd_len2 - 1][1] = 'E';
        exitCoords.x1 = rnd_start2 + rnd_len2 - 1;
        exitCoords.y1 = 0;
        exitCoords.x2 = rnd_start2 + rnd_len2 - 1;
        exitCoords.y2 = 1;
        return true;
    }

    //makes the stair-step corridors between rooms
    function makePaths(path1Start, path1End, path2Start, path2End) {
        //make corridor between top two rooms
        for (var i = path1Start, j = 0, k = 0; i <= path1End; ++i, ++j) {
            board[i][1 + k] = 1;
            board[i + 1][1 + k] = 1;
            board[i][2 + k] = 1;
            if (j == 4) {
                j = 0;
                ++k;
            }
        }
        //& between bottom two
        for (var i = path2Start, j = 0, k = 0; i <= path2End; ++i, ++j) {
            board[i][boardSize.h - 2 - k] = 1;
            board[i + 1][boardSize.h - 2 - k] = 1;
            board[i][boardSize.h - 3 - k] = 1;
            if (j == 4) {
                j = 0;
                ++k;
            }
        }
        //link rooms vertically - always at same position
        board[Math.round(boardSize.w / 4)][Math.round(boardSize.h / 2 - 1)] = 1;
        board[Math.round(boardSize.w / 4 + 1)][Math.round(boardSize.h / 2 - 1)] = 1;
        board[Math.round((3 * boardSize.w) / 4)][Math.round(boardSize.h / 2 + 1)] = 1;
        board[Math.round((3 * boardSize.w) / 4 + 1)][Math.round(boardSize.h / 2 + 1)] = 1;

        board[Math.round(boardSize.w / 4)][Math.round(boardSize.h / 2)] = 1;
        board[Math.round(boardSize.w / 4 + 1)][Math.round(boardSize.h / 2)] = 1;
        board[Math.round((3 * boardSize.w) / 4)][Math.round(boardSize.h / 2 + 2)] = 1;
        board[Math.round((3 * boardSize.w) / 4 + 1)][Math.round(boardSize.h / 2 + 2)] = 1;
    }

    //draws array to canvas squares
    //maybe someday future-me will simplify it...
    function arrayToCanvas(width, height) {
        var darkenAmt = 0;
        for (var i = 0; i < width; ++i) {
            for (var j = 0; j < height; ++j) {
                darkenAmt = visibility(i, j);
                //if square is outside visibility radius, draw black square
                if (darkenAmt === 3) {
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                } else if (board[i][j]) {
                    //it's only an object if it's a rodent...
                    if (typeof board[i][j] != "number" && typeof board[i][j] != "string") {
                        switch (darkenAmt) {
                            case 1:
                                ctx.fillStyle = darken1(colors.rodentColor);
                                break;
                            case 2:
                                ctx.fillStyle = darken2(colors.rodentColor);
                                break;
                            default:
                                //turns red if you're attacking
                                if (board[i][j].attacked) ctx.fillStyle = colors.attackColor;
                                else ctx.fillStyle = colors.rodentColor;
                        }
                        ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                    } else {
                        switch (board[i][j]) {
                            case 'P':
                                if(playerStats.health == ":(") ctx.fillStyle = colors.attackColor;
                                else ctx.fillStyle = "#ffffff";
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                                break;
                            case 'S':
                                //use appropriate darkening levels (could probably condense to a function)
                                switch (darkenAmt) {
                                    case 1:
                                        ctx.fillStyle = darken1(colors.snakeColor);
                                        break;
                                    case 2:
                                        ctx.fillStyle = darken2(colors.snakeColor);
                                        break;
                                    default:
                                        if(snakeStats.attacked) ctx.fillStyle = colors.attackColor;
                                        else ctx.fillStyle = colors.snakeColor;
                                }
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                                break;
                            case 'H':
                                switch (darkenAmt) {
                                    case 1:
                                        ctx.fillStyle = darken1(colors.healthItemColor);
                                        break;
                                    case 2:
                                        ctx.fillStyle = darken2(colors.healthItemColor);
                                        break;
                                    default:
                                        ctx.fillStyle = colors.healthItemColor;
                                }
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                                break;
                            case 'W':
                                switch (darkenAmt) {
                                    case 1:
                                        ctx.fillStyle = darken1(colors.weaponColor);
                                        break;
                                    case 2:
                                        ctx.fillStyle = darken2(colors.weaponColor);
                                        break;
                                    default:
                                        ctx.fillStyle = colors.weaponColor;
                                }
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                                break;
                            case 'K':
                                switch (darkenAmt) {
                                    case 1:
                                        ctx.fillStyle = darken1(colors.keyColor);
                                        break;
                                    case 2:
                                        ctx.fillStyle = darken2(colors.keyColor);
                                        break;
                                    default:
                                        ctx.fillStyle = colors.keyColor;
                                }
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                                break;
                            case 'E':
                                switch (darkenAmt) {
                                    case 1:
                                        ctx.fillStyle = darken1(colors.exitColor);
                                        break;
                                    case 2:
                                        ctx.fillStyle = darken2(colors.exitColor);
                                        break;
                                    default:
                                        ctx.fillStyle = colors.exitColor;
                                }
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                                break;
                            default:
                                switch (darkenAmt) {
                                    case 1:
                                        ctx.fillStyle = darken1(colors.roomColor);
                                        break;
                                    case 2:
                                        ctx.fillStyle = darken2(colors.roomColor);
                                        break;
                                    default:
                                        ctx.fillStyle = colors.roomColor;
                                }
                                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                        }
                    }
                } else {
                    switch (darkenAmt) {
                        case 1:
                            ctx.fillStyle = darken1(colors.wallColor);
                            break;
                        case 2:
                            ctx.fillStyle = darken2(colors.wallColor);
                            break;
                        default:
                            ctx.fillStyle = colors.wallColor;
                    }
                    ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
                }
            }
        }
    }

    function placeItems() {
        //places set number of health recovery items at random
        for(var z = 0; z < numberOfHealthItems; ++z) {
            spawnHealth();
        }

        //places weapons
        for(var z = 0; z < numWeapons; ++z) {
            do {
                var rndX = Math.floor(Math.random() * boardSize.w);
                var rndY = Math.floor(Math.random() * boardSize.h);
            } while (!board[rndX][rndY]); //try again if it places it in a wall or other piece
            board[rndX][rndY] = 'W';
        }
    }

    //places a health item at random
    function spawnHealth() {
        do {
            var rndX = Math.floor(Math.random() * boardSize.w);
            var rndY = Math.floor(Math.random() * boardSize.h);
        } while (!board[rndX][rndY]); //try again if it places it in a wall or other piece
        board[rndX][rndY] = 'H';
    }

    //this handles interaction of the player with items and enemies
    function interactions(newXpos, newYpos) {
        //if you approach a rodent...
        if (typeof board[newXpos][newYpos] !== "number" && typeof board[newXpos][newYpos] !== "string") {
            attackHit('r', newXpos, newYpos);
            if (playerStats.weapon != 'knife') {
                var multiplier = Math.random();
                board[newXpos][newYpos].health -= 1;
                playerStats.health -= Math.round(multiplier * rodent.attack);
                if (playerStats.health <= 0) lose();
                if (typeof playerStats.health == "number") $("#health").html(playerStats.health + '%');
                else $("#health").html(playerStats.health);
                if (board[newXpos][newYpos].health <= 0) { //should combine these into function
                    $("#status").html("Rodent: dead.");
                    playerStats.xp += 5;
                    $("#xp").html(playerStats.xp);
                    board[newXpos][newYpos] = 1;
                    arrayToCanvas(boardSize.w, boardSize.h);
                    spawnRodent();
                } else {
                    $("#status").html("Rodent: Level " + board[newXpos][newYpos].level + ". Health: " + board[newXpos][newYpos].health + "\nYou kicked it. It doesn't look happy.");
                }
            } else if (playerStats.weapon == 'knife') {
                var multiplier = Math.random();
                //knife gets duller when you use it
                useKnife(multiplier);
                //multiplier adds randomness to attack amount
                multiplier = Math.random();
                multiplier += (playerStats.level - 1) / 2.0; //attack multiplier increases 1+(1/2)*level
                //rodent gets random damage when you attack it
                var damage = Math.round((rodent.damage * (sharpness / 100) * multiplier))
                //snakeStats.attkAmt += damage;
                board[newXpos][newYpos].health -= damage;
                playerStats.xp += 1;
                $("#xp").html(playerStats.xp);
                if (playerStats.xp >= levelUpAt) {
                    playerStats.level += 1;
                    playerStats.xp -= levelUpAt;
                    $("#level").html(playerStats.level);
                }
                if (board[newXpos][newYpos].health <= 0) {
                    $("#status").html("Rodent: dead.");
                    playerStats.xp += 5;
                    $("#xp").html(playerStats.xp);
                    board[newXpos][newYpos] = 1;
                    arrayToCanvas(boardSize.w, boardSize.h);
                    spawnRodent();
                } else {
                    //use message from useKnife() if knife gone
                    if (sharpness > 1) $("#status").html("Rodent: Level " + board[newXpos][newYpos].level + ". Health: " + board[newXpos][newYpos].health + "\nYou attack with your knife! It attacks back!");
                    multiplier = Math.random();
                    playerStats.health = Math.round(parseInt($("#health").html()) - (rodent.attack * multiplier));
                    if (playerStats.health <= 0) lose();
                    $("#health").html(playerStats.health);
                }
            }
        } else {
            //anything else...
            switch (board[newXpos][newYpos]) {
                //if you're by a wall
                case 0:
                    $("#status").html("That's a wall.");
                    break;
                //if health powerup
                case 'H':
                    if (parseInt($("#health").html()) == 100) {
                        $("#status").html("Your health is already maxed out!");
                    } else {
                        $("#status").html("Your health increased by " + healthPowerupVal + '%'); //yeah, not really %
                        if (parseInt($("#health").html()) + 20 >= 100) {
                            $("#health").html(100);
                        } else {
                            $("#health").html(parseInt($("#health").html()) + 20);
                        }
                    }
                    spawnHealth();
                    break;
                //if you find a weapon
                case 'W':
                    if (alreadyFoundKnife) {
                        $("#status").html("It's like the one you found earlier, but it's still sharp.");
                    } else {
                        $("#status").html("You found a large, very sharp knife. Use carefully.");
                        playerStats.weapon = "knife";
                        alreadyFoundKnife = true;
                    }
                    sharpness = 100;
                    $("#weapon").html("Knife. Sharpness: " + sharpness);
                    break;
                //fighing the snake
                case 'S':
                    attackHit('s', newXpos, newYpos);
                    if (playerStats.weapon != 'knife') {
                        var multiplier = Math.random();
                        snakeStats.health -= 1;
                        playerStats.health -= Math.round(multiplier * snakeNoWeaponDamage);
                        if (playerStats.health <= 0) lose();
                        if (typeof playerStats.health == "number") $("#health").html(playerStats.health + '%');
                        else $("#health").html(playerStats.health);
                        $("#status").html("Snake: Level " + snakeStats.level + ". Health: " + snakeStats.health + "\nYou kicked it. It doesn't look happy.");
                    } else if (playerStats.weapon == 'knife') {
                        var multiplier = Math.random();
                        multiplier += (playerStats.level - 1) / 2.0; //attack multiplier increases 1+(1/2)*level
                        //knife gets duller when you use it
                        useKnife(multiplier);
                        multiplier = Math.random();
                        //snake gets random damage when you cut it
                        var damage = Math.round((snakeDamage * (sharpness / 100) * multiplier))
                        snakeStats.attkAmt += damage;
                        snakeStats.health -= damage;
                        //snake gets shorter!
                        if(snakeStats.attkAmt > (100 / snakeStats.initLevel)) {
                            snakeStats.attkAmt = snakeStats.attkAmt % (100 / snakeStats.initLevel);
                            snakeStats.level -= 1;
                            var tail = snakeCoords.pop();
                            board[tail.x][tail.y] = 1;
                            arrayToCanvas(boardSize.w, boardSize.h);
                        }
                        if(snakeStats.health <= 0 || snakeStats.level < 1) {
                            $("#status").html("Snake: dead.");
                            win();
                        }
                        //if knife breaks, display different message (from useKnife()).
                        if(sharpness > 1) $("#status").html("Snake: Level " + snakeStats.level + ". Health: " + snakeStats.health + "\nYou attack with your knife! It attacks back!");
                        multiplier = Math.random();
                        playerStats.health = Math.round(parseInt($("#health").html()) - (20 * multiplier));
                        if(playerStats.health <= 0) lose();
                        $("#health").html(playerStats.health);
                    }
                    break;
                case 'K':
                    playerStats.haveKey = true;
                    $("#status").html("You recovered the key to the exit!");
                    break;
                case 'E':
                    if (!playerStats.haveKey) {
                        $("#status").html("Hey! Listen! You'll need a key to get through this door...");
                    } else { //have key
                        alert("Hey! You won!");
                        var ending = setInterval(function() {
                            --lightRadius;
                            arrayToCanvas(boardSize.w, boardSize.h);
                            if (lightRadius < -1) {
                                clearInterval(ending);
                                //clearInterval(snakeAlive);
                                clearInterval(rodentsActive); //put it here so they keep moving until you leave
                                //init();
                            }
                        }, 300);
                    }
                    break;
                default:
            }
        }
    }

    function attackHit(enemy, xpos, ypos) {
        var temp = '';
        switch (enemy) {
            case 'r':
                //so only the one you're attacking blinks red
                if (typeof board[xpos][ypos] == 'object') board[xpos][ypos].attacked = true;
                arrayToCanvas(boardSize.w, boardSize.h);
                var attack = setTimeout(function() {
                    if (typeof board[xpos][ypos] == 'object') board[xpos][ypos].attacked = false;
                    arrayToCanvas(boardSize.w, boardSize.h);
                }, 80);
                break;
            case 's':
                snakeStats.attacked = true;
                arrayToCanvas(boardSize.w, boardSize.h);
                var attack = setTimeout(function() {
                    snakeStats.attacked = false;
                    arrayToCanvas(boardSize.w, boardSize.h);
                }, 100);
                break;
            default:
                return;
        }
    }

    //called when when snake or rodent interaction
    function useKnife(rng) {
        sharpness -= Math.round(5 * rng);
        if (sharpness < 1) {
            sharpness = 0;
            playerStats.weapon = "Nothing!";
            $("#weapon").html(playerStats.weapon);
            $("#status").html("Your knife broke! I told you to use carefully!");
        } else {
            $("#weapon").html("Knife. Sharpness: " + sharpness);
        }
    }

    function initSnake() {
        snakeCoords = JSON.parse(JSON.stringify(snakeStartCoords));
        snakeStats.health = 100;
        snakeStats.level = snakeStats.initLevel;
        snakeStats.attkAmt = 0;
        console.log("initsnake: "+snakeCoords);
        do {
            var rndX = Math.floor(Math.random() * boardSize.w);
            var rndY = Math.floor(Math.random() * boardSize.h);
        } while (!board[rndX][rndY]); //try again if it places it in a wall or other piece
        board[rndX][rndY] = 'S';
        snakeCoords[0].x = rndX;
        snakeCoords[0].y = rndY;
        arrayToCanvas(boardSize.w, boardSize.h);
        snakeAlive = setInterval(function() {
            if(snakeStats.attacked) snakeStats.attacked = false;//keeps color from getting stuck
            moveSnake();
        }, 800);
    }

    //controls snake movement. it moves at random.
    function moveSnake() {
        var canMove = false;
        var direction;
        var newHeadX, newHeadY;
        var possible = { 'L': 1, 'U': 1, 'R': 1, 'D': 1 }; //remembers if direction has been tried
        //keep trying a new direction until one works.
        //if none work, reverse the snake and go back.
        do {
            direction = Math.floor(Math.random() * 4);
            switch (direction) {
                case 0:
                    if (snakeCoords[0].x === 0) {
                        possible.L = 0;
                        break; //at left edge of screen
                    }
                    if (board[snakeCoords[0].x - 1][snakeCoords[0].y] === 1) canMove = true; //LEFT
                    else possible.L = 0;
                    newHeadX = snakeCoords[0].x - 1;
                    newHeadY = snakeCoords[0].y;
                    break;
                case 1:
                    if (snakeCoords[0].y === 0) {
                        possible.U = 0;
                        break; //at top edge of screen
                    }
                    if (board[snakeCoords[0].x][snakeCoords[0].y - 1] === 1) canMove = true; //UP
                    else possible.U = 0;
                    newHeadX = snakeCoords[0].x;
                    newHeadY = snakeCoords[0].y - 1;
                    break;
                case 2:
                    if (snakeCoords[0].x == boardSize.w - 1) {
                        possible.R = 0;
                        break; //at right edge of screen
                    }
                    if (board[snakeCoords[0].x + 1][snakeCoords[0].y] === 1) canMove = true; //RIGHT
                    else possible.R = 0;
                    newHeadX = snakeCoords[0].x + 1;
                    newHeadY = snakeCoords[0].y;
                    break;
                case 3:
                    if (snakeCoords[0].y == boardSize.h - 1) {
                        possible.D = 0;
                        break; //at bottom edge of screen
                    }
                    if (board[snakeCoords[0].x][snakeCoords[0].y + 1] === 1) canMove = true; //DOWN
                    else possible.D = 0;
                    newHeadX = snakeCoords[0].x;
                    newHeadY = snakeCoords[0].y + 1;
                    break;
            }
            //if snake gets stuck, reverse - infinite loop otherwise
            if (possible.L == 0 && possible.U == 0 && possible.R == 0 && possible.D == 0) {
                console.log("whoops");
                snakeCoords.reverse(); //built-in method
                possible.L = 1;
                possible.U = 1;
                possible.R = 1;
                possible.D = 1;
                continue;
            }
        } while (!canMove);
        board[newHeadX][newHeadY] = 'S';
        board[snakeCoords[snakeCoords.length - 1].x][snakeCoords[snakeCoords.length - 1].y] = 1; //turn off tail square
        snakeCoords.pop();
        snakeCoords.unshift({ 'x': newHeadX, 'y': newHeadY }); //add new head square

        clearBoard();
        arrayToCanvas(boardSize.w, boardSize.h);
    }

    function initRodents() {
        rodentList = {};//you know how long that took to figure out?
        for (var r = 0; r < numRodents; ++r) {
            spawnRodent();
        }
        moveRodents();
    }

    function spawnRodent() {
        var temp = {};
        var rndX = 0;
        var rndY = 0;
        do {
            rndX = Math.floor(Math.random() * boardSize.w);
            rndY = Math.floor(Math.random() * boardSize.h);
        } while (!board[rndX][rndY]); //try again if it places it in a wall or other piece
        temp.health = rodent.health;
        temp.attack = rodent.attack;
        temp.level = rodent.level;
        temp.attacked = false; //turns true for a blip
        temp.coords = {};
        temp.coords.x = rndX;
        temp.coords.y = rndY;
        board[rndX][rndY] = temp; //board itself stores rodent stats - rodentList only stores x & y coords
        rodentList[JSON.stringify(temp.coords)] = temp.coords; //store coords to list using stringified version as index
        temp = {}; //maybe better to do explicit deep copy
    }

    //for now, they all move in unison
    function moveRodents() {
        rodentsActive = setInterval(function() {
            var keys = Object.keys(rodentList);
            keys.forEach(function(i) {
                if(board[rodentList[i].x][rodentList[i].y].attacked) board[rodentList[i].x][rodentList[i].y].attacked = false;//keeps color from getting stuck
                //mostly cut & pasted from moveSnake() with some changes.
                //maybe combine both into same function someday...
                var canMove = false;
                var direction;
                var newX, newY;
                //remembers if direction has been tried - prevents infinite loop edge cases
                var possible = { 'L': 1, 'U': 1, 'R': 1, 'D': 1 };
                //keep trying a new direction until one works.
                do {
                    direction = Math.floor(Math.random() * 4);
                    switch (direction) {
                        case 0:
                            if (rodentList[i].x === 0) {
                                possible.L = 0;
                                break; //at left edge of screen
                            }
                            if (board[rodentList[i].x - 1][rodentList[i].y] === 1) canMove = true; //LEFT
                            else possible.L = 0;
                            newX = rodentList[i].x - 1;
                            newY = rodentList[i].y;
                            break;
                        case 1:
                            if (rodentList[i].y === 0) {
                                possible.U = 0;
                                break; //at top edge of screen
                            }
                            if (board[rodentList[i].x][rodentList[i].y - 1] === 1) canMove = true; //UP
                            else possible.U = 0;
                            newX = rodentList[i].x;
                            newY = rodentList[i].y - 1;
                            break;
                        case 2:
                            if (rodentList[i].x == boardSize.w - 1) {
                                possible.R = 0;
                                break; //at right edge of screen
                            }
                            if (board[rodentList[i].x + 1][rodentList[i].y] === 1) canMove = true; //RIGHT
                            else possible.R = 0;
                            newX = rodentList[i].x + 1;
                            newY = rodentList[i].y;
                            break;
                        case 3:
                            if (rodentList[i].y == boardSize.h - 1) {
                                possible.D = 0;
                                break; //at bottom edge of screen
                            }
                            if (board[rodentList[i].x][rodentList[i].y + 1] === 1) canMove = true; //DOWN
                            else possible.D = 0;
                            newX = rodentList[i].x;
                            newY = rodentList[i].y + 1;
                            break;
                    }
                    //if no possible moves for rodent, give up for now
                    if (possible.L == 0 && possible.U == 0 && possible.R == 0 && possible.D == 0) {
                        console.log("R whoops");
                        possible.L = 1;
                        possible.U = 1;
                        possible.R = 1;
                        possible.D = 1;
                        break;
                    }
                } while (!canMove);
                if (typeof board[rodentList[i].x][rodentList[i].y] == "object") { //prevents weird behavior
                    board[newX][newY] = board[rodentList[i].x][rodentList[i].y]; //move reference
                    board[rodentList[i].x][rodentList[i].y] = 1; //turn off previous square
                }
                rodentList[i].x = newX;
                rodentList[i].y = newY;

                //no board redraw here -- snake movement takes care of it
            }); //forEach
        }, 1000);
    }

    function visibility(x, y) {
        //return 0;///////////////////////////////////////////////////////////////
        var darkenAmt = 0;
        if (y < playerPos.y - lightRadius || y > playerPos.y + lightRadius || x < playerPos.x - lightRadius || x > playerPos.x + lightRadius)
            darkenAmt = 3;
        else if (y == playerPos.y - lightRadius || y == playerPos.y + lightRadius || x == playerPos.x - lightRadius || x == playerPos.x + lightRadius)
            darkenAmt = 2;
        else if (y == playerPos.y - (lightRadius - 1) || y == playerPos.y + (lightRadius - 1) || x == playerPos.x - (lightRadius - 1) || x == playerPos.x + (lightRadius - 1))
            darkenAmt = 1;
        else
            darkenAmt = 0;
        return darkenAmt;
    }

    function win() {
        clearInterval(snakeAlive);
        board[snakeCoords[0].x][snakeCoords[0].y] = 1;
        if (snakeCoords.length > 1) board[snakeCoords[1].x][snakeCoords[1].y] = 1;
        //snakeCoords = [];
        //place key randomly within two squares of player -
        //makes sure the key doesn't disappear if you step on it
        var rndX;
        var rndY;
        var rndSignX;
        var rndSignY;
        var signX;
        var signY;
        do {
            rndX = Math.floor(Math.random() * 2) + 1;
            rndY = Math.floor(Math.random() * 2) + 1;
            signX = Math.random();
            signY = Math.random();
            if (rndSignX < .5) signX = 1;
            else signX = -1;
            if (rndSignY < .5) signY = 1;
            else signY = -1;
        } while (board[playerPos.x + (rndX * signX)][playerPos.y + (rndY * signY)] !== 1);
        board[playerPos.x + (rndX * signX)][playerPos.y + (rndY * signY)] = 'K';
    }

    function lose() {
        playerStats.health = ":(";
        $("#status").html("Our adventurer didn't make it this time...");
        var ending = setInterval(function() {
            --lightRadius;
            arrayToCanvas(boardSize.w, boardSize.h);
            if (lightRadius < -1) {
                clearInterval(snakeAlive);
                clearInterval(rodentsActive);
                clearInterval(ending);
                alert("You lost.");
                init();
            }
        }, 300);
    }

    function start() {
        var beginning = setInterval(function() {
            lightRadius++;
            arrayToCanvas(boardSize.w, boardSize.h);
            if (lightRadius >= lightRadiusMax) clearInterval(beginning);
        }, 300);
    }

    //could condense these into single function
    function darken1(hex) {
        var r = hexToRgb(hex).r;
        var g = hexToRgb(hex).g;
        var b = hexToRgb(hex).b;
        r = Math.round(r * .65);
        g = Math.round(g * .65);
        b = Math.round(b * .65);
        return rgbToHex(r, g, b);
    }

    function darken2(hex) {
        var r = hexToRgb(hex).r;
        var g = hexToRgb(hex).g;
        var b = hexToRgb(hex).b;
        r = Math.round(r * .4);
        g = Math.round(g * .4);
        b = Math.round(b * .4);
        return rgbToHex(r, g, b);
    }

    /////////////////////////////////////////////////////////////////////////////
    //from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb//
    /////////////////////////////////////////////////////////////////////////////
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    /////////////////////////////////////////////////////////////////////////////
    //                                                                         //
    /////////////////////////////////////////////////////////////////////////////
});
