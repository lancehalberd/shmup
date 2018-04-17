const {
    WIDTH,
    HEIGHT,
    FRAME_LENGTH,
} = require('gameConstants');

const {
    getNewState,
    advanceState,
    applyPlayerActions,
} = require('state');
const render = require('render');

const { isKeyDown, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_ENTER, KEY_R } = require('keyboard');




const now = () => Date.now();

// Currently we only support a single player.
const playerIndex = 0;

let stateQueue = [];
let state = getNewState();

const update = () => {
    state = applyPlayerActions(state, playerIndex, {
        // Make sure up/down only trigger once per press during the title sequence.
        up: isKeyDown(KEY_UP, state.title), down: isKeyDown(KEY_DOWN, state.title),
        left: isKeyDown(KEY_LEFT), right: isKeyDown(KEY_RIGHT),
        shoot: isKeyDown(KEY_SPACE),
        start: isKeyDown(KEY_ENTER, true),
    });

    if (stateQueue.length && isKeyDown(KEY_R)) {
        state = stateQueue.shift();
    } else {
        state = advanceState(state);
        if (!state.title && !state.paused) {
            stateQueue.unshift(state);
        }
    }

    stateQueue = stateQueue.slice(0, 100);
    //render(state);
    // This is here to help with debugging from console.
    window.state = state;
};
setInterval(update, FRAME_LENGTH);

const renderLoop = () => {
    try {
        render(state);
        window.requestAnimationFrame(renderLoop);
    } catch (e) {
        console.log(e);
        debugger;
    }
}
renderLoop();

