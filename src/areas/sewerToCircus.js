
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToCircus(state) {
    const world = {
        ...state.world,
        type: SEWER_TO_CIRCUS,
        suppressAttacks: true,
    };
    return {...state, world};
}

const SEWER_TO_CIRCUS = 'sewerToCircus';
allWorlds[SEWER_TO_CIRCUS] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        state = setCheckpoint(state, CHECK_POINT_CIRCUS_START);
        state = applyCheckpointToState(state, CHECK_POINT_CIRCUS_START);
        // Use fade transition for now.
        return {...state, world: {...state.world, transitionFrames: 100}};
    },
};

module.exports = {
    transitionToCircus,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_CIRCUS_START } = require('areas/circus');
