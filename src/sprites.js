
const getNewSpriteState = (base) => ({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    vx: 0,
    vy: 0,
    animation: false,
    animationTime: 0,
    ...base,
});

module.exports = {
    getNewSpriteState,
};
