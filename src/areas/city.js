const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_RED_LASER,
} = require('gameConstants');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const { getGroundHeight, getNewLayer, allWorlds, checkpoints, setCheckpoint } = require('world');
const { ENEMY_CARGO_BEETLE, ENEMY_LIGHTNING_BEETLE } = require('enemies/beetles');
/*

Add in interactive candles that light when shot/go out when slashed
Add jumping fleas that slow/bring down the Knight
Add normal and mounted cockroaches
Add trash cats that are invincible with meow SFX
Add spider boss guarding the window - the spider can capture knights with a web and hold them unless slashed free. The web can only be slashed, and the spider is invincible behind it. After the web is down, the spider can then be attacked directly. There are many other spiders on screen, and possibly flies that also get caught in the web flying from left to right.
Perhaps also add rats here for both 3B and 3C, climbing the walls of the alley areas.

Here are the background assets for 3b! The first order is the transitions from both possibilities of stage 2 into the city.
There is a lot of vertical movement possibility to 3b, both in travelling in the brick alley and also when above the roof of
the alley and seeing the cityscape. There is the ground all the way to the floor of the alley
From 2B to 3B, it is the same transition from 1 to 2B where the screen moves faster than the Knight,
and the Knight appears at the other side of the tunnel. From 2A to 3B,
the forest merely ends and the Knight is flying above the city skyline.

*/

function spawnEnemy(state, enemyType, props) {
    const newEnemy = createEnemy(state, enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    newEnemy.vx = newEnemy.vx || (newEnemy.stationary || newEnemy.hanging ? 0 : -6);
    return addEnemyToState(state, newEnemy);
}

const setEvent = (state, event) => {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return {...state, world: {...state.world, eventTime: -FRAME_LENGTH, event}};
};

// Add check points for:
const CHECK_POINT_CITY_START = 'cityStart';
const CHECK_POINT_CITY_MIDDLE = 'cityMiddle';
const CHECK_POINT_CITY_MIDDLE_TIME = 40000;
const CHECK_POINT_CITY_END = 'cityEnd'
const CHECK_POINT_CITY_BOSS = 'cityBoss'
checkpoints[CHECK_POINT_CITY_START] = function (state) {
    const world = getCityWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_CITY_MIDDLE] = function (state) {
    const world = getCityWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_CITY_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_CITY_END] = function (state) {
    const world = getCityWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_CITY_BOSS] = function (state) {
    const world = getCityWorld();
    world.time = 120000;
    return transitionToCityBoss({...state, world});
};

const CITY_DURATION = 120000;
const CITY_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT;

const WORLD_CITY = 'city';
allWorlds[WORLD_CITY] = {
    initialEvent: 'nothing',
    events: {
        nothing: (state, eventTime) => {
            if (eventTime === 1000) {
                return setEvent(state, 'easyWrens');
            }
        },
        easyWrens: (state, eventTime) => {
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, 'powerup');
            }
        },
        powerup: (state, eventTime) => {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_CARGO_BEETLE, {left: WIDTH, top: SAFE_HEIGHT / 2});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['wrens']));
            }
        },
        wrens: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 5 - numFormidable;
            let spacing = state.world.time < CITY_EASY_DURATION ? 3000 : 2000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['lightningBeetle']));
            }
        },
        lightningBeetle: (state, eventTime) => {
            if (eventTime === 0) {
                let top = random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_LIGHTNING_BEETLE, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'wrens');
            }
        },
        bossPrep: (state) => {
            if (state.enemies.length === 0) {
                state = setCheckpoint(state, CHECK_POINT_CITY_END);
                return transitionToCityBoss(state);
            }
        },
    },
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 5;
        const targetX = Math.max(world.targetX, world.x + 1000);
        let targetY = world.y;
        if (world.time < 10000) {
            targetY = world.y;
        } else if (world.time % 20000 < 5000) {
            targetY = -500;//world.y;
        } else if (world.time % 20000 < 10000) {
            targetY = -500;
        } else if (world.time % 20000 > 15000) {
            targetY = -500; //800;
        }
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_CITY && world.time >= CITY_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === CHECK_POINT_CITY_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_CITY_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

const getCityWorld = () => ({
    type: WORLD_CITY,
    x: 0,
    y: 500,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/alley.mp3',
    groundHeight: 30,
    ...getCityLayers(),
});
const skyLoop = createAnimation('gfx/scene/city/3bcityskybox.png', r(400, 300));
const sunset = createAnimation('gfx/scene/city/sunsettransition.png', r(400, 300));
const groundLoop = createAnimation('gfx/scene/city/3bgroundloop.png', r(200, 60));
const cityScapeLoop = createAnimation('gfx/scene/city/cityscape.png', r(460, 300));
const alleyLoop = createAnimation('gfx/scene/city/alley.png', r(320, 600));

const dumpsterAnimation = createAnimation('gfx/scene/city/dumpster.png', r(200, 150));
const litterAnimation = createAnimation('gfx/scene/city/trash1.png', r(100, 100));
const trashbagAnimation = createAnimation('gfx/scene/city/trash2.png', r(100, 100));

/*
xxx Sunset slowly moves down.
xxx The cityscape can scroll slowly and loop.


I also made the new window, both for entering the restaurant and for the base of the spider boss.
The window entering the restaurant has lines that are where different light bulbs go.
I also made strings to appear in the alley with little lightning sparks to animate over the broken bulbs over and over,
harming anything it is near. I am unsure if we should make the bulbs destroyable, as if the Knight has that power,
they may accidentally kill themselves a lot.
Anyway, the point of the bulbs around the window is to funnel the Knight into the open area,
and not too high as to clip through the wall.

Part way through, they travel down to ground floor and see a window - entering the window transitions them into the restaurant.
In the restaurant, occasionally there can be ground as well (the table).
I am unsure how you want to have it if a robes falls on the table but then reaches the end of the table - do they then fall off?
Do they stop? Alternatively, we can treat the groundloop as a "bar" and never have it end with only minor alterations to the sprite.

*/
const getCityLayers = () => ({
    background: getNewLayer({
        xFactor: 0.05, yFactor: 0.01, yOffset: 0, maxY: 0,
        spriteData: {
            sky: {animation: skyLoop, scale: 2, next: ['sky']},
        },
    }),
    sunset: getNewLayer({
        xFactor: 0.05, yFactor: 0.01, yOffset: 0, maxY: 0, unique: true,
        spriteData: {
            sunset: {
                animation: sunset, scale: 2, vy: -0.5,
                accelerate(state, layerName, spriteIndex) {
                    let world = state.world;
                    let layer = world[layerName];
                    let sprites = [...layer.sprites];
                    const sprite = sprites[spriteIndex];
                    const left = 0;//-state.world.time / 200;
                    const top = state.world.time / 100 - 150;
                    sprites[spriteIndex] = {...sprite, left, top};
                    layer = {...layer, sprites};
                    world = {...world, [layerName]: layer};
                    return {...state, world};
                },
            },
        },
    }),
    cityScape: getNewLayer({
        xFactor: 0.2, yFactor: 0.5, yOffset: -300,
        spriteData: {
            cityScape: { animation: cityScapeLoop, scale: 2, next: ['cityScape'], offset: 0 },
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0,
        spriteData: {
            pavement: { animation: groundLoop, next: ['pavement'], offset: 0},
        },
    }),
    wall: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -54,
        spriteData: {
            wall: { animation: alleyLoop, next: ['wall'], offset: 0},
        },
    }),
    dumpster: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -48,
        spriteData: {
            dumpster: { animation: dumpsterAnimation, scale: 2, next: ['trash'], offset: [-200, -50, 100] },
            trash: { animation: [trashbagAnimation, litterAnimation], scale: 2, next: ['trash', 'trash', 'lastTrash'], offset: [20, 80, 120], yOffset: [3, 5] },
            lastTrash: { animation: [trashbagAnimation, litterAnimation], scale: 2, next: ['dumpster'], offset: [150, 200], yOffset: [3, 5] },
        },
    }),
    forestEdge: getNewLayer({
        xFactor: 1, yFactor: 1, maxY: 0,
        spriteData: {},
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'sunset', 'cityScape', 'ground', 'wall', 'dumpster', 'forestEdge'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
});

module.exports = {
    CHECK_POINT_CITY_START,
    WORLD_CITY,
    getCityWorld,
};

const { updatePlayer } = require('heroes');
const { createEnemy, updateEnemy, addEnemyToState, enemyData, removeEnemy,
    accelerate_followPlayer, onHitGroundEffect_spawnMonk,
} = require('enemies');
/*
Here are the new enemies for 3B.
I imagine 3B will have a lot of previous enemies - flies in strange swarms and other normal flying ant mobs.
Unique enemies are cockroaches - who can be programmed with really erratic fast behavior moving diagonally back and forth.
There are also fleas, who are super small, but they only appear when close to the ground or restaurant tables.

I am unsure if fleas should kill the Knight outright, or have an effect where they just attach to the Knight and
can only be knocked off by slashing. Perhaps also they are immune to ranged attacks.

When attached to the Knight, she can move slower and slower, or even lose height, s
imilar to the Mario 3 flowers dropped by Goombas. Otherwise, they can just be normal jumping enemies.

Lastly is the trash cat (drawn at 1/2 scale, or even 1/3 scale, if it doesn't look large enough).
The trash cat is immune to any attacks, and only appears in the alley ground.
I don't imagine there will be too many of these cats, and they will pop out and slash when the knight gets close.
*/
const ENEMY_WREN = 'wren';
const wrenGeometry = {
    ...r(80, 74),
    hitBox: {left: 15, top: 15, width: 45, height: 35},
};
enemyData[ENEMY_WREN] = {
    animation: createAnimation('gfx/enemies/birds/wrenspritesheet.png', wrenGeometry, {cols: 4}),
    deathAnimation: createAnimation('gfx/enemies/birds/wrenspritesheet.png', wrenGeometry, {x: 4}),
    deathSound: 'sfx/birds/bird.mp3',
    props: {
        life: 3,
        score: 50,
        vx: -4,
    },
};

const formidableEnemies = [];

const { transitionToCityBoss } = require('areas/cityBoss');
const { createAttack, addEnemyAttackToState, } = require('attacks');

const { createEffect, effects, addEffectToState, updateEffect } = require('effects');

