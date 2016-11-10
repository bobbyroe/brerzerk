/**
 *
 * GLOBALS: stage, walls, start_pos, maze
 * PIXI globals: Grfx
 *
 **/

// more globals
var quad_width = 200;
var quad_height = 225;
var maze_width = 10 + quad_width * 5;
var maze_height = 10 + quad_height * 3;
var digits_sprites = [];
var num_digits = 5;

var score_container;
var players_remaining;
var score_cntr;
var bonus_text;

function drawWalls () {
	
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
				remaining_sides = sides.filter( function (s, i) {
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
					color = enemy_color;
					width = 8;
					random_sides = [ blocker_side ];
				} else {
					color = 0x0000FF;
					width = 15;
				}
			}

			random_sides.forEach( function (s) {

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
				rect.name = `${h}${w}${i}` // `Rectangle${h}${w}, ${s}`; // debug
				maze.addChild(rect);

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
	var player_start = {
		col: Math.floor(start_pos.x / quad_width),
		row: Math.floor(start_pos.y / quad_height)
	};
	// console.log(player_start);

	for (var row = 0; row < num_rows; row++) {

		x_pos = quad_width * 0.5;
		for (var col = 0; col < num_cols; col++) {

			// skip the first box, since the player is there already
			// TODO fix this to look for the players pos (start_pos)
			if (row === player_start.row && col === player_start.col) { 
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

	// annotate this one please 
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
	};
}

/*******************************************************************************
 * Game UI, score and num players icons
 *******************************************************************************/

function handleAllRobotsKilled () {

	console.log('handleAllRobotsKilled');
	score += level_bonus;
	showBonusMessage();
};

function updateGameUI () {

	updateScore();
}

function updateScore () {

	var score_str = getScoreString();
	var x_index = -1;
	for (var c = 0, len = score_str.length; c < len; c++) {
		x_index = getXindexForChar(score_str[c]);
		digits_sprites[c].texture.frame = new PIXI.Rectangle(x_index, 0, 8, 9);
	}
}

function showBonusMessage () {

	resetBonusText();
	bonus_text.visible = true;
}

function resetScoreDisplay () {

	if (score_container != null) {
		stage.removeChild(score_container);
	}
	score_container = new PIXI.Container();
	score_container.x = 10;
	score_container.y = 710;

	score_cntr = new PIXI.Container();
	score_cntr.x = 30;
	score_cntr.y = 0;
	var cur_digit;
	var score_str = getScoreString();
	digits_sprites = []; // reset
	for (var i = 0; i < num_digits; i++) {
		cur_digit = getDigit(score_str, i);
		score_cntr.addChild(cur_digit);
		digits_sprites.push(cur_digit);
	}
	score_container.addChild(score_cntr);

	players_remaining = new PIXI.Container();
	players_remaining.x = 300;
	players_remaining.y = 0;
	for (var i = 0; i < num_players_remaining - 1; i++) {
		players_remaining.addChild(getPlayerIcon(i));
	}
	score_container.addChild(players_remaining);

	bonus_text = new PIXI.Container();
	bonus_text.x = 400;
	bonus_text.y = 0;
	resetBonusText();
	bonus_text.visible = false;
	score_container.addChild(bonus_text);

	// BONUS text + 3 digit sprites
	stage.addChild(score_container);
}

function resetBonusText () {

	bonus_text.removeChildren();
	var bonus_str = "BONUS " + level_bonus;
	var char_tex, char_sprite, x_index, rect;
	var padding = 2;
	var width = 8;
	for (var i = 0, num_chars = bonus_str.length; i < num_chars; i++) {
		char_tex = PIXI.loader.resources["images/charset.png"].texture.clone();
		char_sprite = new PIXI.Sprite(char_tex);
		x_index = getXindexForChar(bonus_str[i]);
		rect = new PIXI.Rectangle(x_index, 0, 8, 9);
		char_tex.frame = rect;
		char_sprite.scale.set(4, 4);
		char_sprite.tint = 0xFFFFFF;
		char_sprite.x = i * (width * 4) + (padding * i);
		char_sprite.y = 0;
		char_sprite.name = `char${i}`;
		bonus_text.addChild(char_sprite);
	}
}

function getPlayerIcon (index) {

	var man_tex = PIXI.loader.resources["images/charset.png"].texture.clone();
	var icon_sprite = new PIXI.Sprite(man_tex);
	var width = 8;
	var padding = 4;
	var rect = new PIXI.Rectangle(778, 0, width, 9);
	man_tex.frame = rect;
	icon_sprite.scale.set(4, 4);
	icon_sprite.tint = 0x00FF00;
	icon_sprite.x = index * (width * 4) + (padding * index);
	icon_sprite.y = 0;
	icon_sprite.name = 'man0';

	return icon_sprite;
}

function getDigit (score_str, index) {

	var digit_tex = PIXI.loader.resources["images/charset.png"].texture.clone();
	var digit_sprite = new PIXI.Sprite(digit_tex);
	var width = 8;
	var padding = 2;
	var x_index = getXindexForChar(score_str[index]);
	var rect_d = new PIXI.Rectangle(x_index, 0, width, 9);
	digit_tex.frame = rect_d;
	digit_sprite.scale.set(4, 4);
	digit_sprite.tint = 0x00FF00;
	digit_sprite.x = index * (width * 4) + (padding * index);
	digit_sprite.y = 0;
	digit_sprite.name = `digit${index}`;

	return digit_sprite;
}

function getScoreString () {

	var score_str = "" + score;
	// catch scores 100,00 and up ...
	if (score_str.length > 5) {
		throw new Error('score is greater then 99,999!!! fix me!');
	}

	// front-load zeros as needed
	var num_paddings = num_digits - score_str.length;
	for (var d = 0; d < num_paddings; d++) {
		score_str = ' ' + score_str;
	}

	return score_str;
}

function getXindexForChar (c) {

	// var char = "" + c;
	var width = 8;
	return (c.charCodeAt(0) - 31) * width;
}
