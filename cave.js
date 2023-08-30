'use strict';

// cave maker

let width=16*7, height=16;

function noise() {
	let cave = Array.from(Array(height), _ => Array(width).fill(0));
	for (let w=0; w<width; w++) {
        let centre = Math.sin(Math.PI*w/16.0)*height/3.5;
		for (let h=0; h<height; h++) {
			if ( Math.random() < Math.min(0.48, Math.sqrt(1.0 - Math.abs((height-1)/2.0-h + centre) *2.0 / height) )) {
				cave[h][w] = 1;
			}
		}
	}
	return cave
}

function collapseSquare(cave,h,w) {
    if (cave[h][w] == 1) return 1;
    let centre = Math.sin(Math.PI*w/16.0)*height/3.5 + (height-1.0)/2.0;
    if ((h >= centre - 2) && (h <= centre + 2)) return 1;
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