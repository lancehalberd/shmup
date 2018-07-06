const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
    EFFECT_EXPLOSION,
    ATTACK_SLASH, ATTACK_STAB,
} = require('gameConstants');
const { ENEMY_JUMPING_SPIDER } = require('enemies/spiders');
const random = require('random');
const { createAnimation, r } = require('animations');
const { getNewSpriteState, getTargetVector } = require('sprites');
const { getGroundHeight, getNewLayer, allWorlds, checkpoints, setCheckpoint } = require('world');
const { ENEMY_HORNET, ENEMY_HORNET_SOLDIER } = require('enemies/hornets');

const willowAnimation = createAnimation('gfx/scene/forest/willowsheet.png', r(200, 200), {cols: 6, duration: 30});

const spawnEnemy = (state, enemyType, props) => {
    const newEnemy = createEnemy(enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    newEnemy.vx = newEnemy.vx || (newEnemy.stationary || newEnemy.hanging ? 0 : -6);
    return addEnemyToState(state, newEnemy);
};

const spawnThorns = (state) => {
    //if (random.chance(0.5)) {
        return spawnEnemy(state, ENEMY_FLOOR_THORNS, {left: WIDTH + random.range(0, 100), top: GAME_HEIGHT});
    //} else {
    //    return spawnEnemy(state, ENEMY_FLOOR_THORNS, {left: WIDTH + random.range(0, 100), top: 300});
    //}
};

const setEvent = (state, event) => {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return {...state, world: {...state.world, eventTime: -FRAME_LENGTH, event}};
};

// Add check points for:
const THORN_HEIGHT = 40;
const CHECK_POINT_FOREST_LOWER_START = 'forestLowerStart';
const CHECK_POINT_FOREST_LOWER_MIDDLE = 'forestLowerMiddle';
const CHECK_POINT_FOREST_LOWER_MIDDLE_TIME = 40000;
const CHECK_POINT_FOREST_LOWER_END = 'forestLowerEnd'
const CHECK_POINT_FOREST_LOWER_BOSS = 'forestLowerBoss'
checkpoints[CHECK_POINT_FOREST_LOWER_START] = function (state) {
    const world = getForestLowerWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_FOREST_LOWER_MIDDLE] = function (state) {
    const world = getForestLowerWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_FOREST_LOWER_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_FOREST_LOWER_END] = function (state) {
    const world = getForestLowerWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_FOREST_LOWER_BOSS] = function (state) {
    const world = getForestLowerWorld();
    world.time = 120000;
    return {...state, world};
};
const formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];

const FOREST_LOWER_DURATION = 120000;
const FOREST_LOWER_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT - THORN_HEIGHT;

const WORLD_FOREST_LOWER = 'forestLower';
allWorlds[WORLD_FOREST_LOWER] = {
    initialEvent: 'nothing',

    events: {
        nothing: (state, eventTime) => {
            if (eventTime === 1000) {
                return setEvent(state, 'easyFlies');
            }
        },
        easyFlies: (state, eventTime) => {
            if (eventTime === 0) {
                state = spawnThorns(state);
                let top = THORN_HEIGHT + random.element([1,2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime === 0) {
                let top = THORN_HEIGHT + random.element([1,2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime === 0) {
                state = spawnThorns(state);
                let top = THORN_HEIGHT + random.element([1,2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, 'powerup');
            }
        },
        powerup: (state, eventTime) => {
            if (eventTime === 0) {
                state = spawnThorns(state);
                return spawnEnemy(state, ENEMY_CARGO_BEETLE, {left: WIDTH, top: THORN_HEIGHT + SAFE_HEIGHT / 2});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['explodingBeetle', 'hornet']));
            }
        },
        flyingAnts: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 2 - numFormidable;
            let spacing = state.world.time < FOREST_LOWER_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber - 1; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT_SOLDIER, {left: WIDTH + 10 + Math.random() * 30, top: THORN_HEIGHT + SAFE_HEIGHT / 4 + i * SAFE_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber; i++) {
                    const enemyType = random.element([ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER]);
                    state = spawnEnemy(state, enemyType, {left: WIDTH + 10 + Math.random() * 30, top: THORN_HEIGHT + SAFE_HEIGHT / 4 + i * SAFE_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['jumpingSpider']));
            }
        },
        explodingBeetle: (state, eventTime) => {
            if (eventTime === 0) {
                state = spawnThorns(state);
                let top = THORN_HEIGHT + random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_EXPLOSIVE_BEETLE, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'jumpingSpider');
            }
        },
        hornet: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable < 2) {
                state = spawnThorns(state);
                let top = THORN_HEIGHT + random.element([1, 2, 3]) * SAFE_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_HORNET, {left: WIDTH, top});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'flyingAnts');
            }
        },
        jumpingSpider: (state, eventTime) => {
            if (eventTime === 0) {
                state = spawnEnemy(state, ENEMY_JUMPING_SPIDER, {left: WIDTH + 10, top: THORN_HEIGHT + random.range(2, 5) * SAFE_HEIGHT / 6 });
                return state;
            }
            let spacing = 1000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['jumpingSpider', 'flyingAnts', 'hornet']));
            }
        },
        bossPrep: (state) => {
            if (state.enemies.length === 0) {
                state = setCheckpoint(state, CHECK_POINT_FOREST_LOWER_END);
                // return transitionToForestLowerBoss(state);
            }
        },
    },
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 5;
        const targetX = world.x + 1000;
        let targetY = world.y;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_FOREST_LOWER && world.time >= FOREST_LOWER_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === CHECK_POINT_FOREST_LOWER_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_FOREST_LOWER_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

const getForestLowerWorld = () => ({
    type: WORLD_FOREST_LOWER,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/river.mp3',
    groundHeight: 30,
    hazardCeilingHeight: THORN_HEIGHT,
    ...getForestLowerLayers(),
});

const thornloop = createAnimation('gfx/scene/forest/thornloop.png', r(200, 60));
const forestbackTop = createAnimation('gfx/scene/forest/back.png', r(800, 400), {y: 1});
const thickTrunk = createAnimation('gfx/scene/forest/forestmg3.png', r(100, 400));
const skinnyTrunk = createAnimation('gfx/scene/forest/forestmg5.png', r(100, 400));
const getForestLowerLayers = () => ({
    background: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: 0, maxY: 0,
        spriteData: {
            trees: {animation: forestbackTop, scale: 2},
        },
    }),
    trunks: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: 0,
        spriteData: {
            thickTrunk: {animation: thickTrunk, scale: 1.6, next: ['skinnyTrunk', 'thickTrunk'], offset: [200, 300, 350], yOffset: [0, 10, 20]},
            skinnyTrunk: {animation: skinnyTrunk, scale: 1.6, next: ['skinnyTrunk', 'thickTrunk'], offset: [70, 150, 250], yOffset: [0, 10, 20]},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: 0,
        spriteData: {
            ground: {animation: createAnimation('gfx/scene/field/groundloop.png', r(200, 60)), scale: 1, next: ['ground'], offset: 0},
        },
    }),
    thorns: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: -GAME_HEIGHT + THORN_HEIGHT,
        spriteData: {
            thorns: {animation: thornloop, scale: 2, next: ['thorns'], offset: 0},
        },
    }),
    largeTrunks: getNewLayer({
        xFactor: 1.5, yFactor: 1.5, yOffset: 200,
        spriteData: {
            thickTrunk: {animation: thickTrunk, scale: 3, next: ['skinnyTrunk', 'thickTrunk'], offset: [300, 500], yOffset: [0, 50, 100]},
            skinnyTrunk: {animation: skinnyTrunk, scale: 3, next: ['skinnyTrunk', 'thickTrunk'], offset: [300, 500], yOffset: [0, 50, 100]},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'trunks', 'ground', 'thorns'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: ['largeTrunks'],
});


module.exports = {
    CHECK_POINT_FOREST_LOWER_START,
    getForestLowerWorld,
};

const { createEnemy, addEnemyToState, enemyData, updateEnemy } = require('enemies');

const ENEMY_CEILING_THORNS = 'ceilingThorns';
const ceilingThornRectangle = r(200, 200, {hitBox: {left: 41, top: 0, width: 130, height: 150}});
enemyData[ENEMY_CEILING_THORNS] = {
    animation: createAnimation('gfx/scene/forest/thorn1.png', ceilingThornRectangle),
    deathAnimation: createAnimation('gfx/scene/forest/thorn3.png', r(200, 200)),
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {stationary: false});
    },
    props: {
        maxLife: 20,
        life: 20,
        score: 0,
        stationary: true,
        doNotFlip: true,
        weakness: {[ATTACK_SLASH]: 20, [ATTACK_STAB]: 20},
    },
};
const ENEMY_FLOOR_THORNS = 'floorThorns';
const floorThornsRectangle = r(200, 200, {hitBox: {left: 21, top: 125, width: 170, height: 75}});
enemyData[ENEMY_FLOOR_THORNS] = {
    ...enemyData[ENEMY_CEILING_THORNS],
    animation: createAnimation('gfx/scene/forest/thorn2.png', floorThornsRectangle),
};

// const { transitionToForestLowerBoss } = require('areas/forestLowerBoss');