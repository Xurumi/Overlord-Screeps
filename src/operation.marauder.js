/*
 * Copyright (c) 2019.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */
Creep.prototype.marauding = function () {
    let sentence = ['Just', 'Here', 'To', 'Ruin', 'Your', 'Day'];
    let word = Game.time % sentence.length;
    this.say(sentence[word], true);
    // Set a target
    if (!this.memory.targetRoom) {
        let lowLevel = _.sample(_.filter(Memory.roomCache, (r) => r.name !== this.room.name && r.user && r.user !== MY_USERNAME && !_.includes(FRIENDLIES, r.user) && _.includes(Memory._threats, r.user) && !r.sk && !r.safemode && r.level && r.level < 3));
        if (lowLevel) {
            this.memory.targetRoom = lowLevel.name;
        } else {
            let potential = _.sample(_.filter(Memory.roomCache, (r) => r.name !== this.room.name && r.user && r.user !== MY_USERNAME && !_.includes(FRIENDLIES, r.user) && _.includes(Memory._threats, r.user) && !r.sk && !r.level));
            if (potential) this.memory.targetRoom = potential.name; else this.memory.operation = 'borderPatrol';
        }
    } else {
        if (this.room.name !== this.memory.targetRoom) {
            this.attackInRange();
            return this.shibMove(new RoomPosition(25, 25, this.memory.targetRoom), {range: 19});
        }
        if (this.room.name === this.memory.targetRoom) {
            // If on target and cant win find a new target
            if (!this.canIWin() || !this.handleMilitaryCreep()) {
                this.room.cacheRoomIntel(true);
                this.attackInRange();
                this.memory.targetRoom = undefined;
                this.shibKite();
            }
        }
    }
};