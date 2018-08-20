
const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT,
    ATTACK_DEFEATED_ENEMY, ATTACK_BULLET,
    ENEMY_FLYING_ANT, ENEMY_MONK,
    EFFECT_EXPLOSION,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { getNewSpriteState } = require('sprites');
const { allWorlds, getGroundHeight, getNewLayer } = require('world');
const { enterStarWorldEnd } = require('areas/stars');

const WORLD_SKY_BOSS = 'skyrBoss';

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

