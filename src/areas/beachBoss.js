
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
    HERO_BEE,
    ATTACK_BULLET,
} = require('gameConstants');
const { drawImage } = require('draw');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame } = require('animations');
const { allWorlds } = require('world');

const WORLD_BEACH_BOSS = 'beachBoss';
module.exports = {
    transitionToBeachBoss,
};
const { transitionToOcean } = require('areas/beachToOcean');

const {
    enemyData, setMode, damageEnemy,
    createEnemy, addEnemyToState, removeEnemy, updateEnemy,
    renderEnemyFrame, getEnemyHitbox, isIntersectingEnemyHitboxes
} = require('enemies');
const { getHeroHitbox, updatePlayer, isPlayerInvulnerable, } = require('heroes');
const { attacks, createAttack, addEnemyAttackToState } = require('attacks');

function transitionToBeachBoss(state) {
    const world = {
        ...state.world,
        spawnsDisabled: true,
        type: WORLD_BEACH_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_BEACH_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        let {targetFrames, targetX, targetY} = world;
        // Stop the camera while the crab is dead or the finisher is being used.
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        if (state.players[0].usingFinisher || (crab && crab.dead && crab.left < WIDTH / 3)) {
            targetX = world.x;
        } else {
            targetX = Math.max(world.targetX, world.x + 1000);
        }
        targetFrames = 150 * 5;
        targetY = world.y;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};

        if (time === 500) {
            const lifebars = {};
            let newEnemy = createEnemy(state, ENEMY_CRAB, {
                left: WIDTH,
                top: HEIGHT,
            });
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 24, width: 600, height: 8, startTime: world.time,
            };
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(state, ENEMY_CRAB_RIDER, {
                left: WIDTH,
                top: HEIGHT,
            });
            state = addEnemyToState(state, newEnemy);
            world = {...world, lifebars, bgm: 'bgm/boss.mp3'};
            state = {...state, bgm: world.bgm};
        }
        const rider = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB_RIDER)[0];
        if (time > 500 && !rider) {
            return transitionToOcean(state);
        }

        state = {...state, world};
        return state;
    },
};

const crabGeometry = r(375, 300, {
    scaleX: 2, scaleY: 2,
    hitbox: {left: 0, top: 0, width: 375, height: 290},
    hitboxes: [
        {left: 152, top: 75, width: 20, height: 40},
        {left: 202, top: 75, width: 20, height: 40}
    ]
});
const bodyAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {cols: 2});
const bodyDeadAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 2, cols: 2});
const legsAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {rows: 2, cols: 5, frameMap: [4, 5]});
legsAnimation.frames[0].hitboxes = [
    {"left":3,"width":118,"top":208,"height":88},
    {"left":22,"width":122,"top":175,"height":30},
    {"left":41,"width":55,"top":164,"height":10},
    {"left":255,"width":122,"top":213,"height":79},
    {"left":232,"width":109,"top":170,"height":43},
    {"left":216,"width":66,"top":155,"height":13},
    {"left":235,"width":45,"top":128,"height":26},
    {"left":245,"width":26,"top":111,"height":14},
]
legsAnimation.frames[1].hitboxes = [
    {"left":24,"width":97,"top":208,"height":88},
    {"left":34,"width":110,"top":175,"height":30},
    {"left":41,"width":55,"top":164,"height":10},
    {"left":255,"width":91,"top":213,"height":79},
    {"left":232,"width":109,"top":170,"height":43},
    {"left":216,"width":66,"top":155,"height":13},
    {"left":235,"width":45,"top":128,"height":26},
    {"left":245,"width":26,"top":111,"height":14},
];

const mouthAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 1, y: 1});
const mouthOpenAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 2, y: 1});
const clawAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 3, y: 1});
clawAnimation.frames[0].hitboxes = [
    {"left":86,"width":33,"top":106,"height":76},
    {"left":123,"width":19,"top":117,"height":49},
];
const clawAttackAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 2, y: 2, cols: 3, frameMap: [0,1,2,1,0]});
clawAttackAnimation.frames[0].hitboxes = [
    {"left":104,"width":54,"top":66,"height":100},
];
clawAttackAnimation.frames[1].hitboxes = [
    {"left":122,"width":30,"top":10,"height":157},
    {"left":154,"width":23,"top":10,"height":74},
];
clawAttackAnimation.frames[1].hitboxes = [
    {"left":126,"width":33,"top":0,"height":170},
];

const ENEMY_CRAB = 'crab';
enemyData[ENEMY_CRAB] = {
    animation: bodyAnimation,
    deathAnimation: bodyDeadAnimation,
    isInvulnerable(state, enemy) {
        return this.isEnraged(state, enemy);
    },
    isEnraged(state, enemy) {
        return enemy.enragedAttacks > 0;
    },
    updateState(state, enemy) {
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        let {vx} = enemy;
        const heroCenter = new Rectangle(getHeroHitbox(state.players[0])).getCenter();
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        if (state.players[0].usingFinisher) {
            return setMode(state, enemy, 'walk');
        }
        if (enemy.dead) {
            const rider = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB_RIDER)[0];
            if (rider && !state.world.lifebars[rider.id]) {
                const lifebars = {
                    ...state.world.lifebars
                }
                lifebars[rider.id] = {
                    left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: state.world.time,
                };
                state = {...state, world: {...state.world, lifebars}};
            }
            if (enemy.animationTime >= 15000 || enemy.left < -100) {
                state = updateEnemy(state, rider, {life: Math.max(rider.life, 25)});
                state = updateEnemy(state, enemy, {life: enemy.maxLife / 3, dead: false});
                enemy = state.idMap[enemy.id];
                return setMode(state, enemy, 'prepareToCharge');
            }
            return state;
        }
        if (enemy.mode === 'walk') {
            if (enemy.left > WIDTH / 2) {
                vx = 0;
                state = updateEnemy(state, enemy, {animationTime: 0});
                enemy = state.idMap[enemy.id];
            } else {
                vx = state.world.vx - 0.5;
            }
            if (enemy.modeTime >= 3000) {
                if (enemy.left < WIDTH / 3) {
                    state = setMode(state, enemy, 'prepareToCharge');
                    enemy = state.idMap[enemy.id];
                } else {
                    state = setMode(state, enemy, 'bubbles');
                    enemy = state.idMap[enemy.id];
                }
            }
        } else if (enemy.mode === 'prepareToCharge') {
            const dx = heroCenter[0] - (center[0] - 140);
            vx = (dx > 0) ? enemy.speed : -enemy.speed;
            state = setMode(state, enemy, 'charge');
            enemy = state.idMap[enemy.id];
        } else if (enemy.mode === 'bubbles') {
            vx = 0;
            state = updateEnemy(state, enemy, {animationTime: 0});
            enemy = state.idMap[enemy.id];
            if (enemy.modeTime === 20) {
                state = {...state, sfx: {...state.sfx, blowBubbles: true}};
            }
            if (enemy.modeTime % 240 === 0) {
                const bubble = createEnemy(state, random.element([ENEMY_BUBBLE_SHOT, ENEMY_BUBBLE, ENEMY_BUBBLE, ENEMY_BUBBLE]), {
                    left: enemy.left + 380, top: enemy.top + 235,
                    vx: -1 -enemy.modeTime / 400,
                    vy: Math.random() * 2 - 6 + enemy.modeTime / 200,
                    scaleX: 0.2,
                    scaleY: 0.2,
                    sourceId: enemy.id,
                    sourceOffset: [380, 235],
                });
                bubble.left -= bubble.width / 2;
                bubble.height -= bubble.height / 2;
                state = addEnemyToState(state, bubble);
            }
            if (enemy.modeTime >= 2000) {
                state = setMode(state, enemy, 'walk');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'charge') {
            const dx = heroCenter[0] - (center[0] - 140);
            if (dx * vx < 0) {
                vx = 0;
                state = setMode(state, enemy, 'prepareClawAttack');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'prepareClawAttack') {
            state = updateEnemy(state, enemy, {animationTime: 0});
            enemy = state.idMap[enemy.id];
            if (enemy.modeTime >= 500 || (this.isEnraged(state, enemy) && enemy.modeTime >= 200)) {
                state = setMode(state, enemy, 'clawAttack');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'clawAttack') {
            if (enemy.modeTime >= clawAttackAnimation.frames.length * clawAttackAnimation.frameDuration * FRAME_LENGTH) {
                if (enemy.enragedAttacks > 1) {
                    state = updateEnemy(state, enemy, {enragedAttacks: enemy.enragedAttacks - 1});
                    enemy = state.idMap[enemy.id];
                    state = setMode(state, enemy, 'prepareToCharge');
                    enemy = state.idMap[enemy.id];
                } else if (enemy.enragedAttacks === 1) {
                    state = setMode(state, enemy, 'enragedBubbles');
                    enemy = state.idMap[enemy.id];
                } else {
                    state = setMode(state, enemy, 'reset');
                    enemy = state.idMap[enemy.id];
                }
            }
        } else if (enemy.mode === 'enragedBubbles') {
            vx = 0;
            state = updateEnemy(state, enemy, {animationTime: 0});
            enemy = state.idMap[enemy.id];
            if (enemy.modeTime === 20 || enemy.modeTime === 520 || enemy.modeTime === 1020) {
                state = {...state, sfx: {...state.sfx, blowBubbles: true}};
            }
            if (enemy.modeTime % 240 === 0) {
                const theta = Math.PI / 2 - 2 * Math.PI * enemy.modeTime / 3000;
                const bubble = createEnemy(state, random.element([ENEMY_BUBBLE_SHOT, ENEMY_BUBBLE, ENEMY_BUBBLE]), {
                    left: enemy.left + 380, top: enemy.top + 235,
                    vx: 4 * Math.cos(theta),
                    vy: 4 * Math.sin(theta),
                    scaleX: 0.2,
                    scaleY: 0.2,
                    sourceId: enemy.id,
                    sourceOffset: [380, 235],
                });
                bubble.left -= bubble.width / 2;
                bubble.height -= bubble.height / 2;
                state = addEnemyToState(state, bubble);
            }
            if (enemy.modeTime >= 3000) {
                state = updateEnemy(state, enemy, {enragedAttacks: 0});
                enemy = state.idMap[enemy.id];
                state = setMode(state, enemy, 'reset');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'reset') {
            if (enemy.left < WIDTH / 2) {
                vx = state.world.vx + 5;
            } else {
                state = setMode(state, enemy, 'walk');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'enraging') {
            if (enemy.modeTime >= 1000) {
                state = setMode(state, enemy, 'prepareToCharge');
                enemy = state.idMap[enemy.id];
            }
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
        return updateEnemy(state, enemy, {vx});
    },
    drawOver(context, state, enemy) {
        let animationTime = enemy.dead ? 0 : enemy.animationTime;
        let frame = getFrame(legsAnimation, animationTime);
        renderEnemyFrame(context, state, enemy, frame);
        let animation = enemy.mode === 'bubbles' ? mouthOpenAnimation : mouthAnimation;
        frame = getFrame(animation, animationTime);
        renderEnemyFrame(context, state, enemy, frame);
        frame = getFrame(this.getClawAnimation(state, enemy), animationTime);
        renderEnemyFrame(context, state, enemy, frame);
    },
    getClawAnimation(state, enemy) {
        return enemy.mode === 'clawAttack' || enemy.mode === 'prepareClawAttack' ? clawAttackAnimation : clawAnimation;
    },
    getExtraHitboxes(state, enemy, getDamageBoxes) {
        // legs+claws are not targetable, but they do damage the player.
        if (!getDamageBoxes) return [];
        let animationTime = enemy.dead ? 0 : enemy.animationTime;
        let frame = getFrame(legsAnimation, animationTime);
        const legHitboxes = frame.hitboxes || [frame.hitbox || new Rectangle(frame).moveTo(0, 0)];
        frame = getFrame(this.getClawAnimation(state, enemy), animationTime);
        const armHitboxes = frame.hitboxes || [frame.hitbox || new Rectangle(frame).moveTo(0, 0)];
        return [...legHitboxes, ...armHitboxes];
    },
    props: {
        life: 150,
        speed: 8,
        boss: false,
        persist: true,
        mode: 'walk',
        grounded: true,
        modeTime: 0,
        doNotFling: true,
        permanent: true,
        tintAmount: 0,
    },
};

const ENEMY_CRAB_RIDER = 'crabRider';
const crabRiderGeometry = r(375, 300, {
    scaleX: 2, scaleY: 2,
    hitbox: {left: 172, top: 75, width: 24, height: 40},
});
const monkAnimation = createAnimation('gfx/enemies/crab/crab.png', crabRiderGeometry, {x: 4, y: 1});
const monkAttackAnimation = createAnimation('gfx/enemies/crab/crab.png', crabRiderGeometry, {x: 0, y: 2});
const monkDeathAnimation = createAnimation('gfx/enemies/crab/crab.png', crabRiderGeometry, {x: 1, y: 2});
enemyData[ENEMY_CRAB_RIDER] = {
    animation: monkAnimation,
    attackAnimation: monkAttackAnimation,
    deathAnimation: monkDeathAnimation,
    updateState(state, enemy) {
        if (enemy.dead) return state;
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        if (crab.dead && enemy.mode === 'passive') {
            state = setMode(state, enemy, 'preparing');
            enemy = state.idMap[enemy.id];
        }
        state = updateEnemy(state, enemy, {
            modeTime: enemy.modeTime + FRAME_LENGTH,
            //life: enemy.maxLife / 10,
            //mode: 'preparing',
            left: crab.left, top: crab.top,
        });
        enemy = state.idMap[enemy.id];
        if (enemy.snaredForFinisher) return state;
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        const playerCenter = new Rectangle(getHeroHitbox(state.players[0])).getCenter();
        const left = center[0] - 35;
        const top = center[1] - 5;
        let theta = Math.atan2(playerCenter[1] - center[1], playerCenter[0] - center[0]);
        function shootBullet(theta) {
            state = updateEnemy(state, enemy, {lastShot: state.world.time});
            enemy = state.idMap[enemy.id];
            const bullet = createAttack(ATTACK_BULLET, {
                vx: Math.cos(theta) * 6,
                vy: Math.sin(theta) * 6,
                left,
                top,
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        }
        const speedFactor = crab.dead ? 2 : 1;
        const lengthFactor = 4 - Math.floor(4 * enemy.life / enemy.maxLife);
        const bulletDelay = 400;
        if (enemy.mode === 'passive' || !this.canShoot(state, enemy)) {
            if (enemy.mode !== 'passive' && enemy.mode !== 'preparing') {
                state = setMode(state, enemy, 'preparing');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'preparing') {
            if (enemy.modeTime > 1500 / speedFactor) {
                const modeIndex = Math.floor(lengthFactor * Math.random()) % 5;
                const newMode = ['bulletStream', 'bulletSpray', 'alternatingSpray', 'bulletHell', 'bulletHell'][modeIndex];
                state = setMode(state, enemy, newMode);
                enemy = state.idMap[enemy.id];
            }
        } else {
            if (enemy.mode === 'bulletStream') {
                if (enemy.modeTime % bulletDelay === 0) {
                    shootBullet(theta);
                }
            }
            if (enemy.mode === 'bulletSpray') {
                if (enemy.modeTime % (2 * bulletDelay) === 0) {
                    shootBullet(theta - 2 * Math.PI / 6);
                    shootBullet(theta - Math.PI / 6);
                    shootBullet(theta);
                    shootBullet(theta + Math.PI / 6);
                    shootBullet(theta + 2 * Math.PI / 6);
                }
            }
            if (enemy.mode === 'alternatingSpray') {
                if (enemy.modeTime % (4 * bulletDelay) === 0) {
                    shootBullet(theta - 3 * Math.PI / 12);
                    shootBullet(theta - Math.PI / 12);
                    shootBullet(theta + Math.PI / 12);
                    shootBullet(theta + 3 * Math.PI / 12);
                }
                if (enemy.modeTime % (4 * bulletDelay) === 2 * bulletDelay) {
                    shootBullet(theta - 2 * Math.PI / 6);
                    shootBullet(theta - Math.PI / 6);
                    shootBullet(theta);
                    shootBullet(theta + Math.PI / 6);
                    shootBullet(theta + 2 * Math.PI / 6);
                }
            }
            if (enemy.mode === 'bulletHell') {
                if (enemy.modeTime % bulletDelay === 0) {
                    theta = 3 * Math.PI / 2 - enemy.modeTime / bulletDelay / 5;
                    shootBullet(theta - 2 * Math.PI / 6);
                    shootBullet(theta - Math.PI / 6);
                    shootBullet(theta);
                    shootBullet(theta + Math.PI / 6);
                    shootBullet(theta + 2 * Math.PI / 6);
                }
            }
            if (enemy.modeTime >= 4 * bulletDelay * lengthFactor) {
                state = setMode(state, enemy, 'preparing');
                enemy = state.idMap[enemy.id];
            }
        }
        enemy = state.idMap[enemy.id];
        return state
    },
    canShoot(state, enemy) {
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        return !enemy.dead && !enemy.snaredForFinisher &&
            (crab.dead || crab.mode === 'walk' || crab.mode === 'bubbles');
    },
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode !== 'passive') return this.attackAnimation;
        return this.animation;
    },
    getHitboxes(state, enemy) {
        // The rider is not targetable while the crab is active.
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        if (!crab.dead) return [];
        const frame = getFrame(this.attackAnimation, enemy.animationTime);
        return frame.hitboxes || [frame.hitbox || new Rectangle(frame).moveTo(0, 0)];
    },
    drawOver(context, state, enemy) {
        if (
            enemy.mode === 'passive' || enemy.mode === 'preparing' ||
            !this.canShoot(state, enemy) || state.world.time - enemy.lastShot < 200
        )  {
            return;
        }

        const animation = attacks[ATTACK_BULLET].animation;
        const frame = getFrame(animation, enemy.animationTime);
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        const left = center[0] - 35 - frame.width / 2;
        const top = center[1] - 5 - frame.height / 2;
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(left, top));
    },
    onDamageEffect(state, enemy) {
        let enrageAt = enemy.enrageAt || enemy.maxLife * (1 - enemy.enrageThreshold);
        if (enemy.life <= 0 || enemy.life > enrageAt) return state;
        enrageAt = enrageAt - enemy.maxLife * enemy.enrageThreshold;
        // Hack: keep enrageAt from becoming falsey and resetting.
        if (!enrageAt) enrageAt = -1;
        state = updateEnemy(state, enemy, {
            enrageAt,
        });
        enemy = state.idMap[enemy.id];
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        if (crab.dead)  {
            state = updateEnemy(state, crab, {
                life: crab.maxLife / 3,
                dead: false,
                mode: 'enraging',
                modeTime: 0,
                enragedAttacks: 4,
                animationTime: 0,
            });
        }
        return setMode(state, enemy, 'preparing');
    },
    props: {
        life: 200,
        boss: true,
        hanging: true,
        doNotFling: true,
        permanent: true,
        mode: 'passive',
        //mode: 'preparing',
        lastShot: 0,
        modeTime: 0,
        enrageThreshold: 0.25,
    },
};

const bubbleGeometry = r(50, 50, {
    scaleX: 2, scaleY: 2,
    hitbox: {left: 5, top: 5, width:40, height: 40}
});
const attachedBubbleGeometry = r(50, 50, {
    scaleX: 2, scaleY: 2,
    hitbox: {left: -1000, top: -1000, width: 2050, height: 2050},
});
const ENEMY_BUBBLE = 'bubble';
const ENEMY_BUBBLE_SHOT = 'bubbleShot';
enemyData[ENEMY_BUBBLE] = {
    animation: createAnimation('gfx/enemies/crab/bubble.png', bubbleGeometry, {cols: 3}),
    attachedAnimation: createAnimation('gfx/enemies/crab/bubble.png', attachedBubbleGeometry, {cols: 3}),
    deathAnimation: createAnimation('gfx/enemies/crab/bubblepop.png', r(75, 75)),
    deathSound: 'bubblePop',
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.attached) return this.attachedAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead) {
            if (enemy.animationTime > 200) return removeEnemy(state, enemy);
            return state;
        }
        if (enemy.scaleX < 1) {
            state = updateEnemy(state, enemy, {
                scaleX: Math.min(1, enemy.scaleX * 1.05),
                scaleY: Math.min(1, enemy.scaleY * 1.05),
            });
            enemy = state.idMap[enemy.id];
        }
        const player = state.players[0];
        const heroHitbox = getHeroHitbox(player);
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        if (enemy.attached) {
            if (player.invulnerableFor > 0) return updateEnemy(state, enemy, {attached: 0});
            state = updatePlayer(state, 0, {cannotSwitchFrames: 10}, {
                vx: player.sprite.vx * 0.5,
                vy: -2,
            });
            const heroCenter = new Rectangle(heroHitbox).getCenter();
            return updateEnemy(state, enemy, {
                vx: 0, vy: 0,
                left: enemy.left + heroCenter[0] - center[0],
                top: enemy.top + heroCenter[1] - center[1],
            })
        }
        if (!player.cannotSwitchFrames && !isPlayerInvulnerable(state, 0) && isIntersectingEnemyHitboxes(state, enemy, heroHitbox)) {
            state = updatePlayer(state, 0, {cannotSwitchFrames: 10, [HERO_BEE]: {...player[HERO_BEE], targets: []}}, {
                vx: player.sprite.vx * 0.8,
                vy: player.sprite.vy * 0.8 - 0.3,
            });
            return updateEnemy(state, enemy, {attached: true, life: 15});
        }
        let {vx, vy} = enemy;
        const source = state.idMap[enemy.sourceId];
        if (source) {
            const sourceCenter = [source.left + enemy.sourceOffset[0], source.top + enemy.sourceOffset[1]];
            const dx = center[0] - sourceCenter[0];
            const dy = center[1] - sourceCenter[1];
            const m = Math.sqrt(dx * dx + dy * dy);
            if (m) {
                vx += 0.1 * dx / m;
                vy += 0.1 * dy / m;
            }
        } else {
            vx -= 0.1;
        }
        if (center[1] < 50) vy += 0.1;
        else vy -= 0.05;
        vx *= 0.99;
        vy *= 0.99;
        return updateEnemy(state, enemy, {vx, vy});
    },
    onDamageEffect(state, enemy) {
        return updateEnemy(state, enemy, {vx: enemy.vx * 0.8, vy: enemy.vy * 0.8});
    },
    props: {
        life: 20,
        noCollisionDamage: true,
        attached: false,
    },
};

enemyData[ENEMY_BUBBLE_SHOT] = {
    animation: createAnimation('gfx/enemies/crab/bubble.png', bubbleGeometry, {x: 3, cols: 3}),
    deathAnimation: createAnimation('gfx/enemies/crab/bubblepop.png', r(75, 75)),
    deathSound: 'bubblePop',
    updateState(state, enemy) {
        if (enemy.dead) {
            if (enemy.animationTime > 200) return removeEnemy(state, enemy);
            return state;
        }
        if (enemy.scaleX < 1) {
            state = updateEnemy(state, enemy, {
                scaleX: Math.min(1, enemy.scaleX * 1.05),
                scaleY: Math.min(1, enemy.scaleY * 1.05),
            });
            enemy = state.idMap[enemy.id];
        }
        const heroHitbox = getHeroHitbox(state.players[0]);
        // This bubble is destroyed on contact.
        if (!isPlayerInvulnerable(state, 0) && isIntersectingEnemyHitboxes(state, enemy, heroHitbox)) {
            return damageEnemy(state, enemy.id, {damage: 100});
        }
        let {vx, vy} = enemy;
        const source = state.idMap[enemy.sourceId];
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        if (source) {
            const sourceCenter = [source.left + enemy.sourceOffset[0], source.top + enemy.sourceOffset[1]];
            const dx = center[0] - sourceCenter[0];
            const dy = center[1] - sourceCenter[1];
            const m = Math.sqrt(dx * dx + dy * dy);
            if (m) {
                vx += 0.1 * dx / m;
                vy += 0.1 * dy / m;
            }
        } else {
            vx -= 0.1;
        }
        if (center[1] < 80) vy += 0.1;
        else if (center[1] > 500) vy -= 0.1;
        else vy -= 0.05;
        vx *= 0.99;
        vy *= 0.99;
        return updateEnemy(state, enemy, {vx, vy});
    },
    onDamageEffect(state, enemy) {
        return updateEnemy(state, enemy, {vx: enemy.vx * 0.8, vy: enemy.vy * 0.8});
    },
    onDeathEffect(state, enemy) {
        const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        const numBullets = 8;
        for (let i = 0; i < numBullets; i++) {
            const theta = Math.PI * 2 * i / numBullets;
            const bullet = createAttack(ATTACK_BULLET, {
                vx: Math.cos(theta) * 5,
                vy: Math.sin(theta) * 5,
                left: center[0],
                top: center[1],
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        }
        return state;
    },
    props: {
        life: 1,
        noCollisionDamage: true,
    },
}
