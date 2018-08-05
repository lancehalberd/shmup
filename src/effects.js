const { drawImage, drawTintedImage } = require('draw');

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

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const {
    requireImage,
    createAnimation,
    getFrame,
    getHitBox,
    damageAnimation,
    dustAnimation,
    explosionAnimation,
    needleFlipAnimation,
    rateTextAnimation,
    sizeTextAnimation,
    speedTextAnimation,
    deflectAnimation,
    r,
} = require('animations');

const { getNewSpriteState } = require('sprites');

const beeRectangle = r(88, 56);
const beeSwitchAnimation = {
    frames: [
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beeswitch1.png')},
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beeswitch2.png')},
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beeswitch3.png')},
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beeswitch4.png')},
    ],
    frameDuration: 6,
};
const beeDeathAnimation = {
    frames: [
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beedie1.png')},
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beedie2.png')},
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beedie3.png')},
        {...beeRectangle, image: requireImage('gfx/heroes/bee/beedie4.png')},
    ],
    frameDuration: 6,
};
const dragonflyRectangle = r(88, 56);
const dragonflySwitchAnimation = {
    frames: [
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflyswitch1.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflyswitch2.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflyswitch3.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflyswitch4.png')},
    ],
    frameDuration: 6,
};
const dragonflyDeathAnimation = {
    frames: [
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflydie1.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflydie2.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflydie3.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflydie4.png')},
    ],
    frameDuration: 6,
};
const mothRectangle = r(88, 56);
const mothSwitchAnimation = {
    frames: [
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothswitch1.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothswitch2.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothswitch3.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothswitch4.png')},
    ],
    frameDuration: 6,
};
const mothDeathAnimation = {
    frames: [
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothdie1.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothdie2.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothdie3.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothdie4.png')},
    ],
    frameDuration: 6,
};

const effects = {
    [EFFECT_DAMAGE]: {
        animation: damageAnimation,
    },
    [EFFECT_EXPLOSION]: {
        animation: explosionAnimation,
        props: {
            relativeToGround: true,
        },
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
};
window.effects = effects;

function getEffectHitBox(effect) {
    let animation = effects[effect.type].animation;
    return new Rectangle(getHitBox(animation, effect.animationTime)).translate(effect.left, effect.top);
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
    let sfx = state.sfx;
    if (effect.sfx && !(effect.delay > 0)) sfx = {...sfx, [effect.sfx]: true};
    return {...state, newEffects: [...state.newEffects, effect], sfx };
};

const updateEffect = (state, effectIndex, props) => {
    const effects = [...state.effects];
    effects[effectIndex] = {...effects[effectIndex], ...props};
    return {...state, effects};
};

function renderEffectFrame(context, frame, target, effect) {
    if (!effect.tint || !effect.tint.amount) return drawImage(context, frame.image, frame, target);
    drawTintedImage(context, frame.image, effect.tint.color, effect.tint.amount, frame, target);
}

const renderEffect = (context, effect) => {
    if (effect.delay > 0) return;
    const frame = getFrame(effects[effect.type].animation, effect.animationTime);
    if ((effect.xScale || 1) === 1 && (effect.yScale || 1) === 1 && (effect.rotation || 0) === 0) {
        renderEffectFrame(context, frame, effect, effect);
        if (isKeyDown(KEY_SHIFT)) {
            context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'orange';
            let hitBox = getHitBox(effects[effect.type].animation, effect.animationTime);
            hitBox = hitBox.translate(effect.left, effect.top);
            context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
            context.restore();
        }
    } else {
        let hitBox = getHitBox(effects[effect.type].animation, effect.animationTime);
        // This moves the origin to where we want the center of the enemies hitBox to be.
        context.save();
        const xScale = effect.xScale || 1;
        const yScale = effect.yScale || 1;
        /*context.translate(
            effect.left + xScale * (hitBox.left + hitBox.width / 2),
            effect.top + yScale * (hitBox.top + hitBox.height / 2)
        );*/
        const anchor = frame.anchor || {x: hitBox.left, y: hitBox.top};
        context.translate(effect.left + anchor.x, effect.top + anchor.y);
        context.scale(xScale, yScale);
        if (effect.rotation) context.rotate(effect.rotation);
        // This draws the image frame so that the anchor is exactly at the origin.
        const target = new Rectangle(frame).moveTo(-anchor.x, -anchor.y);
        renderEffectFrame(context, frame, target, effect);
        context.restore();

        if (isKeyDown(KEY_SHIFT)) {
            context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'orange';
            hitBox = hitBox.stretchFromPoint(anchor.x, anchor.y, xScale, yScale)
                .translate(effect.left, effect.top);
            // console.log(effect.left + effect.width * effect.xScale / 2, effect.top + effect.width * effect.yScale / 2);
            context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
            context.restore();
        }
    }
};

const advanceEffect = (state, effectIndex) => {
    const effect = state.effects[effectIndex];
    const effectInfo = effects[effect.type];
    if (effectInfo.advanceEffect) {
        state = effectInfo.advanceEffect(state, effectIndex);
    }
    let { done, left, top, width, height, vx, vy, animationTime,
        relativeToGround, loops, delay,
    } = state.effects[effectIndex];
    if (delay > 0) {
        delay--;
        if (effect.sfx && delay === 0) {
            state = {...state, sfx: {...state.sfx, [effect.sfx]: true}};
        }
        if (relativeToGround) {
            const neargroundKey = state.world.mgLayerNames[state.world.mgLayerNames.length - 1];
            left -= state.world[neargroundKey].xFactor * state.world.vx;
            top += state.world[neargroundKey].yFactor * state.world.vy;
        }
        return updateEffect(state, effectIndex, {delay, top, left});
    }
    const animation = effectInfo.animation;
    left += vx;
    top += vy;
    if (relativeToGround) {
        const neargroundKey = state.world.mgLayerNames[state.world.mgLayerNames.length - 1];
        left -= state.world[neargroundKey].xFactor * state.world.vx;
        top += state.world[neargroundKey].yFactor * state.world.vy;
    }
    animationTime += FRAME_LENGTH;

    if (!effect.permanent) {
        done = done || animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration * (loops || 1) ||
            left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
            top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;
    }

    return updateEffect(state, effectIndex, {left, top, animationTime, done});
};

const advanceAllEffects = (state) => {
    for (let i = 0; i < state.effects.length; i++) {
        state = advanceEffect(state, i);
    }
    state.effects = state.effects.filter(effect => !effect.done);
    return state;
};

function getEffectIndex(state, type, offset = 0) {
    for (;offset < state.effects.length; offset++) {
        if (state.effects[offset].type === type) return offset;
    }
    return -1
}

module.exports = {
    effects,
    createEffect,
    addEffectToState,
    advanceAllEffects,
    renderEffect,
    updateEffect,
    getEffectIndex,
    getEffectHitBox,
};
