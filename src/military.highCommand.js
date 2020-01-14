/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by rober on 5/16/2017.
 */

module.exports.highCommand = function () {
    if (!Memory.targetRooms) Memory.targetRooms = {};
    let maxLevel = Memory.maxLevel;
    // Manage dispatching responders
    if (Game.time % 10 === 0) manageResponseForces();
    // Crush new spawns
    if (NEW_SPAWN_DENIAL && Game.time % 10 === 0) newSpawnDenial();
    // Request scouting for new operations
    if (maxLevel >= 4 && Game.time % 750 === 0) operationRequests();
    // Manage old operations
    if (Game.time % 50 === 0) manageAttacks();
    // Check for flags
    if (Game.time % 10 === 0) manualAttacks();
};

function manageResponseForces() {
    let idlePower = 0;
    let idleResponders = _.filter(Game.creeps, (c) => c.memory && c.memory.awaitingOrders && c.memory.operation === 'borderPatrol');
    idleResponders.forEach((c) => idlePower += c.combatPower);
    let ownedRoomAttack = _.findKey(Memory.roomCache, (r) => r.owner && r.owner === MY_USERNAME && r.lastPlayerSighting + 25 > Game.time && r.controller && r.controller.my);
    let responseTargets = _.max(_.filter(Memory.roomCache, (r) => r.threatLevel && !r.sk && (!r.user || r.user === MY_USERNAME) && r.closestRange <= LOCAL_SPHERE &&
        r.hostilePower < (r.friendlyPower + (_.sum(_.filter(Game.creeps, (c) => c.my && c.memory.responseTarget === r.name), 'combatPower')) + idlePower) * 0.85 && r.lastInvaderCheck + 550 >= Game.time), '.threatLevel');
    let highestHeat = _.max(_.filter(Memory.roomCache, (r) => r.roomHeat && !r.sk && (!r.user || r.user === MY_USERNAME) && r.closestRange <= LOCAL_SPHERE && !r.numberOfHostiles &&
        r.lastInvaderCheck + 550 >= Game.time), '.roomHeat');
    let guard = _.findKey(Memory.targetRooms, (o) => o.type === 'guard' && o.level > 0);
    let friendlyResponsePower = 0;
    if (ownedRoomAttack) {
        for (let creep of idleResponders) {
            if (friendlyResponsePower > ownedRoomAttack.hostilePower) break;
            friendlyResponsePower += creep.combatPower;
            creep.memory.responseTarget = ownedRoomAttack;
            creep.memory.awaitingOrders = undefined;
            creep.memory.idle = undefined;
            log.a(creep.name + ' reassigned to assist in the defense of ' + roomLink(ownedRoomAttack) + ' from ' + roomLink(creep.room.name));
        }
    } else if (responseTargets && responseTargets.name) {
        for (let creep of idleResponders) {
            if (friendlyResponsePower > responseTargets.hostilePower * 1.1) break;
            friendlyResponsePower += creep.combatPower;
            creep.memory.responseTarget = responseTargets.name;
            creep.memory.awaitingOrders = undefined;
            creep.memory.idle = undefined;
            log.a(creep.name + ' responding to ' + roomLink(responseTargets.name) + ' from ' + roomLink(creep.room.name));
        }
    } else if (guard) {
        for (let creep of idleResponders) {
            creep.memory.responseTarget = guard;
            creep.memory.awaitingOrders = undefined;
            creep.memory.idle = undefined;
            log.a(creep.name + ' reassigned to help guard ' + roomLink(guard) + ' from ' + roomLink(creep.room.name));
        }
    } else if (highestHeat && highestHeat.name) {
        for (let creep of idleResponders) {
            creep.memory.responseTarget = highestHeat.name;
            creep.memory.awaitingOrders = undefined;
            creep.memory.idle = undefined;
            if (creep.room.name !== highestHeat.name) log.a(creep.name + ' reassigned to a contested room ' + roomLink(highestHeat.name) + ' from ' + roomLink(creep.room.name));
        }
    }
}

function newSpawnDenial() {
    // Set limit
    let targetLimit = HARASS_LIMIT + 2;
    if (TEN_CPU) targetLimit = 1;
    let totalCountFiltered = _.filter(Memory.targetRooms, (target) => target.type !== 'poke' && target.type !== 'clean').length || 0;
    // Harass Enemies
    let newSpawns = _.sortBy(_.filter(Memory.roomCache, (r) => r.user && r.user !== MY_USERNAME && !r.safemode && r.closestRange <= 12 && !checkForNap(r.user) && !_.includes(FRIENDLIES, r.user) && !Memory.targetRooms[r.name] && !r.sk && !r.isHighway && r.level && !r.towers), 'closestRange');
    for (let target of newSpawns) {
        if (totalCountFiltered >= targetLimit) break;
        if (Memory.targetRooms[target.name]) continue;
        let lastOperation = Memory.roomCache[target.name].lastOperation || 0;
        if (lastOperation + 1000 > Game.time) continue;
        let cache = Memory.targetRooms || {};
        let tick = Game.time;
        cache[target.name] = {
            tick: tick,
            type: 'hold',
            level: 0,
            priority: 1
        };
        Memory.targetRooms = cache;
        log.a('Hold operation planned for ' + roomLink(target.name) + ' owned by ' + target.user + ' (Nearest Friendly Room - ' + target.closestRange + ' rooms away)', 'HIGH COMMAND: ');
        break;
    }
}

function operationRequests() {
    if (!Memory._enemies || !Memory._enemies.length) Memory._enemies = [];
    if (!Memory._nuisance || !Memory._nuisance.length) Memory._nuisance = [];
    let maxLevel = Memory.maxLevel;
    let totalCountFiltered = _.filter(Memory.targetRooms, (target) => target.type !== 'poke' && target.type !== 'clean' && target.type !== 'guard').length || 0;
    // Set limit
    let targetLimit = HARASS_LIMIT;
    if (TEN_CPU) targetLimit = 1;
    // Guard new rooms
    let guardNeeded = _.filter(Memory.roomCache, (r) => r.user && r.user === MY_USERNAME && r.level && !r.towers);
    for (let target of guardNeeded) {
        if (Memory.targetRooms[target.name]) continue;
        let cache = Memory.targetRooms || {};
        let tick = Game.time;
        cache[guardNeeded.name] = {
            tick: tick,
            type: 'guard',
            level: 1,
            priority: 1
        };
        Memory.targetRooms = cache;
        break;
    }
    // Harass Enemies
    let enemyHarass = _.sortBy(_.filter(Memory.roomCache, (r) => HARASS_ATTACKS && r.user && r.user !== MY_USERNAME && !checkForNap(r.user) && (_.includes(Memory._nuisance, r.user) || _.includes(Memory._enemies, r.user)) && !Memory.targetRooms[r.name] && !r.sk && !r.isHighway && !r.level), 'closestRange');
    if (!enemyHarass.length) enemyHarass = _.sortBy(_.filter(Memory.roomCache, (r) => r.user && r.user !== MY_USERNAME && !checkForNap(r.user) && !_.includes(FRIENDLIES, r.user) && !Memory.targetRooms[r.name] && !r.sk && !r.isHighway && !r.level && (ATTACK_LOCALS && r.closestRange <= LOCAL_SPHERE)), 'closestRange');
    for (let target of enemyHarass) {
        if (totalCountFiltered >= targetLimit) break;
        if (Memory.targetRooms[target.name]) continue;
        let lastOperation = Memory.roomCache[target.name].lastOperation || 0;
        if (lastOperation + 3000 > Game.time) continue;
        let cache = Memory.targetRooms || {};
        let tick = Game.time;
        cache[target.name] = {
            tick: tick,
            type: 'attack'
        };
        Memory.targetRooms = cache;
        log.a('Scout operation planned for ' + roomLink(target.name) + ' owned by ' + target.user + ' (Nearest Friendly Room - ' + target.closestRange + ' rooms away)', 'HIGH COMMAND: ');
        break;
    }
    // SIEGES
    if (Memory._enemies.length) {
        // Attack owned rooms of enemies
        let activeSieges = _.filter(Memory.targetRooms, (target) => target.type === 'siege' || target.type === 'siegeGroup' || target.type === 'swarm' || target.type === 'drain').length || 0;
        if (Memory._enemies.length && !activeSieges) {
            let enemySiege = _.sortBy(_.filter(Memory.roomCache, (r) => r.user && r.user !== MY_USERNAME && _.includes(Memory._enemies, r.user) && !checkForNap(r.user) &&
                !Memory.targetRooms[r.name] && !r.sk && !r.isHighway && r.level && (r.level < 3 || (SIEGE_ENABLED && maxLevel >= 6)) && (Game.shard.name !== 'treecafe' || r.forestPvp)), 'closestRange');
            for (let target of enemySiege) {
                if (Memory.targetRooms[target.name]) continue;
                let lastOperation = Memory.roomCache[target.name].lastOperation || 0;
                if (lastOperation + 4500 > Game.time) continue;
                let cache = Memory.targetRooms || {};
                let tick = Game.time;
                cache[target.name] = {
                    tick: tick,
                    type: 'attack'
                };
                Memory.targetRooms = cache;
                log.a('Scout operation planned for ' + roomLink(target.name) + ' owned by ' + target.user + ' (Room Level - ' + target.level + '), Nearest Room - ' + target.closestRange + ' rooms away)', 'HIGH COMMAND: ');
                break;
            }
        }
    }
    // Kill strongholds
    let stronghold = _.sortBy(_.filter(Memory.roomCache, (r) => r.sk && r.towers && r.closestRange <= 3), 'closestRange');
    if (stronghold.length) {
        for (let target of stronghold) {
            if (Memory.targetRooms[target.name]) continue;
            let lastOperation = Memory.roomCache[target.name].lastOperation || 0;
            if (lastOperation + 1000 > Game.time) continue;
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            cache[target.name] = {
                tick: tick,
                type: 'attack'
            };
            Memory.targetRooms = cache;
            log.a('Scout operation planned for ' + roomLink(target.name) + ' SUSPECTED INVADER STRONGHOLD (Nearest Friendly Room - ' + target.closestRange + ' rooms away)', 'HIGH COMMAND: ');
            break;
        }
    }
     // Clean
     let cleanCount = _.filter(Memory.targetRooms, (target) => target.type === 'clean').length || 0;
     let cleanLimit = CLEAN_LIMIT;
     if (TEN_CPU) cleanLimit = 0;
     if (cleanCount < cleanLimit) {
         let enemyClean = _.sortBy(_.filter(Memory.roomCache, (r) => !Memory.targetRooms[r.name] && r.structures && !r.owner && !r.isHighway), 'closestRange');
        if (enemyClean.length) {
            let cleanTarget = _.sample(enemyClean);
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            let overlordCount = Memory.myRooms.length;
            let type = 'clean';
            if (Game.gcl.level > overlordCount) type = 'claimClear';
            cache[cleanTarget.name] = {
                tick: tick,
                type: type,
                level: 1,
                priority: 4
            };
            Memory.targetRooms = cache;
            log.a('Cleaning operation planned for ' + roomLink(cleanTarget.name), 'HIGH COMMAND: ');
        }
     }
    // Pokes
    if (POKE_ATTACKS) {
        let pokeCount = _.filter(Memory.targetRooms, (target) => target.type === 'poke').length || 0;
        let pokeLimit = POKE_LIMIT;
        if (TEN_CPU) pokeLimit = 1;
        if (pokeCount < pokeLimit) {
            let pokeTargets = [];
            if (Memory._enemies.length) {
                pokeTargets = _.sortBy(_.filter(Memory.roomCache, (r) => r.user && r.user !== MY_USERNAME && !checkForNap(r.user) && (_.includes(Memory._nuisance, r.user) || _.includes(Memory._enemies, r.user)) && !Memory.targetRooms[r.name] && !r.sk && !r.isHighway && !r.level), 'closestRange');
            } else if (POKE_NEUTRALS) {
                pokeTargets = _.sortBy(_.filter(Memory.roomCache, (r) => r.user && r.user !== MY_USERNAME && !_.includes(FRIENDLIES, r.user) && !checkForNap(r.user) && !Memory.targetRooms[r.name] && !r.level && !r.sk && !r.isHighway), 'closestRange');
            }
            if (pokeTargets.length) {
                for (let target of pokeTargets) {
                    if (Memory.targetRooms[target.name]) continue;
                    pokeCount = _.filter(Memory.targetRooms, (target) => target.type === 'poke').length || 0;
                    if (pokeCount >= pokeLimit) break;
                    let lastOperation = Memory.roomCache[target.name].lastPoke || 0;
                    if (lastOperation !== 0 && lastOperation + _.random(0, 3000) > Game.time) continue;
                    Memory.roomCache[target.name].lastPoke = Game.time;
                    let cache = Memory.targetRooms || {};
                    let tick = Game.time;
                    let priority;
                    let range = target.closestRange;
                    if (range <= LOCAL_SPHERE) priority = 1; else if (range <= LOCAL_SPHERE * 1.25) priority = 2; else if (range <= LOCAL_SPHERE * 2) priority = 3; else priority = 4;
                    cache[target.name] = {
                        tick: tick,
                        type: 'poke',
                        level: 1,
                        priority: priority
                    };
                    Memory.targetRooms = cache;
                    log.a('Poke operation planned for ' + roomLink(target.name) + ' owned by ' + target.user, 'HIGH COMMAND: ');
                }
            }
        }
    }
    // Power Mining
    if (maxLevel >= 8 && !TEN_CPU) {
        let powerRooms = _.filter(Memory.roomCache, (r) => r.power && r.closestRange <= 10);
        let powerMining = _.filter(Memory.targetRooms, (target) => target.type === 'power').length || 0;
        if (powerRooms.length && powerMining <= 2) {
            for (let powerRoom of powerRooms) {
                if (Memory.targetRooms[powerRoom.name]) break;
                let lastOperation = Memory.roomCache[powerRoom.name].lastOperation || 0;
                if (lastOperation + 4500 > Game.time) continue;
                let cache = Memory.targetRooms || {};
                let tick = Game.time;
                cache[powerRoom.name] = {
                    tick: tick,
                    type: 'attack'
                };
                Memory.targetRooms = cache;
                log.a('Scout operation planned for ' + roomLink(powerRoom.name) + ' suspected power bank location, Nearest Room - ' + powerRoom.closestRange + ' rooms away', 'HIGH COMMAND: ');
                break;
            }
        }
    }
    // Commodity Mining
    if (maxLevel >= 4 && !TEN_CPU) {
        let commodityRooms = _.filter(Memory.roomCache, (r) => r.commodity && r.closestRange <= 10 && !r.user);
        let commodityMining = _.filter(Memory.targetRooms, (target) => target.type === 'commodity').length || 0;
        if (commodityRooms.length && commodityMining <= 2) {
            for (let commodityRoom of commodityRooms) {
                if (Memory.targetRooms[commodityRoom.name]) break;
                let lastOperation = Memory.roomCache[commodityRoom.name].lastOperation || 0;
                if (lastOperation + 4500 > Game.time) continue;
                let cache = Memory.targetRooms || {};
                let tick = Game.time;
                cache[commodityRoom.name] = {
                    tick: tick,
                    type: 'commodity',
                    level: 1,
                    priority: 1
                };
                Memory.targetRooms = cache;
                log.a('Mining operation planned for ' + roomLink(commodityRoom.name) + ' suspected power deposit location, Nearest Room - ' + commodityRoom.closestRange + ' rooms away', 'HIGH COMMAND: ');
                break;
            }
        }
    }
}

function manageAttacks() {
    if (!Memory.targetRooms || !_.size(Memory.targetRooms)) return;
    let maxLevel = Memory.maxLevel;
    let totalCountFiltered = _.filter(Memory.targetRooms, (target) => target.type !== 'poke' && target.type !== 'clean' && target.type !== 'attack' && target.type !== 'scout' && target.type !== 'power' && target.type !== 'commodity' && target.type !== 'guard').length || 0;
    let siegeCountFiltered = _.filter(Memory.targetRooms, (target) => target.type === 'siege' || target.type === 'siegeGroup').length || 0;
    let pokeCount = _.filter(Memory.targetRooms, (target) => target.type === 'poke').length || 0;
    let pokeLimit = POKE_LIMIT;
    let cleanCount = _.filter(Memory.targetRooms, (target) => target.type === 'clean').length || 0;
    let cleanLimit = CLEAN_LIMIT;
    if (TEN_CPU) cleanLimit = 1;
    if (!Memory.targetRooms) Memory.targetRooms = {};
    // Clear scouts if over limit
    if (totalCountFiltered > HARASS_LIMIT) {
        let cullAmount = totalCountFiltered - HARASS_LIMIT;
        let culled = 0;
        let scouts = _.filter(Memory.targetRooms, (target) => target.type === 'attack' || target.type === 'scout');
        for (let key in scouts) {
            if (culled >= cullAmount) break;
            culled++;
            totalCountFiltered--;
            delete Memory.targetRooms[key];
        }
    }
    let staleMulti = 1;
    for (let key in Memory.targetRooms) {
        let type = Memory.targetRooms[key].type;
        let priority = Memory.targetRooms[key].priority;
        // Special Conditions
        switch (type) {
            // Manage Scouts
            case 'scout':
            case 'attack':
                if (!_.filter(Game.creeps, (c) => c.my && c.memory.role === 'scout' && c.memory.targetRoom === key).length) staleMulti = 0.25;
                break;
            // Manage Pokes
            case 'poke':
                if (pokeCount > pokeLimit * 2) {
                    delete Memory.targetRooms[key];
                    continue;
                }
                break;
            // Manage harassment
            case 'harass':
            case 'rangers':
                if (totalCountFiltered > HARASS_LIMIT + 2) {
                    log.a('Canceling operation in ' + roomLink(key) + ' as we have too many active operations.', 'HIGH COMMAND: ');
                    delete Memory.targetRooms[key];
                    totalCountFiltered--;
                    continue;
                }
                if (Memory.roomCache[key] && Memory.roomCache[key].closestRange <= LOCAL_SPHERE) staleMulti = 2;
                break;
            // Manage Holds
            case 'hold':
                staleMulti = 10;
                break;
            // Manage Nukes
            case 'nukes':
                continue;
            // Manage siege
            case 'siegeGroup':
            case 'siege':
                if (maxLevel < 6) {
                    delete Memory.targetRooms[key];
                    continue;
                }
                if (siegeCountFiltered > 1) {
                    log.a('Canceling operation in ' + roomLink(key) + ' as we have too many active operations.', 'HIGH COMMAND: ');
                    delete Memory.targetRooms[key];
                    siegeCountFiltered--;
                    continue;
                }
                break;
            // Manage Pending
            case 'pending':
                if (Memory.targetRooms[key].dDay - 50 <= Game.time) {
                    let cache = Memory.targetRooms || {};
                    let tick = Game.time;
                    cache[key] = {
                        tick: tick,
                        type: 'attack',
                        level: 1,
                        dDay: undefined
                    };
                    Memory.targetRooms = cache;
                }
                continue;
            case 'power':
            case 'commodity':
            // Manage Guard
            case 'guard':
                staleMulti = 10;
                break;
            // Manage Cleaning
            case 'clean':
                if (cleanCount > cleanLimit) delete Memory.targetRooms[key];
                staleMulti = 10;
                break;
        }
        if (!Memory.targetRooms[key]) continue;
        // Cancel stale ops with no kills
        if ((Memory.targetRooms[key].tick + (1500 * staleMulti) < Game.time && !Memory.targetRooms[key].lastEnemyKilled) ||
            (Memory.targetRooms[key].lastEnemyKilled && Memory.targetRooms[key].lastEnemyKilled + (1500 * staleMulti) < Game.time)) {
            delete Memory.targetRooms[key];
            if (type !== 'poke') log.a('Canceling operation in ' + roomLink(key) + ' as it has gone stale.', 'HIGH COMMAND: ');
            continue;
        }
        // Remove your rooms
        if (Memory.roomCache[key] && Memory.targetRooms[key].type !== 'guard' && Memory.roomCache[key].user && Memory.roomCache[key].user === MY_USERNAME) {
            delete Memory.targetRooms[key];
            continue;
        }
        // Remove allied rooms
        if (Memory.roomCache[key] && Memory.targetRooms[key].type !== 'guard' && Memory.roomCache[key].user && _.includes(FRIENDLIES, Memory.roomCache[key].user)) {
            delete Memory.targetRooms[key];
            if (type !== 'poke') log.a('Canceling operation in ' + roomLink(key) + ' as ' + Memory.roomCache[key].user + ' is a friend.', 'HIGH COMMAND: ');
            continue;
        }
        // Remove allied rooms
        if (Memory.roomCache[key] && Memory.targetRooms[key].type !== 'guard' && Memory.roomCache[key].user && checkForNap(Memory.roomCache[key].user)) {
            delete Memory.targetRooms[key];
            if (type !== 'poke') log.a('Canceling operation in ' + roomLink(key) + ' as ' + Memory.roomCache[key].user + ' is part of a friendly alliance.', 'HIGH COMMAND: ');
            continue;
        }
        // Delete wave based rooms at the threshold
        if (Memory.targetRooms[key].waves) {
            if (Memory.targetRooms[key].waves >= 5) {
                delete Memory.targetRooms[key];
                log.a('Canceling operation in ' + roomLink(key) + ' as it has reached the maximum number of attack waves.', 'HIGH COMMAND: ');
            }
        }
        // Remove rooms where we're getting wrecked
        if (Memory.targetRooms[key].tick + (1500 * staleMulti) && Memory.targetRooms[key].friendlyDead) {
            let alliedLosses = Memory.targetRooms[key].friendlyDead;
            let enemyLosses = Memory.targetRooms[key].enemyDead || 1000;
            if (alliedLosses * staleMulti > enemyLosses) {
                delete Memory.targetRooms[key];
                log.a('Canceling operation in ' + roomLink(key) + ' due to heavy casualties.', 'HIGH COMMAND: ');
            }
        }
    }
}

function manualAttacks() {
    for (let name in Game.flags) {
        //Cancel attacks
        if (_.startsWith(name, 'cancel')) {
            delete Memory.targetRooms[Game.flags[name].pos.roomName];
            delete Memory.roomCache[Game.flags[name].pos.roomName];
            if (Memory.activeSiege && Memory.activeSiege === Game.flags[name].pos.roomName) delete Memory.activeSiege;
            log.a('Canceling operation in ' + roomLink(Game.flags[name].pos.roomName) + ' at your request.', 'HIGH COMMAND: ');
            Game.flags[name].remove();
        }
        //Bad room flag
        if (_.startsWith(name, 'avoid')) {
            let cache = Memory.avoidRooms || [];
            cache.push(Game.flags[name].pos.roomName);
            Memory.avoidRooms = cache;
            Game.flags[name].remove();
            log.e(Game.flags[name].pos.roomName + ' will be avoided.')
        }
        //Bad remote
        if (_.startsWith(name, 'remote')) {
            let cache = Memory.avoidRemotes || [];
            cache.push(Game.flags[name].pos.roomName);
            Memory.avoidRemotes = cache;
            Game.flags[name].remove();
            log.e(Game.flags[name].pos.roomName + ' will be avoided.')
        }
        //Remove bad room/remote flag
        if (_.startsWith(name, 'remove')) {
            if (Memory.avoidRooms && _.includes(Memory.avoidRooms, Game.flags[name].pos.roomName)) {
                let cache = Memory.avoidRooms;
                cache = _.filter(cache, (r) => r !== Game.flags[name].pos.roomName);
                Memory.avoidRooms = cache;
                log.e(Game.flags[name].pos.roomName + ' will no longer be avoided.')
            } else if (Memory.avoidRemotes && _.includes(Memory.avoidRemotes, Game.flags[name].pos.roomName)) {
                let cache = Memory.avoidRemotes;
                cache = _.filter(cache, (r) => r !== Game.flags[name].pos.roomName);
                Memory.avoidRemotes = cache;
                log.e(Game.flags[name].pos.roomName + ' will no longer be avoided.')
            } else {
                log.e(Game.flags[name].pos.roomName + ' is not on any avoid lists.')
            }
            Game.flags[name].remove();
        }
        // Claim target
        if (_.startsWith(name, 'claim')) {
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'claimScout',
                manual: true,
                priority: 1
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        //Set staging room
        if (_.startsWith(name, 'stage')) {
            let cache = Memory.stagingRooms || {};
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick
            };
            Memory.stagingRooms = cache;
            Game.flags[name].remove();
        }
        //Set future
        if (_.startsWith(name, 'future')) {
            let cache = Memory.targetRooms || {};
            let ticks = name.match(/\d+$/)[0];
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                dDay: tick + ticks,
                type: 'pending',
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'siege')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            let type = 'siege';
            if (Memory.maxLevel < 8) type = 'siegeGroup';
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: type,
                level: Number(level),
                priority: Number(priority),
                manual: true
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'attack')) {
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'attack',
                manual: true,
                priority: 1
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'guard')) {
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            let priority = 1;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'guard',
                level: 1,
                priority: Number(priority),
                manual: true
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'scout')) {
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'scout',
                manual: true,
                priority: 1
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'clear')) {
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'claimClear'
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'clean')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'clean',
                manual: true,
                level: Number(level),
                priority: Number(priority)
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'harass')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'harass',
                level: Number(level),
                priority: Number(priority),
                manual: true
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'hold')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'hold',
                level: Number(level),
                priority: Number(priority),
                manual: true
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'drain')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'drain',
                level: Number(level),
                priority: Number(priority),
                manual: true
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'robbery')) {
            let cache = Memory.targetRooms || {};
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'robbery',
                level: 1,
                priority: Number(priority)
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'ranger')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'rangers',
                level: level,
                priority: Number(priority),
                manual: true
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'swarm')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let priority = 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'swarm',
                level: level,
                priority: Number(priority)
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'power')) {
            let cache = Memory.targetRooms || {};
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                type: 'power',
                level: 1,
                priority: 1
            };
            Memory.targetRooms = cache;
            Game.flags[name].remove();
        }
        if (_.startsWith(name, 'nuke')) {
            let cache = Memory.targetRooms || {};
            let level = name.match(/\d+$/)[0] || 1;
            let tick = Game.time;
            cache[Game.flags[name].pos.roomName] = {
                tick: tick,
                dDay: tick + 50000,
                type: 'nuke',
                level: Number(level)
            };
            nukeFlag(Game.flags[name])
        }
    }
}

function nukeFlag(flag) {
    let nuker = _.filter(Game.structures, (s) => s.structureType === STRUCTURE_NUKER && s.energy === s.energyCapacity && s.ghodium === s.ghodiumCapacity && !s.cooldown && Game.map.getRoomLinearDistance(s.room.name, flag.pos.roomName) <= 10)[0];
    if (!nuker) {
        log.e('Nuke request for room ' + flag.pos.roomName + ' denied, no nukes found in-range.');
        flag.remove();
    } else {
        nuker.launchNuke(flag.pos);
        log.a('NUCLEAR LAUNCH DETECTED - ' + flag.pos.roomName + ' ' + flag.pos.x + '.' + flag.pos.y + ' has a nuke inbound from ' + nuker.room.name + ' and will impact in 50,000 ticks.', 'HIGH COMMAND: ');
        flag.remove();
    }
}

function checkForNap(user) {
    // If we have no alliance data return false
    if (!ALLIANCE_DATA || !NAP_ALLIANCE.length || _.includes(Memory._enemies, user)) return false;
    let LOANdata = JSON.parse(ALLIANCE_DATA);
    let LOANdataKeys = Object.keys(LOANdata);
    for (let iL = (LOANdataKeys.length - 1); iL >= 0; iL--) {
        if (LOANdata[LOANdataKeys[iL]].indexOf(user) >= 0 && _.includes(NAP_ALLIANCE, LOANdataKeys[iL])) {
            return true;
        }
    }
    return false;
}

module.exports.operationSustainability = function (room) {
    // Switch to pending if safemodes
    if (room.controller && room.controller.safeMode) {
        let cache = Memory.targetRooms || {};
        let tick = Game.time;
        cache[room.name] = {
            tick: tick,
            type: 'pending',
            dDay: tick + room.controller.safeMode,
        };
        // Set no longer needed creeps to go recycle
        _.filter(Game.creeps, (c) => c.my && c.memory.targetRoom && c.memory.targetRoom === room.name).forEach((c) => c.memory.recycle = true);
        log.a(room.name + ' is now marked as Pending as it has a safemode.', 'OPERATION PLANNER: ');
        return Memory.targetRooms = cache;
    }
    let operation = Memory.targetRooms[room.name];
    if (!operation || operation.sustainabilityCheck === Game.time) return;
    let friendlyDead = operation.friendlyDead || 0;
    let trackedFriendly = operation.trackedFriendly || [];
    let friendlyTombstones = _.filter(room.tombstones, (s) => _.includes(FRIENDLIES, s.creep.owner.username));
    for (let tombstone of friendlyTombstones) {
        if (_.includes(trackedFriendly, tombstone.id) || tombstone.creep.ticksToLive <= 5) continue;
        friendlyDead = friendlyDead + UNIT_COST(tombstone.creep.body);
        trackedFriendly.push(tombstone.id);
    }
    let friendlyForces = _.filter(room.creeps, (c) => c.memory && c.memory.military);
    let enemyForces = _.filter(room.creeps, (c) => !c.memory);
    if (friendlyForces.length === 1 && friendlyForces[0].hits < friendlyForces[0].hitsMax * 0.14 && enemyForces.length && !_.includes(trackedFriendly, friendlyForces[0].id)) {
        friendlyDead = friendlyDead + UNIT_COST(friendlyForces[0].body);
        trackedFriendly.push(friendlyForces[0].id);
    }
    let enemyDead = operation.enemyDead || 0;
    let trackedEnemy = operation.trackedEnemy || [];
    let enemyTombstones = _.filter(room.tombstones, (s) => !_.includes(FRIENDLIES, s.creep.owner.username));
    for (let tombstone of enemyTombstones) {
        if (_.includes(trackedEnemy, tombstone.id) || tombstone.creep.ticksToLive <= 10) continue;
        operation.lastEnemyKilled = Game.time;
        enemyDead = enemyDead + UNIT_COST(tombstone.creep.body);
        trackedEnemy.push(tombstone.id);
    }
    operation.enemyDead = enemyDead;
    operation.friendlyDead = friendlyDead;
    operation.trackedEnemy = trackedEnemy;
    operation.trackedFriendly = trackedFriendly;
    operation.sustainabilityCheck = Game.time;
    Memory.targetRooms[room.name] = operation;
};

module.exports.threatManagement = function (creep) {
    if (!creep.room.controller) return;
    let user;
    if (creep.room.controller.owner) user = creep.room.controller.owner.username;
    if (creep.room.controller.reservation) user = creep.room.controller.reservation.username;
    if (!user || (_.includes(FRIENDLIES, user) && !_.includes(Memory._threatList, user))) return;
    let cache = Memory._badBoyList || {};
    let threatRating = 50;
    if (cache[user] && (cache[user]['threatRating'] > 50 || _.includes(FRIENDLIES, user))) threatRating = cache[user]['threatRating'];
    cache[user] = {
        threatRating: threatRating,
        lastAction: Game.time,
    };
    Memory._badBoyList = cache;
};