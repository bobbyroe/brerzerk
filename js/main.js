// GLOBALS:
// Events
// getHowlerAudio, removeListeners
// getPlayer, drawWalls, getEvilOtto
// soundsInSequence, getBullet, getPossiblePositions, getRobot, 

// make stuff look pixelated
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi

/*******************************************************************************
 * Setup
 *******************************************************************************/
var BZRK = {}; // game object
var player;
var evil_otto;
var gameState;
var timer = 0;						// *** primitive – not passed by reference!
var num_players_remaining = 3;		// *** primitive – not passed by reference!
var walls = [];
var robots = [];
var bullets = [];
var next_robot_bullet_time = 150;	// *** primitive – not passed by reference!
var enemy_color = 0x000000;
var robot_bullets = [];
var max_robot_bullets = 1; 			// *** primitive – not passed by reference!
var score = 0;						// *** primitive – not passed by reference!
var level_bonus = 0;				// *** primitive – not passed by reference!
var game_over_timer = -1;			// *** primitive – not passed by reference!
var is_game_restarting = true; 		// *** primitive – not passed by reference!

var pubSub = new Events(BZRK);
var all_sprites = {};

// exit level velocity
var x_vel = 0;
var y_vel = 0;
var start_pos = {x: 90, y: 300};

var renderer = PIXI.autoDetectRenderer(
	1024, 768, 
	{antialias: false, transparent: false, resolution: 1}
);
document.body.appendChild(renderer.view);



var stage = new PIXI.Container();
renderer.render(stage);

var maze = new PIXI.Container();
stage.addChild(maze);

// score, game over screen ...
var UI = getGameUI({stage});
UI.splashScreen.create();

// APP STARTS-UP HERE ...
PIXI.loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.add("images/evil-otto.png")
	.add("images/charset.png")
	.load(setup);

var sound = getHowlerAudio();

function setup() {
	
	pubSub.listenTo(BZRK, 'all_robots_killed', handleAllRobotsKilled);
	pubSub.listenTo(BZRK, 'got_the_humanoid', handleHumanoidGot);
	resetGameState();
	gameLoop();	
}

function resetGameState () {
	// listen for any key
	function fn () { 
		window.removeEventListener("keydown", fn); 
		gameState = gameRestarting;
		renderer.view.className = "";
	}
	window.addEventListener("keydown", fn, false);
	gameState = gameDormant;
}

/*******************************************************************************
 * GAME PLAY LOOP
 *******************************************************************************/
function gameLoop() {

	requestAnimationFrame(gameLoop);
	timer += 1;
	gameState();
	renderer.render(stage);
}

/*******************************************************************************
 * SETUP GAME
 *******************************************************************************/
function gameRestarting () {
	
	// clean up
	maze.x = 0;
	maze.y = 0;
	maze.removeChildren();
	walls = [];
	robots = [];
	if (evil_otto != null) { evil_otto.destroy(); } // clean up
	removeListeners();
	UI.splashScreen.hide();

	UI.resetScore(num_players_remaining);

	// initialize
	timer = 0;
	next_robot_bullet_time = 150;
	enemy_color = getEnemyColor();
	max_robot_bullets = getMaxNumRobotBullets();
	
	if (num_players_remaining > 0) {
		player = getPlayer({start_pos, bullets});
		maze.addChild(player);
		drawWalls({walls, enemy_color, maze, start_pos, quad_width, quad_height });
		gameState = gameStart;
		is_game_restarting = false; 

	} else { // RESET
		score = 0;
		num_players_remaining = 3;
		game_over_timer = timer + 30;
		gameState = gameOver;
		is_game_restarting = true;
	}

	evil_otto = getEvilOtto({ pos: {x: 0, y: 0}, player, robots, enemy_color, start_pos, maze });
	// keep him offscreen for now
}

function gameStart () {

	player.visible = true;
	getRobots();
	for (var r = 0, r_len = robots.length; r < r_len; r++) {
		maze.addChild(robots[r]);
	}
	evil_otto.delay_timer = robots.length * 115;
	level_bonus = robots.length * 10;

	// toggle : pause the game
	var ESC = keyboard('Escape');
	ESC.press = function () { 
			gameState = (gameState === gamePlay) ? gamePaused : gamePlay;
	};
	ESC.release = function () { /* no op */ };
	//

	all_sprites = { player,  walls, robots, robot_bullets, bullets, evil_otto };
	gameState = gamePlay;
}

function gameDormant () {
	renderer.view.className = "hidden";
	UI.splashScreen.show();
}

function gamePlay () {

	hitTestAll(all_sprites);
	player.tick();
	evil_otto.tick();
	updateRobots();
	updateBullets();
	UI.update({ score }); // score, etc ... including debug stuff – in layout.js
}

function gamePaused () { /* no op */ }

function prepareToExitLevel (side) {

	maze.children.forEach( function (child) {
		child.tint = 0x0000FF;
	});

	x_vel = 0;
	y_vel = 0;
	var rate = 7;
	switch (side) {
		case 'top': 
		x_vel = 0;
		y_vel = rate * 1;
		start_pos = {x: maze.width * 0.5, y: maze.height - player.height - 100};
		break;
		case 'right': 
		x_vel = rate * -1;
		y_vel = 0;
		start_pos = {x: 90, y: maze.height * 0.5};
		break;
		case 'bottom': 
		x_vel = 0;
		y_vel = rate * -1;
		start_pos = {x: maze.width * 0.5, y: 90};
		break;
		case 'left': 
		x_vel = rate;
		y_vel = 0;
		start_pos = {x: maze.width - player.width - 100, y: maze.height * 0.5};
		break;
	}

	// robot talk to player
	var random_rate = Math.random() + 0.5;	
	if (robots.length !== 0) {
		soundsInSequence('chicken fight like a robot'.split(' '), random_rate);
	} else {
		soundsInSequence('the humanoid must not escape'.split(' '), random_rate);
	}

	gameState = exitingLevel;
}

function exitingLevel () {

	if (maze.x + maze.width < -50 || 
		maze.x > maze.width + 50 ||
		maze.y + maze.height < -50 ||
		maze.y > maze.height + 50) {
			gameState = gameRestarting;
	} else { 
		maze.x += x_vel;
		maze.y += y_vel;
	}
}

function gameOver () {

	if (timer > game_over_timer) {
		gameState = resetGameState;
	} else {
		renderer.view.className = "hidden";
	}
}

/*******************************************************************************
 * some pubSub message handlers
 *******************************************************************************/
function handleAllRobotsKilled () {

	console.log('handleAllRobotsKilled');
	score += level_bonus;
	UI.showBonus();
}

function handleHumanoidGot () {

	console.log('handleHumanoidGot');
	stage.removeChild(player);
	if (timer - player.death_start_timer - player.death_anim_duration > player.blinking_duration) {
		num_players_remaining -= 1;
		is_game_restarting = true;
		start_pos = {x: 90, y: 300};
		gameState = gameRestarting;
	}
}

/*******************************************************************************
 * bullets
 *******************************************************************************/
function fire (sprite) {

	var shot = getBullet(sprite);
	maze.addChild(shot);

	if (sprite === player) {
		bullets.push(shot);
		sound.play('player_bullet');
	} else {
		robot_bullets.push(shot);
		sound.play('robot_bullet');
	}
}

function updateBullets () {

	for (var i = 0, s_len = bullets.length; i < s_len; i++) {
		bullets[i].tick();
	}
	for (var j = 0, rs_len = robot_bullets.length; j < rs_len; j++) {
		robot_bullets[j].tick();
	}
}

/*******************************************************************************
 * robots
 *******************************************************************************/
function getRobots () {

	var max_num_robots = 12, min_num_robots = 3;
	var num_robots = max_num_robots; // Math.floor(Math.random() * (max_num_robots - min_num_robots)) + min_num_robots;
	var possible_positions = _getPossiblePositions();
	var robot, robot_pos;

	for (var r = 0; r < num_robots; r++) {

		robot = getRobot({max_num_robots, robots, robot_bullets, walls, enemy_color, maze });

		var random_index = Math.floor(Math.random() * possible_positions.length);
		robot_pos = possible_positions.splice(random_index, 1)[0];
		robot_pos.x += Math.floor(Math.random() * 50) - 25;
		robot_pos.y += Math.floor(Math.random() * 50) - 25;
		robot.position.set(robot_pos.x, robot_pos.y);
		robot.index = r;

		robots.push(robot);
	}
}

function _getPossiblePositions () {

	var num_cols = 5;
	var num_rows = 3;
	var x_pos = quad_width * 0.5;
	var y_pos = quad_height * 0.5;
	var positions = [];
	var pos = {};
	var player_start = {
		col: Math.floor(start_pos.x / quad_width),
		row: Math.floor(start_pos.y / quad_height)
	};

	for (var row = 0; row < num_rows; row++) {

		x_pos = quad_width * 0.5;
		for (var col = 0; col < num_cols; col++) {

			// skip the first box, since the player is there already
			// TODO fix this to look for the players pos (start_pos)
			if (row === player_start.row && col === player_start.col) { 
				x_pos += quad_width;
				continue; 
			}
			pos = {
				x: x_pos,
				y: y_pos
			};
			positions.push(pos);
			x_pos += quad_width;
		}

		y_pos += quad_height;
	}
	return positions;
}

function updateRobots () {

	if (timer > next_robot_bullet_time) {
		next_robot_bullet_time += 30;
	}
	for (var i = 0, r_len = robots.length; i < r_len; i++) {
		robots[i].tick(player);
	}
}

// for robots and evil otto
/*
	Yellow robots that do not fire
	Red robots that can fire 1 bullet (500 points)
	Cyan robots that can fire 2 bullets (1,500 points)
	Green robots that fire 3 bullets (3k)
	Purple robots that fire 4 bullets (4.5k)
	Yellow robots that fire 5 bullets (6k)
	White robots that fire 1 fast bullet (7.5k)
	Cyan robots that fire 2 fast bullets (10k)
	Purple robots that fire 3 fast bullets (11k)
	Gray robots that fire 4 fast bullets (13k)
	Yellow robots that fire 5 fast bullets (15k)
	Red robots that fire 5 fast bullets (17k)
	Cyan robots that fire 5 fast bullets (19k)
*/
var score_tiers = [500, 1500, 3000, 4500, 6000, 7500, 10000, 11000, 13000, 15000, 17000, 19000];
function getEnemyColor () {

	var colors = [0xFFFF00, 0xFF0000, 0x00FFFF, 0x00FF00, 0xFF00FF, 0xFFFF00, 0xFFFFFF, 0x00FFFF, 0xFF00FF];
	var col = colors[0];

	if (score >= score_tiers[0]) { col = colors[1]; }
	if (score >= score_tiers[1]) { col = colors[2]; }
	if (score >= score_tiers[2]) { col = colors[3]; }
	if (score >= score_tiers[3]) { col = colors[4]; }
	if (score >= score_tiers[4]) { col = colors[5]; }
	if (score >= score_tiers[5]) { col = colors[6]; }
	if (score >= score_tiers[6]) { col = colors[7]; }
	if (score >= score_tiers[7]) { col = colors[8]; }
	if (score >= score_tiers[8]) { col = Math.floor(Math.random() * 0xFFFFFF); } // MAX
	return col;
}

function getMaxNumRobotBullets () {

	var num_bullets = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
	var num = num_bullets[0];

	if (score >= score_tiers[0]) { num = num_bullets[1]; }
	if (score >= score_tiers[1]) { num = num_bullets[2]; }
	if (score >= score_tiers[2]) { num = num_bullets[3]; }
	if (score >= score_tiers[3]) { num = num_bullets[4]; }
	if (score >= score_tiers[4]) { num = num_bullets[5]; }
	if (score >= score_tiers[5]) { num = num_bullets[6]; } 	// fast bullets
	if (score >= score_tiers[6]) { num = num_bullets[7]; }
	if (score >= score_tiers[7]) { num = num_bullets[8]; }
	if (score >= score_tiers[8]) { num = 5; } 				// MAX
	return num;
}


