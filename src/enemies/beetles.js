
const { PRIORITY_FIELD, requireImage, createAnimation, r } = require('animations');
const { ATTACK_EXPLOSION } = require('gameConstants');

const ENEMY_CARGO_BEETLE = 'cargoBeetle';
const ENEMY_EXPLOSIVE_BEETLE = 'explosiveBeetle';
const ENEMY_LIGHTNING_BEETLE = 'lightningBeetle';
const ATTACK_LIGHTNING_BOLT = 'lightningBolt';

module.exports = {
    ENEMY_CARGO_BEETLE,
    ENEMY_EXPLOSIVE_BEETLE,
    ENEMY_LIGHTNING_BEETLE,
    ATTACK_LIGHTNING_BOLT,
};

const { attacks, createAttack, addNeutralAttackToState, default_advanceAttack } = require('attacks');
const { enemyData } = require('enemies');
const { createLoot, getAdaptivePowerupType, addLootToState } = require('loot');

const beetleRectangle = r(100, 100, {hitbox: {left: 0, top: 16, width: 100, height: 84}});
enemyData[ENEMY_CARGO_BEETLE] = {
    animation: {
        frames: [
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/bfly1.png', PRIORITY_FIELD)},
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/bfly2.png', PRIORITY_FIELD)},
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/bfly3.png', PRIORITY_FIELD)},
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/bfly4.png', PRIORITY_FIELD)},
        ],
        frameDuration: 6,
    },
    deathAnimation: createAnimation('gfx/enemies/beetles/bflyded.png', beetleRectangle, {priority: PRIORITY_FIELD}),
    accelerate(state, enemy) {
        // Move up and down in a sin wave.
        const theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
        const vy = 2 * Math.sin(theta);
        return {...enemy, vy};
    },
    deathSound: 'sfx/flydeath.mp3',
    onDeathEffect(state, enemy) {
        const loot = createLoot(enemy.lootType || getAdaptivePowerupType(state));
        // These offsets are chosen to match the position of the bucket.
        loot.left = enemy.left + 50 - loot.width / 2;
        loot.top = enemy.top + 85 - loot.height / 2;
        return addLootToState(state, loot);
    },
    props: {
        life: 3,
        score: 0,
        speed: 1,
        vx: -3,
    },
},
enemyData[ENEMY_EXPLOSIVE_BEETLE] = {
    ...enemyData[ENEMY_CARGO_BEETLE],
    animation: {
        frames: [
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/expbfly1.png', PRIORITY_FIELD)},
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/expbfly2.png', PRIORITY_FIELD)},
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/expbfly3.png', PRIORITY_FIELD)},
            {...beetleRectangle, image: requireImage('gfx/enemies/beetles/expbfly4.png', PRIORITY_FIELD)},
        ],
        frameDuration: 6,
    },
    deathAnimation: createAnimation('gfx/enemies/beetles/expbflyded.png', beetleRectangle, {priority: PRIORITY_FIELD}),
    // deathSound: 'sfx/flydeath.mp3',
    onDeathEffect(state, enemy, playerIndex = 0) {
        // The bucket explodes on death.
        const explosion = createAttack(ATTACK_EXPLOSION, {
            // These offsets are chosen to match the position of the bucket.
            left: enemy.left + 30 + enemy.vx,
            top: enemy.top + 90 + enemy.vy,
            playerIndex,
            delay: 10,
            vx: enemy.vx, vy: enemy.vy,
            scale: 4
        });
        explosion.left -= explosion.width / 2;
        explosion.top -= explosion.height / 2;
        return addNeutralAttackToState(state, explosion);
    },
};
/*

Lightning Beetles, which when killed summon a vertical bolt of lightning across the screen to damage anything.
*/
enemyData[ENEMY_LIGHTNING_BEETLE] = {
    ...enemyData[ENEMY_CARGO_BEETLE],
    animation: createAnimation('gfx/enemies/beetles/gbeetle.png', beetleRectangle, {cols: 4}),
    deathAnimation: createAnimation('gfx/enemies/beetles/gbeetle.png', beetleRectangle, {x: 4}),
    // deathSound: 'sfx/flydeath.mp3',
    onDeathEffect(state, enemy, playerIndex = 0) {
        // The bucket explodes on death.
        const lightning = createAttack(ATTACK_LIGHTNING_BOLT, {
            // These offsets are chosen to match the position of the bucket.
            left: enemy.left + 30 + enemy.vx,
            top: 0,
            playerIndex,
            delay: 10,
            vy: 30,
            //vx: enemy.vx, vy: enemy.vy,
        });
        lightning.left -= lightning.width / 2;
        return addNeutralAttackToState(state, lightning);
    },
};

attacks[ATTACK_LIGHTNING_BOLT] = {
    animation: createAnimation('gfx/attacks/lightningstrike.png', r(15, 600, {
        hitbox: {left: 4, top: 0, width: 7, height: 600}
    }), {duration: 72}),
    advance(state, attack) {
        const neargroundKey = state.world.mgLayerNames[state.world.mgLayerNames.length - 1];
        return default_advanceAttack(state, {
            ...attack,
            top: (attack.top + 50) % 50 - 50,
            left: attack.left - state.world[neargroundKey].xFactor * state.world.vx
        });
    },
    props: {
        damage: 20, piercing: true,
        sfx: 'lightningBolt',
        explosion: true,
    },
};
