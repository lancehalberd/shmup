const EFFECT_SEAL_TARGET = 'sealTarget';

module.exports = {
    getSealTargetPosition,
    EFFECT_SEAL_TARGET,
};

const {
    PRIORITY_FIELD_BOSS,
    r,
    createAnimation,
} = require('animations');
const { getEnemyHitbox } = require('enemies');
const {
    effects,
    updateEffect, getEffectHitbox,
} = require('effects');

function getSealTargetPosition(state, effect, enemy) {
    const hitbox = getEnemyHitbox(state, enemy);
    const effectHitbox = getEffectHitbox(effect).translate(-effect.left, -effect.top);
    return {
        top: hitbox.top + hitbox.height / 2 - effectHitbox.top - effectHitbox.height / 2,
        left: hitbox.left - effectHitbox.left - effectHitbox.width / 2 - 100,
    };
}

effects[EFFECT_SEAL_TARGET] = {
    // This just crops the Finisher target to remove the word "Finisher" from it.
    animation: createAnimation('gfx/effects/crosshair.png',
        r(150, 58, { hitbox: { left: 46, top: 0, width: 55, height: 55 } }),
        {priority: PRIORITY_FIELD_BOSS},
    ),
    advanceEffect(state, effectIndex) {
        const effect = state.effects[effectIndex];
        const enemy = state.idMap[effect.enemyId];
        state = updateEffect(state, effectIndex, {tint: (state.world.time % 500 > 250) ? {color: 'white', amount: 0.5} : undefined});
        if (!enemy || enemy.dead || enemy.hidden) {
            return updateEffect(state, effectIndex, {done: true});
        }
        // Move the hitbox to be in front of the enemy.
        return updateEffect(state, effectIndex, getSealTargetPosition(state, effect, enemy));
    },
    props: {
        permanent: true,
    },
};
