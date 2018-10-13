
const {
    FRAME_LENGTH, WIDTH, HEIGHT,
    ENEMY_MONK,
    EFFECT_EXPLOSION,
    EFFECT_HUGE_EXPLOSION,
    ATTACK_BULLET, ATTACK_DEFEATED_ENEMY,
} = require('gameConstants');
const random = require('random');
const { PRIORITY_FIELD_BOSS, requireImage, createAnimation, r, a } = require('animations');
const { getNewSpriteState, getTargetVector } = require('sprites');
const { getGroundHeight, allWorlds } = require('world');

const priority = PRIORITY_FIELD_BOSS;

const WORLD_FIELD_BOSS = 'fieldBoss';
const layerNamesToClear = ['wheat', 'darkGrass', 'thickGrass', 'nearground', 'foreground'];
const treeFortAnimation = createAnimation('gfx/enemies/plainsboss/plainsbossbase.png', r(800, 600), {priority});
const forestEdgeAnimation = createAnimation('gfx/enemies/plainsboss/forestbeginbase.png', r(800, 600), {priority});
allWorlds[WORLD_FIELD_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        if (world.time < 500 &&
            (['nearground','foreground'].some(layerName => world[layerName].sprites.length) ||
                world.y > 0)
        ) {
            world = {
                ...world,
                targetFrames: 50 * 5 / 2,
                targetX: world.x + 1000,
                time: 0,
            };
        }
        const time = world.time + FRAME_LENGTH;
        if (time === 500) {
            world.nearground.sprites = [
                getNewSpriteState({
                    ...forestEdgeAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: forestEdgeAnimation,
                }),
                getNewSpriteState({
                    ...treeFortAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: treeFortAnimation,
                }),
            ];
            /*world.thickGrass.sprites = [
                getNewSpriteState({
                    ...forestEdgeAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: forestEdgeAnimation,
                })
            ];*/
            world.targetFrames = 400 / 2;
            world.targetX = world.x +  2 * WIDTH;
            world.bgm = 'bgm/boss.mp3';
            state = {...state, bgm: world.bgm};
        }
        if (world.targetFrames < 50) {
            world = {...world, targetFrames: world.targetFrames + 0.6};
        }
        if (time === 2500) {
            const lifebars = {};
            const treeSprite = world.nearground.sprites[0];
            let newEnemy = createEnemy(state, ENEMY_DOOR, {
                left: treeSprite.left + 638,
                top: treeSprite.top + 270,
            });
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(state, ENEMY_LARGE_TURRET, {
                left: treeSprite.left + treeSprite.width - 90,
                top: treeSprite.top + 70,
            });
            newEnemy.left -= newEnemy.width / 2;
            newEnemy.top -= newEnemy.height / 2;
            state = addEnemyToState(state, newEnemy);
            const smallTurrets = [
                [-125, 110], [-35, 130], [-130, 160],
                [-40, 200], [-125, 240], [-35, 245],
            ];
            for (const coords of smallTurrets) {
                newEnemy = createEnemy(state, ENEMY_SMALL_TURRET, {
                    left: treeSprite.left + treeSprite.width + coords[0],
                    top: treeSprite.top + coords[1],
                });
                newEnemy.left -= newEnemy.width / 2;
                newEnemy.top -= newEnemy.height / 2;
                state = addEnemyToState(state, newEnemy);
            }
            world = {...world, lifebars};
        }
        const largeTurret = state.enemies.filter(enemy => enemy.type === ENEMY_LARGE_TURRET)[0];
        // When the large turret becomes a target, add its lifebar to the screen.
        if (state.world.lifebars && !state.world.lifebars[largeTurret.id] &&
            enemyData[largeTurret.type].ready(state, largeTurret)
        ) {
            const turretLifebar = {
                left: 100, top: HEIGHT - 24, width: 600, height: 8, startTime: world.time,
            };
            world = {...world, lifebars: {...world.lifebars, [largeTurret.id]: turretLifebar}};
        }
        const turrets = state.enemies.filter(enemy => !enemy.dead && enemy.type === ENEMY_SMALL_TURRET);
        const door = state.enemies.filter(enemy => enemy.type === ENEMY_DOOR)[0];
        if (time > 2500) {
            if (largeTurret.dead && largeTurret.animationTime >= 1000) {
                return transitionToUpperForest(state);
            }
            if (!door) {
                return transitionToLowerForest(state);
            }
            const treeSprite = world.nearground.sprites[0];
            world = {...world, rightEdge: treeSprite.left + 630, spawnsDisabled: true};
            const minMonkTime = 4000 + 1000 * turrets.length;
            if (turrets.length <= 4 && time - (world.lastMonkTime || 0) >= minMonkTime && Math.random() > 0.9) {
                const treeSprite = world.nearground.sprites[0];
                const newEnemy = createEnemy(state, ENEMY_GROUND_MONK, {
                    left: treeSprite.left + treeSprite.width - 270,
                    top: treeSprite.top + treeSprite.height - 36,
                    // Normally monks walk slowly left to right to keep up with scrolling,
                    // but when the screen is still, the need to walk right to left to
                    // approach the player.
                    speed: -1.5,
                });
                newEnemy.left -= newEnemy.width / 2;
                newEnemy.top -= newEnemy.height / 2;
                state = addEnemyToState(state, newEnemy);
                world = {...world, lastMonkTime: time};
            }
            const minStickTime = 3000 + 1000 * turrets.length;
            // Sticks fall from the top of the screen until either boss is killed by the finisher.
            // We stop generation of sticks during the finisher because it looks bad to have
            // them fall during the finisher and especially during transition to the second stage.
            if (time - (world.lastStickTime || 0) >= minStickTime && Math.random() > 0.9
                && door && !door.dead && largeTurret && !largeTurret.dead
                && !state.players[0].usingFinisher
            ) {
                const treeSprite = world.nearground.sprites[0];
                const spawnX = Math.random() * 400 + treeSprite.left + 50;

                // Add a dust cloud to signify something happened when the enemy hit the ground.
                let leaf = createEffect(EFFECT_LEAF, {top: Math.random() * -30, left: spawnX - 20 - Math.random() * 40, vy: -2 + Math.random() * 4});
                leaf.left -= leaf.width / 2;
                state = addEffectToState(state, leaf);
                leaf = createEffect(EFFECT_LEAF, {top: Math.random() * -30, left: spawnX -20 + Math.random() * 40, animationTime: 500, vy: -2 + Math.random() * 4});
                leaf.left -= leaf.width / 2;
                state = addEffectToState(state, leaf);

                let stick = createEnemy(state, random.element([ENEMY_STICK_1, ENEMY_STICK_2, ENEMY_STICK_3]), {
                    left: spawnX,
                    top: -100,
                    vy: 0,
                    delay: 15,
                });
                stick.left -= stick.width / 2;
                state = addEnemyToState(state, stick);
                world = {...world, lastStickTime: time};
            }
        }
        world = {...world, time};
        state = {...state, world};
        return state;
    },
};

function transitionToFieldBoss(state) {
    const updatedWorld = {
        ...state.world,
        type: WORLD_FIELD_BOSS,
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

module.exports = {
    transitionToFieldBoss,
};

const { enemyData, createEnemy, addEnemyToState, updateEnemy } = require('enemies');

const smallTurretRectangle = r(41, 41);
const ENEMY_SMALL_TURRET = 'smallTurret';
enemyData[ENEMY_SMALL_TURRET] = {
    animation: createAnimation('gfx/enemies/plainsboss/sweetspot.png', smallTurretRectangle, {priority}),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/sweetspot4.png', smallTurretRectangle, {priority}),
    attackAnimation: {
        frames: [
            {...smallTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspot2.png', priority)},
            {...smallTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspot3.png', priority)},
            {...smallTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspot2.png', priority)},
        ],
        frameDuration: 12,
    },
    deathSound: 'sfx/explosion.mp3+0+0.5',
    onDeathEffect(state, enemy) {
        let delay = 6;
        for (let i = 0; i < 2; i++) {
            const explosion = createEffect(EFFECT_EXPLOSION, {
                sfx: 'sfx/explosion.mp3+0+0.5',
                delay,
            });
            delay += random.range(8, 12);
            explosion.left = enemy.left + (enemy.width - explosion.width ) / 2 + random.range(-15, 15);
            explosion.top = enemy.top + (enemy.height - explosion.height ) / 2 + random.range(-15, 15);
            state = addEffectToState(state, explosion);
        }
        return state;
    },
    isInvulnerable(state, enemy) {
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot(state, enemy) {
        if (enemy.left > WIDTH + 10) return state;
        // This is pretty ad hoc, but this code delays creating the bullet until the second
        // frame of the attack animation, since the first frame is a preparation frame.
        if (enemy.attackCooldownFramesLeft === Math.floor(enemy.attackCooldownFrames / 2)) {
            state = addTurretShot(state, enemy, {sdy: enemy.height / 2});
        }
        let shotCooldown = enemy.shotCooldown;
        if (shotCooldown === undefined) shotCooldown = random.element(enemy.shotCooldownFrames);
        if (shotCooldown > 0) return updateEnemy(state, enemy, {shotCooldown: shotCooldown - 1});
        shotCooldown = random.element(enemy.shotCooldownFrames);
        return updateEnemy(state, enemy, {shotCooldown, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames});
    },
    props: {
        life: 6,
        score: 200,
        stationary: true,
        bulletSpeed: 5,
        attackCooldownFrames: 36,
        shotCooldownFrames: [80, 120],
        persist: true,
    },
};

function addTurretShot(state, enemy, {tdx = 0, sdx = 0, sdy = 0, speedFactor = 1}) {
    let target = state.players[0].sprite;
    target = {...target, left: target.left + state.world.vx * 40 + tdx};
    let {dx, dy} = getTargetVector(enemy, target);
    if (!dx && !dy) dx = -1;
    const mag = Math.sqrt(dx * dx + dy * dy);
    const bullet = createAttack(ATTACK_BULLET, {
        left: enemy.left + sdx,
        top: enemy.top + sdy,
        vx: speedFactor * enemy.bulletSpeed * dx / mag,
        vy: speedFactor * enemy.bulletSpeed * dy / mag,
    });
    bullet.left -= bullet.width / 2;
    bullet.top -= bullet.height / 2;
    return addEnemyAttackToState(state, bullet);
}

const largeTurretRectangle = r(41, 41);
const ENEMY_LARGE_TURRET = 'largeTurret';
enemyData[ENEMY_LARGE_TURRET] = {
    animation: createAnimation('gfx/enemies/plainsboss/sweetspotlarge1.png', largeTurretRectangle, {priority}),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/sweetspotlarge4.png', largeTurretRectangle, {priority}),
    attackAnimation: {
        frames: [
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge2.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png', priority)},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge2.png', priority)},
        ],
        frameDuration: 12,
    },
    deathSound: 'sfx/explosion.mp3',
    onDeathEffect(state, enemy) {
        let delay = 6;
        for (let i = 0; i < 7; i++) {
            const explosion = createEffect(EFFECT_EXPLOSION, {
                sfx: 'sfx/explosion.mp3',
                delay,
            });
            delay += random.range(8, 12);
            if (i % 3 === 2) delay += 10;
            explosion.width *= 2;
            explosion.height *= 2;
            explosion.left = enemy.left + (enemy.width - explosion.width ) / 2 + random.range(-25, 25);
            explosion.top = enemy.top + (enemy.height - explosion.height ) / 2 + random.range(-25, 25);
            state = addEffectToState(state, explosion);
        }
        return state;
    },
    isInvulnerable(state, enemy) {
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    ready(state) {
        return state.enemies.filter(enemy => !enemy.dead && enemy.type === ENEMY_SMALL_TURRET).length <= 2;
    },
    shoot(state, enemy) {
        // Don't open up until 2 or fewer turrets are left.
        if (!this.ready(state, enemy)) return state;
        // This turret shoots four different times during its attack animation.
        if (enemy.attackCooldownFramesLeft === 54 || enemy.attackCooldownFramesLeft === 36) {
            state = addTurretShot(state, enemy, {tdx: 40 - Math.random() * 80, sdx: 10, sdy: enemy.height / 2});
        } else if (enemy.attackCooldownFramesLeft === 18 || enemy.attackCooldownFramesLeft === 72) {
            state = addTurretShot(state, enemy, {sdx: 10, sdy: enemy.height / 2, speedFactor: 1.4});
        }
        let shotCooldown = enemy.shotCooldown;
        if (shotCooldown === undefined) shotCooldown = random.element(enemy.shotCooldownFrames);
        if (shotCooldown > 0) return updateEnemy(state, enemy, {shotCooldown: shotCooldown - 1});
        shotCooldown = random.element(enemy.shotCooldownFrames);
        return updateEnemy(state, enemy, {shotCooldown, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames});
    },
    props: {
        life: 200,
        score: 1000,
        stationary: true,
        bulletSpeed: 6,
        attackCooldownFrames: 96,
        shotCooldownFrames: [120, 160],
        persist: true,
        boss: true,
    },
};
const ENEMY_GROUND_MONK = 'groundMonk';
enemyData[ENEMY_GROUND_MONK] = {
    ...enemyData[ENEMY_MONK],
    spawnAnimation: createAnimation('gfx/enemies/monks/robesclimb.png', r(49, 31), {duration: 500, priority}),
    props: {
        ...enemyData[ENEMY_MONK].props,
        life: 2,
        groundOffset: 5,
    },
};
const ENEMY_DOOR = 'door';
const doorRectangle = r(129, 275, {hitBox: {left: 22, top: 23, width: 96, height: 220}});
enemyData[ENEMY_DOOR] = {
    animation: {
        frames: [
            {...doorRectangle, image: requireImage('gfx/enemies/plainsboss/door1.png', priority)},
            {...doorRectangle, image: requireImage('gfx/enemies/plainsboss/door2.png', priority)},
            {...doorRectangle, image: requireImage('gfx/enemies/plainsboss/door3.png', priority)},
        ],
        frameDuration: 12,
    },
    deathAnimation: createAnimation('gfx/enemies/plainsboss/door3.png', doorRectangle, {priority}),
    updateState(state, enemy) {
        let animationTime = 0;
        if (enemy.life <= enemy.maxLife / 3) animationTime = 2 * FRAME_LENGTH * 12;
        else if (enemy.life <= 2 * enemy.maxLife / 3) animationTime = FRAME_LENGTH * 12;
        return updateEnemy(state, enemy, {animationTime});
    },
    onDeathEffect(state, enemy) {
        let delay = 6;
        for (let i = 0; i < 7; i++) {
            const explosion = createEffect(EFFECT_HUGE_EXPLOSION, {
                sfx: 'sfx/explosion.mp3',
                delay,
            });
            delay += random.range(8, 12);
            if (i % 3 === 2) delay += 10;
            explosion.width *= 2;
            explosion.height *= 2;
            explosion.left = enemy.left + (enemy.width - explosion.width ) / 2 + random.range(-40, 40);
            explosion.top = enemy.top + (enemy.height - explosion.height ) / 2 + random.range(-100, 100);
            state = addEffectToState(state, explosion);
        }
        return updateEnemy(state, enemy, {stationary: false, bounces: 2, vx: 2});
    },
    onHitGroundEffect(state, enemy) {
        if (enemy.bounces > 0) {
            return updateEnemy(state, enemy, {
                vy: -4 - 3 * enemy.bounces,
                bounces: enemy.bounces - 1
            });
        }
        // This prevents onHitGroundEffect from being called again for this enemy.
        return updateEnemy(state, enemy, {hitGround: true});
    },
    onDamageEffect(state, enemy) {
        if (!enemy.life || enemy.life % 3) return state;
        for (let i = 0; i < 2; i++) {
            const effect = createEffect(EFFECT_DOOR_DAMAGE, {
                top: enemy.top + 20 + 120 * i + Math.random() * 40,
                left: enemy.left + 20 + Math.random() * 90,
            });
            effect.top -= effect.height / 2;
            effect.left -= effect.width / 2;
            state = addEffectToState(state, effect);
        }
        return state;
    },
    props: {
        life: 2000,
        score: 500,
        stationary: true,
        doNotFlip: true,
        weakness: {[ATTACK_DEFEATED_ENEMY]: 300},
        boss: true,
    },
};
const ENEMY_STICK_1 = 'stick1';
const ENEMY_STICK_2 = 'stick2';
const ENEMY_STICK_3 = 'stick3';
enemyData[ENEMY_STICK_1] = {
    animation: createAnimation('gfx/enemies/plainsboss/branch1.png', r(80, 40), {priority}),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/branch4.png', r(80, 40), {priority}),
    accelerate: (state, enemy) => {
        if (enemy.top + enemy.height >= getGroundHeight(state)) {
            return {...enemy, dead: true, vx: 3+ Math.random() * 3, vy: -4};
        }
        return {...enemy, vy: enemy.vy + .3};
    },
    props: {
        life: 1,
        score: 0,
    },
};
enemyData[ENEMY_STICK_2] = {
    ...enemyData[ENEMY_STICK_1],
    animation: createAnimation('gfx/enemies/plainsboss/branch2.png', r(80, 40), {priority}),
};
enemyData[ENEMY_STICK_3] = {
    ...enemyData[ENEMY_STICK_1],
    animation: createAnimation('gfx/enemies/plainsboss/branch3.png', r(113, 24), {priority}),
};

const { transitionToUpperForest } = require('areas/fieldToUpperForest');
const { transitionToLowerForest } = require('areas/fieldToLowerForest');

const { createAttack, addEnemyAttackToState } = require('attacks');

const { createEffect, effects, addEffectToState, updateEffect } = require('effects');
const EFFECT_LEAF = 'leaf';
// Make the leaf scale from the center of its hitbox instead of the top left corner.
const leafGeometry = a({...r(40, 37), hitBox: r(30, 37)}, 0.5, 0.5);
effects[EFFECT_LEAF] = {
    animation: createAnimation('gfx/enemies/plainsboss/leaf.png', leafGeometry, {priority}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        /*if (effect.vy > 20) {
            return updateEffect(state, effectIndex, {xScale: -(effect.xScale || 1), vx: -effect.vx, vy: -2});
        }*/
        const xFactor = Math.cos(effect.animationTime / 100);
        const yFactor = Math.sin(effect.animationTime / 100);
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 1.5 - 2 * yFactor * yFactor,
            vx: 5 * xFactor * Math.abs(xFactor),
            xScale: (xFactor > 0) ? 1 : - 1
        });
    },
    props: {
        relativeToGround: true,
        loops: 20,
        vy: 1,
        vx: 0
    },
};
const EFFECT_DOOR_DAMAGE = 'doorDamage';
effects[EFFECT_DOOR_DAMAGE] = {
    animation: createAnimation('gfx/enemies/plainsboss/doorhurt.png', r(103,153), {duration: 20, priority}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 0.5,
            xScale: (effect.xScale * 4 + 1) / 5,
            yScale: (effect.yScale * 4 + 1) / 5,
        });
    },
    props: {
        relativeToGround: true,
        xScale: .1,
        yScale: .1,
    },
};


