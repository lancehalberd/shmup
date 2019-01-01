
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToCastle(state) {
    const world = {
        ...state.world,
        type: OCEAN_TO_CASTLE,
        suppressAttacks: true,
    };
    return {...state, world}
}

const OCEAN_TO_CASTLE = 'oceanToCastle';
allWorlds[OCEAN_TO_CASTLE] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: -100, targetTop: 300});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        state = setCheckpoint(state, CHECK_POINT_CASTLE_START);
        state = applyCheckpointToState(state, CHECK_POINT_CASTLE_START);
        // Use fade transition for now.
        return {...state, world: {...state.world, transitionFrames: 100}};
    },
};

module.exports = {
    transitionToCastle,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_CASTLE_START } = require('areas/castle');
