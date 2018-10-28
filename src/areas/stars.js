const { createAnimation, r } = require('animations');
const { getNewLayer } = require('world');

const stars1 = createAnimation('gfx/scene/portal/portal1.png', r(200, 200));
// TODO: Ask Jon to fix black in this image and add it back.
// const stars2 = createAnimation('gfx/scene/portal/portal2.png', r(200, 200));
const stars3 = createAnimation('gfx/scene/portal/portal3.png', r(200, 200));

const getStarWorld = (type) => ({
    type,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/space.mp3',
    groundHeight: 30,
    background: getNewLayer({
        xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
        backgroundColor: '#000',
    }),
    midgroundTop: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: 0,
        spriteData: {
            stars: {animation: [stars1, stars3], scale: 2, next: ['stars'], offset: [0]},
        },
    }),
    midgroundBottom: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -400,
        spriteData: {
            stars: {animation: [stars1, stars3], scale: 2, next: ['stars'], offset: [20]},
        },
    }),
    bgLayerNames: ['background'],
    mgLayerNames: ['midgroundTop', 'midgroundBottom'],
    fgLayerNames: [],
});

const enterStarWorld = (state, checkpoint, returnPoint) => {
    state = starWorldTransition(applyCheckpointToState(state, checkpoint));
    state = {...state, world: {...state.world, returnPoint}};
    return state;
};

const starWorldTransition = (state) => {
    return {...state, world: {...state.world, transitionFrames: 100}};
};

module.exports = {
    enterStarWorld, getStarWorld, starWorldTransition,
};


const { applyCheckpointToState } = require('world');

