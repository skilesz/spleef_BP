import { system, Vector, ScreenDisplay, world } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';


// GLOBAL
let gamePos = 0;
let gameCoords = [];
let currentPlayers = [];
let currGame = false;


// EVENT LISTENERS

// Listen for coordinator use on a block, record that position
world.events.beforeItemUseOn.subscribe(eventData => {
    if (eventData.item.typeId === 'spleef:coordinator') {
        gameCoords[gamePos] = eventData.blockLocation.above(); 
        eventData.source.runCommand('tellraw @s {"rawtext":[{"text":"§6§l[SPLEEF]§r: Set player location §9§l' + (gamePos + 1) + '§r."}]}');
        gamePos++;
        if (gamePos === 4) gamePos = 0;
    }
});

// Listen for spleef remote use, pull up game menu
world.events.beforeItemUse.subscribe(eventData => {
    let { item, source } = eventData;

    if (item.typeId === 'spleef:spleef_remote') {
        displayMenu(item, source);
    }
});

// Listen for deaths and remove from currentPlayers list
world.events.entityHurt.subscribe(eventData => {
    let { hurtEntity } = eventData;

    if (currGame && currentPlayers.includes(hurtEntity)) {
        for (let i = 0; i < currentPlayers.length; i++) {
            if (currentPlayers[i] === hurtEntity) {
                if (hurtEntity.getComponent('minecraft:health').current <= 0) {
                    for (let j = i; j < currentPlayers.length - 1; j++) {
                        currentPlayers[j] = currentPlayers[j + 1];
                    }
                    currentPlayers.pop();
                    endGame();
                }
            }
        }
    }
});


// ON-TICK
world.events.tick.subscribe(eventData => {

});


// HELPER FUNCTIONS

// Display the spleef menu
function displayMenu(item, source) {
    let spleefForm = new ActionFormData();
    spleefForm.title('§6§lSpleef Menu');
    let spleefBody = 'Current Players:\n';
    for (let i = 0; i < currentPlayers.length; i++) {
        spleefBody += currentPlayers[i].name + '\n';
    }
    spleefForm.body(spleefBody);
    spleefForm.button('Play');
    spleefForm.button('Choose Players');
    spleefForm.button('Reset');

    spleefForm.show(source).then(async r => {
        if (r.isCanceled) return;

        let response = r.selection;
        switch (response) {
            case 0:
                playSpleef(item, source);
                break;
            case 1:
                showPlayerMenu(item, source)
                break;
            case 2:
                currentPlayers = [];
                currGame = false;
                break;
            default:
        }
    }).catch(e => {
        console.error(e, e.stack);
    });
}

// Play spleef
function playSpleef(item, source) {
    if (currentPlayers.length < 2) {
        source.runCommand('tellraw @s {"rawtext":[{"text":"§6§l[SPLEEF]§r: §c2 or more players required."}]}');
        return;
    }

    if (currentPlayers.length > gameCoords.length) {
        source.runCommand('tellraw @s {"rawtext":[{"text":"§6§l[SPLEEF]§r: §cCoordinates not set for enough players."}]}');
        return;
    }

    for (let i = 0; i < currentPlayers.length; i++) {
        currentPlayers[i].runCommand('tp @s ' + gameCoords[i].x + ' ' + gameCoords[i].y + ' ' + gameCoords[i].z);
    }

    for (let i = 0; i < currentPlayers.length; i++) {
        currentPlayers[i].runCommand('titleraw @s times 0 10 10');
        currentPlayers[i].runCommand('titleraw @s title {"rawtext":[{"text":"§c§l3"}]}');
    }

    sleep(() => {
        for (let i = 0; i < currentPlayers.length; i++) {
            currentPlayers[i].runCommand('titleraw @s title {"rawtext":[{"text":"§e§l2"}]}');
        }

        sleep(() =>{
            for (let i = 0; i < currentPlayers.length; i++) {
                currentPlayers[i].runCommand('titleraw @s title {"rawtext":[{"text":"§a§l1"}]}');
            }

            sleep(() => {
                for (let i = 0; i < currentPlayers.length; i++) {
                    currentPlayers[i].runCommand('titleraw @s times 0 20 0');
                    currentPlayers[i].runCommand('titleraw @s title {"rawtext":[{"text":"§9§lGO"}]}');
                }

                currGame = true;
            }, 20);
        }, 20);
    }, 20);
}

// Choose players
function showPlayerMenu(item, source) {
    let spleefPlayerForm = new ModalFormData();
    spleefPlayerForm.title('§6§lChoose Players');

    let onlinePlayers = Array.from(world.getPlayers());
    let choices = [];
    choices[0] = '--';
    for (let i = 0; i < onlinePlayers.length; i++) {
        choices[i + 1] = onlinePlayers[i].name;
    }

    spleefPlayerForm.dropdown('Choose Player 1', choices);
    spleefPlayerForm.dropdown('Choose Player 2', choices);
    spleefPlayerForm.dropdown('Choose Player 3', choices);
    spleefPlayerForm.dropdown('Choose Player 4', choices);

    spleefPlayerForm.show(source).then(r => {
        if (r.isCanceled) return;

        let chosenPlayers = r.formValues;

        let k = 0;

        for (let i = 0; i < 4; i++) {
            if (chosenPlayers[i] != 0) {
                currentPlayers[k] = onlinePlayers[chosenPlayers[i] - 1];
                k++;
            }
        }

    }).catch(e => {
        console.error(e, e.stack);
    })
}

// Sleep
function sleep(callback, delay = 1) {
    if (delay < 1) {
      Promise.resolve().then(callback);
      return;
    }
    const n = Math.floor(delay);
    let i = 0;
    (function tick() {
      i++;
      if (i >= n) {
        system.run(callback);
        return;
      }
      system.run(tick);
    })();
}

// End game condition
function endGame() {
    if (currentPlayers.length > 1) {
        return;
    } else {
        currentPlayers[0].runCommand('titleraw @s times 10 60 10');
        currentPlayers[0].runCommand('titleraw @s title {"rawtext":[{"text":"§6§lWINNER!!"}]}');
        world.say('§6§l[SPLEEF]§r: §l' + currentPlayers[0].name + ' §rhas won a game of spleef!');
        currentPlayers = [];
        currGame = false;
    }
}