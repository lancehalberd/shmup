
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

const forestEdgeAnimation = createAnimation('gfx/scene/city/2ato3b.png', r(218, 400));

//Add in normal skybox as well as the sunset transition
function transitionToCity(state) {
    const sprites = state.world.background.sprites;
    sprites[2] = getNewSpriteState({
        top: sprites[0].top,
        left: sprites[0].left + sprites[0].width,
        width: forestEdgeAnimation.frames[0].width * 2,
        height: forestEdgeAnimation.frames[0].height * 2,
        animation: forestEdgeAnimation,
    });
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
        state = {...state, world};
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
