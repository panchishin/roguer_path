'use strict';

// cave maker

let width=16*4, height=16;

function noise() {
	let cave = Array.from(Array(height), _ => Array(width).fill(0));
	for (let h=0; h<height; h++) {
		for (let w=0; w<width; w++) {
			if ( Math.random() < Math.min(0.68, Math.sqrt(1.0 - Math.abs((height-1)/2.0-h)*2.0/height) )) {
				cave[h][w] = 1;
			}
		}
	}
	return cave
}

function collapseSquare(cave,h,w) {
	let count = 0;
	for (let dh=h-1+height; dh<=h+1+height; dh++) {
		for (let dw=w-1+width; dw<=w+1+width; dw++) {
			count += cave[dh%height][dw%width];
		}
	}
	return count >= 5 ? 1 : 0
}

function collapse(cave) {
	let result = Array.from(Array(height), _ => Array(width).fill(0));
	for (let h=0; h<height; h++) {
		for (let w=0; w<width; w++) {
			result[h][w] = collapseSquare(cave,h,w);
		}
	}
	return result;
}

function print(cave) {
	let result = [];
	result.push(Array(width).fill("X").join(''));
	for (let h=0; h<height; h++) {
		result.push(cave[h].map(x=>"X "[x]).join(''));
	}
	result.push(Array(width).fill("X").join(''));
	return result.join('\n');
}

let duration = 0;
function display() {
	let cave = noise();
	cave = collapse(cave);
	document.getElementById("maze1").innerHTML = print(cave);
	cave = collapse(cave);
	document.getElementById("maze2").innerHTML = print(cave);
	cave = collapse(cave);
	document.getElementById("maze3").innerHTML = print(cave);
	duration = 10;
}

document.onkeydown = (e) => {
	display()
};

// prevent window from scrolling when using the arrow functions
window.addEventListener("keydown", function(e) {
	if (e.code in actions) {
		e.preventDefault();
	}
}, false);

setInterval(()=>{if (--duration < 0) {display()} },1000);


display();