const random = require('random');

const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    LOOT_COIN, LOOT_TRIPLE_COMBO,
} = require('gameConstants');

const WORLD_STARS_1 = 'stars1';

const advanceWorld = (state) => {
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
        const type = (multiplier >= 3) ? LOOT_TRIPLE_COMBO : random.element(ladybugTypes);
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

const { allWorlds } = require('world');
allWorlds[WORLD_STARS_1] = { advanceWorld };

const CHECK_POINT_STARS_1 = 'stars1';

module.exports = {
    CHECK_POINT_STARS_1
};

const { checkpoints, applyCheckpointToState } = require('world');

checkpoints[CHECK_POINT_STARS_1] = function (state) {
    const world = getStarWorld(WORLD_STARS_1);
    world.returnPoint = CHECK_POINT_FIELD_START;
    return updatePlayer({...state, world}, 0, {comboScore: 0});
};

const { getStarWorld, starWorldTransition } = require('areas/stars');
const { CHECK_POINT_FIELD_START } = require('areas/field');

const { LOOT_HELMET, createLoot, addLootToState, getComboMultiplier, ladybugTypes} = require('loot');

const { updatePlayer } = require('heroes');
