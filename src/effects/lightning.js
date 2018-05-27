const {
    FRAME_LENGTH,
} = require('gameConstants');
const {
    requireImage, r,
} = require('animations');

const EFFECT_LIGHTNING = 'lightning';
const EFFECT_FAST_LIGHTNING = 'fastLightning';

const lightningFrames = [
    {...r(50, 10), image: requireImage('gfx/attacks/chain1.png')},
    {...r(50, 10), image: requireImage('gfx/attacks/chain2.png')},
    {...r(50, 10), image: requireImage('gfx/attacks/chain3.png')},
    {...r(50, 10), image: requireImage('gfx/attacks/chain4.png')},
];
function advanceLightning(state, effectIndex) {
    const effect = state.effects[effectIndex];
    if (effect.charges > 0 && effect.animationTime === FRAME_LENGTH) {
        const center = [effect.left + effect.width / 2, effect.top + effect.height / 2];
        const left = center[0] + Math.cos(effect.rotation) * effect.width / 2;
        const top = center[1] + Math.sin(effect.rotation) * effect.width / 2;
        state = checkToAddLightning(state, {...effect, left, top});
    }
    return state;
}
const checkToAddLightning = (state, {left, top, charges = 8, damage = 5, branchChance = 0, rotation = 0, scale = 2, vx = 0, vy = 0, type = EFFECT_LIGHTNING}) => {
    const addLightning = (rotation, branchChance) => {
        const lightning = createEffect(type, {
            left, top,
            charges: charges - 1,
            rotation,
            branchChance,
            xScale: scale, yScale: scale,
            vx, vy,
        });
        lightning.width *= scale;
        lightning.height *= scale;
        lightning.left -= lightning.width / 2;
        lightning.left += Math.cos(rotation) * lightning.width / 2;
        lightning.top -= lightning.height / 2;
        lightning.top += Math.sin(rotation) * lightning.width / 2;
        state = addEffectToState(state, lightning);
    }
    const targetRotations = [];
    for (let i = 0; i < state.enemies.length; i++) {
        const enemy = state.enemies[i];
        if (enemy.done || enemy.dead) continue;
        // The large lightning attack can only hit enemies in front of each bolt.
        if (type === EFFECT_LIGHTNING && enemy.left + enemy.width / 2 <= left) continue;
        const hitBox = getEnemyHitBox(enemy);
        const dx = hitBox.left + hitBox.width / 2 - left,
            dy = hitBox.top + hitBox.height / 2 - top;
        const radius = Math.sqrt(hitBox.width * hitBox.width + hitBox.height * hitBox.height) / 2;
        if (Math.sqrt(dx * dx + dy * dy) <= 50 * scale + radius) {
            targetRotations.push(Math.atan2(dy, dx));
            state = damageEnemy(state, i, {playerIndex: 0, damage});
            state = {...state, sfx: {...state.sfx, 'sfx/hit.mp3': true}};
        }
    }
    if (targetRotations.length) {
        const branchChance = targetRotations.length > 1 ? 0 : branchChance + 0.2;
        for (var enemyRotation of targetRotations) {
            addLightning(enemyRotation, branchChance);
        }
    } else if (Math.random() < branchChance) {
        addLightning(rotation - (Math.PI / 12), 0);
        addLightning(rotation + (Math.PI / 13), 0);
    } else {
        addLightning(rotation, branchChance + 0.2);
    }
    return state;
}

module.exports = {
    EFFECT_FAST_LIGHTNING,
    checkToAddLightning,
};


const { effects, createEffect, addEffectToState } = require('effects');
const { getEnemyHitBox, damageEnemy } = require('enemies');
effects[EFFECT_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 4,
    },
    advanceEffect: advanceLightning,
    props: {
        loops: 1,
        damage: 5,
        charges: 8,
        branchChance: .9,
        rotation: 0,
        sfx: 'sfx/fastlightning.mp3',
    },
};
effects[EFFECT_FAST_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 1,
    },
    advanceEffect: advanceLightning,
    props: {
        loops: 1,
        damage: 1,
        charges: 0,
        branchChance: 0,
        rotation: 0,
    },
};
