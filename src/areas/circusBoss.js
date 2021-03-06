
const {
    FRAME_LENGTH, HEIGHT, WIDTH, GAME_HEIGHT,
    ATTACK_BULLET,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitbox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_CIRCUS_BOSS = 'circusBoss';

const groundAnimation = createAnimation('gfx/scene/circus/panelground.png', r(200, 80));

function transitionToCircusBoss(state) {
    const world = {
        ...state.world,
        y: 400,
        spawnsDisabled: true,
        type: WORLD_CIRCUS_BOSS,
        time: 0,
        targetFrames: 50 * 5,
        groundHeight: 40,
        ground: getNewLayer({
            xFactor: 1, yFactor: 1, yOffset: 0,
            spriteData: {
                tent: { animation: groundAnimation },
            },
        }),
        mgLayerNames: [...state.world.mgLayerNames, 'ground'],
    };
    return {...state, world};
}
allWorlds[WORLD_CIRCUS_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        let {targetFrames, targetX, targetY} = world;
        targetY = world.y;

        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};

        if (time === 500) {
            const lifebars = {};
            let newEnemy = createEnemy(state, ENEMY_FERRIS_WHEEL, {
                left: world.targetX - world.x + 300,
                top: -200,
            });
            const sourceId = newEnemy.id;
            state = addEnemyToState(state, newEnemy);
            // Add the 8 outer carts.
            for (let i = 0; i < 8; i++) {
                newEnemy = createEnemy(state, ENEMY_CART, {
                    sourceId,
                    rotationOffset: i * Math.PI * 2 / 8,
                    radius: wheelScale * 120,
                    // These will get set correctly on first update.
                    left: WIDTH,
                    top: 0,
                });
                state = addEnemyToState(state, newEnemy);
            }
            // Add the 4 inner carts.
            for (let i = 0; i < 4; i++) {
                newEnemy = createEnemy(state, ENEMY_CART, {
                    sourceId,
                    rotationOffset: i * Math.PI * 2 / 4 + Math.PI / 8,
                    radius: wheelScale * 65,
                    left: WIDTH,
                    top: 0,
                });
                state = addEnemyToState(state, newEnemy);
            }
            // Add the boss carts
            newEnemy = createEnemy(state, ENEMY_BOSS_CART, {
                sourceId,
                rotationOffset: 0,
                radius: 0,
                left: WIDTH,
                top: 0,
            });
            state = addEnemyToState(state, newEnemy);
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            world = {...world, lifebars, bgm: 'bgm/boss.mp3'};
            state = {...state, bgm: world.bgm};
        }
        const bossCart = state.enemies.filter(enemy => enemy.type === ENEMY_BOSS_CART)[0];
        if (time > 500 && !bossCart) {
            return transitionToOcean(state);
        }

        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToCircusBoss,
};
const { transitionToOcean } = require('areas/circusToOcean');

const {
    enemyData, createEnemy, addEnemyToState,
    updateEnemy, renderEnemyFrame, getEnemyHitbox,
} = require('enemies');
const { createAttack, addEnemyAttackToState } = require('attacks');
const { getHeroHitbox } = require('heroes');

const ENEMY_FERRIS_WHEEL = 'ferrisWheel';
const ferrisWheelGeometry = r(300, 300, {
    scaleX: 3, scaleY: 3,
    hitboxes: [],
});
const wheelAnimation = createAnimation('gfx/scene/circus/ferrissheet.png', ferrisWheelGeometry, {y: 1, x: 2, cols: 3});
const wheelScale = wheelAnimation.frames[0].scaleX;
enemyData[ENEMY_FERRIS_WHEEL] = {
    animation: createAnimation('gfx/scene/circus/ferrissheet.png', ferrisWheelGeometry),
    updateState(state, enemy) {
        // Set a cap on how fast the wheel can rotate.
        const vRotation = Math.max(-0.15, Math.min(0.15, enemy.vRotation * 0.995));
        return updateEnemy(state, enemy, {
            vRotation,
            wheelRotation: enemy.wheelRotation + vRotation,
        });
    },
    drawUnder(context, state, enemy) {
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        center[1] -= 20 * wheelScale;
        context.strokeStyle = 'black';
        context.lineWidth = 3 * wheelScale;
        context.beginPath();
        const r = 120 * wheelScale;
        for (let i = 0; i < 8; i++) {
            const theta = enemy.wheelRotation + i * 2 * Math.PI / 8;
            context.moveTo(center[0], center[1]);
            context.lineTo(center[0] + r * Math.cos(theta), center[1] + r * Math.sin(theta));
        }
        for (let i = 0; i < 4; i++) {
            const theta = enemy.wheelRotation + i * 2 * Math.PI / 4 + Math.PI / 8;
            context.moveTo(center[0], center[1]);
            context.lineTo(
                center[0] + 65 * wheelScale * Math.cos(theta),
                center[1] + 65 * wheelScale * Math.sin(theta)
            );
        }
        context.stroke();
    },
    drawOver(context, state, enemy) {
        let frameIndex = Math.floor(10 * enemy.wheelRotation / Math.PI) % wheelAnimation.frames.length;
        while (frameIndex < 0) frameIndex += wheelAnimation.frames.length;
        let frame = wheelAnimation.frames[frameIndex];
        renderEnemyFrame(context, state, enemy, frame);
    },
    props: {
        life: 1000,
        vx: 0,
        wheelRotation: 0,
        vRotation: 0.01,
        permanent: true,
        grounded: true,
    },
};

const ENEMY_CART = 'cart';
const ENEMY_BOSS_CART = 'bossCart';
const cartGeometry = r(53, 40, {
    scaleX: 2, scaleY: 2,
    hitboxes: [
        {left: 22, top: 0, width: 9, height: 15},
        {left: 2, top: 15, width: 49, height: 23},
    ],
});
const cartAnimation = createAnimation('gfx/scene/circus/cartferris.png', cartGeometry,
    {cols:3, frameMap: [0,2,1,2], duration: 24}
);
const cartDeathAnimation = createAnimation('gfx/scene/circus/cartferris.png', cartGeometry, {x:3});

enemyData[ENEMY_CART] = {
    animation: cartAnimation,
    deathAnimation: cartDeathAnimation,
    updateState(state, enemy) {
        if (enemy.dead) return state;
        const hitbox = getEnemyHitbox(state, enemy);
        const wheel = state.idMap[enemy.sourceId];
        const center = new Rectangle(getEnemyHitbox(state, wheel)).getCenter();
        center[1] -= 20 * wheelScale;
        // Math.cos here makes the carts pull down, but we want to pull them left, so
        // last remaining cart will stay on screen.
        if (enemy.type !== ENEMY_BOSS_CART) {
            state = updateEnemy(state, wheel, {
                vRotation: wheel.vRotation + Math.sin(wheel.wheelRotation + enemy.rotationOffset) * .0001,
            });
        }
        if (enemy.shotCooldown > 0) {
            state = updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - FRAME_LENGTH});
            enemy = state.idMap[enemy.id];
        } else if (hitbox.left + hitbox.width < WIDTH - 100 && hitbox.top + hitbox.height < GAME_HEIGHT - 100) {
            state = this.shootBullets(state, enemy);
            enemy = state.idMap[enemy.id];
        }
        return updateEnemy(state, enemy, {
            left: center[0] + Math.cos(wheel.wheelRotation + enemy.rotationOffset) * enemy.radius - hitbox.width / 2,
            top: center[1] + Math.sin(wheel.wheelRotation + enemy.rotationOffset) * enemy.radius - 10,
        });
    },
    shootBullets(state, enemy) {
        const numCarts = state.enemies.filter(e => !e.dead && e.type === ENEMY_CART).length;
        const numBullets = Math.max(1, 1 + (12 - numCarts) / 2);
        const spread = (numBullets - 1) * Math.PI / 10;
        // Add a little randomness
        const base = Math.PI + Math.PI / 20 - Math.random() * Math.PI / 40;
        for (let i = 0; i <= numBullets; i++) {
            const theta = base - spread / 2 + i * spread / numBullets;
            state = this.shootBullet(state, enemy, theta);
        }
        return updateEnemy(state, enemy, {shotCooldown: 4000});
    },
    shootBullet(state, enemy, theta) {
        const hitbox = getEnemyHitbox(state, enemy);
        const bullet = createAttack(ATTACK_BULLET, {
            vx: Math.cos(theta) * 5 - state.world.vx,
            vy: Math.sin(theta) * 5,
            left: hitbox.left + hitbox.width / 10,
            top: hitbox.top + hitbox.height * 0.6,
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    onDamageEffect(state, enemy, attack) {
        const wheel = state.idMap[enemy.sourceId];
        return updateEnemy(state, wheel, {
            vRotation: wheel.vRotation - Math.sin(wheel.wheelRotation + enemy.rotationOffset) * .003 * attack.damage,
        });
    },
    props: {
        life: 50,
        shotCooldown: 4000,
        vx: 0,
        hanging: true,
        permanent: true,
    },
};
enemyData[ENEMY_BOSS_CART] = {
    ...enemyData[ENEMY_CART],
    isInvulnerable(state, enemy) {
        return this.isEnraged(state, enemy);
    },
    isEnraged(state, enemy) {
        return enemy.enragedTimer > 0;
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        let wheel = state.idMap[enemy.sourceId];
        if (enemy.enragedTimer > 0) {
            state = updateEnemy(state, wheel, {
                vRotation: Math.max(-0.15, wheel.vRotation - 0.002),
            });
            wheel = state.idMap[wheel.id];
            state = updateEnemy(state, enemy, {
                enragedTimer: enemy.enragedTimer - FRAME_LENGTH,
            });
            enemy = state.idMap[enemy.id];
        }
        // Tint increases/decrease depending on whether the spider is enraged.
        let tintAmount = enemy.tintAmount;
        tintAmount += this.isEnraged(state, enemy) ? 0.02 : -0.04;
        tintAmount = Math.max(0, Math.min(1, tintAmount));
        const maxTint = 0.4 + 0.1 * Math.cos(state.world.time / 100);
        state = updateEnemy(state, enemy, {
            tintAmount,
            tint: {color: 'red', amount: maxTint * enemy.tintAmount},
        });
        enemy = state.idMap[enemy.id];

        if (enemy.shotCooldown > 0) {
            state = updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - FRAME_LENGTH});
            enemy = state.idMap[enemy.id];
        } else {
            state = this.shootBullets(state, enemy);
            enemy = state.idMap[enemy.id];
        }
        const hitbox = getEnemyHitbox(state, enemy);
        const center = new Rectangle(getEnemyHitbox(state, wheel)).getCenter();
        center[1] -= 20 * wheelScale;
        return updateEnemy(state, enemy, {
            left: center[0] + Math.cos(wheel.wheelRotation + enemy.rotationOffset) * enemy.radius - hitbox.width / 2,
            top: center[1] + Math.sin(wheel.wheelRotation + enemy.rotationOffset) * enemy.radius - 10,
        });
    },
    shootBullets(state, enemy) {
        const hitbox = getEnemyHitbox(state, enemy);
        const x = hitbox.left + hitbox.width / 10;
        const y = hitbox.top + hitbox.height * 0.6;
        const playerCenter = new Rectangle(getHeroHitbox(state.players[0])).getCenter();
        const numCarts = state.enemies.filter(e => !e.dead && e.type === ENEMY_CART).length;
        const numBullets = Math.max(1, 2 * (12 - numCarts));
        const spread = Math.min(Math.PI * 4 / 3, (numBullets - 1) * Math.PI / 10);
        // Center on the player.
        const base = Math.atan2(playerCenter[1] - y, playerCenter[0] - x);
        for (let i = 0; i <= numBullets; i++) {
            const theta = base - spread / 2 + i * spread / numBullets;
            state = this.shootBullet(state, enemy, theta);
        }
        // Shoot more often the fewer carts remain.
        let shotCooldown = 1500 + 500 * numCarts;
        if (this.isEnraged(state, enemy)) {
            shotCooldown /= 3;
        }
        return updateEnemy(state, enemy, {shotCooldown});
    },
    onDamageEffect(state, enemy) {
        let enrageAt = enemy.enrageAt || enemy.maxLife * (1 - enemy.enrageThreshold);
        if (enemy.life <= 0 || enemy.life > enrageAt) return state;
        enrageAt = enrageAt - enemy.maxLife * enemy.enrageThreshold;
        // Hack: keep enrageAt from becoming falsey and resetting.
        if (!enrageAt) enrageAt = -1;
        return updateEnemy(state, enemy, {
            enrageAt, enragedTimer: 3000
        });
    },
    props: {
        life: 400,
        shotCooldown: 1000,
        vx: 0,
        hanging: true,
        permanent: true,
        boss: true,
        enrageThreshold: 0.2,
        tintAmount: 0,
    },
};
