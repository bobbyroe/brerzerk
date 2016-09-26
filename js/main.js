
// Aliases
var Rectangle = PIXI.Rectangle;
var Container = PIXI.Container;
var autoDetectRenderer = PIXI.autoDetectRenderer;
var loader = PIXI.loader;
var resources = PIXI.loader.resources;
var Sprite = PIXI.Sprite;
var Grfx = PIXI.Graphics;
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi#pixis-graphic-primitives

/*******************************************************************************
 * Setup
 *******************************************************************************/
var player_sprite;
var evil_otto;
var gameState;
var timer = 0;
var num_players_remaining = 3;
var colors8 = [0xFFFFFF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00];
var walls = [];
var robots = [];
var DEBUG = true;
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

// show timer 
var debug_timer = document.createElement('div');
debug_timer.style = "position:absolute; top:30px;left:50px;color:#FFFFFF";
document.body.appendChild(debug_timer);

// score 
var score_div = document.createElement('div');
score_div.style = "position:absolute; bottom:110px;left:50px;color:#FFFFFF;font-size:36px;font-family:sans-serif";
document.body.appendChild(score_div);

// bonus 
var bonus_div = document.createElement('div');
bonus_div.style = "position:absolute; bottom:110px;left:350px;color:#FFFFFF;font-size:36px;font-family:sans-serif";
document.body.appendChild(bonus_div);

// SPLASH SCREEN
var splash_header = document.createElement('h1');
splash_header.style = "margin-top:200px;color:#FF0000;font-size:96px;font-family:sans-serif;font-weight:bold;text-align:center";
var anykey_subhead = document.createElement('h2');
anykey_subhead.style = "margin-top:50px;color:#FFFF00;font-family:sans-serif;font-size:48px;text-align:center";
document.body.appendChild(splash_header);
document.body.appendChild(anykey_subhead);

var stage = new Container();
renderer.render(stage);


// APP STARTS-UP HERE ...
loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.add("images/evil-otto.png")
	.load(setup);

// audio
var talking_audio = {
		a: 			[0, 280],
		ALERT: 		[340, 360],
		attack: 	[770, 380],
		charge: 	[1220, 410],
		chicken: 	[1700, 450],
		coins: 		[2200, 450],
		destroy: 	[2730, 600],
		detected: 	[3380, 600],
		escape: 	[4010, 470],
		fight: 		[4560, 300],
		get: 		[4870, 290],
		got: 		[5230, 320],
		humanoid: 	[5700, 660],
		in: 		[6430, 390],
		INTRUDER: 	[6860, 600],
		it: 		[7500, 200],
		kill: 		[7790, 340],
		like: 		[8200, 320],
		must: 		[8570, 320],
		not: 		[8940, 250],
		pocket: 	[12880, 400],
		robot: 		[15000, 550],
		shoot: 		[15620, 260],
		the: 		[15940, 334]
	};
var sfx_audio = {
		player_bullet: 	[9250, 1000],
		player_dead: 	[10275, 2500],
		robot_bullet: 	[13310, 750],
		robot_dead: 	[14100, 800]
	};
Object.assign(sfx_audio, talking_audio);
var sound = new Howl({
	src: ['audio/sound_sprite.mp3'],
	sprite: sfx_audio
});

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
	if (timer > next_bullet_time) {
		next_bullet_time += 30;
	}
	if (DEBUG === true) { 
		debug_timer.textContent = timer; 
	}
	score_div.textContent = score;
	gameState();

	renderer.render(stage);
}

function gameStart () {

	if (timer < player_sprite.blinking_duration) {
		player_sprite.visible = (timer % 40 > 20);
	} else {
		player_sprite.visible = true;
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
	splash_header.textContent = "";
	anykey_subhead.textContent = "";
	num_players_remaining -= 1;

	timer = 0;
	next_bullet_time = 150;

	if (num_players_remaining > 0) {
		player_sprite = getPlayer(start_pos);
		stage.addChild(player_sprite);
		drawWalls();
		bonus_div.textContent = '';
		gameState = gameStart;  

	} else {
		num_players_remaining = 2;
		game_over_timer = timer + 150;
		gameState = gameOver;
	}

	//
	evil_otto = getEvilOtto({x: 300, y: 300});
	//
}

function gameDormant () {
	renderer.view.hidden = true;
	splash_header.textContent = "BRERZERK";
	anykey_subhead.textContent = "HIT ANY KEY";
}

function gamePlay () {

	hitTestAll();
	player_sprite.tick();
	evil_otto.tick();
	updateRobots();
	updateBullets();

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
		start_pos = {x: stage.width * 0.5, y: stage.height - player_sprite.height - 100};
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
		start_pos = {x: stage.width - player_sprite.width - 100, y: stage.height * 0.5};
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
		splash_header.textContent = "GAME OVER";
	}
}

/*******************************************************************************
 * bullets
 *******************************************************************************/
function fire (sprite) {
	
	var shot = getBullet(sprite);
	stage.addChild(shot);

	if (sprite === player_sprite) {
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

	var arr = (shot.sprite.name === player_sprite.name) ? bullets : robot_bullets;
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
		robot.setPosition(robot_pos);
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


/*******************************************************************************
 * EVIL OTTO
 *******************************************************************************/
function getEvilOtto (pos) {

	if (evil_otto != null) { evil_otto.destroy(); } // clean up
	
	var otto_tex = loader.resources["images/evil-otto.png"].texture;
	otto_sprite = new Sprite(otto_tex);
	var rect = new Rectangle(44, 0, 11, 43);
	otto_tex.frame = rect;
	otto_sprite.vx = 0;
	otto_sprite.vy = 0;
	otto_sprite.ax = 0; // aim.x
	otto_sprite.ay = 0; // aim.y
	otto_sprite.scale.set(4, 4);
	otto_sprite.rate = 2;
	otto_sprite.tint = 0xFF0000;
	otto_sprite.x = pos.x; // 150;
	otto_sprite.y = pos.y; // 90;
	otto_sprite.name = 'EVIL OTTO';
	
	// public methods
	otto_sprite.tick = ottoDormant;

	return otto_sprite
}

var otto_frame_indeces = [6,7,8,9,10,11,12,11,10,9,8,7];
var o_len = otto_frame_indeces.length - 1;

function ottoPlay () {

	var x_pos = otto_frame_indeces[(Math.round(timer * 0.2) % o_len)] * 11; 
	otto_sprite.x += otto_sprite.vx;
	otto_sprite.y += otto_sprite.vy;

	// animate him
	otto_sprite.texture.frame = new Rectangle( x_pos, 0, 11, 43);
	
}

function ottoDormant () {

	if (timer > otto_delay) {
		soundsInSequence('INTRUDER ALERT INTRUDER ALERT'.split(' '));
		stage.addChild(evil_otto);
		otto_sprite.tick = ottoStart;
	}
}

function ottoStart () {

	var x_pos = (Math.round((timer - otto_delay) * 0.1) % 8) * 11; 

	if (x_pos > 66) {
		otto_sprite.tick = ottoPlay;
	} else {
		// animate him
		otto_sprite.texture.frame = new Rectangle(x_pos, 0, 11, 43);
	}
	
}


