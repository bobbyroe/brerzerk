
export default function drawWalls (options_obj) {
	
	// unpack
	let { walls, maze, start_pos, game } = options_obj;
	let num_cols = 5;
	let num_rows = 3;
	let width = 15;
	let color = 0x0000FF;
	//
	var x_pos = 5;
	var y_pos = 10;
	var sides = "top,right,bottom,left".split(',');
	var random_sides = [];
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

			// random_sides.forEach(_addSide);
			x_pos += game.quad_width;
		}
		y_pos += game.quad_height;
	}


	//
	let start_index = 5;
	let exit_id = 2;
	let start_tile = _getTileWithId(start_index);
	_findPathToExit(start_tile);

	function _findPathToExit (tile) {

		// mark as "open"
		tile.was_visited = true;

		// are we an exit tile?
		if (tile.id !== start_index && tile.id === exit_id) {

			// we're done!
			console.log("found it! ->", exit_id);

			tile.adjacent_tiles.forEach( t => {

				let side = -1;
				if (t === tile.id - num_cols) { side = 0; }
				if (t === tile.id + 1) { side = 1; }
				if (t === tile.id + num_cols) { side = 2; }
				if (t === tile.id - 1) { side = 3; }

				// only push the "wall" if it's an elidible interior side
				if (tile.interior_walls.indexOf(side) !== -1) { tile.walls.push(side); }
			});

		} else if (tile.adjacent_tiles.length === 0) { 

			// no more adjacent tiles!!!
			// start over!
			console.log("on no!!!");

		} else {

			// continue
			// pick an adjacent tile at random
			let random_index = Math.floor(Math.random() * tile.adjacent_tiles.length);
			let next_id = tile.adjacent_tiles[random_index];
			let next_tile = _getTileWithId(next_id);

			// add walls on remaining sides 
			let remaining_tiles = tile.adjacent_tiles.filter( t => t !== next_id );
			remaining_tiles.forEach( t => {

				let side = -1;
				if (t === tile.id - num_cols) { side = 0; }
				if (t === tile.id + 1) { side = 1; }
				if (t === tile.id + num_cols) { side = 2; }
				if (t === tile.id - 1) { side = 3; }

				// only push the "wall" if it's an elidible interior side
				if (tile.interior_walls.indexOf(side) !== -1) { tile.walls.push(side); }
			});
			// remove the current tile from the list of adjacent tiles
			next_tile.adjacent_tiles.splice(next_tile.adjacent_tiles.indexOf(tile.id), 1);

			console.log(tile);

			// recurse
			_findPathToExit(next_tile);
		}
	}

	// DEBUG draw path boxes
	game_tiles.forEach( t => {

		let column = t.id % num_cols;
		let cur_row = Math.floor(t.id / num_cols);
		let pos = {
			x: 5 + column * game.quad_width,
			y: 10 + cur_row * game.quad_height
		};

		let square = null;
		if (t.was_visited === true) {
			square = new PIXI.Graphics();
			square.lineStyle(2, 0x00FF00, 1);
			square.drawRect(25, 25, game.quad_width - 35, game.quad_height - 35);
			square.x = pos.x;
			square.y = pos.y;
			square.alpha = 0.2;
			maze.addChild(square);
		} else {

			// fill in the rest of the tiles walls
			t.interior_walls.forEach( n => {
				t.walls.push(n);
			});
		}
	});

	// draw!
	game_tiles.forEach( t => {

		// calculate position for tile 
		let column = t.id % num_cols;
		let cur_row = Math.floor(t.id / num_cols);
		let pos = {
			x: 5 + column * game.quad_width,
			y: 10 + cur_row * game.quad_height
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
			rect.name = `${column}${cur_row}${i}`; // `Rectangle${h}${w}, ${s}`; // debug
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

function _getTileWithId (id) {
	return game_tiles.find( t => t.id === id);
}

let game_tiles = [
	{
		id: 0,
		was_visited: false,
		is_exit: false,
		walls: [0, 3],
		interior_walls: [1, 2],
		pillars: [0, 1, 2, 3],
		adjacent_tiles: [1, 5],
	},
	{
		id: 1,
		was_visited: false,
		is_exit: false,
		walls: [0],
		interior_walls: [1, 2],
		pillars: [1, 2],
		adjacent_tiles: [2, 6] // exclude 0
	},
	{
		id: 2,
		was_visited: false,
		is_exit: true,
		walls: [],
		interior_walls: [1, 2],
		pillars: [1, 2],
		adjacent_tiles: [1, 3, 7]
	},
	{
		id: 3,
		was_visited: false,
		is_exit: false,
		walls: [0],
		interior_walls: [1, 2],
		pillars: [1, 2],
		adjacent_tiles: [2, 4, 8]
	},
	{
		id: 4,
		was_visited: false,
		is_exit: false,
		walls: [0, 1],
		interior_walls: [2],
		pillars: [1, 2],
		adjacent_tiles: [3, 9]
	},
	{
		id: 5,
		was_visited: false,
		is_exit: true,
		walls: [],
		interior_walls: [1, 2],
		pillars: [2, 3],
		adjacent_tiles: [0, 6, 10]
	},
	{
		id: 6,
		was_visited: false,
		is_exit: false,
		walls: [],
		interior_walls: [1, 2],
		pillars: [2],
		adjacent_tiles: [1, 5, 7, 11]
	},
	{
		id: 7,
		was_visited: false,
		is_exit: false,
		walls: [],
		interior_walls: [1, 2],
		pillars: [2],
		adjacent_tiles: [2, 6, 8, 12]
	},
	{
		id: 8,
		was_visited: false,
		is_exit: false,
		walls: [],
		interior_walls: [1, 2],
		pillars: [2],
		adjacent_tiles: [3, 7, 9, 13]
	},
	{
		id: 9,
		was_visited: false,
		is_exit: true,
		walls: [],
		interior_walls: [2],
		pillars: [2],
		adjacent_tiles: [4, 8, 14]
	},
	{
		id: 10,
		was_visited: false,
		is_exit: false,
		walls: [2, 3],
		interior_walls: [1],
		pillars: [2, 3],
		adjacent_tiles: [5, 11]
	},
	{
		id: 11,
		was_visited: false,
		is_exit: false,
		walls: [2],
		interior_walls: [1],
		pillars: [2],
		adjacent_tiles: [6, 12] // exclude 10
	},
	{
		id: 12,
		was_visited: false,
		is_exit: true,
		walls: [],
		interior_walls: [1],
		pillars: [2],
		adjacent_tiles: [7, 11, 13]
	},
	{
		id: 13,
		was_visited: false,
		is_exit: false,
		walls: [2],
		interior_walls: [1],
		pillars: [2],
		adjacent_tiles: [8, 12, 14]
	},
	{
		id: 14,
		was_visited: false,
		is_exit: false,
		walls: [1, 2],
		interior_walls: [],
		pillars: [2],
		adjacent_tiles: [9, 14]
	}
];
