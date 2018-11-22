
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToCity(state) {
    const world = {
        ...state.world,
        type: FOREST_LOWER_TO_CITY,
        suppressAttacks: true,
    };
    return {...state, world}
}
/*

From 2B to 3B, it is the same transition from 1 to 2B where the screen moves faster than the Knight,
and the Knight appears at the other side of the tunnel.

*/

const FOREST_LOWER_TO_CITY = 'forestLowerToCity';
allWorlds[FOREST_LOWER_TO_CITY] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        state = setCheckpoint(state, CHECK_POINT_CITY_START);
        state = applyCheckpointToState(state, CHECK_POINT_CITY_START);
        // Use fade transition for now.
        return {...state, world: {...state.world, transitionFrames: 100}};
    },
};

module.exports = {
    transitionToCity,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_CITY_START } = require('areas/city');
