/**
 *
 * GLOBALS: stage, walls, start_pos
 * PIXI globals: Grfx
 *
 **/
var quad_width = 200;
var quad_height = 225;
var maze_width = 10 + quad_width * 5;
var maze_height = 10 + quad_height * 3;

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
					rect.drawRect(0, 0, quad_width + 10, 15);
					rect.x = x_pos;
					rect.y = y_pos;
					i = 0;
					break;
					case 'right': 
					rect.drawRect(0, 0, 15, quad_height + 5);
					rect.x = x_pos + quad_width;
					rect.y = y_pos;
					i = 1;
					break;
					case 'bottom': 
					rect.drawRect(0, 0, quad_width + 5, 15);
					rect.x = x_pos;
					rect.y = y_pos + quad_height;
					i = 2;
					break;
					case 'left': 
					rect.drawRect(0, 0, 15, quad_height + 5);
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
			// TODO fix this to look for the players pos (start_pos)
			if (w === 1 && h === 0) { 
				x_pos += quad_width;
				continue; 
			}
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

function resetScoreDisplay () {

	score_container = new Container();
	score_container.x = 10;
	score_container.y = 705;

	score_cntr = new Container();
	score_cntr.x = 30;
	score_cntr.y = 0;
	var num_digits = 5;
	for (var i = 0; i < num_digits; i++) {
		score_cntr.addChild(getDigit(i));
	}
	score_container.addChild(score_cntr);

	players_remaining = new Container();
	players_remaining.x = 300;
	players_remaining.y = 0;
	for (var i = 0; i < num_players_remaining - 1; i++) {
		players_remaining.addChild(getPlayerIcon(i));
	}
	score_container.addChild(players_remaining);

	
	// 5 digit score sprites
	// 5 player icon sprites
	// BONUS text + 3 digit sprites
	stage.addChild(score_container);
}

function getPlayerIcon (index) {

	var man_tex = loader.resources["images/charset.png"].texture.clone();
	var icon_sprite = new Sprite(man_tex);
	var width = 8;
	var padding = 4;
	var rect_i = new Rectangle(778, 0, width, 9);
	man_tex.frame = rect_i;
	icon_sprite.scale.set(4, 4);
	icon_sprite.tint = 0x00FF00;
	icon_sprite.x = index * (width * 4) + (padding * index);
	icon_sprite.y = 0;
	icon_sprite.name = 'man0';

	return icon_sprite;
}

function getDigit (index) {

	// 8 = SPACE, 137 = 0, 
	var digit_tex = loader.resources["images/charset.png"].texture.clone();
	var digit_sprite = new Sprite(digit_tex);
	var width = 8;
	var padding = 2;
	var x_index = (index === 4) ? 137 : 8;
	var rect_d = new Rectangle(x_index, 0, 8, 9); // (width = 8)
	digit_tex.frame = rect_d;
	digit_sprite.scale.set(4, 4);
	digit_sprite.tint = 0xFFFFFF;
	digit_sprite.x = index * (width * 4) + (padding * index);
	digit_sprite.y = 0;
	digit_sprite.name = `digit${index}`;

	return digit_sprite;
}




