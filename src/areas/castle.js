const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_BULLET, ENEMY_MONK,
} = require('gameConstants');
const { ENEMY_HORNET, ENEMY_HORNET_KNIGHT } = require('enemies/hornets');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const {
    getNewLayer, allWorlds, updateLayerSprite,
    checkpoints, setCheckpoint, setEvent, advanceWorld,
} = require('world');

const WORLD_CASTLE = 'castle';
const CHECK_POINT_CASTLE_START = 'castleStart';
const CHECK_POINT_CASTLE_END = 'castleEnd'
const CHECK_POINT_CASTLE_BOSS = 'castleBoss'
const CASTLE_START_TIME = 40000;
const CASTLE_DURATION = 120000;

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
} = require('enemies');
const { transitionToCastleBoss } = require('areas/castleBoss');
const {
    addEnemyAttackToState, createAttack,
} = require('attacks');

const { ENEMY_SHELL_MONK, ENEMY_SHORT_SAND_TURRET, ENEMY_TALL_SAND_TURRET } = require('areas/beach');
const { ENEMY_BUBBLE_SHIELD } = require('areas/beachBoss');
const { ENEMY_PIRANHA, ENEMY_SEA_URCHIN } = require('areas/ocean');

checkpoints[CHECK_POINT_CASTLE_START] = function (state) {
    const world = getCastleWorld();
    world.time = CASTLE_START_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_CASTLE_END] = function (state) {
    const world = getCastleWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return advanceWorld(advanceWorld({...state, world}));
};
checkpoints[CHECK_POINT_CASTLE_BOSS] = function (state) {
    const world = getCastleWorld();
    world.time = 120000;
    // Advance world once to add background, and a second time to position it.
    state = advanceWorld(state);
    return transitionToCastleBoss(advanceWorld(state));
};

const {
    nothing, easyFlies, normalFlies, powerup,
    bossPowerup,
    singleEnemy, singleEasyHardEnemy,
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
        bossPowerup: bossPowerup(CHECK_POINT_CASTLE_END, transitionToCastleBoss),
    },
    advanceWorld(state) {
        state = this.floatEnemies(state);
        if (!state.enemies.filter(e => !e.dead && e.type === ENEMY_BUBBLE_SHIELD).length) {
            state = addEnemyToState(state, createEnemy(state, ENEMY_BUBBLE_SHIELD, {left: -200}));
        }
        let world = state.world;
        if (world.type === WORLD_CASTLE && world.time >= CASTLE_DURATION && world.event !== 'bossPowerup') {
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
    },
    // Scroll the deep water up at the beginning of the level.
    updateWater(state) {
        let water = state.world.deepWater.sprites[0];
        if (!water) return state;
        const start = 0, end = GAME_HEIGHT - water.height;
        const top = Math.max(end, start - state.world.time / 50);
        return updateLayerSprite(state, 'sunrise', 0, {left: 0, top});
    },
    floatEnemies(state) {
        for (const enemy of state.enemies) {
            if (!enemy.dead || enemy.grounded) continue;
            state = updateEnemy(state, enemy, {vx: enemy.vx * 0.99, vy: enemy.vy * 0.85 - 1.2 });
        }
        return state;
    }
};

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

const groundStartLoop = createAnimation('gfx/scene/castle/groundend.png', r(200, 60));
const groundLoop = createAnimation('gfx/scene/castle/groundloop.png', r(200, 60));
const backLoop = createAnimation('gfx/scene/castle/backloop.png', r(40, 40));
const bubbles1Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120));
const bubbles2Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 1});
const bubblesAnimations = [bubbles1Animation, bubbles2Animation];
const seaweedAnimation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {cols: 2, x: 2, duration: 24});
const fishAnimation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 4});
const deepWaterAnimation = createAnimation('gfx/scene/ocean/under.png', r(400, 900));

function getCastleLayers() {
    return {
    deepWaterback: getNewLayer({
        xFactor: 0, yFactor: 1, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: deepWaterAnimation, scale: 2},
        },
    }),
    deepWater: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: deepWaterAnimation, scale: 2, alpha: 0.5},
        },
    }),
    backgroundLow: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -120, xOffset: 160,
        spriteData: {
            ground: {animation: backLoop, scale: 4},
        },
    }),
    backgroundMedium: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -275, xOffset: 250,
        spriteData: {
            ground: {animation: backLoop, scale: 4},
        },
    }),
    backgroundHigh: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -430, xOffset: 200,
        spriteData: {
            ground: {animation: backLoop, scale: 4},
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
    mgLayerNames: ['deepWaterback', 'backgroundHigh', 'backgroundMedium', 'backgroundLow', 'ground', 'midStuff', 'groundStuff'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: ['deepWater'],
    };
}

// gfx/enemies/piranha.png r(140, 120) swim* 2, dead, teeth overlay, rider overlay, dead rider.
// maybe show the teether while striking forward.
// perhaps swim on screen, pause, then burst forward with teeth bared.


