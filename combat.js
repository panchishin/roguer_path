"use strict";

function attackDamage(a,d,r) { // attack strength, defense strength, random 0<1
	r = Math.floor(r*(a+d));
	if (r < a && r <= d ) return a - r;

	if (d < a) {
		if (r > a) return r - d;
		else return a - d;
	} else {
		if (r > d) return a + d - r;
		else return 0;
	}
}

let attackDamageTestCases = [
	[ 0, 0, 0, 0 ],
	[ 1, 0, 0, 1 ], [ 1, 0, 1, 1 ] ,
	[ 2, 1, 0, 2 ], [ 2, 1, 1, 1 ], [ 2, 1, 2, 1 ], [ 2, 1, 3, 2 ] ,
	[ 2, 2, 0, 2 ], [ 2, 2, 1, 1 ], [ 2, 2, 2, 0 ], [ 2, 2, 3, 1 ] ,
	[ 4, 1, 0, 4 ], [ 4, 1, 1, 3 ], [ 4, 1, 2, 3 ], [ 4, 1, 3, 3 ], [ 4, 1, 4, 3 ],
	[ 2, 4, 0, 2 ], [ 2, 4, 1, 1 ], [ 2, 4, 2, 0 ], [ 2, 4, 3, 0 ], [ 2, 4, 4, 0 ], [ 2, 4, 5, 1 ], 
	[ 4, 2, 0, 4 ], [ 4, 2, 1, 3 ], [ 4, 2, 2, 2 ], [ 4, 2, 3, 2 ], [ 4, 2, 4, 2 ], [ 4, 2, 5, 3 ], 
];

let tests = 0;
for (let [a,d,r,o] of attackDamageTestCases){
	let r2 = (a+d)==0?0:r/(a+d);
	if (!( attackDamage(a,d,r2) == o )) {
		console.log("error with attackDamage("+a+","+d+","+r+") == "+o+" but was " + attackDamage(a,d,r2));
		break;
	}
	tests++;
}
console.log("Successfully ran " + tests + " tests out of " + attackDamageTestCases.length);

function attackSuccess(a,d,r) { // attack chance, defense chance, random 0<1
	return a==0? 0: r*(a+d) < a;
}

let attackSuccessTestCases = [
	[ 0, 0, 0, false], [ 0, 2, 1, false], 
	[ 1, 0, 0, true],
	[ 2, 1, 0, true], [ 2, 1, 1, true], [ 2, 1, 2, false],
	[ 2, 1, 0.99, true], [ 2, 1, 1.99, true], [ 2, 1, 2.99, false],
	[ 1, 2, 0, true], [ 1, 2, 1, false], [ 1, 2, 2, false],
]

tests = 0;
for (let [a,d,r,s] of attackSuccessTestCases){
	let r2 = (a+d)==0?0:r/(a+d);
	if (!( attackSuccess(a,d,r2) == s )) {
		console.log("error with attackSuccess("+a+","+d+","+r+") == "+s+" but was " + attackSuccess(a,d,r2));
		break;
	}
	tests++;
}
console.log("Successfully ran " + tests + " tests out of " + attackSuccessTestCases.length);

const BASE=16

function makeHumanWithFist(name="human") {
	return { attack_chance : BASE , attack_damage : BASE , defence_chance : BASE , defence_damage : BASE , health : BASE , name: name };
}

function makeSlug(name="slug") {
	return { attack_chance : BASE , attack_damage : BASE , defence_chance : 0 , defence_damage : BASE , health : BASE , name: name };
}

function giveKnife(entity) {
	// entity.attack_chance += BASE;
	entity.attack_damage += BASE;
	entity.defence_chance += BASE;
	entity.name += " with knife";
	return entity
}

function improveArmor(entity) {
	entity.defence_chance += BASE;
	entity.name += " with light armor";
	return entity
}

function oneAttackBetweenEntities(entityA, entityB, describe=true) {
	if ( attackSuccess(entityA.attack_chance, entityB.defence_chance, Math.random()) ) {
		let damage = attackDamage(entityA.attack_damage, entityB.defence_damage, Math.random());
		if (damage == 0) {
			if (describe) console.log(entityA.name + " strikes " + entityB.name + " but the attack was ineffective");
			// entityB.health -= 1;
		} else {
			if (describe) console.log(entityA.name + " strikes " + entityB.name + " for " + damage + " damage");
			entityB.health -= damage;
			if (entityB.health <= 0) {
				if (describe) console.log(entityB.name + " dies")
			} else {
				if (describe) console.log(entityB.name + " only has " + entityB.health + " health left")
			}
			}
	} else {
		if (describe) console.log(entityA.name + " swings wildly");
	}
}

let bob = makeHumanWithFist("Billy Bob");
let slug = makeSlug("cave slug");

while (bob.health > 0 && slug.health > 0) {
	oneAttackBetweenEntities(bob, slug);
	if (slug.health > 0) oneAttackBetweenEntities(slug, bob);
}
console.log("And the victor is " + (bob.health > 0 ? bob.name : slug.name) + " with " + (bob.health > 0 ? bob.health : slug.health) + " health remaining" )

function battle(makeA, makeB, battles, describe=false) {
	let a_wins = 0;
	let a_health = 0;
	let b_wins = 0;
	let b_health = 0;
	for( ; battles > 0; battles--) {
		let entityA = makeA();
		let entityB = makeB();
		while (entityA.health > 0 && entityB.health > 0) {
			oneAttackBetweenEntities(entityA, entityB, describe);
			if (entityB.health > 0) oneAttackBetweenEntities(entityB, entityA, describe);
		}
		if (describe) console.log("And the victor is " + (entityA.health > 0 ? entityA.name : entityB.name) + " with " + (entityA.health > 0 ? entityA.health : entityB.health) + " health remaining" )

		if (entityA.health > 0) { a_wins++; a_health += entityA.health }
		else { b_wins++; b_health += entityB.health }
		if (describe) console.log();
	}
	console.log(makeA().name + " won " + a_wins + " ("+100*a_wins/(a_wins+b_wins)+") avg health " + Math.round(a_health/a_wins) + " vs " + makeB().name + " won " + b_wins + " (" + 100*b_wins/(a_wins+b_wins) +") avg health " + Math.round(b_health/b_wins) );
}

battle(makeHumanWithFist, makeSlug, 5, true);
console.log();
battle(makeHumanWithFist, makeSlug, 10000);
battle(makeSlug, makeHumanWithFist, 10000);
console.log();
battle(()=>{return giveKnife(makeHumanWithFist())}, makeSlug, 10000);
battle(makeSlug, ()=>{return giveKnife(makeHumanWithFist())}, 10000);
console.log();
battle(()=>{return improveArmor(makeHumanWithFist())}, makeSlug, 10000);
battle(makeSlug, ()=>{return improveArmor(makeHumanWithFist())}, 10000);
console.log();
battle(makeHumanWithFist,()=>{return improveArmor(makeSlug())}, 10000);
battle(()=>{return improveArmor(makeSlug())}, makeHumanWithFist, 10000);
console.log();
battle(()=>{return giveKnife(improveArmor(makeHumanWithFist()))}, makeSlug, 10000);
battle(makeSlug, ()=>{return giveKnife(improveArmor(makeHumanWithFist()))}, 10000);
console.log();
battle(()=>{return makeHumanWithFist("Attacker")}, ()=>{return makeHumanWithFist("Defender")}, 10000);
console.log();
battle(()=>{return giveKnife(makeHumanWithFist())}, makeHumanWithFist, 10000);
battle(makeHumanWithFist, ()=>{return giveKnife(makeHumanWithFist())}, 10000);
console.log();
battle(()=>{return improveArmor(makeHumanWithFist())}, makeHumanWithFist, 10000);
battle(makeHumanWithFist, ()=>{return improveArmor(makeHumanWithFist())}, 10000);
console.log();
battle(()=>{return giveKnife(makeHumanWithFist())}, makeSlug, 5, true);
console.log();
battle(()=>{return makeHumanWithFist("Attacker")}, ()=>{return makeHumanWithFist("Defender")}, 5, true);
