/*
 * Copyright (c) 2019.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

let highCommand = require('military.highCommand');

Creep.prototype.robbery = function () {
    let sentence = ['#overlords', 'Thanks', 'For', 'The', 'Stuff', this.memory.targetRoom];
    let word = Game.time % sentence.length;
    this.say(sentence[word], true);
    let terminal = this.room.terminal;
    let storage = this.room.storage;
    // Kill if target is gone
    if (!Memory.targetRooms[this.memory.targetRoom]) return this.memory.recycle = true;
    let tower = _.max(_.filter(this.room.structures, (s) => s.structureType === STRUCTURE_TOWER && s.energy > 0), 'energy');
    if (this.room.name !== this.memory.targetRoom && !this.memory.hauling) return this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {
        range: 23,
        preferHighway: true,
        offRoad: true
    });
    if (this.room.name === this.memory.targetRoom && (!terminal || !_.sum(terminal.store)) && (!storage || !_.sum(storage.store))) {
        highCommand.operationSustainability(this.room);
        switch (this.signController(this.room.controller, 'Thanks for the loot! #robbed #Overlord-Bot')) {
            case OK:
                break;
            case ERR_NOT_IN_RANGE:
                return this.shibMove(this.room.controller, {offRoad: true});
        }
        let cache = Memory.targetRooms || {};
        let tick = Game.time;
        cache[this.pos.roomName] = {
            tick: tick,
            type: 'clean',
            level: 1,
            complete: true
        };
        Memory.targetRooms = cache;
        return this.memory.role = 'remoteHauler';
    }
    // Set level based on how much stuff to haul
    if (this.room.name === this.memory.targetRoom) {
        let tick = Game.time;
        let storageAmount, terminalAmount = 0;
        if (storage) storageAmount = _.sum(_.filter(storage.store, (r) => _.includes(TIER_2_BOOSTS, r.resourceType) || _.includes(END_GAME_BOOSTS, r.resourceType))) || 0;
        if (terminal) terminalAmount = _.sum(_.filter(terminal.store, (r) => _.includes(TIER_2_BOOSTS, r.resourceType) || _.includes(END_GAME_BOOSTS, r.resourceType))) || 0;
        let lootAmount = storageAmount + terminalAmount;
        let opLevel = lootAmount / 500;
        let cache = Memory.targetRooms || {};
        if (opLevel >= 1) {
            cache[this.pos.roomName] = {
                tick: tick,
                type: 'robbery',
                level: _.round(opLevel),
            };
        } else {
            cache[this.pos.roomName] = {
                tick: tick,
                type: 'clean',
                level: 1,
            };
        }
        Memory.targetRooms = cache;
    }
    if (!this.memory.hauling) {
        if (((!terminal || !_.sum(terminal.store)) && (!storage || !_.sum(storage.store))) || _.sum(this.store) === this.store.getCapacity()) return this.memory.hauling = true;
        if (tower.id) {
            switch (this.withdraw(tower, RESOURCE_ENERGY)) {
                case OK:
                    break;
                case ERR_NOT_IN_RANGE:
                    return this.shibMove(tower, {offRoad: true});
            }
        } else if (storage && _.sum(storage.store)) {
            for (let resourceType in storage.store) {
                switch (this.withdraw(storage, resourceType)) {
                    case OK:
                        break;
                    case ERR_NOT_IN_RANGE:
                        return this.shibMove(storage, {offRoad: true});
                }
            }
        } else if (terminal && _.sum(terminal.store)) {
            for (let resourceType in terminal.store) {
                switch (this.withdraw(terminal, resourceType)) {
                    case OK:
                        break;
                    case ERR_NOT_IN_RANGE:
                        return this.shibMove(terminal, {offRoad: true});
                }
            }
        }
    } else {
        if (!_.sum(this.store)) return delete this.memory.hauling;
        if (this.pos.roomName === this.memory.overlord) {
            if (this.renewalCheck()) return;
            if (this.memory.storageDestination) {
                let storageItem = Game.getObjectById(this.memory.storageDestination);
                for (const resourceType in this.store) {
                    switch (this.transfer(storageItem, resourceType)) {
                        case OK:
                            break;
                        case ERR_NOT_IN_RANGE:
                            this.shibMove(storageItem, {offRoad: true});
                            break;
                        case ERR_FULL:
                            delete this.memory.storageDestination;
                            break;
                    }
                }
            } else {
                let controllerContainer = Game.getObjectById(this.room.memory.controllerContainer);
                let storage = this.room.storage;
                let terminal = this.room.terminal;
                if (controllerContainer && this.store[RESOURCE_ENERGY] === _.sum(this.store) && _.sum(controllerContainer.store) < controllerContainer.storeCapacity * 0.70) {
                    this.memory.storageDestination = controllerContainer.id;
                    switch (this.transfer(controllerContainer, RESOURCE_ENERGY)) {
                        case OK:
                            delete this.memory.storageDestination;
                            delete this.memory.destinationReached;
                            break;
                        case ERR_NOT_IN_RANGE:
                            this.shibMove(controllerContainer, {offRoad: true});
                            break;
                        case ERR_FULL:
                            delete this.memory.storageDestination;
                            this.findStorage();
                            break;
                    }
                } else if (storage && _.sum(storage.store) < storage.storeCapacity * 0.90) {
                    this.memory.storageDestination = storage.id;
                    for (const resourceType in this.store) {
                        switch (this.transfer(storage, resourceType)) {
                            case OK:
                                delete this.memory.storageDestination;
                                delete this.memory.destinationReached;
                                break;
                            case ERR_NOT_IN_RANGE:
                                this.shibMove(storage, {offRoad: true});
                                break;
                            case ERR_FULL:
                                delete this.memory.storageDestination;
                                this.findStorage();
                                break;
                        }
                    }
                } else if (terminal && _.sum(terminal.store) < terminal.storeCapacity * 0.70) {
                    this.memory.storageDestination = terminal.id;
                    for (const resourceType in this.store) {
                        switch (this.transfer(terminal, resourceType)) {
                            case OK:
                                delete this.memory.storageDestination;
                                delete this.memory.destinationReached;
                                break;
                            case ERR_NOT_IN_RANGE:
                                this.shibMove(terminal, {offRoad: true});
                                break;
                            case ERR_FULL:
                                delete this.memory.storageDestination;
                                this.findStorage();
                                break;
                        }
                    }
                }
            }
        } else {
            return this.shibMove(new RoomPosition(25, 25, this.memory.overlord), {
                range: 19,
                preferHighway: true,
                offRoad: true
            });
        }
    }
};