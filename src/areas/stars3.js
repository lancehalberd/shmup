const random = require('random');
const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    LOOT_COIN, LOOT_TRIPLE_COMBO,
} = require('gameConstants');

const WORLD_STARS_3 = 'stars3';
const CHECK_POINT_STARS_3 = 'stars3';

module.exports = {
    CHECK_POINT_STARS_3
};

const { allWorlds, checkpoints, applyCheckpointToState } = require('world');
const { getStarWorld, starWorldTransition } = require('areas/stars');
const { CHECK_POINT_FIELD_START } = require('areas/field');
const { LOOT_NECKLACE, createLoot, addLootToState, getComboMultiplier, ladybugTypes} = require('loot');
const { updatePlayer } = require('heroes');
const { spawnEnemy } = require('enemies');
const { ENEMY_BUBBLE } = require('areas/beachBoss');


function advanceWorld(state) {
    let world = state.world;
    const multiplier = getComboMultiplier(state, 0);
    const targetFrames = 170 - 25 * (multiplier - 1);
    const targetX = world.x + 1000;
    let time = world.time + FRAME_LENGTH;
    world = {...world, targetX, time, targetFrames};
    state = {...state, world};

    const addBonusCoin = ({left, top}) => {
        const loot = createLoot(LOOT_COIN, {left, top, points: 0, comboPoints: 10, scale: 3});
        loot.top -= loot.height / 2;
        state = addLootToState(state, loot);
    };
    const startTime = 2000, total = 50, spacing = 200;
    if (time < startTime) return state;
    // Coins are just in a continuous wave in this stage.
    if (time % spacing === 0 && time < startTime + spacing * total) {
        const p = (time - startTime) / spacing / total;
        const amplitude = 50 + 200 * p;
        addBonusCoin({
            left: WIDTH + 100 - 50 * p,
            top: GAME_HEIGHT / 2 - amplitude * Math.cos(time / 500)
        });
        addBonusCoin({
            left: WIDTH + 100 - 50 * p,
            top: GAME_HEIGHT / 2 + amplitude * Math.cos(time / 500)
        });
    }
    if (time % 1100 === 0) {
        for (let i = 0; i < 6; i++) {
            state = spawnEnemy(state, ENEMY_BUBBLE, {vx: -8, left: WIDTH + 100, top: i * GAME_HEIGHT / 5, score: 0});
        }
    }
    time -= startTime + spacing * total;
    time -= 5000;
    if (!time && multiplier >= 5) {
        const necklace = createLoot(LOOT_NECKLACE, {left: WIDTH * 2, top: GAME_HEIGHT - 100});
        necklace.top -= necklace.height / 2;
        state = addLootToState(state, necklace);
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
}
allWorlds[WORLD_STARS_3] = { advanceWorld };
checkpoints[CHECK_POINT_STARS_3] = function (state) {
    const world = getStarWorld(WORLD_STARS_3);
    world.nextX = world.x + 1000;
    world.returnPoint = CHECK_POINT_FIELD_START;
    return updatePlayer({...state, world}, 0, {comboScore: 0});
};
