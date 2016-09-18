
// Aliases
var Rectangle = PIXI.Rectangle;
var Container = PIXI.Container;
var autoDetectRenderer = PIXI.autoDetectRenderer;
var loader = PIXI.loader;
var resources = PIXI.loader.resources;
var Sprite = PIXI.Sprite;
var Grfx = PIXI.Graphics;
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

//
var player_sprite;
var gameState;
var timer = 0;
var num_players_remaining = 2;
var death_start_timer = -1;
var colors8 = [0xFFFFFF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00];
var walls = [];
var robots = [];
var player_blinking_duration = 30; // 120;
var DEBUG = false;
var bullets = [];
var robot_bullets = [];
var bullet_velocity = 4;
var listeners = [];

// https://github.com/kittykatattack/learningPixi#pixis-graphic-primitives
var renderer = autoDetectRenderer(
	1024, 768, 
	{antialias: false, transparent: false, resolution: 1}
);
document.body.appendChild(renderer.view);

var debug_timer = document.createElement('div');
debug_timer.style = "position:absolute; top:30px;left:50px;color:#FFFFFF";
document.body.appendChild(debug_timer);

var stage = new Container();
renderer.render(stage);

loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.load(setup);

function setup() {

	timer = 0;

	addPlayer();

	drawWalls();

	// Start the game loop
	gameState = gameStart;
	gameLoop();
}

function gameLoop() {

	requestAnimationFrame(gameLoop);
	timer += 1;
	if (DEBUG === true) { debug_timer.textContent = timer; }
	gameState();

	renderer.render(stage);
}

function gameStart () {

	if (timer < player_blinking_duration) {
		player_sprite.visible = (timer % 40 > 20);
	} else {
		player_sprite.visible = true;
		addRobots();
		gameState = gamePlay;
	}
}

function gameRestarting () {

	// clean up
	stage.removeChildren();
	walls = [];
	robots = [];
	removeListeners();

	timer = 0;
	death_start_timer = -1;
	addPlayer();
	drawWalls();
	gameState = gameStart;

	console.log(num_players_remaining);
}

 /**
  * GAME PLAY LOOP
  **/
function gamePlay () {

	hitTestAll();
	updatePlayer();
	updateRobots();
	updateBullets();
}

function hitTestAll () {

	// check every wall
	for (var a = 0, a_len = walls.length; a < a_len; a++) {
		var cur_wall = walls[a];

		// player
		if (hitTestRectangle(player_sprite, cur_wall) ) {
			player_sprite.was_hit = true;
		}
		
		// all robots
		for (var b = 0, b_len = robots.length; b < b_len; b++) {
			if (hitTestRectangle(cur_wall, robots[b]) ) {
				robots[b].was_hit = true;
			}
		}

		// robot bullets
		for (var c = 0, c_len = robot_bullets.length; c < c_len; c++) {
			if (hitTestRectangle(cur_wall, robot_bullets[c]) ) {
				robot_bullets[c].was_hit = true;
			}
		}

		// player bullets
		for (var d = 0, d_len = bullets.length; d < d_len; d++) {
			if (hitTestRectangle(cur_wall, bullets[d]) ) {
				bullets[d].was_hit = true;
			}
		}
	}

	// check every robot
	for (var e = 0, e_len = robots.length; e < e_len; e++) {

		var cur_robot = robots[e];
		// player
		if (hitTestRectangle(player_sprite, cur_robot) ) {
			player_sprite.was_hit = true;
			cur_robot.was_hit = true;
			break;
		}

		// evil otto
		// if (hitTestRectangle(evil_otto, cur_robot) ) {
		// 	cur_robot.was_hit = true;
		// }

		// all robots
		for (var f = 0, f_len = robots.length; f < f_len; f++) {
			if (robots[f] !== cur_robot) {
				if (hitTestRectangle(cur_robot, robots[f]) ) {
					cur_robot.was_hit = true;
					robots[f].was_hit = true;
				}
			}
		}

		// robot bullets
		for (var g = 0, g_len = robot_bullets.length; g < g_len; g++) {
			if (robot_bullets[g].robot !== cur_robot) {
				if (hitTestRectangle(cur_robot, robot_bullets[g]) ) {
					cur_robot.was_hit = true;
					robot_bullets[g].was_hit = true;
				}
			}
		}

		// player bullets
		for (var h = 0, h_len = bullets.length; h < h_len; h++) {
			if (hitTestRectangle(cur_robot, bullets[h]) ) {
				cur_robot.was_hit = true;
				bullets[h].was_hit = true;
			}
		}
	}

	// robot bullets
	for (var i = 0, i_len = robot_bullets.length; i < i_len; i++) {
		var cur_robot_bullet = robot_bullets[i];
		
		// player
		if (hitTestRectangle(player_sprite, cur_robot_bullet) ) {
			player_sprite.was_hit = true;
			cur_robot_bullet.was_hit = true;
			break;
		}

		// other robot bullets
		for (var j = 0, j_len = robot_bullets.length; j < j_len; j++) {
			if (robot_bullets[j] !== cur_robot_bullet) {
				if (hitTestRectangle(robot_bullets[j], cur_robot_bullet) ) {
					cur_robot_bullet.was_hit = true;
					robot_bullets[j].was_hit = true;
				}
			}
		}

		// player bullets
		for (var k = 0, k_len = bullets.length; k < k_len; k++) {
			if (hitTestRectangle(bullets[k], cur_robot_bullet) ) {
				cur_robot_bullet.was_hit = true;
				bullets[k].was_hit = true;
			}
		}
	}

	// player_sprite.was_hit = hitTestRectangle(player_sprite, evil_otto);
}

function updatePlayer () {

	if (player_sprite.was_hit === true) {
		death_start_timer = timer;
		if (num_players_remaining > 0) {
			  num_players_remaining -= 1;
			  gameState = playerDead;

		} else {
			  gameState = gameOver;
		}
	} else {
		player_sprite.x += player_sprite.vx;
		player_sprite.y += player_sprite.vy;

		// animate him
		player_sprite.texture.frame = getTexFrameFor(player_sprite);
	}
}

function updateRobots () {

	var cur_robot;

	for (var i = 0, r_len = robots.length; i < r_len; i++) {
		cur_robot = robots[i];
		
		if (cur_robot.was_hit === true) {
			// BOOM!
			robotDead(cur_robot);
		} else {
			cur_robot.x += cur_robot.vx;
			cur_robot.y += cur_robot.vy;

			// animate him
			if (cur_robot.vy > 0) {
				cur_robot.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 64, 0, 8, 11);
			} else if (cur_robot.vy < 0) {
				cur_robot.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 96, 0, 8, 11);
			}

			if (cur_robot.vx > 0) {
				cur_robot.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 48, 0, 8, 11);
			} else if (cur_robot.vx < 0) {
				cur_robot.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 80, 0, 8, 11);
			}

			if (cur_robot.vx === 0 && cur_robot.vy === 0) {
				cur_robot.texture.frame = new Rectangle( (Math.round( (timer + cur_robot.timer_offset) * 0.2) % 6) * 8, 0, 8, 11);
			}
		}
	}
}

function updateBullets () {
	var cur_shot;
	for (var i = 0, s_len = bullets.length; i < s_len; i++) {
		cur_shot = bullets[i];
		if (cur_shot.was_hit === true) {
			setTimeout(removeShot, 1, cur_shot);
		} else {
			cur_shot.x += cur_shot.vx;
			cur_shot.y += cur_shot.vy;

			// bounds
			if (cur_shot.x < 0 || cur_shot.x > 1024 || 
				cur_shot.y < 0 || cur_shot.y > 768) {
				setTimeout(removeShot, 1, cur_shot);
			}
		}
	}
}

function removeShot(shot) {
	stage.removeChild(shot);
	bullets.splice(bullets.indexOf(shot), 1);
	shot.destroy();
}
function gameOver () {

	stage.removeChildren();
	console.log("GAME OVER");
}

function hitTestPlayer () {

	var was_hit = false;
	var robot_hit = false;

	for (var h = 0, h_len = robots.length; h < h_len; h++) {
		robot_hit = hitTestRectangle(player_sprite, robots[h]);
		was_hit = was_hit || robot_hit;
	}

	for (var i = 0, len = walls.length; i < len; i++) {
		was_hit = was_hit || hitTestRectangle(player_sprite, walls[i]);
	}

	return was_hit;
}

function hitTestRobot (sprite) {

	var was_hit = hitTestRectangle(player_sprite, sprite);

	for (var i = 0, len = walls.length; i < len; i++) {
		was_hit = was_hit || hitTestRectangle(sprite, walls[i]);
	}

	return was_hit;
}

function keyboard (code) {

	var key = {
		code: code,
		isDown: false,
		isUp: true,
		press: null,
		release: null,
		shiftKey: false
	};

	key.downHandler = function (evt) {

		if (evt.code === key.code) {
			key.shiftKey = evt.shiftKey;
			if (key.isUp && key.press) { key.press(); }
			key.isDown = true;
			key.isUp = false;
		}
		evt.preventDefault();
	};

	key.upHandler = function(evt) {
		if (evt.code === key.code) {
			key.shiftKey = evt.shiftKey;
			if (key.isDown && key.release) { key.release(); }
			key.isDown = false;
			key.isUp = true;
		}
		evt.preventDefault();
	};

	var dnFn = key.downHandler.bind(key);
	window.addEventListener("keydown", dnFn, false);
	var upFn = key.upHandler.bind(key);
	window.addEventListener("keyup", upFn, false);
	listeners.push(
		{ type: 'keydown', fn: dnFn },
		{ type: 'keyup', fn: upFn }
	);
	
	return key;
}

function removeListeners () {
	listeners.forEach( function (l) {
		window.removeEventListener(l.type, l.fn, false);
	});
}

function hitTestRectangle(r1, r2) {

	var hit = false;
	var combinedHalfWidths;
	var combinedHalfHeights;
	var vx;
	var vy;
	var fudge_factor = 2;

	//Find the center points of each sprite
	r1.centerX = r1.x + r1.width * 0.5;
	r1.centerY = r1.y + r1.height * 0.5;
	r2.centerX = r2.x + r2.width * 0.5;
	r2.centerY = r2.y + r2.height * 0.5;

	//Find the half-widths and half-heights of each sprite
	r1.halfWidth = r1.width * 0.5 - fudge_factor;
	r1.halfHeight = r1.height * 0.5 - fudge_factor;
	r2.halfWidth = r2.width * 0.5 - fudge_factor;
	r2.halfHeight = r2.height * 0.5 - fudge_factor;

	//Calculate the distance vector between the sprites
	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	//Figure out the combined half-widths and half-heights
	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	//Check for a collision on the x axis
	if (Math.abs(vx) < combinedHalfWidths) {

		//A collision might be occuring. Check for a collision on the y axis
		if (Math.abs(vy) < combinedHalfHeights) {

			//There's definitely a collision happening
			hit = true;
			console.log(r1, '\n', r2); // debug
		} else {

			//There's no collision on the y axis
			hit = false;
		}
	} else {

		//There's no collision on the x axis
		hit = false;
	}

	//`hit` will be either `true` or `false`
	return hit;
};


function fire (sprite) {

	var dir = "" + Math.abs(sprite.ax / sprite.rate) + Math.abs(sprite.ay / sprite.rate);
	var diagonal_rote = (sprite.ax + sprite.ay === 0) ? -45 : 45;
	
	var shot = new  Grfx();
	shot.beginFill(0x00FF00);

	switch (dir) {
		case '01': 
		shot.drawRect(0, 0, 1, 8);
		break;
		case '10': 
		shot.drawRect(0, 0, 8, 1);
		break;
		case '11': 
		shot.drawRect(0, 0, 8, 1);
		shot.rotation = degToRad(diagonal_rote);
		break;
	}

	shot.x = sprite.x + 8;
	shot.y = sprite.y + 20;
	shot.scale.set(4, 4);
	shot.vx = sprite.ax * bullet_velocity;
	shot.vy = sprite.ay * bullet_velocity;
	shot.endFill();
	shot.name = `shot ${timer}`; // debug
	stage.addChild(shot);

	// for hit testing
	bullets.push(shot);
}

function setUpPlayerCtrlsFor (sprite) {

	var moveUp = keyboard(sprite.ctrl_keys[0]);
	var moveRight = keyboard(sprite.ctrl_keys[1]);
	var moveDown = keyboard(sprite.ctrl_keys[2]);
	var moveLeft = keyboard(sprite.ctrl_keys[3]);

	moveLeft.press = function () {
		if (moveLeft.shiftKey === true) {
			sprite.ax = sprite.rate * -1;
			fire(sprite);
		} else {
			sprite.vx = sprite.rate * -1;
		}
	};

	moveLeft.release = function () {
		if (moveRight.isDown === false) {
			sprite.ax = 0;
			sprite.vx = 0;
		}
	};

	moveRight.press = function () {
		if (moveRight.shiftKey === true) {
			sprite.ax = sprite.rate;
			fire(sprite);
		} else {
			sprite.vx = sprite.rate;
		}
	};

	moveRight.release = function () {
		if (moveLeft.isDown === false) {
			sprite.ax = 0;
			sprite.vx = 0;
		}
	};

	moveUp.press = function () {
		if (moveUp.shiftKey === true) {
			sprite.ay = sprite.rate * -1;
			fire(sprite);
		} else {
			sprite.vy = sprite.rate * -1;
		}
	};

	moveUp.release = function () {
		if (moveDown.isDown === false) {
			sprite.ay = 0;
			sprite.vy = 0;
		}
	};

	moveDown.press = function () {
		if (moveDown.shiftKey === true) {
			sprite.ay = sprite.rate;
			fire(sprite);
		} else {
			sprite.vy = sprite.rate;
		}
	};

	moveDown.release = function () {
		if (moveUp.isDown === false) {
			sprite.ay = 0;
			sprite.vy = 0;
		}
	};

	// sprite.listeners = [moveUp, moveRight, moveDown, moveDown];
}

function getTexFrameFor (sprite) {

	var rect = new Rectangle(0, 0, 8, 17);

	if (sprite.vx > 0 || sprite.vy !== 0) {
		rect = new Rectangle( (Math.round(timer * 0.2) % 3) * 8 + 8, 0, 8, 17);
	}

	if (sprite.vx < 0) {
		rect = new Rectangle( (Math.round(timer * 0.2) % 3) * 8 + 40, 0, 8, 17);
	}

	return rect;
}

function drawWalls () {
	
	var num_cols = 5;
	var num_rows = 3;
	var box_width = 200;
	var box_height = 235;
	var x_pos = 10;
	var y_pos = 10;
	var rect = null;
	var sides = "top,right,bottom,left".split(',');
	var random_sides = [];
	var color = 0x0000FF;
	var random_prob = 0.2;
	var a_random_side = '';

	for (var w = 0; w < num_rows; w++) {

		x_pos = 10;

		for (var h = 0; h < num_cols; h++) {
			a_random_side = sides[Math.floor(Math.random() * sides.length)];
			random_sides = [ a_random_side ];

			// room borders
			if (w === 0) { random_sides = ['top']; }
			if (h === num_cols - 1) { random_sides = ['right']; }
			if (w === num_rows - 1) { random_sides = ['bottom']; }
			if (h === 0) { random_sides = ['left']; }

			// corners
			if (w === 0 && h === 0) { random_sides = 'top,left'.split(','); }
			if (w === 0 && h === num_cols - 1) { random_sides = 'top,right'.split(','); }
			if (w === num_rows - 1 && h === num_cols - 1) { random_sides = 'right,bottom'.split(','); }
			if (w === num_rows - 1 && h === 0) { random_sides = 'bottom,left'.split(','); }

			// "doors"
			if (w === 0 && h === 2) { random_sides = []; }
			if (w === 1 && h === num_cols - 1) { random_sides = []; }
			if (w === num_rows - 1 && h === 2) { random_sides = []; }
			if (w === 1 && h === 0) { random_sides = []; }

			if (Math.random() < random_prob) {
				remaining_sides = sides.filter( function (s, i) {
					return random_sides.indexOf(s) === -1;
				});
				random_sides.push(remaining_sides[Math.floor(Math.random() * remaining_sides.length)]);
			}

			random_sides.forEach( function (s) {
				rect = new Grfx();
				rect.beginFill(color);

				switch (s) {
					case 'top': 
					rect.drawRect(0, 0, box_width + 10, 10);
					rect.x = x_pos;
					rect.y = y_pos;
					break;
					case 'right': 
					rect.drawRect(0, 0, 10, box_height + 5);
					rect.x = x_pos + box_width;
					rect.y = y_pos;
					break;
					case 'bottom': 
					rect.drawRect(0, 0, box_width + 5, 10);
					rect.x = x_pos;
					rect.y = y_pos + box_height;
					break;
					case 'left': 
					rect.drawRect(0, 0, 10, box_height + 5);
					rect.x = x_pos;
					rect.y = y_pos;
					break;
				}

				rect.endFill();
				rect.name = `Rectangle ${h}, ${w}, ${s}`; // debug
				stage.addChild(rect);

				// for hit testing
				walls.push(rect);
			});

			x_pos += box_width;
		}

		y_pos += box_height;
	}
}

function addPlayer () {

	var player_tex = loader.resources["images/player.png"].texture;
	player_sprite = new Sprite(player_tex);
	var rect = new Rectangle(0, 0, 8, 17);
	player_tex.frame = rect;
	player_sprite.x = 150;
	player_sprite.y = 90;
	player_sprite.vx = 0;
	player_sprite.vy = 0;
	player_sprite.ax = 0; // aim.x
	player_sprite.ay = 0; // aim.y
	player_sprite.scale.set(4, 4);
	player_sprite.ctrl_keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
	player_sprite.rate = 2;
	player_sprite.death_anim_duration = 80;
	player_sprite.tint = 0x00FF00;
	player_sprite.was_hit = false;
	stage.addChild(player_sprite);

	setUpPlayerCtrlsFor(player_sprite);
}

function addRobots () {

	var max_num_robots = 9, min_num_robots = 3;
	var num_robots = Math.floor(Math.random() * max_num_robots) + min_num_robots;
	var robot_tex = loader.resources["images/robot.png"].texture;
	var robot_explode_tex = loader.resources["images/robot-explode.png"].texture;
	var rect, robot_sprite, random_index, robot_pos;
	var possible_positions = getPossiblePositions();

	for (var r = 0; r < num_robots; r++) {
		robot_sprite = new Sprite(robot_tex);
		rect = new Rectangle(0, 0, 8, 11);
		robot_tex.frame = rect;

		random_index = Math.floor(Math.random() * possible_positions.length);
		robot_pos = possible_positions.splice(random_index, 1)[0];
		robot_sprite.x = robot_pos.x;
		robot_sprite.y = robot_pos.y;
		robot_sprite.vx = 0;
		robot_sprite.vy = 0;
		robot_sprite.scale.set(4, 4);
		robot_sprite.ctrl_keys = ['KeyW', 'KeyD', 'KeyS', 'KeyA'];
		robot_sprite.rate = 1;
		robot_sprite.explode_tex = robot_explode_tex;
		robot_sprite.explode_tex.num_frames = 3;
		robot_sprite.tint = 0xFF0000;
		robot_sprite.death_start_timer = -1;
		robot_sprite.timer_offset = Math.floor(Math.random() * 20);
		stage.addChild(robot_sprite);
		// for hit testing 
		robots.push(robot_sprite);
	}

	// setUpPlayerCtrlsFor(robot_sprite);	
}

function getPossiblePositions () {

	var num_cols = 5;
	var num_rows = 3;
	var box_width = 200;
	var box_height = 235;
	var x_pos = box_width * 0.5;
	var y_pos = box_height * 0.5;
	var positions = [];
	var pos = {};

	for (var w = 0; w < num_rows; w++) {

		x_pos = box_width * 0.5;
		for (var h = 0; h < num_cols; h++) {
			
			pos = {
				x: x_pos,
				y: y_pos
			};
			positions.push(pos);
			x_pos += box_width;
		}

		y_pos += box_height;
	}
	return positions;
}

function playerDead () {

	if (timer - death_start_timer < player_sprite.death_anim_duration) {
		// player death
		player_sprite.texture.frame = new Rectangle((Math.round(timer * 0.4) % 4) * 8 + 80, 0, 8, 17);
		player_sprite.tint = colors8[Math.floor(Math.random() * colors8.length)];
	} else {
		stage.removeChild(player_sprite);
		if (timer - death_start_timer - player_sprite.death_anim_duration > player_blinking_duration) {
			gameState = gameRestarting;
		}
	}
	updateRobots();
}

function robotDead (sprite) {

	// robot death
	if (sprite.death_start_timer === -1) { sprite.death_start_timer = timer; }
	var frame_num = (Math.floor((timer - death_start_timer) * 0.1) % 4);
	
	if (frame_num < sprite.explode_tex.num_frames) {
		sprite.texture = sprite.explode_tex;
		sprite.anchor.x = 0.28;
		sprite.anchor.y = 0.28;
		sprite.texture.frame = new Rectangle( frame_num * 18, 0, 18, 18);
	} else {
		setTimeout(removeRobot, 1, sprite);
	}
}

function removeRobot (sprite) {
	stage.removeChild(sprite);
	robots.splice(robots.indexOf(sprite), 1);
	sprite.destroy();
}
// helper fn
function degToRad (deg) {

	return deg * Math.PI / 180;
}