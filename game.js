'use strict';

import { randint, shuffle, assert } from './util.js';
import { bestiary } from './bestiary.js';

const WALL = "#";
const SPACE = " ";
const DOOR = "D";
const HERO = "@";
const STEPS = "·";
const CHAMBER = ",";
const EXIT = "E";
const ESSENCE_OF_WILL = "w";

const MAX_MAZE_SIZE = 12;
const MAX_GOOD_THINGS = 7;
const MAX_BAD_THINGS = 6;

export function Game() {
	this.reset = function() {
		this.start_i = 0;
		this.start_j = 0;
		this.light = 0;
		this.footprints = 1;
		this.canMove = 0;
		this.known;
		this.mazeSize = 2;
		this.numChambers = 0;
		this.numDoors = 0;
		this.map;
		this.tunnelVision = 1;

		this.totalSteps = 0;
		this.totalExits = 0;
		this.totalMaps = 0;
		this.secondsPlayed = 0;
		this.achievements = [];
		this.messages = [];
		this.enteredAChamber = 0;
		this.willpower_spawns = 0;
		this.bestiary_spawns = 0;
		this.willpower_inventory = 0;
		this.bestiary_kills = 0;
		this.deaths = 0;
	}
	this.reset();

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
		if ("v"+document.getElementById(statName).innerHTML == "v"+statValue) return;
		if (display) {
			document.getElementById(statName).parentElement.classList.remove("hidden");
		}
		if (statName != "maze" && statName != "totalsteps" ) {
			document.getElementById(statName).parentElement.classList.remove("shake");
			document.getElementById(statName).parentElement.offsetWidth;
			document.getElementById(statName).parentElement.classList.add("shake");
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
			this.light = 0;
			this.addAchievement("Light is too easy. Exploration illuminates the dungeon");
			return;
		}
		if (this.willpower_spawns < this.mazeSize - 4 && this.willpower_spawns < MAX_GOOD_THINGS) {
			if (this.willpower_spawns == 0) {
				this.addAchievement("Unlocked Essence of willpower '"+ESSENCE_OF_WILL+"'")
				this.addMessage("Essence of willpower may be laying about.");
			} else {
				this.addMessage("More essence of willpower to find.");
			}
			this.willpower_spawns += 1;
			return
		}
		if (this.bestiary_spawns < this.willpower_spawns && this.bestiary_spawns < MAX_BAD_THINGS) {
			this.bestiary_spawns += 1;
			let beast = bestiary[this.bestiary_spawns];
			this.addAchievement("Unlocked "+beast.species+" '"+beast.icon+"'")
			this.addMessage(beast.species+" '"+beast.icon+"' may be lurking about.");
			this.addMessage(beast.species+" - "+beast.description);
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
						this.known[I][J] = 1;
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
		for (var i = 0; i < n; i++) this.known[i] = Array(n).fill(0);

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
		for (let x=0; x<this.willpower_spawns; x++) {
			let I,J;
			[I, J] = placeItem(SPACE, 1)
			G[I][J] = ESSENCE_OF_WILL;
		}
		// place beasts
		for (let x=0; x<this.bestiary_spawns; x++) {
			let I,J;
			[I, J] = placeItem(SPACE, 1)
			if (x==0) {
				G[I][J] = bestiary[1].icon
			} else {
				G[I][J] = bestiary[Math.trunc(Math.random()*this.bestiary_spawns)+1].icon
			}
		}
		this.illuminate(G, iexit, jexit);
		
		return G;
	}

	this.refresh = function(){
		this.illuminate(this.map, this.start_i, this.start_j);
		let n = this.map.length;
		let text = [];
		for (let i=0; i<n; i++) {
			let line = []
			for (let j=0; j<n; j++) {
				if ((this.start_i-i)**2 + (this.start_j-j)**2 > this.tunnelVision*this.tunnelVision) {
					line.push( "?" );
				} else if (i==this.start_i && j==this.start_j) {
					line.push(HERO);
				} else if (this.light || this.known[i][j]) {
					line.push( this.map[i][j] );
				} else {
					line.push( " " );
				}
			}
			text.push(line.join(""));
		}
		this.updateStat("maze",text.join("\n"),1);
	}

	this.start = function(){
		this.totalMaps++
		this.updateStat("totalmaps",this.totalMaps,1);
		this.updateStat("mazesize",this.mazeSize>=MAX_MAZE_SIZE?"max":this.mazeSize*2+1,this.mazeSize>5);
		this.updateStat("numchambers",this.numChambers,this.numChambers > 0);
		this.updateStat("numdoors",this.numDoors,this.numChambers > 1);

		this.map = this.maze(this.mazeSize, this.numChambers, this.numDoors);

		for (let i=this.map.length; i>0; i--) {
			let row = []
			for (let j=this.map.length; j>0; j--) {
				row.push(0);
			}
			this.known.push(row)
		}
		document.getElementById("maze").classList.remove("danger");
		this.tunnelVisionOut(()=>{this.refresh();});
	};

	this.beastAI = function(i,j,depth) {
		let best_move = null;
		let best_distance = 100000;
		let n=this.mazeSize*2+1;
		let I,J;
		for ( [I, J] of shuffle([[i+1, j], [i-1, j], [i, j+1], [i, j-1]] ) ) {
			if (0 <= I && I < n && 0 <= J && J < n && this.map[I][J] != WALL && this.map[I][J] != DOOR && this.map[I][J] != EXIT) {
				let distance;
				let move;
				if (depth > 0) {
					[move, distance] = this.beastAI(I,J,depth-1)
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

	this.moveBeasts = function() {
		this.canMove = 0;
		let n=this.mazeSize*2+1;
		let beastLocations = []
		for(let i=1; i<n; i++) for(let j=1; j<n-1; j++) {
			for(let b=1; b<=this.bestiary_spawns; b++){
				if (this.map[i][j] == bestiary[b].icon) {
					beastLocations.push([i,j,b]);
				}
			}
		}
		for(let loc of beastLocations) {
			let i,j,b;
			[i,j,b] = loc;
			let move;
			let distance;
			[move, distance] = this.beastAI(i,j,2+b*2);
			if (move != null) {
				this.map[i][j] = SPACE;
				this.illuminate(this.map,i,j,0);
				this.map[move[0]][move[1]] = bestiary[b].icon;
				this.illuminate(this.map,move[0],move[1],0);
			}
		}
		this.canMove = 1;
	}

	this.moveTo = function(i,j) {
		if (0<=i && i<this.map.length && 0<=j && j<this.map.length && this.map[i][j] != WALL) {

			this.totalSteps++;
			if (this.totalSteps == 1) this.addAchievement("The wisp has discovered how to move");
			if (this.totalSteps == 10) this.addAchievement("The wisp has moved 10 times");
			if (this.totalSteps == 100) this.addAchievement("The wisp has moved 100 times");
			if (this.totalSteps == 250) this.addAchievement("The wisp has moved 250 times");

			this.updateStat("totalsteps",this.totalSteps,this.totalSteps>0);
			if (this.map[this.start_i][this.start_j] == SPACE && this.footprints) {
				this.map[this.start_i][this.start_j] = STEPS;
			}
			if (this.map[this.start_i][this.start_j] != CHAMBER && this.map[i][j] == CHAMBER) {
				if (!this.enteredAChamber) {
					this.addAchievement("Explored first chamber")
					this.enteredAChamber = 1;
				}
				document.getElementById("maze").classList.add("danger");
			}
			if (this.map[this.start_i][this.start_j] == CHAMBER && this.map[i][j] != CHAMBER) {
				document.getElementById("maze").classList.remove("danger");
			}
			[this.start_i,this.start_j] = [i,j]
			if (this.map[this.start_i][this.start_j] == CHAMBER) this.moveBeasts();

			if (this.map[this.start_i][this.start_j] == ESSENCE_OF_WILL) {
				this.willpower_inventory++;
				this.map[this.start_i][this.start_j] = STEPS;
				this.updateStat("willpower_inventory",this.willpower_inventory,1)
				if (this.willpower_inventory == 1) this.addAchievement("Willpower collected");
			}

			for (let beast_id=1; beast_id <= this.bestiary_spawns; beast_id++)
			if (this.map[this.start_i][this.start_j] == bestiary[beast_id].icon) {
				if (randint(1,4)==4) {
					if (this.willpower_inventory>0){
						this.willpower_inventory -= 1;
						this.updateStat("willpower_inventory",this.willpower_inventory,1);
						this.addMessage("The "+bestiary[beast_id].species+" absorbed some willpower");
					} else {
						this.deaths++;
						this.updateStat("deaths",this.deaths,1);
						this.addMessage("The "+bestiary[beast_id].species+" absorbed the last essence of willpower")
						if (this.deaths==1) this.addAchievement("First death");
						else this.addMessage("Death");
						this.mazeSize = Math.max(5,this.mazeSize-1);
						let old_deaths = this.deaths;
						
						this.tunnelVisionIn(()=>{this.reset(); this.deaths=old_deaths; this.start();});
					}
				} else if (this.willpower_inventory>0){
					// beast death
					this.willpower_inventory -= 1;
					this.updateStat("willpower_inventory",this.willpower_inventory,1);
					this.bestiary_kills++;
					this.addMessage("The "+bestiary[beast_id].species+" has been overpowered by sheer willpower");
					if (this.bestiary_kills == 1) this.addAchievement("First beast kill");
					else if (this.bestiary_kills == 5) this.addAchievement("Fifth beast kill");
					else if (this.bestiary_kills == 10) this.addAchievement("Tenth beast kill");
					this.map[this.start_i][this.start_j] = STEPS;
					this.updateStat("killsSlugs",this.bestiary_kills,1);
				}
			}

			if (this.map[this.start_i][this.start_j] == EXIT) {
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
		this.canMove = 0;
		document.getElementById("maze").classList.add("paused");
		this.tunnelVision = Math.floor(this.map.length);
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
		let maxTunnelVision = Math.floor(this.map.length);
		this.tunnelVision = 0
		function zoom() {
			if (that.tunnelVision < maxTunnelVision) {
				that.tunnelVision += 1;
				that.tunnelVision *= 1.2;
				that.refresh();
				setTimeout(zoom, 100);
			} else {
				that.tunnelVision = that.map.length*2;
				that.canMove = 1;
				document.getElementById("maze").classList.remove("paused");
				callback()
			}
		};
		zoom();
	}

	this.incrementTimer = function() {
		this.secondsPlayed++;
		if (this.secondsPlayed >= 120) document.getElementById("secondsplayed").parentElement.classList.remove("hidden");
		if (this.secondsPlayed == 10) this.addMessage("10 seconds have passed");
		if (this.secondsPlayed == 60) this.addMessage("The wisp of willpower has existed for 1 minute");
		if (this.secondsPlayed == 60*5) this.addMessage("5 minutes of existance");
		if (this.secondsPlayed == 60*10) this.addAchievement("10 min of existance");
		if (this.secondsPlayed == 60*30) this.addAchievement("30 min of existance");
		if (this.secondsPlayed == 60*60) this.addAchievement("1 hour of existance");
		if (this.secondsPlayed == 2*60*60) this.addAchievement("2 hour of existance");
		if (this.secondsPlayed == 5*60*60) this.addAchievement("5 hour of existance");

		document.getElementById("secondsplayed").innerHTML = this.secondsPlayed;
	}
}
