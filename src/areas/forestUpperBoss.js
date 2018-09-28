
const {
    FRAME_LENGTH, WIDTH, HEIGHT, GAME_HEIGHT,
    EFFECT_EXPLOSION,
} = require('gameConstants');
const random = require('random');
const { drawImage } = require('draw');
const { createAnimation, r, getFrame } = require('animations');
const { getNewSpriteState } = require('sprites');
const { allWorlds, getHazardHeight } = require('world');

const WORLD_FOREST_UPPER_BOSS = 'forestUpperBoss';
const layerNamesToClear = ['largeTrunks', 'willows'];

const transitionToForestUpperBoss = (state) => {
    const updatedWorld = {
        ...state.world,
        type: WORLD_FOREST_UPPER_BOSS,
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
allWorlds[WORLD_FOREST_UPPER_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        if (world.hazardHeight > 30) {
            const rate = 0.2;
            const sprites = [...world.ground.sprites];
            for (let i = 0; i < sprites.length; i++) {
                sprites[i] = {...sprites[i], top: sprites[i].top + rate};
            }
            world = {...world,
                hazardHeight: world.hazardHeight - rate,
                ground: {...world.ground, yOffset: world.ground.yOffset + rate, sprites},
            };

        }
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
        let lastSpawnTime = world.lastSpawnTime;
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
            let newEnemy = createEnemy(state, ENEMY_HORNET_NEST_1, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            world = {...world, lifebars, spawnsDisabled: true};
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(state, ENEMY_HORNET_NEST_2, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(state, ENEMY_HORNET_NEST_3, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(state, ENEMY_HORNET_NEST_4, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(state, ENEMY_HORNET_NEST_5, {
                left, top, connectedIds,
            });
            connectedIds.push(newEnemy.id);
            state = addEnemyToState(state, newEnemy);
            lastSpawnTime = 2500;
        }
        const nest = state.enemies.filter(enemy => enemy.type === ENEMY_HORNET_NEST_1)[0];
        const queen = state.enemies.filter(enemy => enemy.type === ENEMY_HORNET_QUEEN)[0];
        // Spawn the hornet queen at 60% health of nest
        if (nest && nest.life > 0 && !queen && nest.life / NEST_LIFE < 0.6 ) {
            const newEnemy = createEnemy(state, ENEMY_HORNET_QUEEN, {
                left: WIDTH,
                top: random.range(1, 3) * getHazardHeight(state) / 5,
            });
            state = addEnemyToState(state, newEnemy);
            lastSpawnTime = time;
            const lifebars = world.lifebars;
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 24, width: 600, height: 8, startTime: time,
            };
            world = {...world, lifebars};
        }
        if (time > 2500 && nest && !nest.dead) {
            const spawnPeriod = 1500 + 3500 * nest.life / NEST_LIFE;
            let enemyTypes = [ENEMY_HORNET_CIRCLER];
            if (nest.life < 0.66 * NEST_LIFE) enemyTypes.push(ENEMY_HORNET_DASHER);
            else if (nest.life < 0.25) enemyTypes = [ENEMY_HORNET_DASHER];
            if (time >= lastSpawnTime + spawnPeriod) {
                const newEnemy = createEnemy(state, random.element(enemyTypes), {
                    left: WIDTH,
                    top: random.range(1, 3) * getHazardHeight(state) / 5,
                });
                state = addEnemyToState(state, newEnemy);
                lastSpawnTime = time;
            }
        }
        if (time > 2500 && !nest) {
            return transitionToSky(state);
        }
        if (time > 2500 && queen && queen.dead && queen.top > GAME_HEIGHT) {
            return transitionToCity(state);
        }
        world = {...world, time, lastSpawnTime};
        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToForestUpperBoss,
};

const { transitionToCity } = require('areas/forestUpperToCity');
const { transitionToSky } = require('areas/forestUpperToSky');

const { enemyData, createEnemy, addEnemyToState, damageEnemy, getEnemyHitBox } = require('enemies');
const {
    ENEMY_HORNET,
    ENEMY_HORNET_CIRCLER,
    ENEMY_HORNET_DASHER,
    ENEMY_HORNET_QUEEN,
} = require('enemies/hornets');

const NEST_LIFE = 500;
const ENEMY_HORNET_NEST_1 = 'horentNest1';
const ENEMY_HORNET_NEST_2 = 'horentNest2';
const ENEMY_HORNET_NEST_3 = 'horentNest3';
const ENEMY_HORNET_NEST_4 = 'horentNest4';
const ENEMY_HORNET_NEST_5 = 'horentNest5';
const EFFECT_NEST_DAMAGE_LOWER = 'nestDamageLower';
const EFFECT_NEST_DAMAGE_UPPER = 'nestDamageUpper';
enemyData[ENEMY_HORNET_NEST_1] = {
    animation: createAnimation('gfx/enemies/hornetnest/nest5.png',
        r(300, 600, {hitBox: {left: 87, top: 33, width: 115, height: 105}})
    ),
    hurtAnimation: createAnimation('gfx/enemies/hornetnest/hornethurt5.png', r(300, 600)),
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
            if (enemy.life % 5) return state;
            const effect = createEffect(enemy.damageEffectType, {
                top: enemy.top + enemy.damageEffectOffset + Math.random() * 40,
                left: enemy.left - 20 + Math.random() * 40,
            });
            state = addEffectToState(state, effect);
        }
        return state;
    },
    onDeathEffect(state, enemy) {
        const hitBox = getEnemyHitBox(state, enemy);
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
        delay = 3;
        for (const enemyType of enemy.spawns) {
            let newEnemy = createEnemy(state, enemyType, {
                left: hitBox.left + hitBox.width / 2,
                top: hitBox.top + hitBox.height / 2,
                delay,
            });
            state = addEnemyToState(state, newEnemy);
            delay += 50;
        }
        return state;
    },
    drawOver(context, state, enemy) {
        if (enemy.dead || enemy.life >= NEST_LIFE / 10) return;
        const animation = enemyData[enemy.type].hurtAnimation;
        const frame = getFrame(animation, enemy.animationTime);
        drawImage(context, frame.image, frame, enemy);
    },
    props: {
        life: NEST_LIFE,
        score: 200,
        hanging: true,
        spawns: [],
        boss: true,
        damageEffectType: EFFECT_NEST_DAMAGE_UPPER,
        damageEffectOffset: 0,
    },
};
enemyData[ENEMY_HORNET_NEST_2] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest4.png',
        r(300, 600, {hitBox: {left: 32, top: 134, width: 215, height:120}})
    ),
    hurtAnimation: createAnimation('gfx/enemies/hornetnest/hornethurt4.png', r(300, 600)),
    props: {
        life: NEST_LIFE * 0.8, hanging: true,
        spawns: [ENEMY_HORNET, ENEMY_HORNET_DASHER, ENEMY_HORNET_DASHER, ENEMY_HORNET_CIRCLER],
        damageEffectType: EFFECT_NEST_DAMAGE_UPPER,
        damageEffectOffset: 100,
    },
};
enemyData[ENEMY_HORNET_NEST_3] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest3.png',
        r(300, 600, {hitBox: {left: 45, top: 195, width: 160, height:120}})
    ),
    hurtAnimation: createAnimation('gfx/enemies/hornetnest/hornethurt3.png', r(300, 600)),
    props: {
        life: NEST_LIFE * 0.6, hanging: true,
        spawns: [ENEMY_HORNET_DASHER, ENEMY_HORNET, ENEMY_HORNET_DASHER],
        damageEffectType: EFFECT_NEST_DAMAGE_LOWER,
        damageEffectOffset: -120,
    },
};
enemyData[ENEMY_HORNET_NEST_4] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest2.png',
        r(300, 600, {hitBox: {left: 43, top: 204, width: 240, height:140}})
    ),
    hurtAnimation: createAnimation('gfx/enemies/hornetnest/hornethurt2.png', r(300, 600)),
    props: {
        life: NEST_LIFE * 0.4, hanging: true,
        spawns: [/* queen spawns here */],
        damageEffectType: EFFECT_NEST_DAMAGE_LOWER,
        damageEffectOffset: -80,
    },
};
enemyData[ENEMY_HORNET_NEST_5] = {
    ...enemyData[ENEMY_HORNET_NEST_1],
    animation: createAnimation('gfx/enemies/hornetnest/nest1.png',
        r(300, 600, {hitBox: {left: 130, top: 302, width: 130, height:85}})
    ),
    hurtAnimation: createAnimation('gfx/enemies/hornetnest/hornethurt1.png', r(300, 600)),
    props: { life: NEST_LIFE * 0.2, hanging: true,
        spawns: [ENEMY_HORNET_CIRCLER, ENEMY_HORNET_CIRCLER],
        damageEffectType: EFFECT_NEST_DAMAGE_UPPER,
        damageEffectOffset: 280,
    },
};

const { effects, createEffect, addEffectToState, updateEffect } = require('effects');

effects[EFFECT_NEST_DAMAGE_LOWER] = {
    animation: createAnimation('gfx/enemies/hornetnest/hornethurteffect2.png', r(300, 600), {duration: 20}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 0.5,
           // xScale: (effect.xScale * 4 + 1) / 5,
           // yScale: (effect.yScale * 4 + 1) / 5,
        });
    },
    props: {
        relativeToGround: true,
        //xScale: .1,
        //yScale: .1,
    },
};
effects[EFFECT_NEST_DAMAGE_UPPER] = {
    ...effects[EFFECT_NEST_DAMAGE_LOWER],
    animation: createAnimation('gfx/enemies/hornetnest/hornethurteffect1.png', r(300, 600), {duration: 20}),
};

