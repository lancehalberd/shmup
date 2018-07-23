
const {
    TEST_ENEMY, FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
} = require('gameConstants');
const random = require('random');
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { getGroundHeight, getNewLayer, allWorlds, checkpoints, setCheckpoint, updateLayerSprite } = require('world');
const { ENEMY_HORNET, ENEMY_HORNET_SOLDIER } = require('enemies/hornets');

const plainsBg = createAnimation('gfx/scene/field/plainsbg.png', r(800, 800));
const groundAnimation = createAnimation('gfx/scene/field/groundloop.png', r(200, 60));
const townAnimation = createAnimation('gfx/scene/field/town.png', r(300, 300));
const dandyHitBox = r(36, 36, {left: 7});
const dandyRectangle = r(80, 98, {hitBox: dandyHitBox});
const dandyAAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, {cols: 2, duration: 30});
const dandyAPoofAnimation = createAnimation('gfx/scene/field/dandya.png', dandyRectangle, {cols: 6, duration: 8}, {loop: false});
const dandyBAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, {x: 2, cols: 2, duration: 30});
const dandyBPoofAnimation = createAnimation('gfx/scene/field/dandyb.png', dandyRectangle, {cols: 6, duration: 8}, {loop: false});
const dandyCAnimation = createAnimation('gfx/scene/field/dandyidleabc.png', dandyRectangle, {x: 4, cols: 2, duration: 30});
const dandyCPoofAnimation = createAnimation('gfx/scene/field/dandyc.png', dandyRectangle, {cols: 6, duration: 8}, {loop: false});
const grassTuft = createAnimation('gfx/scene/field/tuft.png', r(92, 64), {cols: 3, duration: 30, frameMap:[0, 2, 1, 2]});
const grassAnimation = createAnimation('gfx/scene/field/plainsfg1.png', r(200, 100));
const grass2Animation = createAnimation('gfx/scene/field/plainsfg4.png', r(110, 51));
const grass3Animation = createAnimation('gfx/scene/field/plainsfg5.png', r(122, 52));
const smallCloverAnimation = createAnimation('gfx/scene/field/plainsfg6.png', r(69, 38));
const leavesAnimation = createAnimation('gfx/scene/field/plainsfg2.png', r(200, 100));
const berriesAnimation = createAnimation('gfx/scene/field/plainsfg3.png', r(200, 100));
const wheatAnimation = createAnimation('gfx/scene/field/plainsmg1.png', r(200, 100));
const thickGrass = createAnimation('gfx/scene/field/plainsmg.png', r(300, 300));
const darkGrass = createAnimation('gfx/scene/field/plainsmg2.png', r(300, 300));
// const lightGrass = createAnimation('gfx/scene/field/plainsmg3.png', r(300, 300));

const WORLD_FIELD = 'field';

const spawnEnemy = (state, enemyType, props) => {
    const newEnemy = createEnemy(enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    newEnemy.vx = newEnemy.vx || (newEnemy.stationary || newEnemy.hanging ? 0 : -5);
    return addEnemyToState(state, newEnemy);
};


const formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];

const setEvent = (state, event) => {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return {...state, world: {...state.world, eventTime: -FRAME_LENGTH, event}};
};
const FIELD_DURATION = 120000;
const FIELD_EASY_DURATION = 30000;

// Add check points for:
const CHECK_POINT_FIELD_START = 'fieldStart';
const CHECK_POINT_FIELD_MIDDLE = 'fieldMiddle';
const CHECK_POINT_FIELD_END = 'fieldEnd';
const CHECK_POINT_FIELD_BOSS = 'fieldBoss';
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
// start of level 'nothing' getFieldWorldStart
// sky 40 seconds 'nothing' getFieldWorld
// groud before boss ~100 seconds 'nothing' getFieldWorld
allWorlds[WORLD_FIELD] = {
    initialEvent: 'nothing',
    events: {
        nothing: (state, eventTime) => {
            if (eventTime === 1000) {
                if (state.players[0].powerups.length) {
                    return setEvent(state, 'flies');
                }
                return setEvent(state, 'easyFlies');
            }
        },
        easyFlies: (state, eventTime) => {
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, 'powerup');
            }
        },
        powerup: (state, eventTime) => {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_CARGO_BEETLE, {left: WIDTH, top: GAME_HEIGHT / 2});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'flies');
            }
        },
        flies: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 4 - numFormidable;
            let spacing = state.world.time < FIELD_EASY_DURATION ? 2000 : 1000;
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                for (let i = 0; i < baseNumber; i++) {
                    state = spawnEnemy(state, ENEMY_FLY, {left: WIDTH + i * 80, top});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                let top = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                for (let i = 0; i < baseNumber; i++) {
                    state = spawnEnemy(state, ENEMY_FLY, {left: WIDTH + i * 80, top});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                const mode = random.range(0, 1);
                for (let i = 0; i < 2 * baseNumber; i++) {
                    let top = [GAME_HEIGHT / 6 + i * 30, 5 * GAME_HEIGHT / 6 - i * 30][mode];
                    state = spawnEnemy(state, ENEMY_FLY, {left: WIDTH + i * 80, top });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flyingAnts', 'monks']));
            }
        },
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
                return setEvent(state, random.element(['flyingAnts']));
            }
        },
        flyingAnts: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 2 - numFormidable;
            let spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber - 1; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber; i++) {
                    const enemyType = random.element([ENEMY_FLYING_ANT]);
                    state = spawnEnemy(state, enemyType, {left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['hornet', 'locust']));
            }
        },
        hornet: (state, eventTime) => {
            let numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable === 0) {
                const enemyType = (state.world.time >= 0.5 * FIELD_DURATION) ? ENEMY_HORNET_SOLDIER : ENEMY_HORNET;
                state = spawnEnemy(state, enemyType, {left: WIDTH + 10, top: random.element([GAME_HEIGHT / 3, 2 * GAME_HEIGHT / 3])});
                return state;
            }
            let spacing = state.world.time < FIELD_EASY_DURATION ? 4000 : 2000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flies', 'monks']));
            }
        },
        locust: (state, eventTime) => {
            let numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable <= 1) {
                const enemyType = (state.world.time >= 0.5 * FIELD_DURATION) ? ENEMY_LOCUST_SOLDIER : ENEMY_LOCUST;
                state = spawnEnemy(state, enemyType, {left: WIDTH + 10, top: GAME_HEIGHT / 3 + Math.random() * GAME_HEIGHT / 3 });
                return state;
            }
            let spacing = state.world.time < FIELD_EASY_DURATION ? 2000 : 1000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['locust', 'flies', 'monks']));
            }
        },
        bossPrep: (state) => {
            if (state.enemies.length === 0) {
                state = setCheckpoint(state, CHECK_POINT_FIELD_END);
                return transitionToFieldBoss(state);
            }
        },
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
        else if (world.time > 60000 && world.time < 80000) targetY = -100;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        // After 120 seconds, stop spawning enemies, and transition to the boss once all enemies are
        // defeated.
        if (world.type === WORLD_FIELD && world.time >= FIELD_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === 40000) state = setCheckpoint(state, CHECK_POINT_FIELD_MIDDLE);
        if (TEST_ENEMY) {
            if (!state.enemies.length) {
                state = spawnEnemy(state, TEST_ENEMY, {left: WIDTH, top: random.range(100, 700)});
            }
            return state;
        }
        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;

        // This was the original random enemy spawning code for the game.
        /*
        let {enemyCooldown} = state;
        const spawnDuration = Math.min(2500, 100 + time / 20 + state.players[0].score / 10);
        if (enemyCooldown > 0) {
            enemyCooldown--;
        } else if (time % 5000 < spawnDuration - 800 * numFormidable) {
            let newEnemyType = ENEMY_FLY;
            if (time > 15000 && Math.random() < 1 / 6) {
                newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
            } else if (time > 10000 && Math.random() < 1 / 3) {
                newEnemyType = ENEMY_FLYING_ANT;
            } else if (time > 20000 && Math.random() > Math.max(.9, 1 - .1 * state.players[0].score / 3000)) {
                newEnemyType = random.element(formidableEnemies);
            } else if (getGroundHeight(state) < GAME_HEIGHT && Math.random() < 1 / 10) {
                newEnemyType = ENEMY_MONK;
            }
            const newEnemy = createEnemy(newEnemyType, {
                left: WIDTH + 10,
                top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(time / (1000 - spawnDuration / 5))),
            });
            newEnemy.vx = newEnemy.vx || -6 + 3 * (time % 5000) / spawnDuration;
            newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
            state = addEnemyToState(state, newEnemy);
            switch (newEnemy.type) {
                case ENEMY_HORNET:
                    enemyCooldown = 3 * ENEMY_COOLDOWN;
                    break;
                case ENEMY_FLYING_ANT_SOLDIER:
                    enemyCooldown = 2 * ENEMY_COOLDOWN;
                    break;
                default:
                    enemyCooldown = ENEMY_COOLDOWN;
                    break;
            }
        }
        return {...state, enemyCooldown};
        */

    },
};

const getFieldWorld = () => ({
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
});

const getFieldLayers = () => ({
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
});

const getFieldWorldStart = () => {
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
};

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

module.exports = {
    getFieldWorld, getFieldWorldStart,
    CHECK_POINT_FIELD_START, CHECK_POINT_FIELD_MIDDLE, CHECK_POINT_FIELD_END,
};

const { createEnemy, addEnemyToState } = require('enemies');
const { transitionToFieldBoss } = require('areas/fieldBoss');

