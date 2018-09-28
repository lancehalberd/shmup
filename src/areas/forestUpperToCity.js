const { WIDTH } = require('gameConstants');
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const {
    addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds,
    updateLayerSprites,
    clearLayers,
} = require('world');

const forestEdgeAnimation = createAnimation('gfx/scene/city/2ato3b.png', r(218, 400));

//Add in normal skybox as well as the sunset transition
function transitionToCity(state) {
    const sprites = [...state.world.background.sprites];
    const lastSprite = sprites[sprites.length - 1];
    sprites[sprites.length] = getNewSpriteState({
        top: lastSprite.top,
        left: lastSprite.left + lastSprite.width - 360,
        width: forestEdgeAnimation.frames[0].width * 4,
        height: forestEdgeAnimation.frames[0].height * 4,
        animation: forestEdgeAnimation,
    });
    const world = {
        ...state.world,
        background: {...state.world.background, xFactor: 1, sprites, spriteData: null},
        trunks: {...state.world.trunks, xFactor: 1},
        type: FOREST_UPPER_TO_CITY,
        suppressAttacks: true,
        lifebars: [],
    };
    return clearLayers({...state, world}, ['trunks', 'largeTrunks']);
}

const FOREST_UPPER_TO_CITY = 'forestUpperToCity';
allWorlds[FOREST_UPPER_TO_CITY] = {
    advanceWorld: (state) => {
        state = updateLayerSprites(state, 'ground', (state, sprite) => {
            return {...sprite, top: sprite.top + 1};
        });
        /*state = updateLayerSprites(state, 'willows', (state, sprite) => {
            const alpha = Math.max((typeof(sprite.alpha) === 'number') ? sprite.alpha - 0.01 : 0.99, 0);
            return {...sprite, alpha};
        });*/
        let world = {
            ...state.world,
            targetFrames: 50 * 4 / 2,
            targetX: state.world.x + 500,
            targetY: state.world.y,
            ground: {...state.world.ground, }
        }
        const edge = state.world.background.sprites[state.world.background.sprites.length - 1];
        if (edge.left - 100 > 600) state = updatePlayer(state, 0, {}, {targetLeft: edge.left - 100, targetTop: 300});
        state = {...state, world};
        if (edge.left < WIDTH - 400) {
            const sprites = state.world.background.sprites;
            state = setCheckpoint(state, CHECK_POINT_CITY_START);
            state = applyCheckpointToState(state, CHECK_POINT_CITY_START);
            state = {...state,
                world: {
                    ...state.world,
                    forestEdge: {...state.world.forestEdge, sprites},
                    eventTime: 0,
                }
            };
        }
        // Use fade transition for now.
        return state;
    },
};

module.exports = {
    transitionToCity,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_CITY_START } = require('areas/city');
