const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_RED_LASER,
} = require('gameConstants');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const { getGroundHeight, getNewLayer, allWorlds, checkpoints, setCheckpoint } = require('world');
const { ENEMY_CARGO_BEETLE, ENEMY_LIGHTNING_BEETLE } = require('enemies/beetles');


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
const CHECK_POINT_OCEAN_START = 'oceanStart';
const CHECK_POINT_OCEAN_MIDDLE = 'oceanMiddle';
const CHECK_POINT_OCEAN_MIDDLE_TIME = 40000;
const CHECK_POINT_OCEAN_END = 'oceanEnd'
const CHECK_POINT_OCEAN_BOSS = 'oceanBoss'
checkpoints[CHECK_POINT_OCEAN_START] = function (state) {
    const world = getOceanWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_OCEAN_MIDDLE] = function (state) {
    const world = getOceanWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_OCEAN_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_OCEAN_END] = function (state) {
    const world = getOceanWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_OCEAN_BOSS] = function (state) {
    const world = getOceanWorld();
    world.time = 120000;
    return transitionToOceanBoss({...state, world});
};

const OCEAN_DURATION = 120000;
const OCEAN_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT;

const WORLD_OCEAN = 'ocean';
allWorlds[WORLD_OCEAN] = {
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
            let spacing = state.world.time < OCEAN_EASY_DURATION ? 3000 : 2000;
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
                state = setCheckpoint(state, CHECK_POINT_OCEAN_END);
                return transitionToOceanBoss(state);
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

        if (world.type === WORLD_OCEAN && world.time >= OCEAN_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === CHECK_POINT_OCEAN_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_OCEAN_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

const getOceanWorld = () => ({
    type: WORLD_OCEAN,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/title.mp3',
    ...getOceanLayers(),
});

const skyLoop = createAnimation('gfx/scene/sky/sky.png', r(400, 400));
const getOceanLayers = () => ({
    background: getNewLayer({
        xFactor: 0.1, yFactor: 0.5, yOffset: 0, maxY: 0,
        spriteData: {
            ocean: {animation: skyLoop, scale: 2},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
});

module.exports = {
    CHECK_POINT_OCEAN_START,
    WORLD_OCEAN,
    getOceanWorld,
};

const { updatePlayer } = require('heroes');
const { createEnemy, updateEnemy, addEnemyToState, enemyData, removeEnemy } = require('enemies');
const { transitionToOceanBoss } = require('areas/oceanBoss');

