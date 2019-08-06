let overlord = require('main.Overlord');
let highCommand = require('military.highCommand');
let labs = require('module.labController');
let power = require('module.powerManager');
let spawning = require('module.creepSpawning');
let expansion = require('module.expansion');
let diplomacy = require('module.diplomacy');
let hud = require('module.hud');
let shib = require("shibBench");

module.exports.hiveMind = function () {
    // Clean mineral list
    if (Game.time % 10000 === 0) Memory.ownedMineral = [];
    let cpuBucket = Game.cpu.bucket;

    let cpu;
    // Handle Diplomacy
    cpu = Game.cpu.getUsed();
    try {
        diplomacy.diplomacyOverlord();
    } catch (e) {
        log.e('Diplomacy Module experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    shib.shibBench('diplomacyControl', cpu);
    // High Command
    cpu = Game.cpu.getUsed();
    try {
        highCommand.highCommand();
    } catch (e) {
        log.e('High Command Module experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    shib.shibBench('highCommand', cpu);
    // Handle Labs
    cpu = Game.cpu.getUsed();
    if (Game.cpu.bucket >= 9999) {
        try {
            labs.labManager();
        } catch (e) {
            log.e('Lab Module experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    shib.shibBench('labControl', cpu);
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
    let processed = 0;
    for (let key in Memory.ownedRooms) {
        let activeRoom = Memory.ownedRooms[key];
        try {
            overlord.overlordMind(activeRoom);
        } catch (e) {
            log.e('Overlord Module experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
        processed++;
    }
    //Expansion Manager
    if (Game.time % 150 === 0) {
        let overlordCount = Memory.ownedRooms.length;
        let maxLevel = _.max(Memory.ownedRooms, 'controller.level').controller.level;
        let minLevel = _.min(Memory.ownedRooms, 'controller.level').controller.level;
        if (maxLevel >= 4 && minLevel >= 3 && cpuBucket === 10000) {
            let maxRooms = _.round(Game.cpu.limit / 12);
            if (TEN_CPU) maxRooms = 2;
            let needyRoom = _.filter(Memory.ownedRooms, (r) => r.memory.buildersNeeded);
            let safemode = _.filter(Memory.ownedRooms, (r) => r.controller.safeMode);
            let claimAttempt = _.filter(Memory.ownedRooms, (r) => r.memory.claimTarget);
            let claimScout = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimScout');
            if (needyRoom.length < Memory.ownedRooms.length / 2 && !safemode.length && !claimAttempt.length && !claimScout.length && Game.gcl.level > overlordCount && overlordCount < maxRooms) {
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

    // Figure out the prime room every 5000 ticks
    if (!Memory.primeRoom || Game.time % 5000 === 0) {
        // Find the highest level/richest room
        let primeRoom = _.filter(Memory.ownedRooms, (r) => r.controller.level === _.max(Memory.ownedRooms, 'controller.level').controller.level);
        if (primeRoom.length > 1) primeRoom = _.sortBy(primeRoom, 'energy')[0]; else primeRoom = primeRoom[0];
        Memory.primeRoom = primeRoom.name;
    }

    //Non room specific creep spawning
    if (Game.time % 25 === 0) {
        cpu = Game.cpu.getUsed();
        try {
            spawning.militaryCreepQueue();
        } catch (e) {
            log.e('Military Creep queue experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
        shib.shibBench('militarySpawn', cpu);
    }
    // Power Processing
    cpu = Game.cpu.getUsed();
    try {
        power.powerControl();
    } catch (e) {
        log.e('Power Manager experienced an error.');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    shib.shibBench('powerControl', cpu);
    //Process creep build queues
    cpu = Game.cpu.getUsed();
    try {
        spawning.processBuildQueue();
    } catch (e) {
        log.e('Creep build queue experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    shib.shibBench('processBuildQueue', cpu);
    //Room HUD (If CPU Allows)
    if (!TEN_CPU && Game.cpu.bucket > 9999) {
        cpu = Game.cpu.getUsed();
        try {
            hud.hud();
        } catch (e) {
            log.e('Room HUD experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
        shib.shibBench('roomHud', cpu);
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
    if (minion.hits < minion.hitsMax) minion.reportDamage();
    // Report intel chance
    if (minion.room.name !== minion.memory.overlord && Math.random() > 0.5) minion.room.cacheRoomIntel();
    // Handle nuke flee
    if (minion.memory.fleeNukeTime && minion.fleeRoom(minion.memory.fleeNukeRoom)) return;
    // Set role
    let memoryRole = minion.memory.role;
    let creepRole = require('role.' + memoryRole);
    let start = Game.cpu.getUsed();
    try {
        if (minion.borderCheck()) return;
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
    shib.shibBench(memoryRole, start, Game.cpu.getUsed());
}

