
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToSewer(state) {
    const world = {
        ...state.world,
        type: FOREST_LOWER_TO_SEWER,
        suppressAttacks: true,
    };
    return {...state, world}
}

const FOREST_LOWER_TO_SEWER = 'forestLowerToSewer';
allWorlds[FOREST_LOWER_TO_SEWER] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        state = setCheckpoint(state, CHECK_POINT_SEWER_START);
        state = applyCheckpointToState(state, CHECK_POINT_SEWER_START);
        // Use fade transition for now.
        return {...state, world: {...state.world, transitionFrames: 100}};
    },
};


module.exports = {
    transitionToSewer,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_SEWER_START } = require('areas/city');
