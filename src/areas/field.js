
const {
    TEST_ENEMY, FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    LOOT_LIFE,
} = require('gameConstants');
const random = require('random');
const { PRIORITY_TITLE, createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { getNewLayer, allWorlds, checkpoints, setCheckpoint, updateLayerSprite, setEvent } = require('world');
const { ENEMY_HORNET, ENEMY_HORNET_SOLDIER } = require('enemies/hornets');
const { ENEMY_CARGO_BEETLE } = require('enemies/beetles');

const WORLD_FIELD = 'field';
const FIELD_DURATION = 120000;
const FIELD_EASY_DURATION = 30000;
const CHECK_POINT_FIELD_START = 'fieldStart';
const CHECK_POINT_FIELD_MIDDLE = 'fieldMiddle';
const CHECK_POINT_FIELD_END = 'fieldEnd';
const CHECK_POINT_FIELD_BOSS = 'fieldBoss';
module.exports = {
    getFieldWorld, getFieldWorldStart,
    CHECK_POINT_FIELD_START, CHECK_POINT_FIELD_MIDDLE, CHECK_POINT_FIELD_END,
};

const { spawnEnemy, enemyData } = require('enemies');
const { transitionToFieldBoss } = require('areas/fieldBoss');
const { enterStarWorld } = require('areas/stars');
const { CHECK_POINT_STARS_1 } = require('areas/stars1');
const { LOOT_HELMET } = require('loot');

const plainsBg = createAnimation('gfx/scene/field/plainsbg.png', r(800, 800), {priority: PRIORITY_TITLE});
const groundAnimation = createAnimation('gfx/scene/field/groundloop.png', r(200, 60), {priority: PRIORITY_TITLE});
const townAnimation = createAnimation('gfx/scene/field/town.png', r(300, 300), {priority: PRIORITY_TITLE});
const dandyHitbox = r(36, 36, {left: 7});
const dandyRectangle = r(80, 98, {hitbox: dandyHitbox});
const dandyAAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, {cols: 2, duration: 30, priority: PRIORITY_TITLE});
const dandyAPoofAnimation = createAnimation('gfx/scene/field/dandya.png', dandyRectangle, {cols: 6, duration: 8, priority: PRIORITY_TITLE}, {loop: false});
const dandyBAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, {x: 2, cols: 2, duration: 30, priority: PRIORITY_TITLE});
const dandyBPoofAnimation = createAnimation('gfx/scene/field/dandyb.png', dandyRectangle, {cols: 6, duration: 8, priority: PRIORITY_TITLE}, {loop: false});
const dandyCAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, {x: 4, cols: 2, duration: 30, priority: PRIORITY_TITLE});
const dandyCPoofAnimation = createAnimation('gfx/scene/field/dandyc.png', dandyRectangle, {cols: 6, duration: 8, priority: PRIORITY_TITLE}, {loop: false});
const grassTuft = createAnimation('gfx/scene/field/tuft.png', r(92, 64), {cols: 3, duration: 30, frameMap:[0, 2, 1, 2], priority: PRIORITY_TITLE});
const grassAnimation = createAnimation('gfx/scene/field/plainsfg1.png', r(200, 100), {priority: PRIORITY_TITLE});
const grass2Animation = createAnimation('gfx/scene/field/plainsfg4.png', r(110, 51), {priority: PRIORITY_TITLE});
const grass3Animation = createAnimation('gfx/scene/field/plainsfg5.png', r(122, 52), {priority: PRIORITY_TITLE});
const smallCloverAnimation = createAnimation('gfx/scene/field/plainsfg6.png', r(69, 38), {priority: PRIORITY_TITLE});
const leavesAnimation = createAnimation('gfx/scene/field/plainsfg2.png', r(200, 100), {priority: PRIORITY_TITLE});
const berriesAnimation = createAnimation('gfx/scene/field/plainsfg3.png', r(200, 100), {priority: PRIORITY_TITLE});
const wheatAnimation = createAnimation('gfx/scene/field/plainsmg1.png', r(200, 100), {priority: PRIORITY_TITLE});
const thickGrass = createAnimation('gfx/scene/field/plainsmg.png', r(300, 300), {priority: PRIORITY_TITLE});
const darkGrass = createAnimation('gfx/scene/field/plainsmg2.png', r(300, 300), {priority: PRIORITY_TITLE});
// const lightGrass = createAnimation('gfx/scene/field/plainsmg3.png', r(300, 300));

checkpoints[CHECK_POINT_FIELD_START] = function (state) {
    const world = getFieldWorldStart();
    return {...state, world};
};
checkpoints[CHECK_POINT_FIELD_MIDDLE] = function (state) {
    const world = getFieldWorld();
    // Start the midpoint in the sky so it is visually distinct from other check points.
    world.time = 40000;
    world.y = 390;
    return {...state, world};
};
checkpoints[CHECK_POINT_FIELD_END] = function (state) {
    const world = getFieldWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_FIELD_BOSS] = function (state) {
    const world = getFieldWorld();
    world.time = 120000;
    return transitionToFieldBoss({...state, world});
};

const {
    nothing, easyFlies, normalFlies, powerup,
    explodingBeetle, lightningBeetle,
    bossPowerup,
    singleEnemy, singleEasyHardEnemy,
} = require('enemyPatterns');
// start of level 'nothing' getFieldWorldStart
// sky 40 seconds 'nothing' getFieldWorld
// groud before boss ~100 seconds 'nothing' getFieldWorld
allWorlds[WORLD_FIELD] = {
    initialEvent: 'nothing',
    isPortalAvailable(state) {
        return !state.players[0].relics[LOOT_HELMET];
    },
    enterStarWorld(state) {
        return enterStarWorld(state, CHECK_POINT_STARS_1, CHECK_POINT_FIELD_END);
    },
    events: {
        nothing: nothing(1000, 'easyFlies'),
        easyFlies: easyFlies('powerup'),
        powerup: powerup('flies'),
        flies: normalFlies(FIELD_EASY_DURATION, ['flyingAnts', 'monks']),
        monks: (state, eventTime) => {
            let spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                let left = WIDTH;
                for (let i = 0; i < random.range(1, 2); i++) {
                    state = spawnEnemy(state, ENEMY_MONK, {left, top : GAME_HEIGHT});
                    left += random.range(100, 200);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, 'flyingAnts');
            }
        },
        flyingAnts: (state, eventTime) => {
            let spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                for (let i = 0; i < 1; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing
            if (eventTime === 0) {
                for (let i = 0; i < 2; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, ['hornet', 'locust']);
            }
        },
        locust: singleEasyHardEnemy(ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER, FIELD_DURATION / 2, 1500, ['locust', 'flies', 'monks']),
        hornet: singleEasyHardEnemy(ENEMY_HORNET, ENEMY_HORNET_SOLDIER, FIELD_DURATION / 2, 3000, ['flies', 'monks']),
        bossPowerup: bossPowerup(CHECK_POINT_FIELD_END, transitionToFieldBoss),
    },
    advanceWorld: (state) => {
        // return transitionToFieldBoss(state);
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 5;
        const targetX = world.x + 1000;
        let targetY = world.y;
        // 30-45s raise into the sky, stay until 60s, then lower back to the ground.
        if (world.time > 30000 && world.time < 45000) targetY = 400
        else if (world.time > 60000 && world.time < 80000) targetY = 0;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        // After 120 seconds, stop spawning enemies, and transition to the boss once all enemies are
        // defeated.
        if (world.type === WORLD_FIELD && world.time >= FIELD_DURATION && world.event !== 'bossPowerup') {
            return setEvent(state, 'bossPowerup');
        }
        if (world.time === 40000) state = setCheckpoint(state, CHECK_POINT_FIELD_MIDDLE);
        if (TEST_ENEMY) {
            if (!state.enemies.length) {
                const left = enemyData[TEST_ENEMY].props.left || WIDTH;
                const top = enemyData[TEST_ENEMY].props.top || random.range(100, 400);
                state = spawnEnemy(state, TEST_ENEMY, {left, top});
            }
            return state;
        }
        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

function getFieldWorld() {
    return {
    type: WORLD_FIELD,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/field.mp3',
    groundHeight: 30,
    ...getFieldLayers(),
    };
}

function getFieldLayers() {
    return {
    background: getNewLayer({
        xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
        animation: plainsBg,
    }),
    wheat: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -50,
        spriteData: {
            wheatBunch: {animation: wheatAnimation, scale: 4, next: ['wheatCouple'], offset: [-140, -120]},
            wheatCouple: {animation: wheatAnimation, scale: 5, next: ['wheat'], offset: [-100, -80]},
            wheat: {animation: wheatAnimation, scale: 4, next: ['wheatBunch'], offset: [-40, 400]},
        },
    }),
    darkGrass: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -50,
        spriteData: {
            darkGrass: {animation: darkGrass, scale: 1.75, next: ['darkGrass'], offset: [-40, -20]},
        },
    }),
    thickGrass: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -30,
        spriteData: {
            thickGrass: {animation: thickGrass, scale: 1.75, next: ['thickGrass'], offset: [-40, -20]},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: 0,
        spriteData: {
            ground: {animation: groundAnimation, scale: 1, next: ['ground'], offset: 0},
        },
    }),
    nearground: {...getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: -40,
            spriteData: {
                dandyBunch: {animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'dandyPair'], offset: [-40, -35], yOffset: [-8, -5]},
                dandyPair: {animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['dandyC'], offset: [-50, -45], yOffset: [0, 2]},
                dandyA: {animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'leaves', 'grassOrBerries'], offset: 80},
                dandyB: {animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['leaves'], offset: -20, yOffset: [-3, 1]},
                dandyC: {animation: dandyCAnimation, onHit: onHitDandy, scale: 2, next: ['dandyA', 'leaves', 'grassOrBerries'], offset: 100, yOffset: [3, 5]},
                leaves: {animation: [leavesAnimation, smallCloverAnimation], scale: 2, next: ['dandyA', 'dandyBunch', 'leaves', 'grassOrBerries'], offset: -20},
                grassOrBerries: {animation: [grassAnimation, grass2Animation, grass3Animation, berriesAnimation], scale: 2, next: ['grassOrBerries', 'dandyB', 'dandyPair', 'leaves'], offset: 0},
            },
        }),
    },
    foreground: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: -5,
        spriteData: {
            grass: {animation: grassTuft, onContact: speedupAnimation, scale: 1.5, next: ['grass'], offset: [-10, 400, 550, 610]},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: ['background',],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['wheat', 'darkGrass', 'thickGrass', 'ground', 'nearground'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: ['foreground'],
    };
}

function getFieldWorldStart() {
    let world = getFieldWorld();
    world.nearground.sprites = [getNewSpriteState({
        ...townAnimation.frames[0],
        top: 263,
        left: 0,
        offset: 50,
        animation: townAnimation,
        next: ['grassOrBerries'],
    })];
    return world;
}

const onHitDandy = (state, layerName, spriteIndex) => {
    let world = state.world;
    let layer = world[layerName];
    let sprites = [...layer.sprites];
    const sprite = sprites[spriteIndex];
    let newAnimation = dandyAPoofAnimation;
    if (sprite.animation === dandyBAnimation) {
        newAnimation = dandyBPoofAnimation;
    } else if (sprite.animation === dandyCAnimation) {
        newAnimation = dandyCPoofAnimation;
    }
    sprites[spriteIndex] = {...sprite, animation: newAnimation, onHit: null, animationTime: FRAME_LENGTH * newAnimation.frameDuration};
    layer = {...layer, sprites};
    world = {...world, [layerName]: layer};
    return {...state, world};
};

function speedupAnimation(state, layerName, spriteIndex) {
    const sprite = state.world[layerName].sprites[spriteIndex];
    return updateLayerSprite(state, layerName, spriteIndex, {animationTime: sprite.animationTime + 2 * FRAME_LENGTH});
}


