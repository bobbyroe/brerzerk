
export default function drawWalls (options_obj) {
	
	// unpack
	var { walls, maze, start_pos, game } = options_obj;

	var num_cols = 5;
	var num_rows = 3;
	var x_pos = 5;
	var y_pos = 10;
	var width = 15;
	var sides = "top,right,bottom,left".split(',');
	var random_sides = [];
	var color = 0x0000FF;
	var random_prob = 0.2;
	var a_random_side = '';
	var player_start = {
		col: Math.floor(start_pos.x / game.quad_width),
		row: Math.floor(start_pos.y / game.quad_height)
	};
	var blocker_side = '';
	var remaining_sides = [];

	for (var row = 0; row < num_rows; row ++) {

		x_pos = 5;

		for (var col = 0; col < num_cols; col++) {
			random_sides = [];

			if (Math.random() < random_prob) {
				a_random_side = sides[Math.floor(Math.random() * sides.length)];
				random_sides.push(a_random_side);

				remaining_sides = sides.filter( function (s) {
					return random_sides.indexOf(s) === -1;
				});
				random_sides.push(remaining_sides[Math.floor(Math.random() * remaining_sides.length)]);
			}

			if (game.is_restarting === false) {
				// draw exit blocker
				if (player_start.row === 0 && player_start.col === 2) { blocker_side = 'top'; }
				if (player_start.row === 1 && player_start.col === num_cols - 1) { blocker_side = 'right'; }
				if (player_start.row === num_rows - 1 && player_start.col === 2) { blocker_side = 'bottom'; }
				if (player_start.row === 1 && player_start.col === 0) { blocker_side = 'left'; }

				if (row === player_start.row && col === player_start.col) {
					color = game.enemy_color;
					width = 8;
					random_sides = [ blocker_side ];
				} else {
					color = 0x0000FF;
					width = 15;
				}
			}

			random_sides.forEach(_addSide);
			x_pos += game.quad_width;
		}
		y_pos += game.quad_height;
	}

	// draw pillars
	game_tiles.forEach( t => {

		// calculate position for tile 
		let pos = {
			x: 5 + (t.id % num_cols) * game.quad_width,
			y: 10 + Math.floor(t.id / num_cols) * game.quad_height
		};

		// draw each wall
		t.walls.forEach( w => {
			let i = -1; // clockwise position index: 0,1,2,3 = top,right,bottom,left
			let rect = new PIXI.Graphics();
			rect.beginFill(color);

			switch (w) {
				case 0: 
				rect.drawRect(0, 0, game.quad_width, width);
				rect.x = pos.x;
				rect.y = pos.y;
				i = 0;
				break;
				case 1: 
				rect.drawRect(0, 0, width, game.quad_height);
				rect.x = pos.x + game.quad_width;
				rect.y = pos.y;
				i = 1;
				break;
				case 2: 
				rect.drawRect(0, 0, game.quad_width, width);
				rect.x = pos.x;
				rect.y = pos.y + game.quad_height;
				i = 2;
				break;
				case 3: 
				rect.drawRect(0, 0, width, game.quad_height);
				rect.x = pos.x;
				rect.y = pos.y;
				i = 3;
				break;
			}

			rect.endFill();
			rect.name = `${col}${row}${i}`; // `Rectangle${h}${w}, ${s}`; // debug
			maze.addChild(rect);

			// for hit testing
			walls.push(rect);
		});

		// draw each pillar
		t.pillars.forEach( p => {

			// let col = 0xFF9900;
			let box = new PIXI.Graphics();
			box.beginFill(color);
			box.drawRect(0, 0, width, width);
			switch(p) {
				case 0:
				box.x = pos.x;
				box.y = pos.y;
				break;
				case 1:
				box.x = pos.x + game.quad_width;
				box.y = pos.y;
				break;
				case 2:
				box.x = pos.x + game.quad_width;
				box.y = pos.y + game.quad_height;
				break;
				case 3:
				box.x = pos.x;
				box.y = pos.y + game.quad_height;
				break;
			}
			box.endFill();
			// box.alpha = 0.2;
			box.name = `pillar${t.id}`;
			maze.addChild(box);
			walls.push(box);
		});
	});
	
	function _addSide (s) {

		let i = -1; // clockwise position index: 0,1,2,3 = top,right,bottom,left
		let rect = new PIXI.Graphics();
		rect.beginFill(0x00CCFF);

		switch (s) {
			case 'top': 
			rect.drawRect(0, 0, game.quad_width, width);
			rect.x = x_pos;
			rect.y = y_pos;
			i = 0;
			break;
			case 'right': 
			rect.drawRect(0, 0, width, game.quad_height);
			rect.x = x_pos + game.quad_width;
			rect.y = y_pos;
			i = 1;
			break;
			case 'bottom': 
			rect.drawRect(0, 0, game.quad_width, width);
			rect.x = x_pos;
			rect.y = y_pos + game.quad_height;
			i = 2;
			break;
			case 'left': 
			rect.drawRect(0, 0, width, game.quad_height);
			rect.x = x_pos;
			rect.y = y_pos;
			i = 3;
			break;
		}

		rect.endFill();
		rect.name = `${col}${row}${i}`; // `Rectangle${h}${w}, ${s}`; // debug
		maze.addChild(rect);

		// for hit testing
		walls.push(rect);
	}
}

let game_tiles = [
	{
		id: 0,
		is_open: false,
		is_exit: false,
		walls: [0, 3],
		pillars: [0, 1, 2, 3]
	},
	{
		id: 1,
		is_open: false,
		is_exit: false,
		walls: [0],
		pillars: [1, 2]
	},
	{
		id: 2,
		is_open: false,
		is_exit: true,
		walls: [],
		pillars: [1, 2]
	},
	{
		id: 3,
		is_open: false,
		is_exit: false,
		walls: [0],
		pillars: [1, 2]
	},
	{
		id: 4,
		is_open: false,
		is_exit: false,
		walls: [0, 1],
		pillars: [1, 2]
	},
	{
		id: 5,
		is_open: false,
		is_exit: true,
		walls: [],
		pillars: [2, 3]
	},
	{
		id: 6,
		is_open: false,
		is_exit: false,
		walls: [],
		pillars: [2]
	},
	{
		id: 7,
		is_open: false,
		is_exit: false,
		walls: [],
		pillars: [2]
	},
	{
		id: 8,
		is_open: false,
		is_exit: false,
		walls: [],
		pillars: [2]
	},
	{
		id: 9,
		is_open: false,
		is_exit: true,
		walls: [],
		pillars: [2]
	},
	{
		id: 10,
		is_open: false,
		is_exit: false,
		walls: [2, 3],
		pillars: [2, 3]
	},
	{
		id: 11,
		is_open: false,
		is_exit: false,
		walls: [2],
		pillars: [2]
	},
	{
		id: 12,
		is_open: false,
		is_exit: true,
		walls: [],
		pillars: [2]
	},
	{
		id: 13,
		is_open: false,
		is_exit: false,
		walls: [2],
		pillars: [2]
	},
	{
		id: 14,
		is_open: false,
		is_exit: false,
		walls: [1, 2],
		pillars: [2]
	}
];
