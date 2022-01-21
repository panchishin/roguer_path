'use strict';

import { randint, shuffle, assert } from './util.js';

const WALL = "#";
const SPACE = " ";
const DOOR = "D";
const HERO = "@";
const STEPS = ".";
const CHAMBER = ",";
const EXIT = "E";
const COIN = "c";
const SLUG = "~";

const MAX_MAZE_SIZE = 12;
const MAX_GOOD_THINGS = 3;
const MAX_BAD_THINGS = 3;

function Game() {

	this.start_i = 0;
	this.start_j = 0;
	this.light = true;
	this.footprints = true;
	this.canMove = false;
	this.known;
	this.mazeSize = 3;
	this.numChambers = 0;
	this.numDoors = 0;
	this.g;
	this.tunnelVision = 1;

	this.totalSteps = 0;
	this.totalExits = 0;
	this.totalMaps = 0;
	this.secondsPlayed = 0;
	this.achievements = [];
	this.messages = [];
	this.enteredAChamber = false;
	this.coins = 0;
	this.slugs = 0;
	this.inventoryCoins = 0;
	this.killsSlugs = 0;
	this.deaths = 0;


	this.addMessage = function(message, cssclass=null) {
		this.messages.unshift(message)
		let span = document.createElement("span");
		span.innerHTML = message;
		if (cssclass != null) span.classList.add(cssclass)
		let div = document.createElement("div")
		div.appendChild(span)
		let log = document.getElementById("messagelog");
		log.insertBefore(div, log.firstChild);
		if (document.getElementById("messagelog").children.length > 15) {
			document.getElementById("messagelog").lastChild.remove();
		}
	}

	this.addAchievement = function(message) {
		this.addMessage("Achievement : " + message + "!", "achievements");
		this.achievements.unshift(message);
		this.updateStat("achievements",this.achievements.length,this.achievements.length>0);
	}

	this.updateStat = function(statName, statValue, display) {
		if (display) {
			document.getElementById(statName).parentElement.classList.remove("hidden");
		}
		document.getElementById(statName).innerHTML = statValue;
	}

	this.upgrade = function() {
		if (this.numChambers < this.mazeSize - 5) {
			this.numChambers += 1;
			if (this.numChambers == 1) {
				this.addMessage("Dungeons can now have a chamber.");
			} else {
				this.addMessage("Dungeons now have " + this.numChambers + " chambers.");
			}
			return
		}
		if (this.numChambers >= 1 && this.numDoors == 0) {
			this.numDoors = 1;
			this.addMessage("Chambers can now have a door (marked with a '"+DOOR+"').");
			return;
		} 
		if (this.numChambers >= 3 && this.numDoors == 1) {
			this.numDoors = 2;
			this.addMessage("Chambers can now have 2 doors.");
			return;
		}
		if (this.mazeSize >= 7 && this.light) {
			this.light = false;
			this.addAchievement("this.light is too easy. Exploration illuminates the dungeon");
			return;
		}
		if (this.coins < this.mazeSize - 4 && this.coins < MAX_GOOD_THINGS) {
			if (this.coins == 0) {
				this.addAchievement("Unlocked Coins "+COIN)
				this.addMessage("Coins may be laying about.");
			} else {
				this.addMessage("More coins to find.");
			}
			this.coins += 1;
			return
		}
		if (this.slugs < this.coins && this.slugs < MAX_BAD_THINGS) {
			if (this.slugs == 0) {
				this.addAchievement("Unlocked Slugs "+SLUG)
				this.addMessage("Slugs "+SLUG+" may be lurking about.");
			} else {
				this.addMessage("More slugs.");
			}
			this.slugs += 1;
			return
		}
		if (this.mazeSize < MAX_MAZE_SIZE) {
			this.mazeSize += 1;
			this.addMessage("Dungeons have grown to size " + (this.mazeSize*2+1) + ".");
			return;
		}
	}

	this.illuminate = function(g, focus_i, focus_j, distance=3) {
		let n = g.length;
		for (let i=-distance; i<=distance; i++) {
			for (let j=-distance; j<=distance; j++) {
				if (i*i + j*j <= distance*distance) {
					let I;
					let J;
					[I,J] = [focus_i+i, focus_j+j];
					if (0<=I && I<n && 0<=J && J<n) {
						this.known[I][J] = true;
					}
				}
			}
		}
	}

	this.maze = function(n, chambers=0, doors=0) {
		const that = this;
		n = n*2+1

		assert(n > 3 && n%2 == 1);

		var G = Array(n);
		for (var i = 0; i < n; i++) G[i] = Array(n).fill(WALL);

		this.known = Array(n);
		for (var i = 0; i < n; i++) this.known[i] = Array(n).fill(false);

		function placeChamber() {
			const size = 3;
			let I = randint(1,n-size-1);
			let J = randint(1,n-size-1);
			I += I%2==0 ? 1 : 0;
			J += J%2==0 ? 1 : 0;

			for(let i=0; i<size; i++) for(let j=0; j<size; j++) G[I+i][J+j] = CHAMBER;
			that.illuminate(G, I+Math.floor(size/2), J+Math.floor(size/2), size);

			for(let door=0; door<doors; door++) {
				let i,j;
				[i,j] = [randint(0,1)*(size+1)-1 , randint(0,Math.floor(size/2))*2];
				if (randint(0,1) == 0) [i,j] = [j,i];
				if (G[I+i][J+j] == WALL) {
					G[I+i][J+j] = DOOR;
				}
			}
		}

		for(let z=0; z<chambers; z++) {
			placeChamber();
		}

		function placeItem(legalTile) {
			for(let x=0 ; x<100 ; x++) {
				let I = randint(1,n-2);
				let J = randint(1,n-2);
				I += I%2==0 ? 1 : 0;
				J += J%2==0 ? 1 : 0;
				if (G[I][J] == legalTile) return [I,J];
			}
			throw("This shouldn't happen");
		}

		[this.start_i, this.start_j] = placeItem(WALL)
		G[this.start_i][this.start_j] = SPACE;

		let tmax = 0;
		let iexit = 0;
		let jexit = 0;

		function DFS(i, j, t){
			let I = 0, J = 0;
			for ( [I, J] of shuffle([[i+2, j], [i-2, j], [i, j+2], [i, j-2]] ) ) {
				if (0 <= I && I < n && 0 <= J && J < n) if ( (G[I][J] == WALL && G[(I+i)/2][(J+j)/2] == WALL) || (I==that.start_i && J==that.start_j)) {
					G[I][J] = SPACE;
					G[(I+i)/2][(J+j)/2] = SPACE;
					if (t > tmax && (I!=that.start_i || J!=that.start_j) ) { 
						[tmax, iexit, jexit] = [t, I, J];
					}
					if (I!=that.start_i || J!=that.start_j) {
						DFS(I, J, t + 1);
					}
				}
			}
		}

		[iexit, jexit, tmax] = [1,1, 0];

		DFS(this.start_i, this.start_j, 0);
		G[iexit][jexit] = EXIT;

		// place coins
		for (let x=0; x<this.coins; x++) {
			let I,J;
			[I, J] = placeItem(SPACE, true)
			G[I][J] = COIN;
		}
		// place slugs
		for (let x=0; x<this.slugs; x++) {
			let I,J;
			[I, J] = placeItem(SPACE, true)
			G[I][J] = SLUG;
		}
		this.illuminate(G, iexit, jexit);
		
		return G;
	}

	this.refresh = function(){
		this.illuminate(this.g, this.start_i, this.start_j);
		let n = this.g.length;
		let text = [];
		for (let i=0; i<n; i++) {
			let line = []
			for (let j=0; j<n; j++) {
				if ((this.start_i-i)**2 + (this.start_j-j)**2 > this.tunnelVision*this.tunnelVision) {
					line.push( "?" );
				} else if (i==this.start_i && j==this.start_j) {
					line.push(HERO);
				} else if (this.light || this.known[i][j]) {
					line.push( this.g[i][j] );
				} else {
					line.push( " " );
				}
			}
			text.push(line.join(""));
		}
		this.updateStat("maze",text.join("\n"),true);
	}

	this.start = function(){
		this.totalMaps++
		this.updateStat("totalmaps",this.totalMaps,true);
		this.updateStat("mazesize",this.mazeSize>=MAX_MAZE_SIZE?"max":this.mazeSize*2+1,this.mazeSize>5);
		this.updateStat("numchambers",this.numChambers,this.numChambers > 0);
		this.updateStat("numdoors",this.numDoors,this.numChambers > 1);

		this.g = this.maze(this.mazeSize, this.numChambers, this.numDoors);

		for (let i=this.g.length; i>0; i--) {
			let row = []
			for (let j=this.g.length; j>0; j--) {
				row.push(false);
			}
			this.known.push(row)
		}
		document.getElementById("maze").classList.remove("danger");
		this.tunnelVisionOut(()=>{this.refresh();});
	};

	this.slugAI = function(i,j,depth) {
		let best_move = null;
		let best_distance = 100000;
		let n=this.mazeSize*2+1;
		let I,J;
		for ( [I, J] of shuffle([[i+1, j], [i-1, j], [i, j+1], [i, j-1]] ) ) {
			if (0 <= I && I < n && 0 <= J && J < n && this.g[I][J] != WALL && this.g[I][J] != DOOR && this.g[I][J] != EXIT) {
				let distance;
				let move;
				if (depth > 0) {
					[move, distance] = this.slugAI(I,J,depth-1)
				} else {
					distance = (this.start_i-I)**2 + (this.start_j-J)**2;
				}
				if (distance <= best_distance) {
					best_move = [I,J];
					best_distance = distance;
				}
			}
		}
		return [best_move, best_distance];
	}

	this.moveSlugs = function() {
		this.canMove = false;
		let n=this.mazeSize*2+1;
		let slugLocations = []
		for(let i=1; i<n; i++) for(let j=1; j<n-1; j++) {
			if (this.g[i][j] == SLUG) {
				slugLocations.push([i,j]);
			}
		}
		for(let loc of slugLocations) {
			let i,j;
			[i,j] = loc;
			let move;
			let distance;
			[move, distance] = this.slugAI(i,j,4);
			if (move != null) {
				this.g[i][j] = SPACE;
				this.illuminate(this.g,i,j,0);
				this.g[move[0]][move[1]] = SLUG;
				this.illuminate(this.g,move[0],move[1],0);
			}
		}
		this.canMove = true;
	}

	this.moveTo = function(i,j) {
		if (0<=i && i<this.g.length && 0<=j && j<this.g.length && this.g[i][j] != WALL) {

			this.totalSteps++;
			if (this.totalSteps == 1) this.addAchievement("You discovered how to walk");
			if (this.totalSteps == 100) this.addAchievement("100 steps");
			if (this.totalSteps == 250) this.addAchievement("250 steps");

			this.updateStat("totalsteps",this.totalSteps,this.totalSteps>0);
			if (this.g[this.start_i][this.start_j] == SPACE && this.footprints) {
				this.g[this.start_i][this.start_j] = STEPS;
			}
			if (this.g[this.start_i][this.start_j] != CHAMBER && this.g[i][j] == CHAMBER) {
				if (!this.enteredAChamber) {
					this.addAchievement("Explored first chamber")
					this.enteredAChamber = true;
				}
				document.getElementById("maze").classList.add("danger");
			}
			if (this.g[this.start_i][this.start_j] == CHAMBER && this.g[i][j] != CHAMBER) {
				document.getElementById("maze").classList.remove("danger");
			}
			[this.start_i,this.start_j] = [i,j]
			if (this.g[this.start_i][this.start_j] == CHAMBER) this.moveSlugs();

			if (this.g[this.start_i][this.start_j] == COIN) {
				this.inventoryCoins++;
				this.g[this.start_i][this.start_j] = STEPS;
				this.updateStat("inventoryCoins",this.inventoryCoins,true)
				if (this.inventoryCoins == 1) this.addAchievement("Coins");
			}

			if (this.g[this.start_i][this.start_j] == SLUG) {
				if (randint(1,6)==6) {
					// adventurer death
					if (this.inventoryCoins>0){
						this.inventoryCoins = 0;
						this.updateStat("inventoryCoins",this.inventoryCoins,true);
					}
					this.deaths++;
					this.updateStat("deaths",this.deaths,true);
					if (this.deaths==1) this.addAchievement("First death by slug");
					else this.addMessage("Death");
					this.mazeSize = Math.max(5,this.mazeSize-1);
					this.slugs = Math.max(0,this.slugs-1);
					this.coins = Math.max(0,this.coins-1);
					this.numChambers = 0;
					this.tunnelVisionIn(()=>{this.start();});
				} else {
					// slug death
					this.killsSlugs++;
					if (this.killsSlugs == 1) this.addAchievement("First slug kill");
					else if (this.killsSlugs == 5) this.addAchievement("Fifth slug kill");
					else if (this.killsSlugs == 10) this.addAchievement("Tenth slug kill");
					else this.addMessage("The dungeon slug as been squished");
					this.g[this.start_i][this.start_j] = STEPS;
					this.updateStat("killsSlugs",this.killsSlugs,true);
				}
			}

			if (this.g[this.start_i][this.start_j] == EXIT) {
				this.totalExits++;
				if (this.totalExits == 1) this.addAchievement("First exit found")
				this.updateStat("totalexits",this.totalExits,this.totalExits>0);
				this.upgrade();
				this.tunnelVisionIn(()=>{this.start();});
			}
		}
	}

	this.tunnelVisionIn = function(callback) {
		const that = this;
		this.canMove = false;
		document.getElementById("maze").classList.add("paused");
		this.tunnelVision = Math.floor(this.g.length);
		function zoom() {
			if (that.tunnelVision > 1) {
				that.tunnelVision *= 0.8;
				that.tunnelVision -= 1;
				that.refresh();
				setTimeout(zoom, 100);
			} else {
				callback()
			}
		}
		zoom();
	}

	this.tunnelVisionOut = function(callback) {
		const that = this;
		let maxTunnelVision = Math.floor(this.g.length);
		this.tunnelVision = 0
		function zoom() {
			if (that.tunnelVision < maxTunnelVision) {
				that.tunnelVision += 1;
				that.tunnelVision *= 1.2;
				that.refresh();
				setTimeout(zoom, 100);
			} else {
				that.tunnelVision = that.g.length*2;
				that.canMove = true;
				document.getElementById("maze").classList.remove("paused");
				callback()
			}
		};
		zoom();
	}

	this.incrementTimer = function() {
		this.secondsPlayed++;
		if (this.secondsPlayed == 120) document.getElementById("secondsplayed").parentElement.classList.remove("hidden");
		if (this.secondsPlayed == 10) this.addMessage("10 seconds have passed since you began.");
		if (this.secondsPlayed == 60) this.addMessage("Wow, you've been playing for 1 minute");
		if (this.secondsPlayed == 60*5) this.addMessage("It's been 5 minutes and you are still here?");
		if (this.secondsPlayed == 60*10) this.addAchievement("10 min of game time");
		if (this.secondsPlayed == 60*30) this.addAchievement("30 min of game time");
		if (this.secondsPlayed == 60*60) this.addAchievement("60 min of game time");

		document.getElementById("secondsplayed").innerHTML = this.secondsPlayed;
	}
}


let game = new Game();
game.start();

let actions = {
	'ArrowLeft' : { desc : 'left' , funct: ()=>{game.moveTo(game.start_i,game.start_j-1); } },
	'ArrowRight' : { desc : 'right' , funct : ()=>{game.moveTo(game.start_i,game.start_j+1); } },
	'ArrowUp' : { desc : 'up' , funct : ()=>{game.moveTo(game.start_i-1,game.start_j); } },
	'ArrowDown' : { desc : 'down' , funct : ()=>{game.moveTo(game.start_i+1,game.start_j); } },
	'KeyN' : { funct: ()=>{ game.start(); } },
	'KeyL' : { funct: ()=>{ game.light = !game.light; } },
	'KeyU' : { funct: ()=>{ if (game.canMove) { game.upgrade(); game.start(); } } }
};

document.onkeydown = (e) => {
	if (game.canMove && e.code in actions) {
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
