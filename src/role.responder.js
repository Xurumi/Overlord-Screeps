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
    creep.say(ICONS.respond, true);
    if (creep.tryToBoost(['attack'])) return;
    if (!creep.handleMilitaryCreep()) {
        creep.findDefensivePosition(creep);
    }
};
