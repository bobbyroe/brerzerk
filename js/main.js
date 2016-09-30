
// Aliases
var Rectangle = PIXI.Rectangle;
var Container = PIXI.Container;
var autoDetectRenderer = PIXI.autoDetectRenderer;
var loader = PIXI.loader;
var TextureCache = PIXI.utils.TextureCache;
var Sprite = PIXI.Sprite;
var Grfx = PIXI.Graphics;
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi#pixis-graphic-primitives

/*******************************************************************************
 * Setup
 *******************************************************************************/
var player;
var evil_otto;
var gameState;
var timer = 0;
var num_players_remaining = 3;
var colors8 = [0xFFFFFF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00];
var walls = [];
var robots = [];
var DEBUG = false;
var bullets = [];
var max_bullets = 2;
var max_robot_bullets = 1;
var next_bullet_time = 150;
var robot_bullets = [];
var listeners = [];
var robots_awake_time = 150;
var otto_delay = 400;
var score = 0;
var level_bonus = 0;
var game_over_timer = -1;

// exit level velocity
var x_vel = 0;
var y_vel = 0;
var start_pos = {x: 90, y: 300};

var renderer = autoDetectRenderer(
	1024, 768, 
	{antialias: false, transparent: false, resolution: 1}
);
document.body.appendChild(renderer.view);

// debug_timer, score, game over screen ...
createGameUIBits();

var stage = new Container();
renderer.render(stage);


// APP STARTS-UP HERE ...
loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.add("images/evil-otto.png")
	.add("images/charset.png")
	.load(setup);

var sound = getHowlerAudio();

function setup() {
	resetGameState();
	gameLoop();	
}

function resetGameState () {
	// listen for any key
	function fn (evt) { 
		window.removeEventListener("keydown", fn); 
		gameState = gameRestarting;
		renderer.view.hidden = false;
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

function gameStart () {

	if (timer < player.blinking_duration) {
		player.visible = (timer % 40 > 20);
	} else {
		player.visible = true;
		robots = getRobots();
		for (var r = 0, r_len = robots.length; r < r_len; r++) {
			stage.addChild(robots[r]);
		}
		level_bonus = robots.length * 10;

		//
		var SPACE = keyboard('Space');
		SPACE.press = function () { 
			var snds = Object.keys(talking_audio);
			var id = sound.play(snds[Math.floor(Math.random() * snds.length)]); 
			var random_rate = Math.random() + 0.5;
			sound.rate(random_rate, id);
		};
		SPACE.release = function () { /* no op */ };
		//

		gameState = gamePlay;
	}
}

function gameRestarting () {
	
	// clean up
	stage.x = 0;
	stage.y = 0;
	stage.removeChildren();
	walls = [];
	robots = [];
	removeListeners();
	anykey_subhead.textContent = "";
	logo_img.style.display = 'none';

	resetScoreDisplay();

	timer = 0;
	next_bullet_time = 150;

	if (num_players_remaining > 0) {
		player = getPlayer(start_pos);
		stage.addChild(player);
		drawWalls();
		bonus_div.textContent = '';
		gameState = gameStart;  

	} else { // RESET
		num_players_remaining = 3;
		game_over_timer = timer + 30;
		gameState = gameOver;
	}
	evil_otto = getEvilOtto({x: 0, y: 0}); // keep him offscreen for now
}

function gameDormant () {
	renderer.view.hidden = true;
	// splash_header.textContent = "";
	logo_img.style.display = 'block';
	anykey_subhead.textContent = "HIT ANY KEY";
}

function gamePlay () {

	hitTestAll();
	player.tick();
	evil_otto.tick();
	updateRobots();
	updateBullets();
	updateGameUI(); // score, etc ... including debug stuff – in layout.js
}

function prepareToExitLevel (side) {

	stage.children.forEach( function (child) {
		child.tint = 0x0000FF;
	});

	x_vel = 0;
	y_vel = 0;
	var rate = 5;
	switch (side) {
		case 'top': 
		x_vel = 0;
		y_vel = rate * 1;
		start_pos = {x: stage.width * 0.5, y: stage.height - player.height - 100};
		break;
		case 'right': 
		x_vel = rate * -1;
		y_vel = 0;
		start_pos = {x: 90, y: stage.height * 0.5};
		break;
		case 'bottom': 
		x_vel = 0;
		y_vel = rate * -1;
		start_pos = {x: stage.width * 0.5, y: 90};
		break;
		case 'left': 
		x_vel = rate;
		y_vel = 0;
		start_pos = {x: stage.width - player.width - 100, y: stage.height * 0.5};
		break;
	}

	// robot talk to player
	if (robots.length !== 0) {
		sound.play('chicken');
		soundsInSequence('chicken fight like a robot'.split(' '));
	} else {
		soundsInSequence('the humanoid must not escape'.split(' '));
	}
}

function exitingLevel () {

	if (stage.x + stage.width < -50 || 
		stage.x > stage.width + 50 ||
		stage.y + stage.height < -50 ||
		stage.y > stage.height + 50) {
			gameState = gameRestarting;
	} else { 
		stage.x += x_vel;
		stage.y += y_vel;
	}
}

function gameOver () {

	if (timer > game_over_timer) {
		gameState = resetGameState;
	} else {
		renderer.view.hidden = true;
		// splash_header.textContent = "GAME OVER";
	}
}

/*******************************************************************************
 * bullets
 *******************************************************************************/
function fire (sprite) {

	var shot = getBullet(sprite);
	stage.addChild(shot);

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
	for (var i = 0, s_len = robot_bullets.length; i < s_len; i++) {
		robot_bullets[i].tick();
	}
}

function removeBullet(shot) {

	var arr = (shot.sprite.name === player.name) ? bullets : robot_bullets;
	stage.removeChild(shot);
	arr.splice(arr.indexOf(shot), 1);
	shot.destroy();
}

/*******************************************************************************
 * robots
 *******************************************************************************/
function getRobots () {

	var robots = [];
	var max_num_robots = 9, min_num_robots = 3;
	var num_robots = Math.floor(Math.random() * max_num_robots) + min_num_robots;
	var possible_positions = getPossiblePositions();
	var robot, robot_pos;

	for (var r = 0; r < num_robots; r++) {

		robot = getRobot();

		random_index = Math.floor(Math.random() * possible_positions.length);
		robot_pos = possible_positions.splice(random_index, 1)[0];
		robot_pos.x += Math.floor(Math.random() * 50) - 25;
		robot_pos.y += Math.floor(Math.random() * 50) - 25;
		robot.position.set(robot_pos.x, robot_pos.y);
		robot.index = r;

		robots.push(robot);
	}
	return robots;
}

function updateRobots () {

	for (var i = 0, r_len = robots.length; i < r_len; i++) {
		robots[i].tick();
	}
}

function removeRobot (sprite) {
	stage.removeChild(sprite);
	robots.splice(robots.indexOf(sprite), 1);
	sprite.destroy();
}



