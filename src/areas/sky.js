const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ENEMY_FLY,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_SLASH, ATTACK_STAB,
} = require('gameConstants');
const random = require('random');
const { createAnimation, r } = require('animations');
const { getGroundHeight, getNewLayer, allWorlds, checkpoints, setCheckpoint } = require('world');
const { ENEMY_HORNET, ENEMY_HORNET_SOLDIER } = require('enemies/hornets');

const spawnEnemy = (state, enemyType, props) => {
    const newEnemy = createEnemy(enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    newEnemy.vx = newEnemy.vx || (newEnemy.stationary || newEnemy.hanging ? 0 : -6);
    return addEnemyToState(state, newEnemy);
};

const setEvent = (state, event) => {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return {...state, world: {...state.world, eventTime: -FRAME_LENGTH, event}};
};

// Add check points for:
const CHECK_POINT_SKY_START = 'skyStart';
const CHECK_POINT_SKY_MIDDLE = 'skyMiddle';
const CHECK_POINT_SKY_MIDDLE_TIME = 40000;
const CHECK_POINT_SKY_END = 'skyEnd'
const CHECK_POINT_SKY_BOSS = 'skyBoss'
checkpoints[CHECK_POINT_SKY_START] = function (state) {
    const world = getSkyWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_SKY_MIDDLE] = function (state) {
    const world = getSkyWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_SKY_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_SKY_END] = function (state) {
    const world = getSkyWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_SKY_BOSS] = function (state) {
    const world = getSkyWorld();
    world.time = 120000;
    return transitionToSkyBoss({...state, world});
};
const formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];

const SKY_DURATION = 120000;
const SKY_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT - 90;

const WORLD_SKY = 'sky';
allWorlds[WORLD_SKY] = {
    initialEvent: 'nothing',

    events: {
        transition: (state, eventTime) => {
            state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
            if (eventTime === 1000) {
                state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 400});
                return setEvent(state, 'nothing');
            }
            return state;
        },
        nothing: (state, eventTime) => {
            if (eventTime === 1000) {
                return setEvent(state, 'easyFlies');
            }
        },
        easyFlies: (state, eventTime) => {
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
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
                return setEvent(state, random.element(['explodingBeetle', 'hornet']));
            }
        },
        flyingAnts: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 2 - numFormidable;
            let spacing = state.world.time < SKY_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber - 1; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT_SOLDIER, {left: WIDTH + 10 + Math.random() * 30, top: SAFE_HEIGHT / 4 + i * SAFE_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber; i++) {
                    const enemyType = random.element([ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER]);
                    state = spawnEnemy(state, enemyType, {left: WIDTH + 10 + Math.random() * 30, top: SAFE_HEIGHT / 4 + i * SAFE_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['hornet']));
            }
        },
        explodingBeetle: (state, eventTime) => {
            if (eventTime === 0) {
                let top = random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_EXPLOSIVE_BEETLE, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'hornet');
            }
        },
        hornet: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable < 2) {
                let top = random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_HORNET, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'flyingAnts');
            }
        },
        bossPrep: (state) => {
            if (state.enemies.length === 0) {
                state = setCheckpoint(state, CHECK_POINT_SKY_END);
                return transitionToSkyBoss(state);
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
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_SKY && world.time >= SKY_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === CHECK_POINT_SKY_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_SKY_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

const getSkyWorld = () => ({
    type: WORLD_SKY,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/title.mp3',
    ...getSkyLayers(),
});

const skyLoop = createAnimation('gfx/scene/sky/sky.png', r(400, 400));
const moon = createAnimation('gfx/scene/sky/moon.png', r(100, 100));
const clouds = [
    createAnimation('gfx/scene/sky/cloud1.png', r(150, 100)),
    createAnimation('gfx/scene/sky/cloud2.png', r(150, 100)),
    createAnimation('gfx/scene/sky/cloud3.png', r(150, 100)),
];
const getSkyLayers = () => ({
    background: getNewLayer({
        xFactor: 0.1, yFactor: 0.5, yOffset: 0, maxY: 0,
        spriteData: {
            sky: {animation: skyLoop, scale: 2},
        },
    }),
    moon: getNewLayer({
        xFactor: 0.05, yFactor: 0.5, unique: true,
        spriteData: {
            moon: {
                animation: moon, scale: 1, next: ['moon'], offset: [1000],
                accelerate(state, layerName, spriteIndex) {
                    let world = state.world;
                    let layer = world[layerName];
                    let sprites = [...layer.sprites];
                    const sprite = sprites[spriteIndex];
                    // Moon's position is tied to the level time so that it will correspond
                    // to how far the player is in the level and give them a sense of progress,
                    // particularly when the restart at a check point.
                    const x = WIDTH + 400 - (WIDTH + 450) * state.world.time / SKY_DURATION;
                    sprites[spriteIndex] = {...sprite,
                        left: x - sprite.width / 2,
                        top: 300 - 200 * Math.cos(Math.PI * (x - 400) / 1200),
                    };
                    layer = {...layer, sprites};
                    world = {...world, [layerName]: layer};
                    return {...state, world};
                },
            },
        },
    }),
    clouds: getNewLayer({
        xFactor: 0.3, yFactor: 0.5, yOffset: -300,
        spriteData: {
            cloudA: {animation: clouds[0], scale: 2, alpha: 0.7, next: ['cloudB', 'cloudC'], offset: [50, 80], yOffset: [0, 10, 20, 30, 40]},
            cloudB: {animation: clouds[1], scale: 2, alpha: 0.7, next: ['cloudA', 'cloudC'], offset: [50, 80], yOffset: [0, 10, 20, 30, 40]},
            cloudC: {animation: clouds[2], scale: 2, alpha: 0.7, next: ['cloudA', 'cloudB'], offset: [50, 80], yOffset: [0, 10, 20, 30, 40]},
        },
    }),
    fastClouds: getNewLayer({
        xFactor: 0.7, yFactor: 0.5, yOffset: -305,
        spriteData: {
            cloud: {animation: clouds, scale: 2, alpha: 0.5, next: ['cloud'], offset: [150, 200], yOffset: [0, 10, 20, 30, 40]},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'moon', 'clouds', 'fastClouds'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
});

module.exports = {
    CHECK_POINT_SKY_START,
    WORLD_SKY,
    getSkyWorld,
};

const { updatePlayer } = require('heroes');
const { createEnemy, addEnemyToState, enemyData, updateEnemy, removeEnemy,
    accelerate_followPlayer, onHitGroundEffect_spawnMonk,
} = require('enemies');
// Bluebirds, slowly follow the Knight, when mounted can fire long lasers.
const ENEMY_BLUE_BIRD = 'blueBird';
enemyData[ENEMY_BLUE_BIRD] = {
    animation: createAnimation('gfx/enemies/birds/bluebird.png', r(130, 130), {cols: 4, duration: 30}),
    deathAnimation: createAnimation('gfx/enemies/birds/bluebird.png', r(130, 130), {x: 4, duration: 30}),
    deathSound: 'sfx/birds/bird.mp3',
    accelerate: accelerate_followPlayer,
    props: {
        life: 5,
        score: 40,
        speed: 2,
    },
};
const ENEMY_BLUE_BIRD_SOLDIER = 'blueBirdSoldier';
enemyData[ENEMY_BLUE_BIRD_SOLDIER] = {
    animation: createAnimation('gfx/enemies/birds/mountbluebird.png', r(130, 130), {cols: 4, duration: 30}),
    deathAnimation: createAnimation('gfx/enemies/birds/mountbluebird.png', r(130, 130), {x: 4, duration: 30}),
    deathSound: 'sfx/birds/bird.mp3',
    accelerate: accelerate_followPlayer,
    onDeathEffect(state, enemy) {
        const blueBird = createEnemy(ENEMY_BLUE_BIRD, {
            left: enemy.left,
            top: enemy.top,
            speed: 3,
            vx: 10,
            vy: Math.random() < .5 ? -5 : 5,
            animationTime: 20,
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = removeEnemy(state, enemy);
        state = addEnemyToState(state, blueBird);
        return addEnemyToState(state, enemy);
    },
    onHitGroundEffect: onHitGroundEffect_spawnMonk,
    props: {
        life: 8,
        score: 50,
        speed: 1.5,
    },
};
/*Enemies:
Wren, like stronger larger flies and fly in patterns.

Ducks, which stop projectiles from being shot through them but don’t have any attacks.
I am unsure if Ducks should damage the Knights or just only stop attacks.
If they don’t damage the Knights, it may be worth having them move from left to right so they stay on screen longer.
Ducks have a quack to warn they are coming on screen.

Lightning Beetles, which when killed summon a vertical bolt of lightning across the screen to damage anything.
*/

const { transitionToSkyBoss } = require('areas/skyBoss');
