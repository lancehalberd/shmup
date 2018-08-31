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

*/

function spawnEnemy(state, enemyType, props) {
    const newEnemy = createEnemy(enemyType, props);
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
                return setEvent(state, random.element(['lightningBeetle', 'blueBird']));
            }
        },
        lightningBeetle: (state, eventTime) => {
            if (eventTime === 0) {
                let top = random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_LIGHTNING_BEETLE, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'blueBird');
            }
        },
        blueBird: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable < 2) {
                const type = state.world.time < CITY_EASY_DURATION  ? ENEMY_BLUE_BIRD : ENEMY_BLUE_BIRD_SOLDIER;
                let top = random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, type, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['lightningBeetle', 'wrens']));
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
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/title.mp3',
    groundHeight: 30,
    ...getCityLayers(),
});
const skyLoop = createAnimation('gfx/scene/city/3bcityskybox.png', r(400, 300));
const groundLoop = createAnimation('gfx/scene/city/3bgroundloop.png', r(200, 60));
const cityScapeLoop = createAnimation('gfx/scene/city/cityscape.png', r(460, 300));
const clouds = [
    createAnimation('gfx/scene/sky/cloud1.png', r(150, 100)),
    createAnimation('gfx/scene/sky/cloud2.png', r(150, 100)),
    createAnimation('gfx/scene/sky/cloud3.png', r(150, 100)),
];
const getCityLayers = () => ({
    background: getNewLayer({
        xFactor: 0.1, yFactor: 0.5, yOffset: 0, maxY: 0,
        spriteData: {
            sky: {animation: skyLoop, scale: 2, next: ['sky']},
        },
    }),
    cityScape: getNewLayer({
        xFactor: 0.2, yFactor: 0.5, yOffset: 0,
        spriteData: {
            cityScape: {animation: cityScapeLoop, scale: 2, next: ['cityScape'], offset: 0},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0,
        spriteData: {
            pavement: { animation: groundLoop, next: ['pavement'], offset: 0},
        },
    }),
    clouds: getNewLayer({
        xFactor: 0.3, yFactor: 0.5, yOffset: -300,
        spriteData: {
            cloudA: {animation: clouds[0], scale: 2, alpha: 0.7, vx: -1, next: ['cloudB', 'cloudC'], offset: [50, 80], yOffset: [0, 10, 20, 30, 40]},
            cloudB: {animation: clouds[1], scale: 2, alpha: 0.7, vx: -2, next: ['cloudA', 'cloudC'], offset: [50, 80], yOffset: [0, 10, 20, 30, 40]},
            cloudC: {animation: clouds[2], scale: 2, alpha: 0.7, vx: -1, next: ['cloudA', 'cloudB'], offset: [50, 80], yOffset: [0, 10, 20, 30, 40]},
        },
    }),
    fastClouds: getNewLayer({
        xFactor: 0.7, yFactor: 0.5, yOffset: -305,
        spriteData: {
            cloud: {animation: clouds, scale: 2, alpha: 0.5, vx: -4, next: ['cloud'], offset: [150, 200], yOffset: [0, 10, 20, 30, 40]},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'cityScape', 'ground'],
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
// Bluebirds, slowly follow the Knight, when mounted can fire long lasers.
const ENEMY_BLUE_BIRD = 'blueBird';
const blueBirdGeometry = {
    ...r(130, 130),
    hitBox: {left: 27, top: 25, width: 65, height: 80},
    hitBoxes: [
        {left: 18, top: 40, width: 30, height: 33}, // Head
        {left: 42, top: 52, width: 45, height: 65}, // Body
    ]
};
const mountedBlueBirdGeometry = {
    ...blueBirdGeometry,
    hitBoxes: [
        ...blueBirdGeometry.hitBoxes,
        {left: 33, top: 19, width: 27, height: 38}, // Mount
    ]
}
enemyData[ENEMY_BLUE_BIRD] = {
    animation: createAnimation('gfx/enemies/birds/bluebird.png', blueBirdGeometry, {cols: 4}),
    deathAnimation: createAnimation('gfx/enemies/birds/bluebird.png', blueBirdGeometry, {x: 4}),
    deathSound: 'sfx/birds/bird.mp3',
    accelerate: accelerate_followPlayer,
    props: {
        life: 15,
        followPlayerFor: 10000,
        score: 40,
        speed: 4,
    },
};
const ENEMY_BLUE_BIRD_SOLDIER = 'blueBirdSoldier';
enemyData[ENEMY_BLUE_BIRD_SOLDIER] = {
    animation: createAnimation('gfx/enemies/birds/mountbluebird.png', mountedBlueBirdGeometry, {cols: 4}),
    deathAnimation: createAnimation('gfx/enemies/birds/mountbluebird.png', mountedBlueBirdGeometry, {x: 4}),
    deathSound: 'sfx/hit.mp3',
    accelerate: accelerate_followPlayer,
    shoot(state, enemy) {
        if (enemy.shotCooldown === undefined) {
            const initialShotCooldownFrames = enemy.initialShotCooldownFrames || 50
            const shotCooldown = Array.isArray(initialShotCooldownFrames) ?
                random.range(initialShotCooldownFrames[0], initialShotCooldownFrames[1]) :
                initialShotCooldownFrames;
            state = updateEnemy(state, enemy, {shotCooldown});
            enemy = state.idMap[enemy.id];
        }
        if (enemy.shotCooldown > 0) {
            return updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - 1});
        }
        // Set attackCooldownFramesLeft if the enemy uses an attack animation.
        let bulletsFired = enemy.bulletsFired || 0;
        const shotCooldown = Array.isArray(enemy.shotCooldownFrames) ?
            enemy.shotCooldownFrames[bulletsFired % enemy.shotCooldownFrames.length] :
            enemy.shotCooldownFrames;
        bulletsFired++;
        if (enemy.attackCooldownFrames) {
            state = updateEnemy(state, enemy, {shotCooldown, bulletsFired, attackCooldownFramesLeft: enemy.attackCooldownFrames});
        } else {
            state = updateEnemy(state, enemy, {shotCooldown, bulletsFired});
        }
        const laser = createAttack(ATTACK_RED_LASER, {enemyId: enemy.id});
        return addEnemyAttackToState(state, laser);
    },
    onDeathEffect(state, enemy) {
        const blueBird = createEnemy(ENEMY_BLUE_BIRD, {
            left: enemy.left,
            top: enemy.top,
            vx: enemy.left > state.players[0].sprite.left ? 20 : -20,
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
        life: 15,
        followPlayerFor: 10000,
        followYOffset: 50,
        score: 50,
        speed: 3,
        shotCooldownFrames: 50,
        bulletSpeed: 8,
        bulletX: 0.9,
        bulletY: 0.15,
    },
};

const ENEMY_DUCK = 'duck';
const duckGeometry = {
    ...r(200, 102),
    hitBoxes: [
        {left: 25, top: 28, width: 35, height: 20},
        {left: 56, top: 35, width: 50, height: 15},
        {left: 114, top: 24, width: 55, height: 60},
        {left: 114, top: 21, width: 70, height: 20},
    ],
};
// Duck can fly in either direction, and should be spawned off screen to give warning.
enemyData[ENEMY_DUCK] = {
    animation: {
        frames: [
            {...duckGeometry, image: requireImage('gfx/enemies/birds/duck1.png')},
            {...duckGeometry, image: requireImage('gfx/enemies/birds/duck2.png')},
        ],
        frameDuration: 12,
    },
    props: {
        life: 1000,
        score: 50,
        speed: 8,
        spawnSfx: 'quack',
    },
};

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

const formidableEnemies = [ENEMY_BLUE_BIRD, ENEMY_BLUE_BIRD_SOLDIER];

const { transitionToCityBoss } = require('areas/cityBoss');
const { createAttack, addEnemyAttackToState, } = require('attacks');

const { createEffect, effects, addEffectToState, updateEffect } = require('effects');

const EFFECT_GUST = 'gust';
effects[EFFECT_GUST] = {
    animation: createAnimation('gfx/effects/wind.png', r(150, 100), {duration: 1000}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: 3 * Math.sin(effect.animationTime / 100),
        });
    },
    onHitPlayer(state, effectIndex, playerIndex) {
        return updatePlayer(state, playerIndex, {}, {vx: state.players[playerIndex].sprite.vx - 1.5});
    },
    props: {
        relativeToGround: true,
        loops: 20,
        vy: 0,
        vx: -10
    },
};

const EFFECT_GUST_LEAF = 'gustLeaf';
// Make the leaf scale from the center of its hitbox instead of the top left corner.
const leafGeometry = a({...r(40, 37), hitBox: r(30, 37)}, 0.5, 0.5);
effects[EFFECT_GUST_LEAF] = {
    animation: createAnimation('gfx/enemies/plainsboss/leaf.png', leafGeometry),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: 5 * Math.sin(effect.animationTime / 100),
            yScale: (effect.animationTime % 500 > 250) ? -1 : 1
        });
    },
    props: {
        relativeToGround: true,
        loops: 20,
        vy: 0,
        vx: -11
    },
};
