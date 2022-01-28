'use strict';

import { Game } from './game.js';


let game = new Game();
try {
	let previous_save = JSON.parse(localStorage.getItem("game"));
	for( let key of Object.keys(previous_save) ) {
		game[key] = previous_save[key]; 
		// console.log("key " + key + " set to " + previous_save[key])
	}
	game.refresh();
} catch (e) {
	console.log(e)
	game = new Game();
	game.start();
}

let actions = {
	'ArrowLeft' : { desc : 'left' , funct: ()=>{game.moveTo(game.start_i,game.start_j-1); } },
	'ArrowRight' : { desc : 'right' , funct : ()=>{game.moveTo(game.start_i,game.start_j+1); } },
	'ArrowUp' : { desc : 'up' , funct : ()=>{game.moveTo(game.start_i-1,game.start_j); } },
	'ArrowDown' : { desc : 'down' , funct : ()=>{game.moveTo(game.start_i+1,game.start_j); } },
	'KeyQ' : { desc : 'KeyQ' , funct: ()=>{ localStorage.clear("game"); game = new Game(); game.start(); } },
	'KeyN' : { desc : 'KeyN' , funct: ()=>{ game.start(); } },
	'KeyL' : { desc : 'KeyL' , funct: ()=>{ game.light = !game.light; } },
	'KeyU' : { desc : 'KeyU' , funct: ()=>{ if (game.canMove) { game.upgrade(); game.start(); } } }
};

document.onkeydown = (e) => {
	if (game.canMove && e.code in actions) {
		localStorage.setItem("game",JSON.stringify(game));
		actions[e.code].funct();
		game.refresh();
	}
};

// prevent window from scrolling when using the arrow functions
window.addEventListener("keydown", function(e) {
	if (e.code in actions) {
		e.preventDefault();
	}
}, false);

setInterval(()=>{game.incrementTimer()},1000);
