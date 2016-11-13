// GLOBALS
let player = null;
let evil_otto = null;
let walls = [];
let robots = [];
let bullets = [];
let robot_bullets = [];
let max_robot_bullets = 1;

let gameState = null;
let is_game_restarting = true;

let timer = 0;
let next_bullet_time = 150;
let game_over_timer = -1;

let enemy_color = 0x000000;
let score = 0;
let level_bonus = 0;
let num_players_remaining = 3;

let pubSub = null;
let start_pos = {x: 90, y: 300};

let stage = new PIXI.Container();
let maze = new PIXI.Container();
let sound = null;