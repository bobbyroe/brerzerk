/**
 *
 * GLOBALS: stage, walls
 * PIXI globals: Grfx
 *
 **/
var quad_width = 200;
var quad_height = 235;

function drawWalls () {
	
	var num_cols = 5;
	var num_rows = 3;
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

				var i = -1; // clockwise position index: 0,1,2,3 = top,right,bottom,left
				rect = new Grfx();
				rect.beginFill(color);

				switch (s) {
					case 'top': 
					rect.drawRect(0, 0, quad_width + 10, 10);
					rect.x = x_pos;
					rect.y = y_pos;
					i = 0;
					break;
					case 'right': 
					rect.drawRect(0, 0, 10, quad_height + 5);
					rect.x = x_pos + quad_width;
					rect.y = y_pos;
					i = 1;
					break;
					case 'bottom': 
					rect.drawRect(0, 0, quad_width + 5, 10);
					rect.x = x_pos;
					rect.y = y_pos + quad_height;
					i = 2;
					break;
					case 'left': 
					rect.drawRect(0, 0, 10, quad_height + 5);
					rect.x = x_pos;
					rect.y = y_pos;
					i = 3;
					break;
				}

				rect.endFill();
				rect.name = `${h}${w}${i}` // `Rectangle${h}${w}, ${s}`; // debug
				stage.addChild(rect);

				// for hit testing
				walls.push(rect);
			});

			x_pos += quad_width;
		}

		y_pos += quad_height;
	}
}

// used by 'getRobots'
function getPossiblePositions () {

	var num_cols = 5;
	var num_rows = 3;
	var x_pos = quad_width * 0.5;
	var y_pos = quad_height * 0.5;
	var positions = [];
	var pos = {};

	for (var w = 0; w < num_rows; w++) {

		x_pos = quad_width * 0.5;
		for (var h = 0; h < num_cols; h++) {

			// skip the first box, since the player is there already
			if (w === 0 && h === 0) { continue; }
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

function getNearbyWalls (sprite) {

	var top = false;
	var right = false;
	var bottom = false;
	var left = false;
	sprite.qx = Math.floor(sprite.x / quad_width);
	sprite.qy = Math.floor(sprite.y / quad_height);

	var re = new RegExp(`${sprite.qx}${sprite.qy}\\d`);
	
	walls.forEach( function (w) {
		top = top 		 || w.name === `${sprite.qx}${sprite.qy - 1}2`;
		right = right 	 || w.name === `${sprite.qx + 1}${sprite.qy}3`;
		bottom 	= bottom || w.name === `${sprite.qx}${sprite.qy + 1}0`;
		left = left 	 || w.name === `${sprite.qx - 1}${sprite.qy}1`;
	});

	var quad_walls = walls.filter( function (w) { return re.test(w.name); });
	
	quad_walls.forEach( function (w) {
		top = top 		 || w.name[2] === '0';
		right = right 	 || w.name[2] === '1';
		bottom 	= bottom || w.name[2] === '2';
		left = left  	 || w.name[2] === '3';
	});

	return {
		top: top,
		right: right,
		bottom: bottom,
		left: left,
	};;
}



