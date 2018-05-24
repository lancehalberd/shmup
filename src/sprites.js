
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

const getTargetVector = (agent, target) => {
    return {
        dx: target.left + (target.width || 0) / 2 - (agent.left + (agent.width || 0) / 2),
        dy: target.top + (target.height || 0) / 2 - (agent.top + (agent.height || 0) / 2),
    };
};

module.exports = {
    getNewSpriteState,
    getTargetVector,
};
