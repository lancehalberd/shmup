
const {
    FRAME_LENGTH,
} = require('gameConstants');
// const random = require('random');
// const Rectangle = require('Rectangle');
// const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds } = require('world');

const WORLD_SKY_BOSS = 'skyBoss';

function transitionToSkyBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_SKY_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_SKY_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        const time = world.time + FRAME_LENGTH;
        world = {...world, time};
        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToSkyBoss,
};

