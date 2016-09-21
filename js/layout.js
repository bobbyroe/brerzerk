/**
 *
 * GLOBALS: stage, walls
 * PIXI globals: Grfx
 *
 **/
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

// used by 'getRobots'
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