const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_BULLET, ENEMY_MONK,
} = require('gameConstants');
const { ENEMY_HORNET_KNIGHT } = require('enemies/hornets');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const {
    getNewLayer, allWorlds, updateLayerSprite,
    checkpoints, setCheckpoint, setEvent, advanceWorld,
    clearLayers
} = require('world');

const WORLD_CASTLE = 'castle';
const WORLD_CASTLE_DRY = 'castleDry';
const CHECK_POINT_CASTLE_START = 'castleStart';
const CHECK_POINT_CASTLE_MIDDLE = 'castleMiddle'
const CHECK_POINT_CASTLE_END = 'castleEnd'
const CHECK_POINT_CASTLE_BOSS = 'castleBoss'
const CASTLE_START_TIME = 30000;
const CASTLE_MIDDLE_TIME = 50000;
const CASTLE_DURATION = 100000;

module.exports = {
    CHECK_POINT_CASTLE_START,
    WORLD_CASTLE,
    getCastleWorld,
};

const { updatePlayer, getHeroHitbox } = require('heroes');
const {
    updateEnemy, getEnemyHitbox,
    enemyData, shoot_bulletAtPlayer,
    createEnemy, addEnemyToState,
    spawnEnemy, damageEnemy, setMode,
    addBullet, getBulletCoords, renderEnemyFrame,
    ENEMY_SHIELD_MONK,
} = require('enemies');
const { transitionToCastleBoss } = require('areas/castleBoss');
const {
    addEnemyAttackToState, createAttack,
} = require('attacks');

const { ENEMY_SHELL_MONK, ENEMY_SHORT_SAND_TURRET, ENEMY_TALL_SAND_TURRET } = require('areas/beach');
const { ENEMY_BUBBLE_SHIELD } = require('areas/beachBoss');
const { ENEMY_PIRANHA, ENEMY_SEA_URCHIN } = require('areas/ocean');
const { ENEMY_GRASSHOPPER } = require('areas/circus');

checkpoints[CHECK_POINT_CASTLE_START] = function (state) {
    const world = getCastleWorld();
    world.time = CASTLE_START_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_CASTLE_MIDDLE] = function (state) {
    const world = getDryCastleWorld();
    world.time = CASTLE_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_CASTLE_END] = function (state) {
    const world = getDryCastleWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = CASTLE_DURATION - 20000;
    return advanceWorld(advanceWorld({...state, world}));
};
checkpoints[CHECK_POINT_CASTLE_BOSS] = function (state) {
    const world = getDryCastleWorld();
    world.time = CASTLE_DURATION;
    // Advance world once to add background, and a second time to position it.
    state = advanceWorld({...state, world});
    return transitionToCastleBoss(advanceWorld(state));
};

const {
    nothing, easyRoaches, normalRoaches, powerup,
    bossPowerup,
    singleEnemy, singleEasyHardEnemy, explodingBeetle,
} = require('enemyPatterns');
allWorlds[WORLD_CASTLE] = {
    initialEvent: 'nothing',
    events: {
        nothing: nothing(1000, 'piranha'),
        piranha: (state, eventTime) => {
            if (eventTime === 0) {
                let tops = [GAME_HEIGHT / 4, GAME_HEIGHT / 2, 3 * GAME_HEIGHT / 4];
                state = spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops)});
                state = spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops), delay: 40});
                return spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops), delay: 80});
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, ['powerup', 'shellMonk', 'seaUrchins']);
            }
        },
        powerup: powerup(['shellMonk', 'seaUrchins']),
        seaUrchins: (state, eventTime) => {
            let spacing = 2000;
            if (eventTime === 0) {
                const count = random.range(1, 3);
                let left = WIDTH;
                for (let i = 0; i < count; i++) {
                    state = spawnEnemy(state, ENEMY_SEA_URCHIN, {
                        left, top: random.range(200, 300),
                    });
                    left += random.element([60, 80, 100]);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, ['seaUrchins', 'shellMonk']);
            }
        },
        shellMonk: singleEnemy(ENEMY_SHELL_MONK, 2000, ['shellMonk', 'piranha']),
        transitionPause: state => state,
    },
    advanceWorld(state) {
        state = floatEnemies(state);
        if (!state.enemies.filter(e => !e.dead && e.type === ENEMY_BUBBLE_SHIELD).length) {
            state = addEnemyToState(state, createEnemy(state, ENEMY_BUBBLE_SHIELD, {left: -200}));
        }
        if (state.world.time === CASTLE_MIDDLE_TIME - 5000) {
            state = clearLayers(state, ['midStuff', 'groundStuff', 'torchHolders']);
            state = setEvent(state, 'transitionPause');
        } else if (state.world.time === CASTLE_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_CASTLE_MIDDLE);
            state = transitionToDry(state);
        }
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 6;
        const targetX = Math.max(world.targetX, world.x + 1000);
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetFrames, time};
        state = {...state, world};
        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};
function floatEnemies(state) {
    for (const enemy of state.enemies) {
        if (!enemy.dead || enemy.grounded) continue;
        state = updateEnemy(state, enemy, {
            vx: enemy.vx * 0.99,
            vy: enemy.vy * 0.85 - 2,
        });
    }
    return state;
}

function transitionToDry(state) {
    state = updateLayerSprite(state, 'deepWater', 0, {vy: 2.5});
    return {
        ...state,
        world: {
            ...state.world,
            event: 'nothing',
            eventTime: -2000,
            type: WORLD_CASTLE_DRY,
            mgLayerNames: [
                'deepWaterback', 'backgroundHigh', 'backgroundMedium', 'backgroundLow',
                'wallDecorations', 'torchHolders', 'torches',
                'ground', 'midStuff', 'groundStuff',
            ],
        }
    };
}

function getCastleWorld() {
    return {
        type: WORLD_CASTLE,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 45,
        time: 0,
        bgm: 'bgm/ocean.mp3',
        groundHeight: 30,
        ...getCastleLayers(),
    };
}

function getDryCastleWorld() {
    return {
        type: WORLD_CASTLE_DRY,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 45,
        time: 0,
        bgm: 'bgm/ocean.mp3',
        groundHeight: 30,
        ...getCastleLayers(),
        fgLayerNames: [],
        mgLayerNames: [
            'deepWaterback', 'backgroundHigh', 'backgroundMedium', 'backgroundLow',
            'wallDecorations', 'torches', 'ground',
        ],
    };
}

allWorlds[WORLD_CASTLE_DRY] = {
    initialEvent: 'nothing',
    events: {
        nothing: nothing(1000, 'easyRoaches'),
        easyRoaches: easyRoaches('powerup'),
        powerup: powerup(['shieldMonks']),
        normalRoaches: normalRoaches(0, 'shieldMonks'),
        shieldMonks: singleEnemy(ENEMY_SHIELD_MONK, 2000, ['shieldMonks', 'grasshopper', 'normalRoaches', 'hornet']),
        hornet: singleEnemy(ENEMY_HORNET_KNIGHT, 2000, 'normalRoaches'),
        grasshopper: singleEnemy(ENEMY_GRASSHOPPER, 2000, ['shieldMonks', 'grasshopper', 'normalRoaches', 'hornet']),
        explodingBeetle: explodingBeetle('normalRoaches'),
        bossPowerup: bossPowerup(CHECK_POINT_CASTLE_END, transitionToCastleBoss),
    },
    advanceWorld(state) {
        if (state.world.deepWater.sprites.length) {
            const hitbox = getHeroHitbox(state.players[0]);
            // Add/pop the bubble depending on whether the player is under the water still.
            if (hitbox.top > state.world.deepWater.sprites[0].top) {
                if (!state.enemies.filter(e => !e.dead && e.type === ENEMY_BUBBLE_SHIELD).length) {
                    state = addEnemyToState(state, createEnemy(state, ENEMY_BUBBLE_SHIELD, {left: -200}));
                }
            } else {
                state.enemies.filter(e => !e.dead && e.type === ENEMY_BUBBLE_SHIELD).forEach(enemy => {
                    state = damageEnemy(state, enemy.id, {damage: 1});
                });
            }
        }

        let world = state.world;
        if (world.type === WORLD_CASTLE_DRY && world.time >= CASTLE_DURATION && world.event !== 'bossPowerup') {
            return setEvent(state, 'bossPowerup');
        }
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 6;
        const targetX = Math.max(world.targetX, world.x + 1000);
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetFrames, time};
        state = {...state, world};
        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    }
};

const groundStartLoop = createAnimation('gfx/scene/castle/groundend.png', r(200, 60));
const groundLoop = createAnimation('gfx/scene/castle/groundloop.png', r(200, 60));
const backLoop = createAnimation('gfx/scene/castle/backloop.png', r(40, 40));
const bubbles1Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120));
const bubbles2Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 1});
const bubblesAnimations = [bubbles1Animation, bubbles2Animation];
const seaweedAnimation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {cols: 2, x: 2, duration: 24});
const fishAnimation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 4});
const deepWaterAnimation = createAnimation('gfx/scene/ocean/under.png', r(400, 300), {top: 600});

const torch = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {rows: 4});
const torchHolder = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 4});
const banner1 = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 6});
const banner2 = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 7});
const bigBanner1 = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 5});
const bigBanner2 = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 8});

function getCastleLayers() {
    return {
    deepWaterback: getNewLayer({
        backgroundColor: 'blue',
        xFactor: 0, yFactor: 1, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: deepWaterAnimation, scale: 2, alpha: 0.5},
        },
    }),
    deepWater: getNewLayer({
        xFactor: 0, yFactor: 1, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: deepWaterAnimation, scale: 2, alpha: 0.5},
        },
    }),
    backgroundLow: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -120, xOffset: -120,
        spriteData: {
            ground: {animation: backLoop, scale: 4},
        },
    }),
    backgroundMedium: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -275, xOffset: -30,
        spriteData: {
            ground: {animation: backLoop, scale: 4},
        },
    }),
    backgroundHigh: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -430, xOffset: -80,
        spriteData: {
            ground: {animation: backLoop, scale: 4},
        },
    }),
    torches: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -200, xOffset: 2 * WIDTH, firstElements: ['torchHolder'],
        spriteData: {
            torchHolder: {animation: torchHolder, scale: 2, offset: [-20], next: 'torch'},
            torch: {animation: torch, scale: 2, offset: [50, 120], next: 'torchHolder'},
        },
    }),
    torchHolders: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -200, firstElements: ['torchHolder'],
        spriteData: {
            torchHolder: {animation: torchHolder, scale: 2, offset: [50, 120], next: 'torchHolder'},
        },
    }),
    wallDecorations: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -300,
        spriteData: {
            banners: {animation: [banner1, banner2, bigBanner2, bigBanner1], scale: 3, offset: [50, 70]},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0, firstElements: ['ground'],
        spriteData: {
            groundStart: {animation: groundStartLoop, scale: 2, next: 'ground'},
            ground: {animation: groundLoop, scale: 2, next: 'ground'},
        },
    }),
    midStuff: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -800,
        spriteData: {
            bubbles: { animation: bubblesAnimations, vy: -1, scale: 2, offset: [100, 150], yOffset: [0, 100, 200] },
            fish: { animation: fishAnimation, scale: 2, vx: -2, offset: [100, 150], yOffset: [50, 150, 250] },
        },
    }),
    groundStuff: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -56,
        spriteData: {
            seaweed: { animation: seaweedAnimation, scale: 2, offset: [-10, 100, 150], yOffset: [-1, 2, 4] },
            bubbles: { animation: bubblesAnimations, vy: -1, scale: 2, offset: [100, 150], yOffset: [0, -100, -200] },
            fish: { animation: fishAnimation, scale: 2, vx: -1, offset: [100, 150], yOffset: [50, 150, 250] },
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: [
        'deepWaterback', 'backgroundHigh', 'backgroundMedium', 'backgroundLow',
        'wallDecorations', 'torchHolders',
        'ground', 'midStuff', 'groundStuff'
    ],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: ['deepWater'],
    };
}

