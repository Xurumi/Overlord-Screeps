Creep.prototype.wrongRoom = function () {
    if (Game.time % 25 === 0 && this.memory.overlord && this.pos.roomName !== this.memory.overlord) {
        this.memory.recycle = true;
        return true;
    }
};

Creep.prototype.findSource = function (ignoreOthers = false) {
    let source = shuffle(this.room.sources);
    if (this.memory.role === 'stationaryHarvester') source = _.filter(this.room.sources, (s) => _.filter(Game.creeps, (c) => c.id !== this.id && c.memory.role === 'stationaryHarvester' && c.memory.source === s.id).length === 0);
    if (this.memory.role === 'remoteHarvester') source = _.filter(this.room.sources, (s) => _.filter(Game.creeps, (c) => c.id !== this.id && c.memory.role === 'remoteHarvester' && c.memory.source === s.id).length === 0);
    if (this.memory.role === 'SKworker') source = _.filter(this.room.sources, (s) => _.filter(Game.creeps, (c) => c.id !== this.id && c.memory.role === 'SKworker' && c.memory.source === s.id).length === 0);
    if (ignoreOthers) source = this.room.sources;
    if (source.length > 0) {
        this.memory.source = this.pos.findClosestByRange(source).id;
        return this.pos.findClosestByRange(source).id;
    }
    return;
};

Creep.prototype.findMineral = function () {
    const mineral = this.room.mineral;
    if (mineral.length > 0) {
        for (let i = 0; i < mineral.length; i++) {
            if (_.filter(mineral[i].pos.findInRange(FIND_CREEPS, 2), (c) => c.memory && (c.memory.role === 'remoteHarvester' || c.memory.role === 'stationaryHarvester' || c.memory.role === 'SKworker' || c.memory.role === 'mineralHarvester')).length === 0) {
                if (this.shibMove(mineral[i]) !== ERR_NO_PATH) {
                    if (mineral[i].id) {
                        this.memory.source = mineral[i].id;
                        return mineral[i];
                    }
                }
            }
        }
    }
    return;
};

Creep.prototype.findConstruction = function () {
    let construction = this.room.constructionSites;
    let site = _.filter(construction, (s) => s.structureType === STRUCTURE_TOWER);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_SPAWN);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_EXTENSION);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_STORAGE);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_LINK);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_CONTAINER);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = shuffle(_.filter(construction, (s) => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART));
    if (site.length > 0) {
        this.memory.constructionSite = site[0].id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_WALL);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    site = _.filter(this.room.structures, (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 5000 && !_.filter(this.room.creeps, (c) => c.my && c.memory.constructionSite === s.id).length);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(this.room.structures, (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.3 && !_.filter(this.room.creeps, (c) => c.my && c.memory.constructionSite === s.id).length);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(construction, (s) => s.structureType === STRUCTURE_RAMPART);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'build';
        return true;
    }
    this.memory.constructionSite = undefined;
    this.memory.task = undefined;
    return;
};

Creep.prototype.findRepair = function (level) {
    let structures = _.filter(this.room.structures, (s) => s.hits < s.hitsMax);
    let site = _.filter(structures, (s) => s.structureType === STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.7);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        this.memory.targetHits = site.hitsMax * 0.8;
        return true;
    }
    site = _.filter(structures, (s) => s.structureType === STRUCTURE_SPAWN && s.hits < s.hitsMax);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(structures, (s) => s.structureType === STRUCTURE_EXTENSION && s.hits < s.hitsMax);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(structures, (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.5);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(structures, (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 10000);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(structures, (s) => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        return true;
    }
    site = _.filter(structures, (s) => s.structureType === STRUCTURE_WALL && s.hits < 100000 * level);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        this.memory.targetHits = 100000 * level;
        return true;
    }
    site = _.filter(structures, (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 100000 * level);
    if (site.length > 0) {
        site = this.pos.findClosestByRange(site);
        this.memory.constructionSite = site.id;
        this.memory.task = 'repair';
        this.memory.targetHits = 100000 * level;
        return true;
    }
    this.memory.constructionSite = undefined;
    this.memory.task = undefined;
    return false;
};

Creep.prototype.containerBuilding = function () {
    let site = this.pos.findClosestByRange(this.room.constructionSites, {filter: (s) => s.structureType === STRUCTURE_CONTAINER});
    if (site) {
        if (this.pos.getRangeTo(site) <= 1) {
            return site.id;
        }
    }
};

Creep.prototype.harvestDepositContainer = function () {
    let container = this.pos.findClosestByRange(this.room.structures, {filter: (s) => s.structureType === STRUCTURE_CONTAINER});
    if (container) {
        if (this.pos.getRangeTo(container) <= 1) {
            return container.id;
        } else if (this.pos.getRangeTo(container) <= 3) {
            this.shibMove(container);
            return container.id;
        }
    } else {
        this.harvesterContainerBuild();
    }
};

Creep.prototype.harvesterContainerBuild = function () {
    if (this.memory.source && this.pos.getRangeTo(Game.getObjectById(this.memory.source)) <= 1) {
        if (Game.getObjectById(this.memory.source).pos.findInRange(FIND_CONSTRUCTION_SITES, 1).length) return;
        if (this.pos.createConstructionSite(STRUCTURE_CONTAINER) !== OK) {
            return;
        }
    }
};

Creep.prototype.withdrawEnergy = function (destination = undefined) {
    if (destination) this.memory.energyDestination = destination.id;
    if (!this.memory.energyDestination) {
        return;
    } else {
        let energyItem = Game.getObjectById(this.memory.energyDestination);
        if (energyItem && ((energyItem.store && energyItem.store[RESOURCE_ENERGY] > 0) || (energyItem.carry && energyItem.carry[RESOURCE_ENERGY] > 0) || (energyItem.energy && energyItem.energy > 0))) {
            switch (this.withdraw(energyItem, RESOURCE_ENERGY)) {
                case OK:
                    this.memory.energyDestination = undefined;
                    this.memory._shibMove = undefined;
                    return true;
                case ERR_INVALID_TARGET:
                    switch (this.pickup(energyItem)) {
                        case OK:
                            this.memory.energyDestination = undefined;
                            this.memory._shibMove = undefined;
                            break;
                        case ERR_NOT_IN_RANGE:
                            this.shibMove(energyItem);
                            break;
                        case ERR_FULL:
                            this.memory.energyDestination = undefined;
                            this.memory._shibMove = undefined;
                            break;
                        case ERR_INVALID_TARGET:
                            switch (energyItem.transfer(this, RESOURCE_ENERGY)) {
                                case OK:
                                    this.memory.energyDestination = undefined;
                                    this.memory._shibMove = undefined;
                                    return true;
                                case ERR_NOT_IN_RANGE:
                                    this.shibMove(energyItem);
                                    break;
                                case ERR_FULL:
                                    this.memory.energyDestination = undefined;
                                    this.memory._shibMove = undefined;
                                    break;
                            }
                            break;
                    }
                    break;
                case ERR_NOT_IN_RANGE:
                    this.shibMove(energyItem);
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    this.memory.energyDestination = undefined;
                    this.memory._shibMove = undefined;
                    break;
                case ERR_FULL:
                    this.memory.energyDestination = undefined;
                    this.memory._shibMove = undefined;
                    break;
                case ERR_INVALID_ARGS:
                    this.memory.energyDestination = undefined;
                    this.memory._shibMove = undefined;
                    break;
            }
        } else {
            delete this.memory.energyDestination;
        }
    }
};

Creep.prototype.findEnergy = function () {
    // Fuel Trucks
    let fuelTrucks = _.filter(this.room.creeps, (c) => c.my && c.memory.role === 'fuelTruck' && c.carry[RESOURCE_ENERGY]);
    if (fuelTrucks.length) {
        this.memory.energyDestination = fuelTrucks[0].id;
        return true;
    }
    // Terminal
    let terminal = this.room.terminal;
    if (terminal && terminal.store[RESOURCE_ENERGY] > 6000) {
        this.memory.energyDestination = terminal.id;
        return true;
    }
    // Storage
    let storage = this.room.storage;
    if (storage && storage.store[RESOURCE_ENERGY] >= (ENERGY_RESERVE * this.room.controller.level) / 2) {
        this.memory.energyDestination = storage.id;
        return true;
    }
    // Links
    /**let hubLink = Game.getObjectById(this.room.memory.hubLink);
    if (hubLink && hubLink.energy > 50 && !_.filter(this.room.creeps, (c) => c.my && c.memory.energyDestination === hubLink.id && c.id !== this.id).length) {
        this.memory.energyDestination = hubLink.id;
        return true;
    }**/
    // Links
    let storageLink = Game.getObjectById(this.room.memory.storageLink);
    if (storageLink && storageLink.energy > 50 && !_.filter(this.room.creeps, (c) => c.my && c.memory.energyDestination === storageLink.id && c.id !== this.id).length) {
        this.memory.energyDestination = storageLink.id;
        return true;
    }
    //Dropped
    let dropped = this.pos.findClosestByRange(this.room.droppedEnergy, {filter: (r) => r.amount >= this.carryCapacity * 0.8});
    if (dropped) {
        this.memory.energyDestination = dropped.id;
        return true;
    }
    // Tombstone
    let tombstone = this.pos.findClosestByRange(this.room.tombstones, {filter: (r) => r.store[RESOURCE_ENERGY] >= this.carryCapacity * 0.8});
    if (tombstone) {
        this.memory.energyDestination = tombstone.id;
        return true;
    }
    // Container
    let container = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_CONTAINER && this.room.memory.controllerContainer !== s.id && this.room.memory.hubContainer !== s.id && s.store[RESOURCE_ENERGY] >= 100});
    if (container && _.filter(this.room.creeps, (c) => c.my && c.memory.energyDestination === container.id && c.id !== this.id).length < container.store[RESOURCE_ENERGY] / this.carryCapacity) {
        this.memory.energyDestination = container.id;
        return true;
    }
    // Hub Container
    let hubContainer = Game.getObjectById(this.room.memory.hubContainer);
    if (hubContainer && hubContainer.energy > 500 && _.filter(this.room.creeps, (c) => c.my && c.memory.energyDestination === hubContainer.id && c.id !== this.id).length < hubContainer.store[RESOURCE_ENERGY] / this.carryCapacity) {
        this.memory.energyDestination = hubContainer.id;
        return true;
    }
    //Take straight from remoteHaulers/fuel truck at low level who have nowhere to drop
    if (!this.room.controller || this.room.controller.level <= 3) {
        let hauler = _.sample(_.filter(this.room.creeps, (c) => c.memory && (c.memory.role === 'remoteHauler' || c.memory.role === 'fuelTruck') && !c.memory.storageDestination && c.carry[RESOURCE_ENERGY] > 0));
        if (hauler) {
            this.memory.energyDestination = hauler.id;
            return true;
        }
    }
    return false;
};

Creep.prototype.fillerEnergy = function () {
    let source, container;
    if (!this.memory.assignedSource) {
        let assignment = _.filter(this.room.creeps, (c) => c.my && c.memory.role === 'stationaryHarvester' && c.memory.containerAttempt && !c.memory.linkID && !_.filter(this.room.creeps, (f) => f.my && f.memory.role === 'filler' && f.memory.assignedSource === c.memory.source).length);
        if (assignment.length) {
            this.memory.assignedSource = assignment[0].memory.source;
        } else {
            return this.getEnergy();
        }
    } else {
        source = Game.getObjectById(this.memory.assignedSource);
    }
    // Container
    if (!this.memory.assignedContainer) {
        source = Game.getObjectById(this.memory.assignedSource);
        if (source) {
            let container = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: (s) => s.structureType === STRUCTURE_CONTAINER})[0];
            if (container) this.memory.assignedContainer = container.id;
        }
    } else {
        container = Game.getObjectById(this.memory.assignedContainer);
        if (container && container.store[RESOURCE_ENERGY] >= this.carryCapacity * 0.5) {
            this.memory.energyDestination = container.id;
            return true;
        }
    }
    //Dropped
    let dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
    if (dropped.length) {
        this.memory.energyDestination = dropped[0].id;
        return true;
    }
    return false;
};

Creep.prototype.getEnergy = function (hauler = false) {
    // Links
    let hubLink = Game.getObjectById(this.room.memory.hubLink) || Game.getObjectById(_.sample(this.room.memory.hubLinks));
    if (hubLink && hubLink.energy > 50) {
        this.memory.energyDestination = hubLink.id;
        return true;
    }
    // Hub Container
    let hubContainer = Game.getObjectById(this.room.memory.hubContainer);
    if (hubContainer && hubContainer.store[RESOURCE_ENERGY] > 50) {
        this.memory.energyDestination = hubContainer.id;
        return true;
    }
    // Extra Full Terminal
    let terminal = this.room.terminal;
    if (terminal && terminal.store[RESOURCE_ENERGY] && (terminal.store[RESOURCE_ENERGY] > ENERGY_AMOUNT * 1.5 || !terminal.my || this.room.memory.responseNeeded)) {
        this.memory.energyDestination = terminal.id;
        return true;
    }
    // Storage
    let storage = this.room.storage;
    if (storage && (storage.store[RESOURCE_ENERGY] >= ENERGY_RESERVE * this.room.controller.level || hauler)) {
        this.memory.energyDestination = storage.id;
        return true;
    }
    if (this.memory.role !== 'hauler' || this.room.controller.level < 5) {
        // Container
        let container = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_CONTAINER && this.room.memory.controllerContainer !== s.id && this.room.memory.hubContainer !== s.id && s.store[RESOURCE_ENERGY] >= 100});
        if ((!hauler || !_.filter(this.room.creeps, (c) => c.my && c.memory.role === 'filler').length) && container && _.filter(this.room.creeps, (c) => c.my && c.memory.energyDestination === container.id && c.id !== this.id).length < 2) {
            this.memory.energyDestination = container.id;
            return true;
        }
        //Dropped
        let dropped = this.pos.findClosestByRange(this.room.droppedEnergy, {filter: (r) => r.amount >= this.carryCapacity * 0.8});
        if (dropped) {
            this.memory.energyDestination = dropped.id;
            return true;
        }
    }
    return false;
};

// Hauler essential storage
Creep.prototype.findSpawnsExtensions = function () {
    //Tower
    if (this.room.memory.responseNeeded) {
        let tower = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.85});
        if (tower) {
            this.memory.storageDestination = tower.id;
            return true;
        }
    } else {
        let tower = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.45});
        if (tower) {
            this.memory.storageDestination = tower.id;
            return true;
        }
    }
    // Storage
    let storage = this.room.storage;
    if (storage && Math.random() > 0.95) {
        this.memory.storageDestination = storage.id;
        return true;
    }
    //Spawn
    if (this.memory.spawns) {
        let rawSpawn = _.shuffle(JSON.parse(this.memory.spawns));
        for (let i = 0; i < rawSpawn.length; i++) {
            let spawn = Game.getObjectById(rawSpawn[i]);
            if (!spawn) return this.memory.spawns = undefined;
            if (spawn.energy < spawn.energyCapacity) {
                this.memory.storageDestination = spawn.id;
                return true;
            }
        }
    } else {
        let spawn = _.pluck(_.filter(this.room.structures, (s) => s.structureType === STRUCTURE_SPAWN), 'id');
        if (spawn.length) this.memory.spawns = JSON.stringify(spawn);
    }
    //Extension
    if (this.memory.extensions) {
        let rawExtension = _.shuffle(JSON.parse(this.memory.extensions));
        for (let i = 0; i < rawExtension.length; i++) {
            let extension = Game.getObjectById(rawExtension[i]);
            if (!extension) return this.memory.extensions = undefined;
            let taken = _.filter(this.room.creeps, (c) => c.my && c.memory.storageDestination === extension.id);
            if (extension.energy < extension.energyCapacity && !taken.length) {
                this.memory.storageDestination = extension.id;
                return true;
            }
        }
    } else {
        let extension = _.pluck(_.filter(this.room.structures, (s) => s.structureType === STRUCTURE_EXTENSION &&
            s.pos.getRangeTo(s.pos.findClosestByRange(_.filter(this.room.creeps, (c) => c.my && c.memory.role === 'stationaryHarvester' && (c.memory.onContainer || c.memory.containerAttempt)))) > 1), 'id');
        if (extension.length) this.memory.extensions = JSON.stringify(extension);
    }
    return false;
};

// Basic storage
Creep.prototype.findStorage = function () {
    //Terminal
    let terminal = this.room.terminal;
    if (terminal && terminal.my && (terminal.store[RESOURCE_ENERGY] < ENERGY_AMOUNT || (this.room.memory.extremeEnergySurplus && terminal.store[RESOURCE_ENERGY] < ENERGY_AMOUNT * 2))) {
        this.memory.storageDestination = terminal.id;
        return true;
    }
    //Controller
    let controllerContainer = Game.getObjectById(this.room.memory.controllerContainer);
    if (controllerContainer && Math.random() > 0.7 && controllerContainer.store[RESOURCE_ENERGY] < controllerContainer.storeCapacity * 0.5) {
        this.memory.storageDestination = controllerContainer.id;
        return true;
    }
    //Tower
    let tower = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.8});
    if (tower) {
        this.memory.storageDestination = tower.id;
        return true;
    }
    //Terminal for balancing
    if (terminal && terminal.my && terminal.store < terminal.storeCapacity) {
        this.memory.storageDestination = terminal.id;
        return true;
    }
    //Storage
    let storage = this.room.storage;
    if (storage && storage.my) {
        this.memory.storageDestination = storage.id;
        return true;
    }
    // Hub Container
    let hubContainer = Game.getObjectById(this.room.memory.hubContainer);
    if (hubContainer) {
        this.memory.storageDestination = hubContainer.id;
        return true;
    }
    // Links
    let hubLink = Game.getObjectById(this.room.memory.hubLink);
    if (hubLink) {
        this.memory.energyDestination = hubLink.id;
        return true;
    }
    return false;
};

// Essential buildings
Creep.prototype.findEssentials = function () {
    //Tower
    if (this.room.memory.responseNeeded) {
        let tower = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.85});
        if (tower) {
            this.memory.storageDestination = tower.id;
            return true;
        }
    } else {
        let tower = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.5});
        if (tower) {
            this.memory.storageDestination = tower.id;
            return true;
        }
    }
    //Controller
    let controllerContainer = Game.getObjectById(this.room.memory.controllerContainer);
    let linkWeight = 0.15;
    if (this.room.memory.controllerLink) linkWeight = .3;
    if (this.room.controller.level < 8 && controllerContainer && Math.random() > (controllerContainer.store[RESOURCE_ENERGY] / controllerContainer.storeCapacity) + linkWeight) {
        this.memory.storageDestination = controllerContainer.id;
        return true;
    }
    //Terminal
    let terminal = this.room.terminal;
    if (terminal && terminal.my && terminal.store[RESOURCE_ENERGY] < 5000) {
        this.memory.storageDestination = terminal.id;
        return true;
    }
    //Storage
    let storage = this.room.storage;
    if (storage && storage.my && storage.store[RESOURCE_ENERGY] < 5000) {
        this.memory.storageDestination = storage.id;
        return true;
    }
    //Labs
    let lab = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity});
    if (lab) {
        this.memory.storageDestination = lab.id;
        return true;
    }
    //Nuke
    let nuke = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_NUKER && s.energy < s.energyCapacity});
    if (nuke) {
        this.memory.storageDestination = nuke.id;
        return true;
    }
    //Power Spawn
    let power = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_SPAWN && s.energy < s.energyCapacity});
    if (power) {
        this.memory.storageDestination = power.id;
        return true;
    }
    //Top off towers
    let tower = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * 0.9});
    let fullTower = _.filter(this.structures, {filter: (s) => s.my && s.structureType === STRUCTURE_TOWER && s.energy >= s.energyCapacity * 0.9});
    if (tower && !fullTower.length) {
        this.memory.storageDestination = tower.id;
        return true;
    }
    return false;
};

// Delivery management
Creep.prototype.requestDelivery = function () {
    let courier = _.filter(this.room.creeps, (creep) => creep.my && creep.memory.role === 'courier');
    if (!courier.length || this.ticksToLive < 50) return false;
    // Delivery timeout
    if (this.memory.deliveryTick && this.memory.deliveryTick + _.random(15, 25) < Game.time) {
        delete this.memory.deliveryTick;
        delete this.memory.deliveryRequested;
        return false;
    } else if (!this.memory.deliveryRequested) {
        this.memory.deliveryTick = Game.time;
        this.memory.deliveryRequested = true;
        if (!courier[0].memory.storageDestination) courier[0].memory.storageDestination = this.id;
        return true;
    } else if (this.pos.checkForRoad()) {
        this.moveRandom();
        return true;
    } else {
        this.idleFor(5);
        return true;
    }
};

Creep.prototype.findDeliveries = function () {
    //Deliveries
    let deliver = _.sample(_.filter(this.room.creeps, (c) => c.my && c.memory.deliveryRequested && !c.memory.deliveryIncoming));
    if (deliver) {
        this.memory.storageDestination = deliver.id;
        deliver.memory.deliveryIncoming = true;
        return true;
    }
};

Creep.prototype.builderFunction = function () {
    let construction = Game.getObjectById(this.memory.constructionSite);
    if (!construction || construction === null) {
        this.memory.constructionSite = undefined;
        this.memory.task = undefined;
        return;
    }
    if (!this.memory.task) this.memory.task = 'build';
    if (this.memory.task === 'repair') {
        if (construction.hits === construction.hitsMax || construction.hits >= this.memory.targetHits) {
            this.memory.constructionSite = undefined;
            this.memory.task = undefined;
            this.say('Done!', true);
            return;
        }
        this.say('Fix!', true);
        switch (this.repair(construction)) {
            case OK:
                return true;
            case ERR_NOT_IN_RANGE:
                this.shibMove(construction, {range: 3});
                return true;
            case ERR_RCL_NOT_ENOUGH:
                this.memory.constructionSite = undefined;
                this.memory.task = undefined;
                break;
            case ERR_INVALID_TARGET:
                if (construction instanceof ConstructionSite) construction.remove();
                this.memory.constructionSite = undefined;
                this.memory.task = undefined;
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                this.memory.working = undefined;
                break;
        }
    } else {
        this.say('Build!', true);
        switch (this.build(construction)) {
            case OK:
                return true;
            case ERR_NOT_IN_RANGE:
                this.shibMove(construction, {range: 3});
                return true;
            case ERR_RCL_NOT_ENOUGH:
                this.memory.constructionSite = undefined;
                this.memory.task = undefined;
                break;
            case ERR_INVALID_TARGET:
                this.memory.constructionSite = undefined;
                this.memory.task = undefined;
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                this.memory.working = undefined;
                break;
        }
    }
};

/**
 * Globally patch creep actions to log error codes.
 ['attack', 'attackController', 'build', 'claimController', 'dismantle', 'drop',
 'generateSafeMode', 'harvest', 'heal', 'move', 'moveByPath', 'moveTo', 'pickup',
 'rangedAttack', 'rangedHeal', 'rangedMassAttack', 'repair', 'reserveController',
 'signController', 'suicide', 'transfer', 'upgradeController', 'withdraw'].forEach(function (method) {
    let original = Creep.prototype[method];
    // Magic
    Creep.prototype[method] = function () {
        let status = original.apply(this, arguments);
        if (typeof status === 'number' && status < 0 && status !== -9) {
            console.log(`Creep ${this.name} action ${method} failed with status ${status} at ${this.pos}`);
        }
        return status;
    }
});
 */
