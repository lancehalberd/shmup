
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

//Add in normal skybox as well as the sunset transition
function transitionToCity(state) {
    const world = {
        ...state.world,
        type: FOREST_UPPER_TO_CITY,
        suppressAttacks: true,
    };
    return {...state, world}
}

const FOREST_UPPER_TO_CITY = 'forestUpperToCity';
allWorlds[FOREST_UPPER_TO_CITY] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }
        state = setCheckpoint(state, CHECK_POINT_CITY_START);
        state = applyCheckpointToState(state, CHECK_POINT_CITY_START);
        // Use fade transition for now.
        state = {...state, world: {...state.world, transitionFrames: 100}};
        return {...state, world};
    },
};


module.exports = {
    transitionToCity,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_CITY_START } = require('areas/city');
