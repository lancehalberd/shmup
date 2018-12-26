
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToOcean(state) {
    const world = {
        ...state.world,
        type: BEACH_TO_OCEAN,
        suppressAttacks: true,
    };
    return {...state, world}
}

const BEACH_TO_OCEAN = 'beachToOcean';
allWorlds[BEACH_TO_OCEAN] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: -100, targetTop: 300});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        state = setCheckpoint(state, CHECK_POINT_OCEAN_START);
        state = applyCheckpointToState(state, CHECK_POINT_OCEAN_START);
        // Use fade transition for now.
        return {...state, world: {...state.world, transitionFrames: 100}};
    },
};

module.exports = {
    transitionToOcean,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_OCEAN_START } = require('areas/ocean');
