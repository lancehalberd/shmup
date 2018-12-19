
const {
    FRAME_LENGTH, HEIGHT, WIDTH, ATTACK_BULLET,
} = require('gameConstants');
const random = require('random');
const { createAnimation, r } = require('animations');
const { allWorlds } = require('world');

const WORLD_SEWER_BOSS = 'sewerBoss';

const bossBackground = createAnimation('gfx/scene/sewer/snekback.png', r(400, 500));
function transitionToSewerBoss(state) {
    const world = {
        ...state.world,
        spawnsDisabled: true,
        type: WORLD_SEWER_BOSS,
        time: 0,
        targetFrames: 50 * 5,
        bgm: 'bgm/boss.mp3',
        background: {
            ...state.world.background,
            sprites: state.world.background.sprites.filter(s => s.left <= WIDTH),
            firstElements: false,
            spriteData: {
                sewerSnake: {animation: bossBackground, scale: 2, next: false},
            },
        },
    };
    // The snake background will shortly be added right after the current last background sprite.
    // Since the snake background is the width of the screen, the new target x is the right edge
    // of this last sprite.
    const lastBackgroundSprite = world.background.sprites.slice(-1)[0];
    // It is safe to edit world in place here since we just created the object above.
    world.targetX = world.x + lastBackgroundSprite.left + lastBackgroundSprite.width;
    world.targetY = 150;
    return {...state, world};
}
allWorlds[WORLD_SEWER_BOSS] = {
    advanceWorld: (state) => {
        if (state.world.time === 500) {
            state = spawnBoss(state);
        }
        state = checkIfBossDefeated(state);
        state = checkToSpawnRats(state);
        state = {
            ...state,
            world: {
                ...state.world,
                targetFrames: state.world.targetFrames + 0.5,
                time: state.world.time + FRAME_LENGTH,
            }
        };
        return state;
    },
};
function spawnBoss(state) {
    const snakeBackground = state.world.background.sprites.slice(-1)[0];
    const snake = createEnemy(state, ENEMY_SNAKE, {
        top: snakeBackground.top + 231, left: snakeBackground.left + 350
    });
    state = addEnemyToState(state, snake);
    const snakeTail = createEnemy(state, ENEMY_SNAKE_TAIL, {
        top: snakeBackground.top + 450, left: snakeBackground.left + 84
    });
    state = addEnemyToState(state, snakeTail);
    const lifebars = {};
    lifebars[snake.id] = {
        left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: state.world.time,
    };
    lifebars[snakeTail.id] = {
        left: 100, top: HEIGHT - 24, width: 600, height: 8, startTime: state.world.time,
    };
    return {...state,
        bgm: 'bgm/boss.mp3',
        world: {...state.world, lifebars, bgm: 'bgm/boss.mp3'}
    };
}
function checkToSpawnRats(state) {
    if (state.world.time < 10000 || state.world.time % 6000) return state;
    const rats = state.enemies.filter(enemy => enemy.type === ENEMY_RAT);
    if (rats.length >= 3) return state;
    const rat = createEnemy(state, ENEMY_RAT, {
        passive: true,
        top: -100,
        direction: 'down',
        left: -15,
    });
    // Increase left position until an empty column is found.
    while (rats.some(oldRat => oldRat.left === rat.left)) rat.left += 50;
    return addEnemyToState(state, rat);
}
function checkIfBossDefeated(state) {
    const snake = state.enemies.filter(enemy => enemy.type === ENEMY_SNAKE)[0];
    if (state.world.time > 500 && (!snake || (snake.dead && snake.animationTime >= 1500))) {
        return transitionToCircus(state);
    }
    return state
}

module.exports = {
    transitionToSewerBoss,
};
const { transitionToCircus } = require('areas/sewerToCircus');
const { ENEMY_RAT } = require('areas/sewer');

const { enemyData, createEnemy, addEnemyToState, updateEnemy,
    isIntersectingEnemyHitboxes, getEnemyHitbox, removeEnemy,
    addBullet, getBulletCoords,
} = require('enemies');
const { getHeroHitbox } = require('heroes');
const {
    attacks, addEnemyAttackToState, createAttack,
    default_advanceAttack,
} = require('attacks');
/*

1. Rats. Rats climb up and down and slightly to the right on the screen. Unlike how they act in the
rest of the sewer, these rats rarely (or never) attack the Knight, but still deal contact damage,
making it harder to hug the left side of the screen where they are spawning in.

3. Tail. The tail is really long, but I figure it actually stays pretty flush with the snake's face
usually, but can extend out toward the knight now and again. Eventually, it returns back to being
flush with the snake's head and hits the water, which erupts in a sort of wave across the screen,
overlaying a new top water sprite and making the bottom half of the boss arena deadly.


Add Snake Boss
The snake has the ability to eat rats that are moving from left to right on the screen to regain health
The snake can also hit the ground with their tail, causing a wave of water to go across the bottom half of the screen
The snake can stab forward with their tail

*/

const ENEMY_SNAKE = 'snake';
const snakeBodyHitboxes = [
    {left: 173, top: 70, width: 20, height: 71},
    {left: 135, top: 131, width: 30, height: 55},
    {left: 164, top: 179, width: 60, height: 30},
];

const snakeNormalGeometry = r(224, 213, {
    scaleX: 2, scaleY: 2,
    hitboxes: [
        ...snakeBodyHitboxes,
        {left: 25, top: 110, width: 70, height: 10},
        {left: 62, top: 87, width: 60, height: 20},
        {left: 117, top: 70, width: 35, height: 15},
        {left: 143, top: 49, width: 40, height: 20},
    ]
});
const snakeHissGeometry = r(224, 213, {
    scaleX: 2, scaleY: 2,
    hitboxes: [
        ...snakeBodyHitboxes,
        {left: 54, top: 77, width: 25, height: 15},
        {left: 35, top: 63, width: 70, height: 15},
        {left: 67, top: 45, width: 105, height: 18},
        {left: 110, top: 33, width: 50, height: 15},
    ]
});
const snakeHurtGeometry = r(224, 213, {
    scaleX: 2, scaleY: 2,
    hitboxes: [
        ...snakeBodyHitboxes,
        {left: 55, top: 0, width: 30, height: 47},
        {left: 85, top: 22, width: 25, height: 30},
        {left: 117, top: 70, width: 35, height: 15},
        {left: 143, top: 49, width: 40, height: 20},
    ]
});

const biteBodyHitboxes = snakeBodyHitboxes.map(hitbox => {
    return {...hitbox, left: hitbox.left + 140, top: hitbox.top - 35}
});
const snakeBiteLowGeometry = r(364, 178, {
    scaleX: 2, scaleY: 2,
    hitboxes: [
        ...biteBodyHitboxes,
        {left: 8, top: 115, width: 50, height: 8},
        {left: 33, top: 93, width: 45, height: 20},
        {left: 70, top: 77, width: 60, height: 15},
        {left: 130, top: 61, width: 60, height: 15},
        {left: 190, top: 45, width: 60, height: 15},
        {left: 255, top: 33, width: 80, height: 15},
    ]
});
const snakeBiteHighGeometry = r(364, 178, {
    scaleX: 2, scaleY: 2,
    hitboxes: [
        ...biteBodyHitboxes,
        {left: 6, top: 16, width: 65, height: 20},
        {left: 40, top: 2, width: 100, height: 30},
        {left: 155, top: 5, width: 90, height: 30},
        {left: 257, top: 15, width: 80, height: 25},
    ]
});

enemyData[ENEMY_SNAKE] = {
    animation: createAnimation('gfx/enemies/snake/base.png', snakeNormalGeometry,
        {x: 2, cols: 4, frameMap: [0, 0, 0, 0, 0, 1, 2, 3, 2, 1]}
    ),
    hissAnimation: createAnimation('gfx/enemies/snake/base.png', snakeHissGeometry,
        {x: 6, cols: 3}, {loop: false},
    ),
    hurtAnimation: createAnimation('gfx/enemies/snake/base.png', snakeHurtGeometry),
    deathAnimation: createAnimation('gfx/enemies/snake/base.png', snakeNormalGeometry, {x: 1}),
    biteHighAnimation: createAnimation('gfx/enemies/snake/bite.png', snakeBiteHighGeometry,
        {y: 4, rows: 3, frameMap: [0, 1, 2, 2, 2, 2, 2, 0], loop: false, duration: 4}
    ),
    biteLowAnimation: createAnimation('gfx/enemies/snake/bite.png', snakeBiteLowGeometry,
        {rows: 4, frameMap: [0, 1, 2, 3, 3, 3, 3, 3, 0], loop: false, duration: 4}
    ),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.snaredForFinisher) return this.hissAnimation;
        if (enemy.mode === 'hurt') return this.hurtAnimation;
        if (enemy.mode === 'hiss' || enemy.mode === 'shoot' || enemy.mode === 'enraged') return this.hissAnimation;
        if (enemy.mode === 'biteHigh') return this.biteHighAnimation;
        if (enemy.mode === 'biteLow') return this.biteLowAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead || enemy.snaredForFinisher) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'hurt') {
            if (enemy.modeTime >= 1500) {
                state = this.setMode(state, enemy, 'enraged');
            }
        } else if (enemy.mode === 'enraged') {
            if (enemy.modeTime >= 7000) {
                state = this.setMode(state, enemy, random.element(['biteLow', 'biteHigh']));
            }
        } else if (enemy.mode === 'bide') {
            if (enemy.modeTime >= 5000) {
                state = this.setMode(state, enemy, random.element(['hiss', 'shoot', 'shoot']));
            }
        } else if (enemy.mode === 'shoot') {
            if (enemy.modeTime === 1000) {
                const bullet = createAttack(ATTACK_BULLET, {});
                const {top, left} = getBulletCoords(state, enemy);
                const hitbox = getHeroHitbox(state.players[0]);
                const dx = hitbox.left + hitbox.width / 2 - (left + bullet.width / 2);
                const dy = hitbox.top + hitbox.height / 2 - (top + bullet.height / 2);
                // 0 is straight right, PI / 2 is down, PI is left
                let theta = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI / 12;
                if (theta < 0) theta += 2 * Math.PI;
                theta = Math.min(Math.PI, Math.max(Math.PI / 2, theta));
                for (let i = -4; i <= 2; i++) {
                    state = addBullet(state, enemy, () => theta + i * Math.PI / 9);
                }
            }
            if (enemy.modeTime >= 2000) {
                state = this.setMode(state, enemy, 'bide');
            }
        } else if (enemy.mode === 'hiss') {
            if (enemy.modeTime >= 1000 || (enemy.enragedAttacks > 0 && enemy.modeTime > 200)) {
                state = this.setMode(state, enemy, random.element(['biteLow', 'biteHigh']));
            }
        } else if (enemy.mode === 'biteHigh' || enemy.mode === 'biteLow') {
            const animation = this.getAnimation(state, enemy);
            if (enemy.modeTime === animation.frameDuration * FRAME_LENGTH / 2) {
                // Sort rats right to left so that it will eat the one closest to it if there are two in range.
                const rats = state.enemies.filter(enemy => enemy.type === ENEMY_RAT).sort((A, B) => B.left - A.left);
                for (const rat of rats) {
                    if (isIntersectingEnemyHitboxes(state, enemy, getEnemyHitbox(state, rat))) {
                        state = removeEnemy(state, rat);
                        state = updateEnemy(state, enemy, {life: Math.min(enemy.maxLife, enemy.life + enemy.maxLife / 10)});
                        enemy = state.idMap[enemy.id];
                        break;
                    }
                }
            }
            if (enemy.modeTime >= animation.frameDuration * animation.frames.length * FRAME_LENGTH) {
                if (enemy.enragedAttacks > 0) {
                    state = updateEnemy(state, enemy, {enragedAttacks: enemy.enragedAttacks - 1});
                    enemy = state.idMap[enemy.id];
                    if (enemy.enragedAttacks === 0) {
                        // Finish the enraged bite attacks by shooting once.
                        state = this.setMode(state, enemy, 'shoot');
                    } else {
                        state = this.setMode(state, enemy, 'hiss');
                    }
                } else {
                    state = this.setMode(state, enemy, 'bide');
                }
            }
        }
        enemy = state.idMap[enemy.id];
        // Tint increases/decrease depending on whether the spider is enraged.
        let tintAmount = enemy.tintAmount
        tintAmount += this.isEnraged(state, enemy) ? 0.02 : -0.04;
        tintAmount = Math.max(0, Math.min(1, tintAmount));
        const maxTint = 0.4 + 0.1 * Math.cos(state.world.time / 100);
        state = updateEnemy(state, enemy, {
            modeTime: enemy.modeTime + FRAME_LENGTH,
            tintAmount,
            tint: {color: 'red', amount: maxTint * enemy.tintAmount},
        });
        return state;
    },
    isEnraged(state, enemy) {
        return !enemy.dead && (enemy.mode === 'enraged' || enemy.enragedAttacks > 0);
    },
    setMode(state, enemy, mode) {
        const wasBiting = enemy.mode === 'biteLow' || enemy.mode === 'biteHigh';
        const isBiting = mode === 'biteLow' || mode === 'biteHigh';
        // Snake bite animation must be offset to appear in the same place as the base animation,
        // so modify the snake offset when transition between these animations.
        if (wasBiting && !isBiting) {
            state = updateEnemy(state, enemy, {left: enemy.left + 2 * 140, top: enemy.top - 2 * 35});
            enemy = state.idMap[enemy.id];
        } else if (isBiting && !wasBiting) {
            state = updateEnemy(state, enemy, {left: enemy.left - 2 * 140, top: enemy.top + 2 * 35});
            enemy = state.idMap[enemy.id];
        }
        return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0});
    },
    onDamageEffect(state, enemy, attack) {
        // Ignore damage while hurt.
        if (enemy.mode === 'hurt' || enemy.mode === 'enraged') {
            return updateEnemy(state, enemy, {life: enemy.life + attack.damage});
        }
        let enrageAt = enemy.enrageAt || enemy.maxLife * (1 - enemy.enrageThreshold);
        if (enemy.life > 0 && enemy.life < enrageAt) {
            enrageAt = enrageAt - enemy.maxLife * enemy.enrageThreshold;
            // Hack: keep enrageAt from becoming falsey and resetting.
            if (!enrageAt) enrageAt = -1;
            state = updateEnemy(state, enemy, {
                enrageAt,
                enragedAttacks: 5,
            });
            const snakeTail = state.enemies.filter(enemy => enemy.type === ENEMY_SNAKE_TAIL)[0];
            if (snakeTail.dead)  {
                state = updateEnemy(state, snakeTail, {
                    life: snakeTail.maxLife,
                    mode: 'normal',
                    dead: false,
                    modeTime: 0,
                    animationTime: 0
                });
            }
            enemy = state.idMap[enemy.id];
            return this.setMode(state, enemy, 'hurt');
        }
        return state;
    },
    props: {
        life: 500,
        bulletX: 0.8,
        bulletY: 0.4,
        bulletSpeed: 4,
        enrageThreshold: 0.25,
        stationary: true,
        vx: 0, vy: 0,
        boss: true,
        permanent: true,
        mode: 'bide',
        modeTime: -4000,
        doNotFlip: true,
        tintAmount: 0,
    },
};


const snakeTailGeometry = r(382, 218, {
    scaleX: 2,
    scaleY: 2,
});
const snakeTailAnimation = createAnimation('gfx/enemies/snake/snaketail.png', snakeTailGeometry, {cols: 2, duration: 12});
snakeTailAnimation.frames[0].hitboxes = [
    {"left":305,"top":166,"width":75,"height":22},
    {"left":227,"top":164,"width":79,"height":9},
    {"left":220,"top":142,"width":14,"height":21},
    {"left":211,"top":114,"width":9,"height":28},
    {"left":207,"top":80,"width":10,"height":34},
    {"left":215,"width":8,"top":55,"height":24},
    {"left":225,"width":6,"top":32,"height":23},
    {"left":232,"width":7,"top":21,"height":12},
    {"left":247,"width":5,"top":11,"height":5},
    {"left":241,"width":4,"top":16,"height":5},
];
snakeTailAnimation.frames[1].hitboxes = [
    {"left":305,"top":166,"width":75,"height":22},
    {"left":227,"top":164,"width":79,"height":9},
    {"left":220,"top":142,"width":14,"height":21},
    {"left":211,"top":114,"width":9,"height":28},
    {"left":207,"top":80,"width":10,"height":34},
    {"left":215,"width":8,"top":55,"height":24},
    {"left":222,"width":6,"top":32,"height":23},
    {"left":229,"width":7,"top":20,"height":12},
    {"left":241,"width":5,"top":9,"height":5},
    {"left":237,"width":4,"top":16,"height":5},
];


const snakeTailSlamGeometry = r(382, 218, {
    scaleX: 2,
    scaleY: 2,
});
const snakeTailSlamAnimation = createAnimation('gfx/enemies/snake/snaketail.png', snakeTailSlamGeometry, {x: 2, cols: 2}, {loop: false});
snakeTailSlamAnimation.frames[0].hitboxes = [
    {"left":93,"top":179,"width":80,"height":30},
    {"left":177,"top":176,"width":50,"height":15},
    {"left":225,"top":168,"width":157,"height":14},
];
snakeTailSlamAnimation.frames[1].hitboxes = [
    {"left":88,"top":203,"width":80,"height":11},
    {"left":171,"top":193,"width":50,"height":11},
    {"left":267,"top":169,"width":118,"height":14},
    {"left":224,"width":42,"top":179,"height":10},
];

const ENEMY_SNAKE_TAIL = 'snakeTail';
enemyData[ENEMY_SNAKE_TAIL] = {
    animation: snakeTailAnimation,
    slamAnimation: snakeTailSlamAnimation,
    deathAnimation: {frames: [snakeTailSlamAnimation.frames[1]], frameDuration: 12},
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode === 'slam') return this.slamAnimation;
        return this.animation;
    },
    /*isInvulnerable(state, enemy, attack) {
        return true;
    },*/
    updateState(state, enemy) {
        const snake = state.enemies.filter(enemy => enemy.type === ENEMY_SNAKE)[0];
        if (!snake || snake.dead || snake.snaredForFinisher) {
            return state;
        }
        if (enemy.dead)  {
            if (enemy.animationTime >= 8000) {
                state = updateEnemy(state, enemy, {
                    life: Math.min(enemy.maxLife, enemy.life + enemy.maxLife / 100)
                });
                enemy = state.idMap[enemy.id];
                if (enemy.life >= enemy.maxLife) {
                    state = updateEnemy(state, enemy, {dead: false});
                    enemy = state.idMap[enemy.id];
                    return this.setMode(state, enemy, 'normal');
                }
            }
            return state;
        }
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'normal') {
            if (enemy.modeTime >= 3000 ||
                (snake.mode === 'enraged' && snake.modeTime < 4000 && enemy.modeTime >= 200)
            ) {
                state = this.setMode(state, enemy, 'slam');
            }
        } else  if (enemy.mode === 'slam') {
            if (enemy.modeTime === this.slamAnimation.frameDuration * FRAME_LENGTH) {
                const splash = createAttack(ATTACK_TAIL_SPLASH, {
                    left: WIDTH - 250,
                    top: 500,
                    vx: -10,
                    vy: -15,
                });
                state = addEnemyAttackToState(state, splash);
            } else if (enemy.modeTime >= 2000 ||
                (snake.mode === 'enraged' && enemy.modeTime >= 600)
            ) {
                // Stay down during the snakes enraged bites.
                if ((snake.mode === 'enraged' && snake.modeTime < 4000) || !(snake.enragedAttacks > 0)) {
                    state = this.setMode(state, enemy, 'normal');
                }
            }
        }
        enemy = state.idMap[enemy.id];
        // Tint increases/decrease depending on whether the spider is enraged.
        let tintAmount = enemy.tintAmount || 0;
        tintAmount += enemyData[ENEMY_SNAKE].isEnraged(state, snake) ? 0.02 : -0.04;
        tintAmount = Math.max(0, Math.min(1, tintAmount));
        const maxTint = 0.4 + 0.1 * Math.cos(state.world.time / 100);
        state = updateEnemy(state, enemy, {
            modeTime: enemy.modeTime + FRAME_LENGTH,
            tintAmount,
            tint: {color: 'red', amount: maxTint * enemy.tintAmount},
        });
        return state;
    },
    setMode(state, enemy, mode) {
        return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0});
    },
    props: {
        life: 100,
        mode: 'normal',
        // delay first tail slam.
        modeTime: -4000,
        doNotFlip: true,
        vx: 0, vy: 0,
        boss: false,
        stationary: true,
        permanent: true,
        persist: true,
        hazardProof: true,
    }
};

const splashGeometry = r(200, 158, {
    scale: 2,
    hitboxes: [
        {"left":0,"width":200,"top":126,"height":32},
        {"left":26,"width":103,"top":74,"height":52},
        {"left":59,"width":23,"top":20,"height":26},
        {"left":40,"width":73,"top":45,"height":28},
        {"left":105,"width":10,"top":23,"height":23},
        {"left":151,"width":15,"top":97,"height":28},
    ]
});
const splashAnimation = createAnimation('gfx/enemies/snake/waterhit.png', splashGeometry);

const ATTACK_TAIL_SPLASH = 'tailSplash';
attacks[ATTACK_TAIL_SPLASH] = {
    animation: splashAnimation,
    advance(state, attack) {
        if (attack.top < 300) {
            attack = {...attack, vy: 0.5};
        }
        return default_advanceAttack(state, attack);
    },
    props: {
        piercing: true,
    },
}

