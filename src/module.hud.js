module.exports.hud = function () {
    for (let key in Memory.targetRooms) {
        let level = Memory.targetRooms[key].level || 1;
        let type = Memory.targetRooms[key].type;
        let priority = Memory.targetRooms[key].priority || 4;
        let stagingRoom;
        for (let staging in Memory.stagingRooms) {
            if (Game.map.getRoomLinearDistance(staging, key) === 1) {
                stagingRoom = staging;
            }
        }
        if (Memory.targetRooms[key].escort) {
            new RoomVisual(key).text(
                'ESCORT REQUESTED',
                1,
                2,
                {align: 'left', opacity: 0.8, color: '#ff0000'}
            );
        }
        if (type === 'siege' && Memory.targetRooms[key].activeSiege) {
            new RoomVisual(key).text(
                'ACTIVE SIEGE',
                1,
                2,
                {align: 'left', opacity: 0.8, color: '#ff0000'}
            );

            if (type === 'siege' && !Memory.targetRooms[key].activeSiege) {
                new RoomVisual(key).text(
                    'QUEUED SIEGE',
                    1,
                    2,
                    {align: 'left', opacity: 0.8, color: '#0b18ff'}
                );
            }
            if (!stagingRoom) {
                new RoomVisual(key).text(
                    ICONS.crossedSword + ' Operation Type: ' + _.capitalize(type) + ' Level - ' + level + ' Priority - ' + priority,
                    1,
                    3,
                    {align: 'left', opacity: 0.8}
                );
            } else {
                new RoomVisual(key).text(
                    ICONS.crossedSword + ' Operation Type: ' + _.capitalize(type) + ' Level - ' + level + ' Priority - ' + priority + ' - Staging From ' + stagingRoom,
                    1,
                    3,
                    {align: 'left', opacity: 0.8}
                );
            }
            if (Memory.targetRooms[key].enemyDead || Memory.targetRooms[key].friendlyDead) {
                new RoomVisual(key).text(
                    'Enemy Kills/Energy - ' + Memory.targetRooms[key].trackedEnemy.length + '/' + Memory.targetRooms[key].enemyDead + ' Friendly Losses/Energy - ' + Memory.targetRooms[key].trackedFriendly.length + '/' + Memory.targetRooms[key].friendlyDead,
                    1,
                    0,
                    {align: 'left', opacity: 0.8, color: '#ff0000'}
                );
            }
            let creeps = _.filter(Game.creeps, (c) => c.memory.targetRoom === key);
            let y = 0;
            if (type !== 'swarm') {
                for (let creep in creeps) {
                    if (creeps[creep].room.name !== key) {
                        let roomDistance = Game.map.findRoute(creeps[creep].room.name, key).length;
                        let pathLength = 49;
                        if (creeps[creep].memory._shibMove && creeps[creep].memory._shibMove.path) pathLength = creeps[creep].memory._shibMove.path.length;
                        let secondsToArrive = (roomDistance * 49) * Memory.tickLength;
                        let displayTime;
                        if (secondsToArrive < 60) displayTime = secondsToArrive + ' Seconds';
                        if (secondsToArrive >= 86400) displayTime = _.round(secondsToArrive / 86400, 2) + ' Days';
                        if (secondsToArrive < 86400 && secondsToArrive >= 3600) displayTime = _.round(secondsToArrive / 3600, 2) + ' Hours';
                        if (secondsToArrive > 60 && secondsToArrive < 3600) displayTime = _.round(secondsToArrive / 60, 2) + ' Minutes';
                        new RoomVisual(key).text(
                            creeps[creep].name + ' Is ' + roomDistance + ' rooms away. Currently in ' + creeps[creep].room.name + '. With ' + creeps[creep].ticksToLive + ' ticks to live. It should arrive in appx. ' + displayTime,
                            1,
                            4 + y,
                            {align: 'left', opacity: 0.8}
                        );
                    } else {
                        new RoomVisual(key).text(
                            creeps[creep].name + ' Is On Scene. ' + creeps[creep].hits + '/' + creeps[creep].hitsMax + ' hp',
                            1,
                            4 + y,
                            {align: 'left', opacity: 0.8}
                        );
                    }
                    y++;
                }
            } else {
                new RoomVisual(key).text(
                    creeps.length + ' Swarm creeps inbound.',
                    1,
                    4 + y,
                    {align: 'left', opacity: 0.8}
                );
            }
        }
    }
    for (let key in Memory.ownedRooms) {
        let name = Memory.ownedRooms[key].name;
        let room = Game.rooms[name];
        if (!room) continue;
        let spawns = _.filter(room.structures, (s) => s.my && s.structureType === STRUCTURE_SPAWN);
        let activeSpawns = _.filter(spawns, (s) => s.spawning);
        let lowerBoundary = 3;
        if (room.memory.claimTarget) lowerBoundary++;
        if (room.memory.responseNeeded) lowerBoundary++;
        room.visual.rect(0, 0, 13, lowerBoundary + activeSpawns.length, {
            fill: '#ffffff',
            opacity: '0.55',
            stroke: 'black'
        });
        //SPAWNING
        if (activeSpawns.length) {
            let i = 0;
            for (let spawn of activeSpawns) {
                let spawningCreep = Game.creeps[spawn.spawning.name];
                displayText(room, 0, lowerBoundary + i, spawn.name + ICONS.build + ' ' + _.capitalize(spawningCreep.name.split("_")[0]) + ' - Ticks: ' + spawn.spawning.remainingTime);
                i++;
            }
        }
        //GCL
        let lastTickProgress = Memory.lastTickProgress || 0;
        Memory.gclProgressArray = Memory.gclProgressArray || [];
        let progressPerTick = Game.gcl.progress - lastTickProgress;
        stats.addSimpleStat('gclTickProgress', _.size(progressPerTick)); // Creep Count
        if (Memory.gclProgressArray.length < 250) {
            Memory.gclProgressArray.push(progressPerTick)
        } else {
            Memory.gclProgressArray.shift();
            Memory.gclProgressArray.push(progressPerTick)
        }
        progressPerTick = average(Memory.gclProgressArray);
        let secondsToUpgrade = _.round(((Game.gcl.progressTotal - Game.gcl.progress) / progressPerTick) * Memory.tickLength);
        let ticksToUpgrade = _.round((Game.gcl.progressTotal - Game.gcl.progress) / progressPerTick);
        let displayTime;
        if (secondsToUpgrade < 60) displayTime = secondsToUpgrade + ' Seconds';
        if (secondsToUpgrade >= 86400) displayTime = _.round(secondsToUpgrade / 86400, 2) + ' Days';
        if (secondsToUpgrade < 86400 && secondsToUpgrade >= 3600) displayTime = _.round(secondsToUpgrade / 3600, 2) + ' Hours';
        if (secondsToUpgrade > 60 && secondsToUpgrade < 3600) displayTime = _.round(secondsToUpgrade / 60, 2) + ' Minutes';
        displayText(room, 0, 1, ICONS.upgradeController + ' GCL: ' + Game.gcl.level + ' - ' + displayTime + ' / ' + ticksToUpgrade + ' ticks.');
        //Controller
        if (room.controller.progressTotal) {
            let lastTickProgress = room.memory.lastTickProgress || room.controller.progress;
            room.memory.lastTickProgress = room.controller.progress;
            let progressPerTick = room.controller.progress - lastTickProgress;
            room.memory.rclProgressArray = room.memory.rclProgressArray || [];
            if (room.memory.rclProgressArray.length < 250) {
                room.memory.rclProgressArray.push(progressPerTick)
            } else {
                room.memory.rclProgressArray.shift();
                room.memory.rclProgressArray.push(progressPerTick)
            }
            progressPerTick = average(room.memory.rclProgressArray);
            let secondsToUpgrade = _.round(((room.controller.progressTotal - room.controller.progress) / progressPerTick) * Memory.tickLength);
            let ticksToUpgrade = _.round((room.controller.progressTotal - room.controller.progress) / progressPerTick);
            let displayTime;
            if (secondsToUpgrade < 60) displayTime = secondsToUpgrade + ' Seconds';
            if (secondsToUpgrade >= 86400) displayTime = _.round(secondsToUpgrade / 86400, 2) + ' Days';
            if (secondsToUpgrade < 86400 && secondsToUpgrade >= 3600) displayTime = _.round(secondsToUpgrade / 3600, 2) + ' Hours';
            if (secondsToUpgrade > 60 && secondsToUpgrade < 3600) displayTime = _.round(secondsToUpgrade / 60, 2) + ' Minutes';
            displayText(room, 0, 2, ICONS.upgradeController + ' ' + room.controller.level + ' - ' + displayTime + ' / ' + ticksToUpgrade + ' ticks. (' + room.memory.averageCpu + '/R.CPU)');
        } else {
            delete room.memory.lastTickProgress;
            delete room.memory.rclProgressArray;
            displayText(room, 0, 2, ICONS.upgradeController + ' Controller Level: ' + room.controller.level + ' (' + room.memory.averageCpu + '/R.CPU)');
        }
        let y = lowerBoundary - (activeSpawns.length || 1);
        if (room.memory.responseNeeded) {
            displayText(room, 0, y, ICONS.crossedSword + ' RESPONSE NEEDED: Threat Level ' + room.memory.threatLevel);
            y++;
        }
        if (room.memory.claimTarget) {
            displayText(room, 0, y, ICONS.claimController + ' Claim Target: ' + room.memory.claimTarget);
            y++;
        }
    }
};