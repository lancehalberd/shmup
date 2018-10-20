
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');


const transitionAnimation = createAnimation('gfx/scene/sky/sunsettransition.png', r(600, 800));
function transitionToSky(state) {
    const sprites = state.world.background.sprites;
    sprites[2] = getNewSpriteState({
        top: -1536,
        left: 0,
        width: transitionAnimation.frames[0].width * 2,
        height: transitionAnimation.frames[0].height * 2,
        animation: transitionAnimation,
    });
    console.log([...sprites]);
    sprites.splice.apply(sprites, [2, 0, ...state.world.trunks.sprites]);
    const skyIndex = 2 + state.world.trunks.sprites.length;
    console.log([...sprites]);
    const background = {...state.world.background, sprites};
    const trunks = {...state.world.trunks, sprites: [], spriteData: null};
    const world = {
        ...state.world,
        type: FOREST_UPPER_TO_SKY1,
        background,
        trunks,
        skyIndex,
        suppressAttacks: true,
    };
    return {...state, world}
}

const FOREST_UPPER_TO_SKY1 = 'forestUpperToSky1';
const FOREST_UPPER_TO_SKY2 = 'forestUpperToSky2';
allWorlds[FOREST_UPPER_TO_SKY1] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x,
            targetY: state.world.y + 1000,
        }
        const sunset = {...state.world.background.sprites[state.world.skyIndex]};
        if (sunset.top >= -750) {
            sunset.top = -750;
            state = setCheckpoint(state, CHECK_POINT_SKY_START);
            state = applyCheckpointToState(state, CHECK_POINT_SKY_START);
            const background = {...state.world.background, sprites: [sunset]};
            world = {...state.world,
                targetX: state.world.x + 2000,
                event: 'transition',
                eventTime: 0,
                background,
                type: FOREST_UPPER_TO_SKY2,
            };
            state = {...state, world};
            // Move all the initial graphics for the sky up 400 pixels, so they will
            // be in the correct place once we finish scrolling up (from -750 to -350).
            for (const layerName of world.mgLayerNames) {
                if (layerName === 'background') continue;
                state = addElementToLayer(state, layerName);
                for (const sprite of state.world[layerName].sprites) {
                    sprite.top -= 400;
                }
            }
            world = state.world;
        }
        return {...state, world};
    },
};
allWorlds[FOREST_UPPER_TO_SKY2] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        let world = {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 100,
            targetY: state.world.y + 1000,
        }
        const sunset = {...state.world.background.sprites[0]};
        if (sunset.top >= -350) {
            sunset.top = -350;
            const background = {...state.world.background, sprites: [sunset]};
            world = {...state.world,
                targetX: state.world.x + 2000,
                event: 'transition',
                eventTime: 0,
                background,
                type: WORLD_SKY,
                // reset y to 0 so the new elements appear in the correct y position.
                y: 0,
                targetY: 0,
            };
        }
        return {...state, world};
    },
};

module.exports = {
    transitionToSky,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_SKY_START, WORLD_SKY } = require('areas/sky');
