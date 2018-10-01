const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_RED_LASER,
} = require('gameConstants');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const { getGroundHeight, getNewLayer, allWorlds, checkpoints, setCheckpoint } = require('world');
const { ENEMY_CARGO_BEETLE, ENEMY_LIGHTNING_BEETLE } = require('enemies/beetles');


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
const CHECK_POINT_BEACH_START = 'beachStart';
const CHECK_POINT_BEACH_MIDDLE = 'beachMiddle';
const CHECK_POINT_BEACH_MIDDLE_TIME = 40000;
const CHECK_POINT_BEACH_END = 'beachEnd'
const CHECK_POINT_BEACH_BOSS = 'beachBoss'
checkpoints[CHECK_POINT_BEACH_START] = function (state) {
    const world = getBeachWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_BEACH_MIDDLE] = function (state) {
    const world = getBeachWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_BEACH_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_BEACH_END] = function (state) {
    const world = getBeachWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_BEACH_BOSS] = function (state) {
    const world = getBeachWorld();
    world.time = 120000;
    return transitionToBeachBoss({...state, world});
};

const BEACH_DURATION = 120000;
const BEACH_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT;

const WORLD_BEACH = 'beach';
allWorlds[WORLD_BEACH] = {
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
            let spacing = state.world.time < BEACH_EASY_DURATION ? 3000 : 2000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['lightningBeetle', 'wrens']));
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
                state = setCheckpoint(state, CHECK_POINT_BEACH_END);
                return transitionToBeachBoss(state);
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

        if (world.type === WORLD_BEACH && world.time >= BEACH_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === CHECK_POINT_BEACH_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_BEACH_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

const getBeachWorld = () => ({
    type: WORLD_BEACH,
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
    ...getBeachLayers(),
});

const skyLoop = createAnimation('gfx/scene/beach/4Asky.png', r(400, 250));
const oceanLoop = createAnimation('gfx/scene/beach/4abacksheet.png', r(400, 150), {cols: 4, duration: 12, frameMap: [0, 0, 0, 1, 2, 3, 3, 3, 2, 1]});
const beachLoop = createAnimation('gfx/scene/beach/sandground.png', r(200, 60));
const rock1Animation = createAnimation('gfx/scene/beach/rock1.png', r(50, 50));
const rock2Animation = createAnimation('gfx/scene/beach/rock2.png', r(50, 50));
const shell1Animation = createAnimation('gfx/scene/beach/shell1.png', r(100, 100));
const shell2Animation = createAnimation('gfx/scene/beach/shell2.png', r(100, 100));
const getBeachLayers = () => ({
    background: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: -100, maxY: 0, xOffset: 400,
        spriteData: {
            sky: {animation: skyLoop, scale: 2},
        },
    }),
    ocean: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -50, maxY: 0, syncAnimations: true,
        spriteData: {
            ocean: {animation: oceanLoop, scale: 2},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0, maxY: 0,
        spriteData: {
            beach: {animation: beachLoop, scale: 2},
        },
    }),
    detritus: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -48,
        spriteData: {
            rock1: { animation: rock1Animation, scale: 2, next: ['rock2', 'shell2'], offset: [-10, 100, 150], yOffset: [-1, 2, 4] },
            rock2: { animation: rock2Animation, scale: 2, next: ['rock1', 'shell1'], offset: [90, 180], yOffset: [-1, 2, 4] },
            shell1: { animation: shell1Animation, scale: 1, next: ['shell2', 'rock1'], offset: [20, 120], yOffset: [-1, 2, 4] },
            shell2: { animation: shell2Animation, scale: 1, next: ['shell1', 'rock2'], offset: [100], yOffset: [-1, 2, 4] },
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'ocean', 'ground', 'detritus'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
});

module.exports = {
    CHECK_POINT_BEACH_START,
    WORLD_BEACH,
    getBeachWorld,
};

const { updatePlayer } = require('heroes');
const { createEnemy, updateEnemy, addEnemyToState, enemyData, removeEnemy, shoot_bulletAtPlayer } = require('enemies');

const shellMonkGeometry = r(100, 100);
const ENEMY_SHELL_MONK = 'shellMonk';
enemyData[ENEMY_SHELL_MONK] = {
    animation: createAnimation('gfx/enemies/monks/shellrobes.png', shellMonkGeometry, {x: 2}),
    deathAnimation: createAnimation('gfx/enemies/monks/shellrobes.png', shellMonkGeometry, {x: 2}),
    attackAnimation: createAnimation('gfx/enemies/monks/shellrobes.png', shellMonkGeometry, {cols: 2, frameMap: [1, 0, 0, 0, 1], duration: 12}),
    deathSound: 'sfx/robedeath1.mp3',
    isInvulnerable(state, enemy) {
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot: shoot_bulletAtPlayer,
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {ttl: 600});
    },
    props: {
        life: 6,
        score: 100,
        grounded: true,
        stationary: true,
        bulletSpeed: 5,
        attackCooldownFrames: 60,
        shotCooldownFrames: [80, 100],
        bulletX: 0.8,
        bulletY: 0.74,
        shootFrames: [33, 22, 14],
    },
};

const { transitionToBeachBoss } = require('areas/beachBoss');

