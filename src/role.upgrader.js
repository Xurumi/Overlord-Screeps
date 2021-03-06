/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by Bob on 7/12/2017.
 */

module.exports.role = function (creep) {
    //INITIAL CHECKS
    if (creep.tryToBoost(['upgrade']) || creep.wrongRoom()) return;
    // Handle yelling
    herald(creep);
    if (creep.isFull) creep.memory.working = true;
    if (!creep.store[RESOURCE_ENERGY]) delete creep.memory.working;
    let container = Game.getObjectById(creep.room.memory.controllerContainer);
    let link = Game.getObjectById(creep.room.memory.controllerLink);
    if (creep.memory.working) {
        switch (creep.upgradeController(Game.rooms[creep.memory.overlord].controller)) {
            case OK:
                if (Math.random() > 0.99) creep.memory.onContainer = undefined;
                if (!creep.memory.onContainer) {
                    if (container && (!container.pos.checkForCreep() || container.pos.checkForCreep().memory.role !== 'upgrader') && creep.pos.getRangeTo(container)) {
                        return creep.shibMove(container, {range: 0});
                    } else {
                        creep.memory.onContainer = true;
                    }
                }
                if (!creep.isFull) {
                    if (link && link.energy) {
                        creep.withdrawResource(link);
                    } else if (container && container.store[RESOURCE_ENERGY]) {
                        creep.withdrawResource(container);
                    }
                }
                return;
            case ERR_NOT_IN_RANGE:
                return creep.shibMove(Game.rooms[creep.memory.overlord].controller, {range: 3});
        }
    }
    if (creep.memory.energyDestination) {
        creep.withdrawResource();
    } else if (!creep.getActiveBodyparts(MOVE)) {
        if (!creep.memory.onContainer) {
            if (container && (!container.pos.checkForCreep() || container.pos.checkForCreep().memory.role !== 'upgrader') && creep.pos.getRangeTo(container)) {
                return creep.shibMove(container, {range: 0});
            } else {
                creep.memory.onContainer = true;
            }
        } else {
            if (link && link.energy) {
                creep.withdrawResource(link);
            } else if (container && container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                creep.withdrawResource(container);
            }
        }
    } else if (container && container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
        creep.withdrawResource(container);
    } else if (!creep.findEnergy(25)) {
        let source = creep.pos.getClosestSource();
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) creep.shibMove(source)
    }
};

function herald(creep) {
    if (creep.memory.notHerald) return;
    if (creep.memory.herald) {
        let sentence = ['-'];
        if (Memory.LOANalliance) sentence = sentence.concat([Memory.LOANalliance, '-']);
        if (Memory.roomCache[creep.room.name].responseNeeded) {
            if (Memory.roomCache[creep.room.name].threatLevel === 1) sentence = sentence.concat(['FPCON', 'ALPHA']);
            if (Memory.roomCache[creep.room.name].threatLevel === 2) sentence = sentence.concat(['FPCON', 'BRAVO']);
            if (Memory.roomCache[creep.room.name].threatLevel === 3) sentence = sentence.concat(['FPCON', 'CHARLIE']);
            if (Memory.roomCache[creep.room.name].threatLevel >= 4) sentence = sentence.concat(['FPCON', 'DELTA']);
        } else if (Memory.roomCache[creep.room.name] && Memory.roomCache[creep.room.name].lastPlayerSighting) {
            sentence = sentence.concat(['LAST', 'ATTACK', Game.time - Memory.roomCache[creep.room.name].lastPlayerSighting, 'TICKS', 'AGO']);
        } else {
            sentence = sentence.concat(['FPCON', 'NORMAL']);
        }
        if (Memory._badBoyArray && Memory._badBoyArray.length) {
            sentence = sentence.concat(['-', 'THREAT', 'LIST', '-']);
            sentence = sentence.concat(Memory._badBoyArray);
        }
        if (Memory._friendsArray && Memory._friendsArray.length > 1) {
            sentence = sentence.concat(['-', 'FRIENDS', 'LIST', '-']);
            sentence = sentence.concat(Memory._friendsArray);
        }
        if (Memory.ncpArray && Memory.ncpArray.length > 1) {
            sentence = sentence.concat(['-', 'KNOWN', 'NCP', 'LIST', '-']);
            sentence = sentence.concat(Memory.ncpArray);
        }
        let word = Game.time % sentence.length;
        creep.say(sentence[word], true);
        if (!creep.memory.signed) {
            let signs = OWNED_ROOM_SIGNS;
            let addition = '';
            if (Game.shard.name === 'treecafe' && creep.room.controller.level >= 4) addition = ' @pvp@';
            switch (creep.signController(creep.room.controller, _.sample(signs) + addition)) {
                case OK:
                    creep.memory.signed = true;
                    break;
                case ERR_NOT_IN_RANGE:
                    return creep.shibMove(creep.room.controller, {range: 1});
            }
        }
    } else {
        let activeHerald = _.filter(creep.room.creeps, (c) => c.my && c.memory.herald);
        if (!activeHerald.length) {
            creep.memory.herald = true;
        } else {
            creep.memory.notHerald = true;
        }
    }
}