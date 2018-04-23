const { drawImage } = require('draw');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    EFFECT_DAMAGE, EFFECT_EXPLOSION, EFFECT_DUST,
    EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY,
    EFFECT_NEEDLE_FLIP,
} = require('gameConstants');

const {
    getFrame,
    damageAnimation,
    dustAnimation,
    explosionAnimation,
    dragonflyDeathAnimation,
    dragonflySwitchAnimation,
    needleFlipAnimation,
} = require('animations');

const {
    playSound
} = require('sounds');

const { getNewSpriteState } = require('sprites');

const effects = {
    [EFFECT_DAMAGE]: {
        animation: damageAnimation,
    },
    [EFFECT_EXPLOSION]: {
        animation: explosionAnimation,
    },
    [EFFECT_DUST]: {
        animation: dustAnimation,
        props: {
            relativeToGround: true,
        },
    },
    [EFFECT_NEEDLE_FLIP]: {
        animation: needleFlipAnimation,
    },
    [EFFECT_DEAD_DRAGONFLY]: {
        animation: dragonflyDeathAnimation,
    },
    [EFFECT_SWITCH_DRAGONFLY]: {
        animation: dragonflySwitchAnimation,
    },
}

const createEffect = (type, props) => {
    const frame = effects[type].animation.frames[0];
    return getNewSpriteState({
        ...frame,
        ...effects[type].props,
        type,
        ...props,
    });
};

const addEffectToState = (state, effect) => {
    return {...state, newEffects: [...state.newEffects, effect] };
};

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
    if (effect.relativeToGround) {
        left -= state.world.neargroundXFactor * state.world.vx;
        top += state.world.neargroundYFactor * state.world.vy;
    }
    animationTime += FRAME_LENGTH;

    const done = animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration ||
        left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return {...effect, left, top, animationTime, done};
};


module.exports = {
    createEffect,
    addEffectToState,
    advanceEffect,
    renderEffect,
};
