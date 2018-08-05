const {
    FRAME_LENGTH,
} = require('gameConstants');
const {
    requireImage, r, a,
} = require('animations');

const EFFECT_LIGHTNING = 'lightning';
const EFFECT_FAST_LIGHTNING = 'fastLightning';
const EFFECT_ARC_LIGHTNING = 'arcLightning';

const lightningGeometry = a(r(50, 10), 0.5, 0.5);
const lightningFrames = [
    {...lightningGeometry, image: requireImage('gfx/attacks/chain1.png')},
    {...lightningGeometry, image: requireImage('gfx/attacks/chain2.png')},
    {...lightningGeometry, image: requireImage('gfx/attacks/chain3.png')},
    {...lightningGeometry, image: requireImage('gfx/attacks/chain4.png')},
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
        const enemy = state.idMap[state.enemies[i].id];
        if (!enemyIsActive(state, enemy)) continue;
        const hitBox = getEnemyHitBox(enemy);
        // The large lightning attack can only hit enemies in front of each bolt.
        if (type === EFFECT_LIGHTNING && hitBox.left + hitBox.width / 2 <= left) continue;
        const dx = hitBox.left + hitBox.width / 2 - left,
            dy = hitBox.top + hitBox.height / 2 - top;
        const radius = Math.sqrt(hitBox.width * hitBox.width + hitBox.height * hitBox.height) / 2;
        if (Math.sqrt(dx * dx + dy * dy) <= 50 * scale + radius) {
            targetRotations.push(Math.atan2(dy, dx));
            state = damageEnemy(state, enemy.id, {playerIndex: 0, damage});
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
    EFFECT_LIGHTNING,
    EFFECT_FAST_LIGHTNING,
    EFFECT_ARC_LIGHTNING,
    checkToAddLightning,
    lightningFrames,
};

const { effects, createEffect, addEffectToState, updateEffect } = require('effects');
const { getEnemyHitBox, damageEnemy, enemyIsActive } = require('enemies');
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
effects[EFFECT_ARC_LIGHTNING] = {
    animation: {
        frames: lightningFrames,
        frameDuration: 3,
    },
    advanceEffect(state, effectIndex) {
        const effect = state.effects[effectIndex];
        let p = effect.animationTime / effect.duration;
        const target = state.idMap[effect.enemyId];
        const done = effect.done || p >= 1 || (effect.enemyId && !target);
        if (done) {
            if (target && !target.dead) {
                const attack = {playerIndex: effect.playerIndex, damage: effect.damage};
                state = damageEnemy(state, effect.enemyId, attack);
                state = {...state, sfx: {...state.sfx, 'sfx/hit.mp3': true}};
            }
        } else {
            let tx = effect.tx, ty = effect.ty;
            if (target) {
                const hitBox = getEnemyHitBox(target);
                tx = hitBox.left + hitBox.width / 2;
                ty = hitBox.top + hitBox.height / 2;
            }
            const p1 = {
                x: (1 - p) * effect.sx + p * tx + effect.dx * p * (1 - p),
                y: (1 - p) * effect.sy + p * ty + effect.dy * p * (1 - p),
            };
            p = Math.min(1, p + 0.02);
            const p2 = {
                x: (1 - p) * effect.sx + p * tx + effect.dx * p * (1 - p),
                y: (1 - p) * effect.sy + p * ty + effect.dy * p * (1 - p),
            };
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const left = (p2.x + p1.x) / 2 - effect.width / 2;
            const top = (p2.y + p1.y) / 2 - effect.height / 2;
            const rotation = Math.atan2(dy, dx);
            return updateEffect(state, effectIndex, {done, left, top, rotation});
        }
        return updateEffect(state, effectIndex, {done});
    },
    props: {
        loops: 1,
        damage: 5,
        charges: 8,
        branchChance: .9,
        rotation: 0,
        sfx: 'arclightning',
    },
};
