
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToBeach(state) {
    const world = {
        ...state.world,
        type: RESTAURANT_TO_BEACH,
        suppressAttacks: true,
    };
    return {...state, world};
}

const RESTAURANT_TO_BEACH = 'restarauntToBeach';
allWorlds[RESTAURANT_TO_BEACH] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        state = setCheckpoint(state, CHECK_POINT_BEACH_START);
        state = applyCheckpointToState(state, CHECK_POINT_BEACH_START);
        // Use fade transition for now.
        return {...state, world: {...state.world, transitionFrames: 100}};
    },
};

module.exports = {
    transitionToBeach,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_BEACH_START } = require('areas/beach');
