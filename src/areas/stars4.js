const random = require('random');
const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    LOOT_COIN, LOOT_TRIPLE_COMBO, LOOT_FLAME_COIN
} = require('gameConstants');

const { ENEMY_FIRE_RING } = require('areas/circus');

const WORLD_STARS_4 = 'stars4';
const CHECK_POINT_STARS_4 = 'stars4';

module.exports = {
    CHECK_POINT_STARS_4
};

const { allWorlds, checkpoints, applyCheckpointToState } = require('world');
const { getStarWorld, starWorldTransition } = require('areas/stars');
const { CHECK_POINT_FIELD_START } = require('areas/field');
const { LOOT_NEEDLE, createLoot, addLootToState, getComboMultiplier, ladybugTypes} = require('loot');
const { updatePlayer } = require('heroes');
const { spawnEnemy, addEnemyToState, createEnemy } = require('enemies');
const { ENEMY_BUBBLE } = require('areas/beachBoss');



function spawnRing(state, top, left, scale) {
    top = top - 45 * scale;
    left = left - 50 * scale;
    const ring = createEnemy(state, ENEMY_FIRE_RING, {top, left, scale});
    state = addEnemyToState(state, ring);
    const loot = createLoot(LOOT_FLAME_COIN, {points: 0, comboPoints: 30});
    loot.width = 2;
    loot.left = left + scale * 50 - 1;
    loot.top = top + 5 * scale;
    loot.height = 90 * scale;
    loot.sourceId = ring.id;
    return addLootToState(state, loot);
}


function advanceWorld(state) {
    let world = state.world;
    const multiplier = getComboMultiplier(state, 0);
    const targetFrames = 120;
    const targetX = world.x + 1000;
    let time = world.time + FRAME_LENGTH;
    world = {...world, targetX, time, targetFrames};
    state = {...state, world};

    const addBonusCoin = ({left, top}) => {
        const loot = createLoot(LOOT_COIN, {left, top, points: 0, comboPoints: 10, scale: 3});
        loot.top -= loot.height / 2;
        loot.left -= loot.width / 2;
        state = addLootToState(state, loot);
    };
    const R = WIDTH + 150;
    time -= 1000;
    // Coins are just in a continuous wave in this stage.
    if (time === 0) {
        const S = 200
        state = spawnRing(state, GAME_HEIGHT / 2, R, 3);
        state = spawnRing(state, GAME_HEIGHT / 2, R + S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2, R + 2 * S, 1.5);
        addBonusCoin({left: R, top: GAME_HEIGHT / 2 - 150});
        addBonusCoin({left: R, top: GAME_HEIGHT / 2 + 150});
        addBonusCoin({left: R + S, top: GAME_HEIGHT / 2 - 100});
        addBonusCoin({left: R + S, top: GAME_HEIGHT / 2 + 100});
        addBonusCoin({left: R + 2 * S, top: GAME_HEIGHT / 2 - 50});
        addBonusCoin({left: R + 2 * S, top: GAME_HEIGHT / 2 + 50});
    }
    time -= 3000;
    if (time === 0) {
        const S = 100;
        state = spawnRing(state, GAME_HEIGHT / 2 + 120, R, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 - 120, R + S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 + 140, R + 2 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 - 140, R + 3 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 + 160, R + 4 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 - 160, R + 5 * S, 1.5);
        addBonusCoin({left: R + S / 2, top: GAME_HEIGHT / 2});
        addBonusCoin({left: R + 5 * S / 2, top: GAME_HEIGHT / 2});
        addBonusCoin({left: R + 9 * S / 2, top: GAME_HEIGHT / 2});
    }
    time -= 3000;
    if (time === 0) {
        const S = 200;
        state = spawnRing(state, GAME_HEIGHT / 2 + 150, R, 2);
        state = spawnRing(state, GAME_HEIGHT / 2 + 75, R + S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2, R + 2 * S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2 - 75, R + 3 * S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2, R + 4 * S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2 + 75, R + 5 * S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2 + 150, R + 6 * S, 2);
        addBonusCoin({left: R, top: GAME_HEIGHT / 2 + 50});
        addBonusCoin({left: R + S, top: GAME_HEIGHT / 2 });
        addBonusCoin({left: R + 2 * S, top: GAME_HEIGHT / 2 - 75});
        addBonusCoin({left: R + 3 * S, top: GAME_HEIGHT / 2 - 150});
        addBonusCoin({left: R + 4 * S, top: GAME_HEIGHT / 2 - 75});
        addBonusCoin({left: R + 5 * S, top: GAME_HEIGHT / 2});
        addBonusCoin({left: R + 6 * S, top: GAME_HEIGHT / 2 + 50});
    }
    time -= 5000;
    if (time === 0) {
        const S = 100;
        state = spawnRing(state, GAME_HEIGHT / 2 + 120, R + 5 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 - 120, R + 4 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 + 140, R + 3 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 - 140, R + 2 * S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 + 160, R + S, 1.5);
        state = spawnRing(state, GAME_HEIGHT / 2 - 160, R, 1.5);
        addBonusCoin({left: R + 9 * S / 2, top: GAME_HEIGHT / 2});
        addBonusCoin({left: R + 5 * S / 2, top: GAME_HEIGHT / 2});
        addBonusCoin({left: R + 1 * S / 2, top: GAME_HEIGHT / 2});
    }
    time -= 4000;
    if (time === 0) {
        const S = 200
        state = spawnRing(state, GAME_HEIGHT / 2, R + 2 * S, 3);
        state = spawnRing(state, GAME_HEIGHT / 2, R + S, 2);
        state = spawnRing(state, GAME_HEIGHT / 2, R, 1.5);
        addBonusCoin({left: R + 2 * S, top: GAME_HEIGHT / 2 - 150});
        addBonusCoin({left: R + 2 * S, top: GAME_HEIGHT / 2 + 150});
        addBonusCoin({left: R + S, top: GAME_HEIGHT / 2 - 100});
        addBonusCoin({left: R + S, top: GAME_HEIGHT / 2 + 100});
        addBonusCoin({left: R, top: GAME_HEIGHT / 2 - 50});
        addBonusCoin({left: R, top: GAME_HEIGHT / 2 + 50});
    }
    time -= 5000;
    if (!time && multiplier >= 5) {
        const needle = createLoot(LOOT_NEEDLE, {left: WIDTH * 2, top: GAME_HEIGHT - 100});
        needle.top -= needle.height / 2;
        state = addLootToState(state, needle);
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
allWorlds[WORLD_STARS_4] = { advanceWorld };
checkpoints[CHECK_POINT_STARS_4] = function (state) {
    const world = getStarWorld(WORLD_STARS_4);
    world.nextX = world.x + 1000;
    world.returnPoint = CHECK_POINT_FIELD_START;
    return updatePlayer({...state, world}, 0, {comboScore: 0});
};
