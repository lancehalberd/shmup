
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToZoo(state) {
    const world = {
        ...state.world,
        type: SEWER_TO_ZOO,
        suppressAttacks: true,
    };
    return {...state, world};
}

const SEWER_TO_ZOO = 'sewerToZoo';
allWorlds[SEWER_TO_ZOO] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }
        state = setCheckpoint(state, CHECK_POINT_ZOO_START);
        state = applyCheckpointToState(state, CHECK_POINT_ZOO_START);
        // Use fade transition for now.
        state = {...state, world: {...state.world, transitionFrames: 100}};
        return {...state, world};
    },
};

module.exports = {
    transitionToZoo,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_ZOO_START } = require('areas/zoo');
