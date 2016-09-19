function getRobots () {

	var robots = [];
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
		robots.push(robot_sprite);
	}
	return robots;
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