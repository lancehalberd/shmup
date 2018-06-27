const random = require('random');

const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    LOOT_COIN, LOOT_HELMET, LOOT_COMBO,
} = require('gameConstants');
const { createAnimation, r } = require('animations');
const { getNewLayer, allWorlds } = require('world');

const WORLD_STARS = 'stars';

const stars1 = createAnimation('gfx/scene/portal/portal1.png', r(200, 200));
// TODO: Ask Jon to fix black in this image and add it back.
// const stars2 = createAnimation('gfx/scene/portal/portal2.png', r(200, 200));
const stars3 = createAnimation('gfx/scene/portal/portal3.png', r(200, 200));

const advanceStarWorld = (state) => {
    let world = state.world;
    const multiplier = getComboMultiplier(state, 0);
    const targetFrames = 170 - 30 * (multiplier - 1);
    const targetX = world.x + 1000;
    let time = world.time + FRAME_LENGTH;
    world = {...world, targetX, time, targetFrames};
    state = {...state, world};

    const addBonusCoin = (left, top) => {
        const loot = createLoot(LOOT_COIN, {left, top, points: 0, comboPoints: 10, scale: 3});
        loot.top -= loot.height / 2;
        return addLootToState(state, loot);
    };
    time -= 2000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 200; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 2);
        }
    }
    time -= 2000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 400; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 4);
        }
    }
    time -= 2000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 600; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 2);
        }
    }
    time -= 2000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 800; left += 100) {
            state = addBonusCoin(left, 3 * GAME_HEIGHT / 4);
        }
    }

    time -= 5000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 1000; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 2);
        }
    }
    time -= 3000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 1000; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 6);
        }
    }
    time -= 3000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 1000; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 2);
        }
    }
    time -= 3000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 1000; left += 100) {
            state = addBonusCoin(left, 5 * GAME_HEIGHT / 6);
        }
    }
    time -= 3000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 1000; left += 100) {
            const top = GAME_HEIGHT * (.5 + .4 * Math.cos((left - WIDTH) / 1000 * 2 * Math.PI / 3));
            state = addBonusCoin(left, top);
        }
    }
    time -= 4000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 2000; left += 100) {
            const top = GAME_HEIGHT * (.5 - .4 * Math.cos((left - WIDTH) / 1000 * 2 * Math.PI / 2));
            state = addBonusCoin(left, top);
        }
    }
    time -= 4000;
    if (!time) {
        for (let left = WIDTH; left < WIDTH + 1000; left += 100) {
            state = addBonusCoin(left, GAME_HEIGHT / 6);
        }
    }
    time -= 2500;
    if (!time && multiplier >= 5) {
        const helmet = createLoot(LOOT_HELMET, {left: WIDTH * 2, top: GAME_HEIGHT - 100});
        helmet.top -= helmet.height / 2;
        state = addLootToState(state, helmet);
    }
    time -= 3000;
    if (!time) {
        const type = (multiplier >= 3) ? LOOT_COMBO : random.element(ladybugTypes);
        const loot = createLoot(type, {left: WIDTH, top: GAME_HEIGHT / 2, scale: 2});
        loot.top -= loot.height / 2;
        state = addLootToState(state, loot);
    }
    time -= 3000;
    if (!time) {
        state = updatePlayer(state, 0, {comboScore: 0});
        state = starWorldTransition(applyCheckpointToState(state, state.world.returnPoint));
    }
    return state;
};

allWorlds[WORLD_STARS] = {
    advanceWorld: advanceStarWorld,
};

const getStarWorld = () => ({
    type: WORLD_STARS,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/space.mp3',
    groundHeight: 30,
    background: getNewLayer({
        xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
        backgroundColor: '#000',
    }),
    midgroundTop: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: 0,
        spriteData: {
            stars: {animation: [stars1, stars3], scale: 2, next: ['stars'], offset: [0]},
        },
    }),
    midgroundBottom: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -400,
        spriteData: {
            stars: {animation: [stars1, stars3], scale: 2, next: ['stars'], offset: [20]},
        },
    }),
    bgLayerNames: ['background'],
    mgLayerNames: ['midgroundTop', 'midgroundBottom'],
    fgLayerNames: [],
});

const enterStarWorld = (state) => {
    return starWorldTransition(applyCheckpointToState(state, CHECK_POINT_FIELD_STARS_START));
};

const enterStarWorldEnd = (state) => {
    return starWorldTransition(applyCheckpointToState(state, CHECK_POINT_FIELD_STARS_END));
};

const starWorldTransition = (state) => {
    return {...state, world: {...state.world, transitionFrames: 100}};
};

const CHECK_POINT_FIELD_STARS_START = 'fieldStarsStart';
const CHECK_POINT_FIELD_STARS_END = 'fieldStarsEnd';

module.exports = {
    enterStarWorld, enterStarWorldEnd, starWorldTransition,
    CHECK_POINT_FIELD_STARS_START, CHECK_POINT_FIELD_STARS_END,
};


const { applyCheckpointToState, checkpoints } = require('world');

checkpoints[CHECK_POINT_FIELD_STARS_START] = function (state) {
    const world = getStarWorld();
    world.returnPoint = CHECK_POINT_FIELD_END;
    return updatePlayer({...state, world}, 0, {comboScore: 0});
};
checkpoints[CHECK_POINT_FIELD_STARS_END] = function (state) {
    const world = getStarWorld();
    world.time = 25000;
    world.returnPoint = CHECK_POINT_FIELD_START;
    return updatePlayer({...state, world}, 0, {comboScore: 700});
};



const { CHECK_POINT_FIELD_START, CHECK_POINT_FIELD_END } = require('areas/field');

const {createLoot, addLootToState, getComboMultiplier, ladybugTypes} = require('loot');

const { updatePlayer } = require('heroes');
