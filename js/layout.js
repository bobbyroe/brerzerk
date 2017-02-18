/**
 *
 * GLOBALS: stage, start_pos, maze
 * PIXI globals: Grfx
 *
 **/


function drawWalls (options_obj) {
	
	// unpack
	var { walls, maze, start_pos, quad_width, quad_height, game } = options_obj;

	var num_cols = 5;
	var num_rows = 3;
	var x_pos = 10;
	var y_pos = 10;
	var width = 15;
	var rect = null;
	var sides = "top,right,bottom,left".split(',');
	var random_sides = [];
	var color = 0x0000FF;
	var random_prob = 0.2;
	var a_random_side = '';
	var player_start = {
		col: Math.floor(start_pos.x / quad_width),
		row: Math.floor(start_pos.y / quad_height)
	};
	var blocker_side = '';
	var remaining_sides = [];

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

			if (Math.random() < random_prob) {
				remaining_sides = sides.filter( function (s) {
					return random_sides.indexOf(s) === -1;
				});
				random_sides.push(remaining_sides[Math.floor(Math.random() * remaining_sides.length)]);
			}

			// "doors"
			if (w === 0 && h === 2) { random_sides = []; }
			if (w === 1 && h === num_cols - 1) { random_sides = []; }
			if (w === num_rows - 1 && h === 2) { random_sides = []; }
			if (w === 1 && h === 0) { random_sides = []; }

			if (is_game_restarting === false) {
				// draw exit blocker
				if (player_start.row === 0 && player_start.col === 2) { blocker_side = 'top'; }
				if (player_start.row === 1 && player_start.col === num_cols - 1) { blocker_side = 'right'; }
				if (player_start.row === num_rows - 1 && player_start.col === 2) { blocker_side = 'bottom'; }
				if (player_start.row === 1 && player_start.col === 0) { blocker_side = 'left'; }

				if (w === player_start.row && h === player_start.col) {
					color = game.enemy_color;
					width = 8;
					random_sides = [ blocker_side ];
				} else {
					color = 0x0000FF;
					width = 15;
				}
			}

			random_sides.forEach(_addSide);

			x_pos += quad_width;
		}

		y_pos += quad_height;
	}

	function _addSide (s) {

		var i = -1; // clockwise position index: 0,1,2,3 = top,right,bottom,left
		rect = new PIXI.Graphics();
		rect.beginFill(color);

		switch (s) {
			case 'top': 
			rect.drawRect(0, 0, quad_width + 10, width);
			rect.x = x_pos;
			rect.y = y_pos;
			i = 0;
			break;
			case 'right': 
			rect.drawRect(0, 0, width, quad_height + 5);
			rect.x = x_pos + quad_width;
			rect.y = y_pos;
			i = 1;
			break;
			case 'bottom': 
			rect.drawRect(0, 0, quad_width + 5, width);
			rect.x = x_pos;
			rect.y = y_pos + quad_height;
			i = 2;
			break;
			case 'left': 
			rect.drawRect(0, 0, width, quad_height + 5);
			rect.x = x_pos;
			rect.y = y_pos;
			i = 3;
			break;
		}

		rect.endFill();
		rect.name = `${h}${w}${i}`; // `Rectangle${h}${w}, ${s}`; // debug
		maze.addChild(rect);

		// for hit testing
		walls.push(rect);
	}
}
