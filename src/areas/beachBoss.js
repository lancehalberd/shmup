
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
    HERO_BEE,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitbox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_BEACH_BOSS = 'beachBoss';
const BOSS_DURATION = 80000;
module.exports = {
    transitionToBeachBoss,
};
const { transitionToOcean } = require('areas/beachToOcean');

const {
    enemyData, setMode,
    createEnemy, addEnemyToState, removeEnemy, updateEnemy,
    renderEnemyFrame, getEnemyHitbox, isIntersectingEnemyHitboxes
} = require('enemies');
const { getHeroHitbox, updatePlayer } = require('heroes');

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
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        let {targetFrames, targetX, targetY} = world;
        // 20s before the end of the level raise screen so we can transition to the sunrise graphics
        // during the boss fight.
        targetFrames = 150 * 5;
        targetX = Math.max(world.targetX, world.x + 1000);
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
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        if (time > 500 && !crab) {
            return transitionToOcean(state);
        }

        state = {...state, world};
        return state;
    },
};

/**

Stage 4A Crab Boss
Crab blows bubbles:
Regular bubbles absorb attacks and slow the player until destroyed.
Bullet bubbles burst on contact or when hit and spray projectiles in all directions.
Left claw(y:1, x3) has an attack animation(y:2, x:2,3,4,3,2) for trying to hit the player.
When enraged the crab runs along the bottom of the snapping up at the player.
The crab eyes are vulnerable and protect the rider. The eyes can be temporarily defeated making the monk
vulnerable
Add bubble SFX
Bullets pass through the rest of the crab.
*maybe add burrowing robs on the ground?


3- After some bubbles, the crab will rush forward and be under the Knight.
From here, the crab will try to align themselves directly below the knight and snap upwards with the claw
while firing more normal bubbles.
4- When the crab's health bar goes down, its eye moves down, and the robe is exposed.
A second life bar appears for the robe for the second phase of the fight.
 Here, the robe can fire more projectiles at the Knight.
 The crab stays to the right and only fires bubbles, but in this second phase,
 the robe will fire patterns of bullets out as well.

*/
const crabGeometry = r(375, 300, {
    scaleX: 2, scaleY: 2,
    hitbox: {left: 0, top: 0, width: 375, height: 300},
    hitboxes: [
        {left: 152, top: 75, width: 20, height: 40},
        {left: 202, top: 75, width: 20, height: 40}
    ]
});
const bodyAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {cols: 2});
const bodyDeadAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 2, cols: 2});
const legsAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {rows: 2, cols: 5, frameMap: [4, 5]});
const mouthAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 1, y: 1});
const mouthOpenAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 2, y: 1});
const clawAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 3, y: 1});
const clawAttackAnimation = createAnimation('gfx/enemies/crab/crab.png', crabGeometry, {x: 2, y: 2, cols: 3, frameMap: [0,1,2,1,0]});

const ENEMY_CRAB = 'crab';
enemyData[ENEMY_CRAB] = {
    animation: bodyAnimation,
    deathAnimation: bodyDeadAnimation,
    updateState(state, enemy) {
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.dead) {
            const rider = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB_RIDER)[0];
            if (!state.world.lifebars[rider.id]) {
                const lifebars = {
                    ...state.world.lifebars
                }
                lifebars[rider.id] = {
                    left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: state.world.time,
                };
                state = {...state, world: {...state.world, lifebars}};
            }
            if (enemy.animationTime >= 10000) {
                return updateEnemy(state, enemy, {life: enemy.maxLife, dead: false});
            }
            return state;
        }
        let {vx, vy, animationTime} = enemy;
        if (enemy.mode === 'walk') {
            if (enemy.left > WIDTH / 2) {
                vx = 0;
                animationTime = 0;
            } else if (enemy.left < WIDTH / 3) {
                vx = state.world.vx + 1;
            } else {
                vx = state.world.vx;
            }
            if (enemy.modeTime >= 3000) {
                state = setMode(state, enemy, 'bubbles');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'bubbles') {
            vx *= 0.99;
            animationTime = 0;
            if (enemy.modeTime % 200 === 0) {
                const bubble = createEnemy(state, ENEMY_BUBBLE, {
                    left: enemy.left + 380, top: enemy.top + 235,
                    vx: -enemy.modeTime / 400,
                    vy: Math.random() * 2 - 6 + enemy.modeTime / 200,
                    scaleX: 0.2,
                    scaleY: 0.2,
                });
                bubble.left -= bubble.width / 2;
                bubble.height -= bubble.height / 2;
                state = addEnemyToState(state, bubble);
            }
            if (enemy.modeTime >= 2000) {
                state = setMode(state, enemy, 'walk');
                enemy = state.idMap[enemy.id];
            }
        }
        return updateEnemy(state, enemy, {vx, vy, animationTime});
    },
    drawOver(context, state, enemy) {
        let frame = getFrame(legsAnimation, enemy.animationTime);
        renderEnemyFrame(context, state, enemy, frame);
        let animation = enemy.mode === 'bubbles' ? mouthOpenAnimation : mouthAnimation;
        frame = getFrame(animation, enemy.animationTime);
        renderEnemyFrame(context, state, enemy, frame);
        frame = getFrame(clawAnimation, enemy.animationTime);
        renderEnemyFrame(context, state, enemy, frame);
    },
    props: {
        life: 50,
        speed: 15,
        boss: false,
        persist: true,
        mode: 'walk',
        grounded: true,
        modeTime: 0,
        doNotFling: true,
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
    attackAnimation: monkDeathAnimation,
    deathAnimation: monkDeathAnimation,
    updateState(state, enemy) {
        if (enemy.dead) return state;
        const crab = state.enemies.filter(enemy => enemy.type === ENEMY_CRAB)[0];
        state = updateEnemy(state, enemy, {
            modeTime: enemy.modeTime + FRAME_LENGTH,
            left: crab.left, top: crab.top,
        });
        enemy = state.idMap[enemy.id];
        return state
    },
    props: {
        life: 200,
        boss: true,
        hanging: true,
        doNotFling: true,
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
            state = updatePlayer(state, 0, {cannotSwitchFrames: 10}, {
                vx: player.sprite.vx * 0.8,
                vy: player.sprite.vy * 0.8 - 0.3,
            });
            const heroCenter = new Rectangle(heroHitbox).getCenter();
            return updateEnemy(state, enemy, {
                vx: 0, vy: 0,
                left: enemy.left + heroCenter[0] - center[0],
                top: enemy.top + heroCenter[1] - center[1],
            })
        }
        if (!player.cannotSwitchFrames && isIntersectingEnemyHitboxes(state, enemy, heroHitbox)) {
            state = updatePlayer(state, 0, {cannotSwitchFrames: 10, [HERO_BEE]: {...player[HERO_BEE], targets: []}}, {
                vx: player.sprite.vx * 0.8,
                vy: player.sprite.vy * 0.8 - 0.3,
            });
            return updateEnemy(state, enemy, {attached: true, life: 20});
        }
        let {vx, vy} = enemy;
        const source = state.idMap[enemy.sourceId];
        if (source) {
            const sourceCenter = new Rectangle(getEnemyHitbox(state, source)).getCenter();
            const dx = center[0] - sourceCenter[0];
            const dy = center[1] - sourceCenter[1];
            const m = dx * dx + dy * dy;
            if (m) {
                vx += dx / m;
                vy += dy / m;
            }
        }
        vx -= 0.1;
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
        life: 30,
        noCollisionDamage: true,
        attached: false,
    },
}
