
const { FRAME_LENGTH, GAME_HEIGHT } = require('gameConstants');

const getNewWorld = () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    groundHeight: 22,
    backgroundXFactor: .5,
    backgroundYFactor: 0,
    neargroundXFactor: 2,
    neargroundYFactor: 1,
    neargroundYOffset: 0,
    midgroundXFactor: 1,
    midgroundYFactor: 1,
    midgroundYOffset: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/area.mp3',
});

const advanceWorld = (state, world) => {
    let {x, y, vx, vy, targetX, targetY, targetFrames, time} = world
    x += vx;
    y += vy;
    y = Math.max(0, y);
    targetFrames--;
    const targetVx = (targetX - x) / targetFrames;
    vx = (targetVx + vx) / 2;
    const targetVy = (targetY - y) / targetFrames;
    //vy = (targetVy + vy) / 2;
    vy = Math.max((targetVy + vy) / 2, -y);

    // For now just set the targetFrame and destination constantly ahead.
    // Later we can change this depending on the scenario.
    targetFrames = 50 * 10;
    targetX = x + 1000;
    if (time % 60000 > 45000) {
        targetY = y;
    } else if (time % 60000 > 30000) {
        targetY = 400;
    } else if (time % 60000 > 15000) {
        targetY = y;
    } else {
        targetY = -100;
    }
    time += FRAME_LENGTH;
    return {...world, x, y, vx, vy, targetX, targetY, targetFrames, time};
};

const getGroundHeight = (state) => {
    return GAME_HEIGHT - state.world.groundHeight + state.world.y * state.world.neargroundYFactor;
};


module.exports = {
    getNewWorld,
    advanceWorld,
    getGroundHeight,
};
