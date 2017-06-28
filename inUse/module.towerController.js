/**
 * Created by rober on 5/16/2017.
 */
let _ = require('lodash');
const profiler = require('screeps-profiler');

let doNotAggress = RawMemory.segments[2];

module.exports.towerControl = function () {
    for (let tower of _.values(Game.structures)) {
        if (tower.structureType === STRUCTURE_TOWER) {
            const barriers = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && s.hits < 500});
            const road = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.25});
            const woundedCreep = tower.pos.findClosestByRange(FIND_CREEPS, {filter: (c) => c.hits < c.hitsMax && _.includes(doNotAggress, c.owner['username']) === true});
            const closestHostile = tower.pos.findInRange(FIND_CREEPS, 50, {filter: (s) => _.includes(doNotAggress, s.owner['username']) === false});
            if (closestHostile.length > 0) {
                for (let i = 0; i < closestHostile.length; i++) {
                    if (closestHostile[i].pos.getRangeTo(tower) < 15) {
                        tower.attack(closestHostile);
                    } else if (closestHostile[i].pos.getRangeTo(closestHostile[i].pos.findClosestByRange(FIND_MY_CREEPS, {filter: (c) => c.memory.role === 'responder'})) <= 3) {
                        tower.attack(closestHostile);
                    }
                }
                continue;
            }
            if (woundedCreep) {
                tower.heal(woundedCreep);
                continue;
            }
            if (barriers) {
                tower.repair(barriers);
                continue;
            }
            if (road) {
                tower.repair(road);
                continue;
            }
            if (tower.energy > tower.energyCapacity * 0.75) {
                const closestDamagedStructure = Game.getObjectById(findRepair(tower));
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                }
            }
        }
    }
};

function findRepair(tower) {

    site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_SPAWN && s.hits < s.hitsMax});
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 1000});
    }
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTENSION && s.hits < s.hitsMax});
    }
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax});
    }
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.75});
    }
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax / 2});
    }
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 100000});
    }
    if (site === null) {
        site = tower.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_WALL && s.hits < 100000});
    }
    if (site !== null && site !== undefined) {
        return site.id;
    }
}
findRepair = profiler.registerFN(findRepair, 'findRepairTower');

function findWounded(tower) {

    const creep = tower.pos.findClosestByRange(FIND_CREEPS, {filter: (s) => s.hits < s.hitsMax});
    if (creep !== null && creep !== undefined) {
        return creep.id;
    }
}
findWounded = profiler.registerFN(findWounded, 'findRepairTower');
