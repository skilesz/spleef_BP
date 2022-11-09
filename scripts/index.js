import { world } from '@minecraft/server';


// GLOBAL
let gamePos = 0;
let gameCoords = []


// EVENT LISTENERS

// Listen for coordinator use on a block, record that position
world.events.beforeItemUseOn.subscribe(eventData => {
    if (eventData.item.typeId === 'spleef:coordinator') {
        gameCoords[gamePos] = eventData.blockLocation.above();
        world.say('§6§l[SPLEEF]§r: Set player location §9§l' + (gamePos + 1) + '§r.');
        gamePos++;
        if (gamePos === 4) gamePos = 0;
    }
});


// ON-TICK
world.events.tick.subscribe(eventData => {

});