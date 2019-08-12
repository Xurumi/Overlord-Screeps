/*
 * Copyright (c) 2019.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by Bob on 7/12/2017.
 */

module.exports.role = function (creep) {
    //INITIAL CHECKS
    if (Game.time % 50 === 0 && creep.wrongRoom()) return;
    creep.say(ICONS.courier, true);
    // Special Tasks
    if (!creep.room.memory.responseNeeded && (creep.memory.terminalWorker || creep.memory.nuclearEngineer || Game.time % 50 === 0)) if (nuclearEngineer(creep) || terminalWorker(creep)) return;
    // If hauling do things
    if (_.sum(creep.carry) >= creep.carryCapacity * 0.5) creep.memory.hauling = true;
    if (!_.sum(creep.carry)) creep.memory.hauling = undefined;
    if (creep.memory.hauling) {
        if (_.sum(creep.carry) > creep.carry[RESOURCE_ENERGY]) {
            let storage = creep.room.terminal || creep.room.storage;
            for (let resourceType in creep.carry) {
                switch (creep.transfer(storage, resourceType)) {
                    case OK:
                        continue;
                    case ERR_NOT_IN_RANGE:
                        creep.shibMove(storage);
                        return;
                }
            }
        } else if (creep.memory.storageDestination || creep.findEssentials() || creep.findDeliveries()) {
            let storageItem = Game.getObjectById(creep.memory.storageDestination);
            if (!storageItem) return delete creep.memory.storageDestination;
            switch (creep.transfer(storageItem, RESOURCE_ENERGY)) {
                case OK:
                    delete creep.memory.storageDestination;
                    delete creep.memory._shibMove;
                    if (storageItem instanceof Creep) {
                        delete storageItem.memory.deliveryTick;
                        delete storageItem.memory.deliveryRequested;
                    }
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(storageItem);
                    break;
                case ERR_FULL || ERR_INVALID_TARGET:
                    delete creep.memory.storageDestination;
                    delete creep.memory._shibMove;
                    if (storageItem instanceof Creep) {
                        delete storageItem.memory.deliveryTick;
                        delete storageItem.memory.deliveryRequested;
                    }
                    if (storageItem.memory) delete storageItem.memory.deliveryIncoming;
                    break;
            }
        } else if (creep.pos.checkForRoad()) {
            creep.moveRandom();
        } else {
            return creep.idleFor(5);
        }
    } else if (!checkForLoot(creep)) if (creep.memory.energyDestination || creep.findEnergy()) creep.withdrawResource(); else if (creep.pos.checkForRoad()) {
        creep.moveRandom();
    } else {
        return creep.idleFor(5);
    }
};

// Check for loot
function checkForLoot(creep) {
    if (!creep.room.storage) return false;
    let tombstones = _.filter(creep.room.tombstones, (s) => _.sum(s.store) > s.store[RESOURCE_ENERGY] || s.store[RESOURCE_ENERGY] >= 50);
    if (tombstones.length) {
        for (let resourceType in tombstones[0].store) {
            switch (creep.withdraw(tombstones[0], resourceType)) {
                case OK:
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(tombstones[0], {range: 1});
                    break;
            }
        }
        return true;
    }
    let dropped = _.filter(FIND_DROPPED_RESOURCES, (s) => s.amount > 250);
    if (dropped.length) {
        switch (creep.pickup(dropped[0])) {
            case OK:
                break;
            case ERR_NOT_IN_RANGE:
                creep.shibMove(dropped[0], {range: 1});
                break;
        }
        return true;
    }
    if (creep.room.controller.level >= 6) {
        let extractorContainer = Game.getObjectById(creep.room.memory.extractorContainer);
        if (!extractorContainer || _.sum(extractorContainer.store) < extractorContainer.storeCapacity * 0.2) return;
        for (let resourceType in extractorContainer.store) {
            switch (creep.withdraw(extractorContainer, resourceType)) {
                case OK:
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(extractorContainer, {range: 1});
                    break;
            }
        }
        return true;
    }
}

function terminalWorker(creep) {
    let terminal = creep.room.terminal;
    let storage = creep.room.storage;
    if (!terminal || !storage || creep.memory.labTech || creep.memory.nuclearEngineer || _.filter(Game.creeps, (c) => c.memory.terminalWorker && c.memory.overlord === creep.memory.overlord && c.id !== creep.id)[0]) return false;
    if (creep.memory.terminalDelivery) {
        if (_.sum(terminal.store) > 0.85 * terminal.storeCapacity) {
            delete creep.memory.terminalDelivery;
            return false;
        }
        for (let resourceType in creep.carry) {
            switch (creep.transfer(terminal, resourceType)) {
                case OK:
                    delete creep.memory.terminalDelivery;
                    delete creep.memory.terminalWorker;
                    return true;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(terminal);
                    creep.memory.terminalWorker = true;
                    return true;
            }
        }
    } else {
        for (let resourceType in storage.store) {
            if (_.sum(terminal.store) > 0.85 * terminal.storeCapacity) break;
            if (resourceWorth(resourceType) > 10 || (resourceType !== RESOURCE_ENERGY && storage.store[resourceType] > SELL_OFF_AMOUNT) || (resourceType === RESOURCE_ENERGY && storage.store[resourceType] > ENERGY_AMOUNT * 2)) {
                if (_.sum(creep.carry) > 0) {
                    for (let resourceType in creep.carry) {
                        switch (creep.transfer(storage, resourceType)) {
                            case OK:
                                creep.memory.terminalWorker = true;
                                return true;
                            case ERR_NOT_IN_RANGE:
                                creep.shibMove(storage);
                                creep.memory.terminalWorker = true;
                                return true;
                            case ERR_FULL:
                                creep.drop(resourceType);
                                return true;
                        }
                    }
                } else {
                    creep.memory.terminalWorker = true;
                    switch (creep.withdraw(storage, resourceType)) {
                        case OK:
                            creep.memory.terminalWorker = true;
                            creep.memory.terminalDelivery = resourceType;
                            return true;
                        case ERR_NOT_IN_RANGE:
                            creep.memory.terminalWorker = true;
                            return creep.shibMove(storage);
                    }
                }
            }
        }
    }
    if (creep.memory.hauling === false) {
        if (_.sum(terminal.store) > 0.9 * terminal.storeCapacity) {
            creep.memory.terminalWorker = true;
            creep.memory.terminalCleaning = true;
            switch (creep.withdraw(terminal, _.max(Object.keys(terminal.store), key => terminal.store[key]))) {
                case OK:
                    return true;
                case ERR_NOT_IN_RANGE:
                    return creep.shibMove(terminal);
            }
            return true;
        }
    } else if (creep.memory.terminalCleaning) {
        let storage = creep.room.storage;
        for (let resourceType in creep.carry) {
            switch (creep.transfer(storage, resourceType)) {
                case OK:
                    return true;
                case ERR_NOT_IN_RANGE:
                    return creep.shibMove(storage);
                case ERR_FULL:
                    creep.drop(resourceType);
                    return true;
            }
        }
        return true;
    } else if (_.sum(storage.store) >= storage.storeCapacity * 0.90 && storage.store[RESOURCE_ENERGY] > 150000) {
        creep.memory.terminalWorker = true;
        switch (creep.withdraw(storage, RESOURCE_ENERGY)) {
            case OK:
                creep.memory.terminalDelivery = RESOURCE_ENERGY;
                return true;
            case ERR_NOT_IN_RANGE:
                return creep.shibMove(storage);
        }
    }
    delete creep.memory.terminalWorker;
    delete creep.memory.terminalCleaning;
    delete creep.memory.terminalDelivery;
    delete creep.memory.terminalWorker;
    return false;
}

function nuclearEngineer(creep) {
    if (creep.room.controller.level < 8 || creep.memory.terminalWorker || creep.memory.labTech || !_.filter(creep.room.structures, (s) => s.structureType === STRUCTURE_NUKER && s.ghodium < s.ghodiumCapacity)[0] || _.filter(Game.creeps, (c) => c.memory.nuclearEngineer && c.memory.overlord === creep.memory.overlord && c.id !== creep.id)[0]) return false;
    let nuker = _.filter(creep.room.structures, (s) => s.structureType === STRUCTURE_NUKER && s.ghodium < s.ghodiumCapacity)[0];
    let terminal = creep.room.terminal;
    let storage = creep.room.storage;
    let ghodium = getResourceAmount(creep.room, RESOURCE_GHODIUM);
    if (nuker.ghodium < nuker.ghodiumCapacity && ghodium > 0) {
        if (_.sum(creep.carry) > creep.carry[RESOURCE_GHODIUM]) {
            creep.say(ICONS.nuke, true);
            for (let resourceType in creep.carry) {
                switch (creep.transfer(storage, resourceType)) {
                    case OK:
                        creep.memory.nuclearEngineer = true;
                        return true;
                    case ERR_NOT_IN_RANGE:
                        creep.shibMove(storage);
                        creep.memory.nuclearEngineer = true;
                        return true;
                }
            }
        } else if (creep.carry[RESOURCE_GHODIUM] > 0) {
            creep.say(ICONS.nuke, true);
            switch (creep.transfer(nuker, RESOURCE_GHODIUM)) {
                case OK:
                    delete creep.memory.nuclearEngineer;
                    return true;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(nuker);
                    creep.memory.nuclearEngineer = true;
                    return true;
            }
        } else if (!creep.memory.itemStorage) {
            creep.say(ICONS.nuke, true);
            if (storage.store[RESOURCE_GHODIUM] > 0) {
                creep.memory.nuclearEngineer = true;
                creep.memory.itemStorage = storage.id;
            } else if (terminal.store[RESOURCE_GHODIUM] > 0) {
                creep.memory.nuclearEngineer = true;
                creep.memory.itemStorage = terminal.id;
            } else {
                delete creep.memory.nuclearEngineer;
                delete creep.memory.itemStorage;
            }
        } else if (creep.memory.itemStorage && creep.memory.nuclearEngineer) {
            creep.say(ICONS.nuke, true);
            let stockpile = Game.getObjectById(creep.memory.itemStorage);
            switch (creep.withdraw(stockpile, RESOURCE_GHODIUM)) {
                case OK:
                    creep.memory.nuclearEngineer = true;
                    return true;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(stockpile);
                    creep.memory.nuclearEngineer = true;
                    return true;
            }
        }
    }
}

function getResourceAmount(room, boost) {
    let boostInRoomStructures = _.sum(room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 49, true), (s) => {
        if (s['structure'] && s['structure'].store) {
            return s['structure'].store[boost] || 0;
        } else if (s['structure'] && s['structure'].mineralType === boost) {
            return s['structure'].mineralAmount || 0;
        } else {
            return 0;
        }
    });
    let boostInRoomCreeps = _.sum(room.lookForAtArea(LOOK_CREEPS, 0, 0, 49, 49, true), (s) => {
        if (s['creep'] && s['creep'].carry) {
            return s['creep'].carry[boost] || 0;
        } else {
            return 0;
        }
    });
    return boostInRoomCreeps + boostInRoomStructures;
}