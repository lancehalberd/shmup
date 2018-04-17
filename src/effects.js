const { drawImage } = require('draw');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    EFFECT_DAMAGE, EFFECT_EXPLOSION,
} = require('gameConstants');

const {
    getFrame,
    damageAnimation,
    explosionAnimation,
} = require('animations');

const {
    playSound
} = require('sounds');

const effects = {
    [EFFECT_DAMAGE]: {
        animation: damageAnimation,
    },
    [EFFECT_EXPLOSION]: {
        animation: explosionAnimation,
    },
}

const createEffect = (type) => {
    const frame = effects[type].animation.frames[0];
    return {
        ...frame,
        type,
    };
}

const renderEffect = (context, effect) => {
    const frame = getFrame(effects[effect.type].animation, effect.animationTime);
    drawImage(context, frame.image, frame, effect);
    if (effect.sfx) {
        playSound(effect.sfx);
        effect.sfx = false;
    }
};

const advanceEffect = (state, effect) => {
    let { left, top, width, height, vx, vy, delay, duration, animationTime, type } = effect;
    const animation = effects[type].animation;
    left += vx;
    top += vy;
    animationTime += FRAME_LENGTH;

    const done = animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration ||
        left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return {...effect, left, top, animationTime, done};
};


module.exports = {
    createEffect,
    advanceEffect,
    renderEffect,
};
