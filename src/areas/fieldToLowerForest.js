
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

const transitionAnimation = createAnimation('gfx/scene/forest/2beginningsized.png', r(756, 650));
function transitionToLowerForest(state) {
    const sprites = state.world.nearground.sprites;
    // const treeFortSprite = sprites[1];
    sprites[2] = getNewSpriteState({
        top: -736,
        left: 234,
        width: transitionAnimation.frames[0].width * 2,
        height: transitionAnimation.frames[0].height * 2,
        animation: transitionAnimation,
    });
    const nearground = {...state.world.nearground, sprites};
    const world = {
        ...state.world,
        type: WORLD_FIELD_TO_LOWER_FOREST,
        nearground,
        suppressAttacks: true,
    };
    return {...state, world}
}

const WORLD_FIELD_TO_LOWER_FOREST = 'fieldToLowerForest';
allWorlds[WORLD_FIELD_TO_LOWER_FOREST] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: -100, targetTop: 300});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
        }
        const treeCover = state.world.nearground.sprites[2];
        if (treeCover.left <= -550) {
            state = setCheckpoint(state, CHECK_POINT_FOREST_LOWER_START);
            state = applyCheckpointToState(state, CHECK_POINT_FOREST_LOWER_START);
            const largeTrunks = {...state.world.largeTrunks, sprites: [treeCover]};
            world = {...state.world,
                targetX: state.world.x + 2000,
                event: 'transition',
                eventTime: 0,
                largeTrunks,
            };
        }
        return {...state, world};
    },
};

module.exports = {
    transitionToLowerForest,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_FOREST_LOWER_START } = require('areas/forestLower');
