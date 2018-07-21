
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

const transitionAnimation = createAnimation('gfx/scene/forest/2beginningsized.png', r(756, 650));
function transitionToUpperForest(state) {
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
        type: WORLD_FIELD_TO_UPPER_FOREST,
        nearground,
        suppressAttacks: true,
    };
    return {...state, world}
}

const WORLD_FIELD_TO_UPPER_FOREST = 'fieldToUpperForest';
allWorlds[WORLD_FIELD_TO_UPPER_FOREST] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: -100, targetTop: 300});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
        }
        const treeCover = state.world.nearground.sprites[2];
        // TODO: make this path more of a curve.
        if (treeCover.left <= 0) {
            // This needs to be fast enough to reach the leaves, but slow enough to not shoot
            // past the top of the graphic. Just found this number by trial and error.
            world.targetY = state.world.y + 2700;
            world.targetX = state.world.x + 200;
            if (treeCover.top >= -100) {
                world.targetX = state.world.x + 2000;
                world.targetY = state.world.y + 100;
            }
        }
        if (treeCover.left <= -550) {
            state = setCheckpoint(state, CHECK_POINT_FOREST_UPPER_START);
            state = applyCheckpointToState(state, CHECK_POINT_FOREST_UPPER_START);
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
    transitionToUpperForest,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_FOREST_UPPER_START } = require('areas/forestUpper');
