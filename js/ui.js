/*******************************************************************************
 * Game UI, score and num players icons
 *******************************************************************************/

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

function resetScoreDisplay (num_remaining) {

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
	for (var i = 0; i < num_remaining - 1; i++) {
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