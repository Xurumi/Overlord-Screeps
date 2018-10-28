/**
 * Created by Bob on 7/12/2017.
 */

let _ = require('lodash');
const profiler = require('screeps-profiler');

function role(creep) {
    if (creep.tryToBoost(['upgrade'])) return;
    //INITIAL CHECKS
    if (creep.borderCheck()) return null;
    if (creep.wrongRoom()) return null;
    let link = Game.getObjectById(creep.room.memory.controllerLink);
    let container = Game.getObjectById(creep.room.memory.controllerContainer);
    if (creep.carry.energy === 0) creep.memory.working = undefined;
    if (creep.isFull) creep.memory.working = true;
    if (creep.memory.working === true) {
        if (creep.upgradeController(Game.rooms[creep.memory.overlord].controller) === ERR_NOT_IN_RANGE) creep.shibMove(Game.rooms[creep.memory.overlord].controller, {range: 3});
        if (container && container.store[RESOURCE_ENERGY] > 0) creep.withdraw(container, RESOURCE_ENERGY);
        if (link && link.energy > 0) creep.withdraw(link, RESOURCE_ENERGY);
    } else {
        if (creep.memory.energyDestination) {
            creep.withdrawEnergy();
        } else if (container && container.store[RESOURCE_ENERGY] > 0) {
            switch (creep.withdraw(container, RESOURCE_ENERGY)) {
                case OK:
                    if (container && container.pos.checkForCreep()) return creep.shibMove(container, {range: 0});
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(container);
            }
        } else if (link && link.energy > 0) {
            switch (creep.withdraw(link, RESOURCE_ENERGY)) {
                case OK:
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(link);
            }
        } else {
            if (!container) {
                let container = creep.pos.findClosestByRange(creep.room.structures, {filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.pos.getRangeTo(s.room.controller) <= 1});
                if (container) creep.room.memory.controllerContainer = container.id;
            }
            if (!link && !creep.memory.energyDestination) {
                if (!container || creep.room.controller.ticksToDowngrade <= 1500) {
                    if (!creep.findEnergy(25)) {
                        let source = creep.pos.getClosestSource();
                        if (creep.harvest(source) === ERR_NOT_IN_RANGE) creep.shibMove(source)
                    }
                } else {
                    creep.idleFor(5);
                }
            } else {
                creep.idleFor(5);
            }
        }
    }
}

module.exports.role = profiler.registerFN(role, 'upgraderWorkers');