const {
    FRAME_LENGTH,
} = require('gameConstants');

const {
    PRIORITY_PRELOADER, PRIORITY_TITLE,
    PRIORITY_HEROES, PRIORITY_FIELD,
    priorityCounts,
} = require('animations');
const { preloadSounds } = require('sounds');

const {
    getNewState,
    advanceState,
    applyPlayerActions,
} = require('state');
const render = require('render');

const { isKeyDown,
    KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_SPACE,
    KEY_ENTER, KEY_R, KEY_X, KEY_C, KEY_V,
    KEY_T,
} = require('keyboard');

// Currently we only support a single player.
const playerIndex = 0;

// preloadSounds();
let preloadedSounds = false;
let stateQueue = [];
let state = {};

const update = () => {
    if (!state.world) state = getNewState();
    const singlePressOnly = state.title || state.gameover;
    state = applyPlayerActions(state, playerIndex, {
        // Make sure up/down only trigger once per press during the title sequence.
        up: isKeyDown(KEY_UP, singlePressOnly), down: isKeyDown(KEY_DOWN, singlePressOnly),
        left: isKeyDown(KEY_LEFT, singlePressOnly), right: isKeyDown(KEY_RIGHT, singlePressOnly),
        melee: isKeyDown(KEY_SPACE),
        special: isKeyDown(KEY_C),
        switch: isKeyDown(KEY_X),
        toggleDebug: isKeyDown(KEY_T, true),
        start: isKeyDown(KEY_ENTER, true),
    });

    // Wait to load sounds until the graphics are loaded for the first few scenes.
    if (!preloadedSounds && !(
            priorityCounts[PRIORITY_PRELOADER] > 0 ||
            priorityCounts[PRIORITY_TITLE] > 0 ||
            priorityCounts[PRIORITY_FIELD] > 0 ||
            priorityCounts[PRIORITY_HEROES] > 0
        )
    ) {
        preloadSounds();
        preloadedSounds = true;
    }

    if (stateQueue.length && isKeyDown(KEY_R)) {
        state = stateQueue.shift();
    } else {
        state = advanceState(state);
        if (!state.title && !state.paused) {
            stateQueue.unshift(state);
        }
    }

    stateQueue = stateQueue.slice(0, 200);
    //render(state);
    // This is here to help with debugging from console.
    window.state = state;
    window.stateQueue = stateQueue;
};
setInterval(update, FRAME_LENGTH);

const renderLoop = () => {
    try {
        if (state.world) render(state);
        window.requestAnimationFrame(renderLoop);
    } catch (e) {
        console.log(e);
        debugger;
    }
};
renderLoop();

