
/*******************************************************************************
 * HIT TESTING!
 *******************************************************************************/
 export function hitTestAll (all_sprites) {


	// unpack
	var { player, walls, robots, robot_bullets, bullets, evil_otto } = all_sprites;

	// check every wall
	for (var a = 0, a_len = walls.length; a < a_len; a++) {
		var cur_wall = walls[a];

		// player
		if (_hitTestRectangle(player, cur_wall) ) {
			player.was_hit = true;
		}
		
		// all robots
		for (var b = 0, b_len = robots.length; b < b_len; b++) {
			if (_hitTestRectangle(cur_wall, robots[b]) ) {
				robots[b].was_hit = true;
			}
		}

		// robot bullets
		for (var c = 0, c_len = robot_bullets.length; c < c_len; c++) {
			if (_hitTestRectangle(cur_wall, robot_bullets[c]) ) {
				robot_bullets[c].was_hit = true;
			}
		}

		// player bullets
		for (var d = 0, d_len = bullets.length; d < d_len; d++) {
			if (_hitTestRectangle(cur_wall, bullets[d]) ) {
				bullets[d].was_hit = true;
			}
		}
	}

	// check every robot
	for (var e = 0, e_len = robots.length; e < e_len; e++) {

		var cur_robot = robots[e];
		// player
		if (_hitTestRectangle(player, cur_robot) ) {
			player.was_hit = true;
			cur_robot.was_hit = true;
			break;
		}

		// evil otto
		if (_hitTestRectangle(evil_otto, cur_robot) ) {
			cur_robot.was_hit = true;
		}

		// all robots
		for (var f = 0, f_len = robots.length; f < f_len; f++) {
			if (robots[f] !== cur_robot) {
				if (_hitTestRectangle(cur_robot, robots[f]) ) {
					cur_robot.was_hit = true;
					robots[f].was_hit = true;
				}
			}
		}

		// robot bullets
		for (var g = 0, g_len = robot_bullets.length; g < g_len; g++) {
			if (robot_bullets[g].sprite !== cur_robot) {
				if (_hitTestRectangle(cur_robot, robot_bullets[g]) ) {
					cur_robot.was_hit = true;
					robot_bullets[g].was_hit = true;
				}
			}
		}

		// player bullets
		for (var h = 0, h_len = bullets.length; h < h_len; h++) {
			if (_hitTestRectangle(cur_robot, bullets[h]) ) {
				cur_robot.was_hit = true;
				bullets[h].was_hit = true;
			}
		}
	}

	// robot bullets
	for (var i = 0, i_len = robot_bullets.length; i < i_len; i++) {
		var cur_robot_bullet = robot_bullets[i];
		
		// player
		if (_hitTestRectangle(player, cur_robot_bullet) ) {
			player.was_hit = true;
			cur_robot_bullet.was_hit = true;
			break;
		}

		// other robot bullets
		for (var j = 0, j_len = robot_bullets.length; j < j_len; j++) {
			if (robot_bullets[j] !== cur_robot_bullet) {
				if (_hitTestRectangle(robot_bullets[j], cur_robot_bullet) ) {
					cur_robot_bullet.was_hit = true;
					robot_bullets[j].was_hit = true;
				}
			}
		}

		// player bullets
		for (var k = 0, k_len = bullets.length; k < k_len; k++) {
			if (_hitTestRectangle(bullets[k], cur_robot_bullet) ) {
				cur_robot_bullet.was_hit = true;
				bullets[k].was_hit = true;
			}
		}
	}
	if (_hitTestRectangle(player, evil_otto) ) {
		player.was_hit = true;
	}
}

function _hitTestRectangle(r1, r2) {

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

export function getOutOfBoundsSide (obj, game) {

	var maze_width = 10 + game.quad_width * 5;
	var maze_height = 10 + game.quad_height * 3;
	var side = (obj.x < 0) ? 'left' :
		(obj.x + obj.width > maze_width + 25) ? 'right' : // add 25px fudge
		(obj.y < 0) ? 'top' :
		(obj.y + obj.height > maze_height + 25) ? 'bottom' : // add 25px fudge
		'none';
	return side;
}


/*******************************************************************************
 * UTILS!
 *******************************************************************************/
export function degToRad (deg) {

	return deg * Math.PI / 180;
}

