const { WIDTH } = require('gameConstants');
const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToCastle(state) {
    const world = {
        ...state.world,
        type: OCEAN_TO_CASTLE,
    };
    return {...state, world}
}

const OCEAN_TO_CASTLE = 'oceanToCastle';
allWorlds[OCEAN_TO_CASTLE] = {
    advanceWorld: (state) => {
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        //
        let castleWorld = getCastleWorld();
        for (const key of castleWorld.mgLayerNames) {
            castleWorld[key].xOffset = (castleWorld[key].xOffset || 0) + WIDTH + 380;
        }
        // Stop spawning sprites in the ocean world.
        let oceanWorld = {...state.world};
        for (const key of oceanWorld.mgLayerNames) {
            oceanWorld[key] = {...oceanWorld[key], spriteData: null};
        }
        // These names collide with names from the castle world, so reassign them here.
        castleWorld.oceanground = oceanWorld.ground;
        castleWorld.oceanMidstuff = oceanWorld.midStuff;
        castleWorld.oceanGroundStuff = oceanWorld.groundStuff;
        // This is the final combined layers for transitioning from the ocean to the castle.
        castleWorld.mgLayerNames = [
            'deepWaterback', 'oceanground', 'highStuff', 'oceanMidstuff', 'lowStuff', 'oceanGroundStuff',
            'backgroundHigh', 'backgroundMedium', 'backgroundLow', 'ground', 'midStuff', 'groundStuff'
        ];
        // show the ground start element initially, which is not normally displayed in this layer.
        castleWorld.ground.firstElements = ['groundStart'];
        state = setCheckpoint(state, CHECK_POINT_CASTLE_START);
        // Use fade transition for now.
        return {...state, world: {...oceanWorld, ...castleWorld, event: 'nothing'}};
    },
};

module.exports = {
    transitionToCastle,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_CASTLE_START, getCastleWorld } = require('areas/castle');
