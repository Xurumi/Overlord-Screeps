/*
 * Copyright (c) 2019.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

let overlord = require('main.Overlord');
let highCommand = require('military.highCommand');
let labs = require('module.labController');
let power = require('module.powerManager');
let spawning = require('module.creepSpawning');
let expansion = require('module.expansion');
let diplomacy = require('module.diplomacy');
let hud = require('module.hud');

module.exports.hiveMind = function () {

    // Handle Diplomacy
    try {
        diplomacy.diplomacyOverlord();
    } catch (e) {
        log.e('Diplomacy Module experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    // High Command
    try {
        highCommand.highCommand();
    } catch (e) {
        log.e('High Command Module experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    // Handle Labs
    if (Game.cpu.bucket >= 5000) {
        try {
            labs.labManager();
        } catch (e) {
            log.e('Lab Module experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Military first
    let militaryCreeps = shuffle(_.filter(Game.creeps, (r) => r.memory.military));
    for (let key in militaryCreeps) {
        try {
            minionController(militaryCreeps[key]);
        } catch (e) {
            log.e('Military Minion Controller experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Process Overlords
    for (let key in Memory.ownedRooms) {
        let activeRoom = Memory.ownedRooms[key];
        try {
            overlord.overlordMind(activeRoom);
        } catch (e) {
            log.e('Overlord Module experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    //Expansion Manager
    if (Game.time % 25 === 0) {
        let overlordCount = Memory.ownedRooms.length;
        let maxLevel = _.max(Memory.ownedRooms, 'controller.level').controller.level;
        let minLevel = _.min(Memory.ownedRooms, 'controller.level').controller.level;
        let maxRooms = _.round(Game.cpu.limit / 12);
        if (TEN_CPU) maxRooms = 2;
        if (maxLevel >= 4 && minLevel >= 3 && overlordCount < maxRooms && Game.gcl.level > overlordCount) {
            let needyRoom = _.filter(Memory.ownedRooms, (r) => r.memory.buildersNeeded);
            let safemode = _.filter(Memory.ownedRooms, (r) => r.controller.safeMode);
            let claimMission = _.filter(Memory.targetRooms, (t) => t.type === 'claimScout' || t.type === 'claim');
            if (needyRoom.length < Memory.ownedRooms.length / 2 && !safemode.length && !claimMission.length) {
                try {
                    expansion.claimNewRoom();
                } catch (e) {
                    log.e('Expansion Module experienced an error');
                    log.e(e.stack);
                    Game.notify(e.stack);
                }
            }
        }
    }

    //Non room specific creep spawning
    if (Game.time % 25 === 0) {
        try {
            spawning.militaryCreepQueue();
        } catch (e) {
            log.e('Military Creep queue experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Power Processing
    try {
        power.powerControl();
    } catch (e) {
        log.e('Power Manager experienced an error.');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    //Process creep build queues
    try {
        spawning.processBuildQueue();
    } catch (e) {
        log.e('Creep build queue experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    //Room HUD (If CPU Allows)
    if (Game.cpu.bucket > 1000) {
        try {
            hud.hud();
        } catch (e) {
            log.e('Room HUD experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
};

function minionController(minion) {
    // Disable notifications
    if (minion.ticksToLive > 1450) minion.notifyWhenAttacked(false);
    // If minion has been flagged to recycle do so
    if (minion.memory.recycle) return minion.recycleCreep();
    // If idle sleep
    if (minion.idle) return;
    // Report damage if hits are low
    if (minion.hits < minion.hitsMax) minion.trackThreat();
    // Handle nuke flee
    if (minion.memory.fleeNukeTime && minion.fleeRoom(minion.memory.fleeNukeRoom)) return;
    // Set role
    let memoryRole = minion.memory.role;
    let creepRole = require('role.' + memoryRole);
    let start = Game.cpu.getUsed();
    try {
        if (minion.borderCheck()) return;
        // Report intel chance
        if (minion.room.name !== minion.memory.overlord && Math.random() > 0.5) {
            minion.room.invaderCheck();
            minion.room.cacheRoomIntel();
        }
        creepRole.role(minion);
        let used = Game.cpu.getUsed() - start;
        let cpuUsageArray = creepCpuArray[minion.name] || [];
        if (cpuUsageArray.length < 50) {
            cpuUsageArray.push(used)
        } else {
            cpuUsageArray.shift();
            cpuUsageArray.push(used);
            if (average(cpuUsageArray) > 10) {
                minion.memory.recycle = true;
                log.e(minion.name + ' was killed for overusing CPU in room ' + minion.room.name);
            }
        }
        creepCpuArray[minion.name] = cpuUsageArray;
        minion.room.visual.text(
            _.round(average(cpuUsageArray), 2),
            minion.pos.x,
            minion.pos.y,
            {opacity: 0.8, font: 0.4, stroke: '#000000', strokeWidth: 0.05}
        );
    } catch (e) {
        log.e(minion.name + ' experienced an error in room ' + minion.room.name);
        log.e(e.stack);
        Game.notify(e.stack);
    }
}

