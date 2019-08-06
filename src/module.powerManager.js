/*
 * Copyright (c) 2019.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by rober on 5/16/2017.
 */

module.exports.powerControl = function () {
    let powerSpawns = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_POWER_SPAWN);
    if (powerSpawns.length) {
        for (let powerSpawn of powerSpawns) {
            if (powerSpawn.room.energy >= ENERGY_AMOUNT && powerSpawn.power >= 1 && powerSpawn.energy >= 50) {
                powerSpawn.processPower();
            }
        }
    }
    // Handle PC spawning
    if (Game.gpl.level) {
        if (_.size(Game.powerCreeps) && (Game.gpl.level < 10 || Memory.ownedRooms.length / 4 <= _.size(Game.powerCreeps))) {
            let powerCreeps = _.filter(Game.powerCreeps, (c) => c.my);
            let militaryOperator = _.filter(Game.powerCreeps, (c) => c.my && c.memory.combat);
            for (let powerCreep of powerCreeps) {
                if (powerCreep.ticksToLive) {
                    powerCreep.memory.combat = undefined;
                    let powerCreepRole = require('powerRole.' + powerCreep.className);
                    try {
                        // If idle sleep
                        if (powerCreep.idle) continue;
                        powerCreepRole.role(powerCreep);
                    } catch (e) {
                        log.e(powerCreepRole.name + ' in room ' + powerCreep.room.name + ' experienced an error');
                        log.e(e.stack);
                        Game.notify(e.stack);
                    }
                } else if (!powerCreep.spawnCooldownTime || powerCreep.spawnCooldownTime < Date.now()) {
                    let spawn = _.filter(Game.structures, (s) => s.my && s.structureType === STRUCTURE_POWER_SPAWN)[0];
                    if (spawn) {
                        log.a('Spawned an operator in ' + roomLink(spawn.room.name));
                        powerCreep.spawn(spawn)
                    }
                }
            }
        } else {
            let name = 'operator_' + _.random(1, 99);
            log.a('Created an operator named ' + name);
            PowerCreep.create(name, POWER_CLASS.OPERATOR);
        }
    }
};

