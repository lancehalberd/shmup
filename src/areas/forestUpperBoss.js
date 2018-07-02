
const {
    FRAME_LENGTH, WIDTH, HEIGHT,
    EFFECT_EXPLOSION,
    ATTACK_BULLET, ATTACK_DEFEATED_ENEMY,
} = require('gameConstants');
const random = require('random');
const { requireImage, createAnimation, r } = require('animations');
const { getNewSpriteState, getTargetVector } = require('sprites');
const { applyCheckpointToState, allWorlds } = require('world');

const WORLD_UPPER_FOREST_BOSS = 'upperForestBoss';
const layerNamesToClear = ['largeTrunks', 'willows'];

const transitionToForestUpperBoss = (state) => {
    const updatedWorld = {
        ...state.world,
        type: WORLD_UPPER_FOREST_BOSS,
        time: 0,
        targetFrames: 50 * 5,
        targetY: -100,
    };
    for (const layerName of layerNamesToClear) {
        const sprites = updatedWorld[layerName].sprites.filter(sprite => sprite.left < WIDTH);
        updatedWorld[layerName] = {...updatedWorld[layerName], spriteData: false, sprites};
    }
    return {...state, world: updatedWorld};
}

const nestBaseAnimation = createAnimation('gfx/enemies/hornetnest/hornetbase.png', r(300, 600));
allWorlds[WORLD_UPPER_FOREST_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        if (world.time < 500 &&
            (layerNamesToClear.some(layerName => world[layerName].sprites.length) ||
                world.y > 0)
        ) {
            world = {
                ...world,
                targetFrames: 50 * 5 / 2,
                targetX: world.x + 1000,
                time: 0,
            }
        }
        const time = world.time + FRAME_LENGTH;
        if (time === 500) {
            world.willows.sprites = [
                getNewSpriteState({
                    ...nestBaseAnimation.frames[0],
                    top: 0,
                    left: 2 * WIDTH + 500,
                    animation: nestBaseAnimation,
                }),
            ];
            world.targetFrames = 400 / 2;
            world.targetX = world.x + 2 * WIDTH;
            world.bgm = 'bgm/boss.mp3';
            state = {...state, bgm: world.bgm};
        }
        if (world.targetFrames < 50) {
            world = {...world, targetFrames: world.targetFrames + 0.6};
        }
        if (time === 2500) {
            const lifebars = {};
            const nestSprite = world.willows.sprites[0];
            const connectedIds = [];
            let left = nestSprite.left - state.world.vx,
                top = nestSprite.top - state.world.vy;
            let newEnemy = createEnemy(ENEMY_HORNET_NEST_1, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, maxLife: newEnemy.life,
                startTime: world.time,
            };
            world = {...world, lifebars, spawnsDisabled: true};
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(ENEMY_HORNET_NEST_2, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(ENEMY_HORNET_NEST_3, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(ENEMY_HORNET_NEST_4, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(ENEMY_HORNET_NEST_5, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
        }
        world = {...world, time};
        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToForestUpperBoss,
};

const { enemyData, createEnemy, addEnemyToState, damageEnemy, getEnemyHitBox } = require('enemies');

const NEST_HEALTH = 200;
const ENEMY_HORNET_NEST_1 = 'horentNest1';
const ENEMY_HORNET_NEST_2 = 'horentNest2';
const ENEMY_HORNET_NEST_3 = 'horentNest3';
const ENEMY_HORNET_NEST_4 = 'horentNest4';
const ENEMY_HORNET_NEST_5 = 'horentNest5';
enemyData[ENEMY_HORNET_NEST_1] = {
    animation: createAnimation('gfx/enemies/hornetnest/nest5.png',
        r(300, 600, {hitBox: {left: 87, top: 33, width: 115, height: 105}})
    ),
    deathSound: 'sfx/explosion.mp3+0+0.5',
    // All nest pieces are damaged simultaneously.
    onDamageEffect(state, enemy, attack) {
        // The secondary flag prevents this from being triggered beyond the first
        // target.
        if (!attack.secondary) {
            for (let connectedId of enemy.connectedIds) {
                if (connectedId === enemy.id) continue;
                state = damageEnemy(state, connectedId,
                    {playerIndex: 0, damage: attack.damage, secondary: true}
                );
            }
        }
        return state;
    },
    onDeathEffect(state, enemy) {
        const hitBox = getEnemyHitBox(enemy)
        let delay = random.range(4, 6);
        for (let i = 0; i < 3; i++) {
            const explosion = createEffect(EFFECT_EXPLOSION, {
                sfx: 'sfx/explosion.mp3+0+0.5',
                delay,
            });
            delay += random.range(8, 12);
            explosion.left = hitBox.left + (hitBox.width - explosion.width ) / 2 + random.range(-15, 15);
            explosion.top = hitBox.top + (hitBox.height - explosion.height ) / 2 + random.range(-15, 15);
            state = addEffectToState(state, explosion);
        }
        return state;
    },
    props: {
        life: NEST_HEALTH,
        score: 200,
        hanging: true,
    },
};
enemyData[ENEMY_HORNET_NEST_2] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest4.png',
        r(300, 600, {hitBox: {left: 32, top: 134, width: 215, height:120}})
    ),
    props: { life: NEST_HEALTH * 0.8, hanging: true, },
};
enemyData[ENEMY_HORNET_NEST_3] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest3.png',
        r(300, 600, {hitBox: {left: 45, top: 195, width: 160, height:120}})
    ),
    props: { life: NEST_HEALTH * 0.6, hanging: true, },
};
enemyData[ENEMY_HORNET_NEST_4] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest2.png',
        r(300, 600, {hitBox: {left: 43, top: 204, width: 240, height:140}})
    ),
    props: { life: NEST_HEALTH * 0.4, hanging: true, },
};
enemyData[ENEMY_HORNET_NEST_5] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest1.png',
        r(300, 600, {hitBox: {left: 130, top: 302, width: 130, height:85}})
    ),
    props: { life: NEST_HEALTH * 0.2, hanging: true, },
};

const { createEffect, addEffectToState, } = require('effects');
