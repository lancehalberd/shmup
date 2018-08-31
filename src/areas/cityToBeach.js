
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToBeach(state) {
    const world = {
        ...state.world,
        type: CITY_TO_BEACH,
        suppressAttacks: true,
    };
    return {...state, world};
}

const CITY_TO_BEACH = 'cityToBeach';
allWorlds[CITY_TO_BEACH] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }
        state = setCheckpoint(state, CHECK_POINT_BEACH_START);
        state = applyCheckpointToState(state, CHECK_POINT_BEACH_START);
        // Use fade transition for now.
        state = {...state, world: {...state.world, transitionFrames: 100}};
        return {...state, world};
    },
};

module.exports = {
    transitionToBeach,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_BEACH_START } = require('areas/beach');
