const { drawImage } = require('draw');

const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    EFFECT_DAMAGE, EFFECT_EXPLOSION, EFFECT_DUST,
    EFFECT_DEAD_BEE, EFFECT_SWITCH_BEE,
    EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY,
    EFFECT_DEAD_MOTH, EFFECT_SWITCH_MOTH,
    EFFECT_NEEDLE_FLIP,
    EFFECT_RATE_UP, EFFECT_SIZE_UP, EFFECT_SPEED_UP,
    EFFECT_DEFLECT_BULLET,
} = require('gameConstants');

const {
    allAnimations,
    getFrame,
    getHitBox,
    damageAnimation,
    dustAnimation,
    explosionAnimation,
    beeDeathAnimation,
    beeSwitchAnimation,
    dragonflyDeathAnimation,
    dragonflySwitchAnimation,
    mothDeathAnimation,
    mothSwitchAnimation,
    needleFlipAnimation,
    rateTextAnimation,
    sizeTextAnimation,
    speedTextAnimation,
    deflectAnimation,
    createVerticalFrames, r, i,
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
    [EFFECT_DEAD_BEE]: {
        animation: beeDeathAnimation,
    },
    [EFFECT_SWITCH_BEE]: {
        animation: beeSwitchAnimation,
    },
    [EFFECT_DEAD_DRAGONFLY]: {
        animation: dragonflyDeathAnimation,
    },
    [EFFECT_SWITCH_DRAGONFLY]: {
        animation: dragonflySwitchAnimation,
    },
    [EFFECT_DEAD_MOTH]: {
        animation: mothDeathAnimation,
    },
    [EFFECT_SWITCH_MOTH]: {
        animation: mothSwitchAnimation,
    },
    [EFFECT_RATE_UP]: {
        animation: rateTextAnimation,
        props: {
            vy: -0.5,
            loops: 3,
        }
    },
    [EFFECT_SIZE_UP]: {
        animation: sizeTextAnimation,
        props: {
            vy: -0.5,
            loops: 3,
        }
    },
    [EFFECT_SPEED_UP]: {
        animation: speedTextAnimation,
        props: {
            vy: -0.5,
            loops: 3,
        }
    },
    [EFFECT_DEFLECT_BULLET]: {
        animation: deflectAnimation,
    }
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

const updateEffect = (state, effectIndex, props) => {
    const effects = [...state.effects];
    effects[effectIndex] = {...effects[effectIndex], ...props};
    return {...state, effects};
};

const renderEffect = (context, effect) => {
    const frame = getFrame(effects[effect.type].animation, effect.animationTime);
    if ((effect.xScale || 1) === 1 && (effect.yScale || 1) === 1 && (effect.rotation || 0) === 0) {
        drawImage(context, frame.image, frame, effect);
    } else {
        let hitBox = getHitBox(effects[effect.type].animation, effect.animationTime);
        // This moves the origin to where we want the center of the enemies hitBox to be.
        context.save();
        context.translate(effect.left + hitBox.left + hitBox.width / 2, effect.top + hitBox.top + hitBox.height / 2);
        context.scale(effect.xScale || 1, effect.yScale || 1);
        if (effect.rotation) context.rotate(effect.rotation);
        // This draws the image frame so that the center is exactly at the origin.
        const target = new Rectangle(frame).moveTo(
            -(hitBox.left + hitBox.width / 2),
            -(hitBox.top + hitBox.height / 2),
        );
        drawImage(context, frame.image, frame, target);
        context.restore();
    }
    if (effect.sfx) {
        playSound(effect.sfx);
        effect.sfx = false;
    }
};

const advanceEffect = (state, effectIndex) => {
    const effectInfo = effects[state.effects[effectIndex].type];
    if (effectInfo.advanceEffect) {
        state = effectInfo.advanceEffect(state, effectIndex);
    }
    let { left, top, width, height, vx, vy, delay, duration, animationTime,
        relativeToGround, loops,
    } = state.effects[effectIndex];
    const animation = effectInfo.animation;
    left += vx;
    top += vy;
    if (relativeToGround) {
        left -= state.world.nearground.xFactor * state.world.vx;
        top += state.world.nearground.yFactor * state.world.vy;
    }
    animationTime += FRAME_LENGTH;

    const done = animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration * (loops || 1) ||
        left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return updateEffect(state, effectIndex, {left, top, animationTime, done});
};

const advanceAllEffects = (state) => {
    for (let i = 0; i < state.effects.length; i++) {
        state = advanceEffect(state, i);
    }
    state.effects = state.effects.filter(effect => !effect.done);
    return state;
};

module.exports = {
    effects,
    createEffect,
    addEffectToState,
    advanceAllEffects,
    renderEffect,
    updateEffect,
};
