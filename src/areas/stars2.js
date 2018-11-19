const random = require('random');

const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    LOOT_COIN, LOOT_COMBO,
} = require('gameConstants');

const WORLD_STARS_2 = 'stars2';

const advanceWorld = (state) => {
    let world = state.world;
    const multiplier = getComboMultiplier(state, 0);
    const targetFrames = 170 - 30 * (multiplier - 1);
    const targetX = world.x + 1000;
    let time = world.time + FRAME_LENGTH;
    world = {...world, targetX, time, targetFrames};
    state = {...state, world};

    const addBonusCoin = ({left, top}) => {
        const loot = createLoot(LOOT_COIN, {left, top, points: 0, comboPoints: 10, scale: 3});
        loot.top -= loot.height / 2;
        state = addLootToState(state, loot);
    };
    const addBonusCoins = (number, getCoords) => {
        for (let i = 0; i < number; i++) addBonusCoin(getCoords(i));
    };
    time -= 2000;
    // 10
    if (!time) {
        addBonusCoins(5, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 + 50}));
        addBonusCoins(5, n => ({left: WIDTH + 500 + 100 * n, top: GAME_HEIGHT / 2 - 50}));
    }
    time -= 4000;
    // 20
    if (!time) {
        addBonusCoins(5, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 + 100}));
        addBonusCoins(5, n => ({left: WIDTH + 500 + 100 * n, top: GAME_HEIGHT / 2 - 100}));
    }
    time -= 4000;
    // 30
    if (!time) {
        addBonusCoins(5, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 + 150}));
        addBonusCoins(5, n => ({left: WIDTH + 500 + 100 * n, top: GAME_HEIGHT / 2 - 150}));
    }
    time -= 4000;
    // 70
    if (!time) {
        addBonusCoins(5, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 - 150}));
        addBonusCoins(5, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 + 150}));
        addBonusCoins(5, n => ({left: WIDTH + 500 + 100 * n, top: GAME_HEIGHT / 2 - 150 + 20 * n}));
        addBonusCoins(5, n => ({left: WIDTH + 500 + 100 * n, top: GAME_HEIGHT / 2 + 150 + 20 * n}));
        addBonusCoins(5, n => ({left: WIDTH + 1000 + 100 * n, top: GAME_HEIGHT / 2 - 50}));
        addBonusCoins(5, n => ({left: WIDTH + 1000 + 100 * n, top: GAME_HEIGHT / 2 + 250}));
        addBonusCoins(5, n => ({left: WIDTH + 1500 + 100 * n, top: GAME_HEIGHT / 2 - 50 - 40 * n}));
        addBonusCoins(5, n => ({left: WIDTH + 1500 + 100 * n, top: GAME_HEIGHT / 2 + 250 - 40 * n}));
    }

    time -= 5000;
    // 100
    if (!time) {
        addBonusCoins(15, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 - 50 - 12 * n}));
        addBonusCoins(15, n => ({left: WIDTH + 100 * n, top: GAME_HEIGHT / 2 + 50 + 12 * n}));
    }

    time -= 5000;
    if (!time && multiplier >= 5) {
        const helmet = createLoot(LOOT_GAUNTLET, {left: WIDTH * 2, top: GAME_HEIGHT - 100});
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

const { allWorlds } = require('world');
allWorlds[WORLD_STARS_2] = { advanceWorld };

const CHECK_POINT_STARS_2 = 'stars2';

module.exports = {
    CHECK_POINT_STARS_2
};

const { checkpoints, applyCheckpointToState } = require('world');

checkpoints[CHECK_POINT_STARS_2] = function (state) {
    const world = getStarWorld(WORLD_STARS_2);
    world.returnPoint = CHECK_POINT_FIELD_START;
    return updatePlayer({...state, world}, 0, {comboScore: 0});
};

const { getStarWorld, starWorldTransition } = require('areas/stars');
const { CHECK_POINT_FIELD_START } = require('areas/field');

const { LOOT_GAUNTLET, createLoot, addLootToState, getComboMultiplier, ladybugTypes} = require('loot');

const { updatePlayer } = require('heroes');
