 /**
 * 
 * Globals: walls, robots, player_sprite, robot_bullets, bullets, evil_otto,
 * 			maze_width, maze_height
 *          listeners
 **/

/*******************************************************************************
 * Keyboard listeners
 *******************************************************************************/
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
		
		// console.log(evt.code);

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

/*******************************************************************************
 * HIT TESTING!
 *******************************************************************************/
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
		if (hitTestRectangle(evil_otto, cur_robot) ) {
			cur_robot.was_hit = true;
		}

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
			if (robot_bullets[g].sprite !== cur_robot) {
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
	player_sprite.was_hit = hitTestRectangle(player_sprite, evil_otto);
}

function hitTestRectangle(r1, r2) {

	var hit = false;
	var combinedHalfWidths;
	var combinedHalfHeights;
	var vx;
	var vy;
	var fudge_factor = 2;

	r1.centerX = r1.x + r1.width * 0.5;
	r1.centerY = r1.y + r1.height * 0.5;
	r2.centerX = r2.x + r2.width * 0.5;
	r2.centerY = r2.y + r2.height * 0.5;

	r1.halfWidth = r1.width * 0.5 - fudge_factor;
	r1.halfHeight = r1.height * 0.5 - fudge_factor;
	r2.halfWidth = r2.width * 0.5 - fudge_factor;
	r2.halfHeight = r2.height * 0.5 - fudge_factor;

	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	//Check for a collision on the x axis
	if (Math.abs(vx) < combinedHalfWidths) {
		if (Math.abs(vy) < combinedHalfHeights) {
			hit = true;
		} else {
			hit = false;
		}
	} else {
		hit = false;
	}
	return hit;
}

function getOutOfBoundsSide (obj) {
	var side = (obj.x < 0) ? 'left' :
		(obj.x + obj.width > maze_width) ? 'right' :
		(obj.y < 0) ? 'top' :
		(obj.y + obj.height > maze_height) ? 'bottom' : 
		'none';
	return side;
}

/*******************************************************************************
 * sound sequences
 *******************************************************************************/
function soundsInSequence (arr) {

	var snd = arr.shift();
	var id = sound.play(snd);
	if (arr.length > 0) {
		sound.once('end', function () { 
			soundsInSequence(arr);
		}, id);
	}
	
}
