
const { PRIORITY_FIELD, requireImage, createAnimation, r } = require('animations');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH,
} = require('gameConstants');
const Rectangle = require('Rectangle');
const random = require('random');

const ENEMY_HORNET = 'hornet';
const ENEMY_HORNET_SOLDIER = 'hornetSoldier';
const ENEMY_DEAD_KNIGHT = 'deadKnight';
const ENEMY_HORNET_KNIGHT = 'hornetKnight';
const ENEMY_HORNET_CIRCLER = 'hornetCircler';
const ENEMY_HORNET_DASHER = 'hornetDasher';
const ENEMY_HORNET_QUEEN = 'hornetQueen';

module.exports = {
    ENEMY_HORNET,
    ENEMY_HORNET_SOLDIER,
    ENEMY_HORNET_KNIGHT,
    ENEMY_HORNET_CIRCLER,
    ENEMY_HORNET_DASHER,
    ENEMY_HORNET_QUEEN,
};

const {
    enemyData,
    addEnemyToState, createEnemy, removeEnemy, updateEnemy,
    onHitGroundEffect_spawnMonk, shoot_bulletAtPlayer, setMode,
    getEnemyHitbox
} = require('enemies');
const { getHeroHitbox } = require('heroes');
const { getTargetVector } = require('sprites');
const { getHazardCeilingHeight, getHazardHeight } = require('world');

const hornetGeometry = r(120, 120, {
    hitboxes: [
        {"left":12,"width":54,"top":45,"height":28},
        {"left":31,"width":74,"top":72,"height":25},
        {"left":96,"width":5,"top":80,"height":39},
        {"left":102,"width":6,"top":78,"height":27},
    ]
});
const hornetAnimation = {
    frames: [
        {...hornetGeometry, image: requireImage('gfx/enemies/hornets/hornet1.png', PRIORITY_FIELD)},
        {...hornetGeometry, image: requireImage('gfx/enemies/hornets/hornet2.png', PRIORITY_FIELD)},
        {...hornetGeometry, image: requireImage('gfx/enemies/hornets/hornet3.png', PRIORITY_FIELD)},
        {...hornetGeometry, image: requireImage('gfx/enemies/hornets/hornet4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};
const hornetDeathAnimation = createAnimation('gfx/enemies/hornets/hornetded.png',
    hornetGeometry,
    {priority: PRIORITY_FIELD}
);
const hornetSoldierGeometry = r(120, 120, {
    hitboxes: [
        ...hornetGeometry.hitboxes,
        {"left":28,"width":15,"top":22,"height":32},
    ],
});

const hornetSoldierAnimation = {
    frames: [
        {...hornetSoldierGeometry, image: requireImage('gfx/enemies/hornets/mhornet1.png', PRIORITY_FIELD)},
        {...hornetSoldierGeometry, image: requireImage('gfx/enemies/hornets/mhornet2.png', PRIORITY_FIELD)},
        {...hornetSoldierGeometry, image: requireImage('gfx/enemies/hornets/mhornet3.png', PRIORITY_FIELD)},
        {...hornetSoldierGeometry, image: requireImage('gfx/enemies/hornets/mhornet4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};
const fallingHornetSoldierHitbox = {left: 46, top: 48, width: 40, height: 40};
const hornetSoldierDeathAnimation = createAnimation('gfx/enemies/hornets/mhornetded.png',
    {...hornetSoldierGeometry, hitbox: fallingHornetSoldierHitbox},
    {priority: PRIORITY_FIELD}
);

enemyData[ENEMY_HORNET] = {
    animation: hornetAnimation,
    deathAnimation: hornetDeathAnimation,
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate(state, enemy) {
        let {vx, vy, seed, targetX, targetY, mode, modeTime} = enemy;
        // Retreat if the player is using the finisher on the nest.
        if (state.players[0].usingFinisher) {
            vx = 8;
            vy = 0;
            return {...enemy, vx, vy, doNotFlip: false, persist: false, permanent: false};
        }
        const theta = Math.PI / 2 + Math.PI * 4 * modeTime / 2000;
        const radius = seed * 2 + 2;
        switch (mode) {
            case 'enter':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vx < 0) vx *= 2;
                if (vx > 0) vx *= .5;
                if (modeTime > 2000) {
                    mode = 'circle';
                    modeTime = 0;
                }
                break;
            case 'circle':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vy > 0 && enemy.top < 50) vy *= (1 + (50 - enemy.top) / 100);
                if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
                    vy *= (1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100);
                }
                if (modeTime > 2000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack':
                if (modeTime === FRAME_LENGTH) {
                    const target = state.players[0].sprite;
                    targetX = target.left + target.width / 2;
                    targetY = target.top + target.height / 2;
                    const {dx, dy} = getTargetVector(enemy, target);
                    const theta = Math.atan2(dy, dx);
                    vx = enemy.speed * Math.cos(theta);
                    vy = enemy.speed * Math.sin(theta);
                } else {
                    const {dx} = getTargetVector(enemy, {left: targetX, top: targetY});
                    if (dx * vx < 0) {
                        mode = 'retreat';
                        modeTime = 0;
                    }
                }
                break;
            case 'retreat':
                if (modeTime === FRAME_LENGTH) {
                    vx = 0;
                    vy = 0;//-vy;
                } else if (modeTime === 200) {
                    vx = enemy.speed * 1.5;
                } else if (enemy.left + enemy.width / 2 > WIDTH - 100){
                    mode = 'circle';
                    modeTime = 0;
                }
        }
        modeTime += FRAME_LENGTH;
        return {...enemy, targetX, targetY, vx, vy, mode, modeTime};
    },
    props: {
        life: 30,
        score: 500,
        speed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true,
        difficulty: 10,
    }
};
enemyData[ENEMY_HORNET_SOLDIER] = {
    animation: hornetSoldierAnimation,
    deathAnimation: hornetSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate(state, enemy) {
        let {vx, vy, targetX, targetY, mode, modeTime} = enemy;
        // Retreat if the player is using the finisher on the nest.
        if (state.players[0].usingFinisher) {
            vx = 8;
            vy = 0;
            return {...enemy, vx, vy, doNotFlip: false, persist: false, permanent: false};
        }
        const theta = Math.PI / 2 + Math.PI * 4 * modeTime / 8000;
        const radius = 1;
        switch (mode) {
            case 'enter':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vx < 0) vx *= 2;
                if (vx > 0) vx *= .5;
                if (modeTime > 4000) {
                    mode = 'circle';
                    modeTime = 0;
                }
                break;
            case 'circle':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vy > 0 && enemy.top < 100) vy *= (1 + (100 - enemy.top) / 100);
                if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
                    vy *= (1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100);
                }
                if (modeTime > 4000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack':
                if (modeTime === FRAME_LENGTH) {
                    const target = state.players[0].sprite;
                    targetX = target.left + target.width / 2;
                    targetY = target.top + target.height / 2;
                    const {dx, dy} = getTargetVector(enemy, target);
                    const theta = Math.atan2(dy, dx);
                    vx = enemy.speed * Math.cos(theta);
                    vy = enemy.speed * Math.sin(theta);
                } else {
                    const {dx} = getTargetVector(enemy, {left: targetX, top: targetY});
                    if (dx * vx < 0) {
                        mode = 'retreat';
                        modeTime = 0;
                    }
                }
                break;
            case 'retreat':
                if (modeTime === FRAME_LENGTH) {
                    vx = 0;
                    vy = 0;//-vy;
                } else if (modeTime === 200) {
                    vx = enemy.speed * 1.5;
                } else if (enemy.left + enemy.width / 2 > WIDTH - 100){
                    mode = 'circle';
                    modeTime = 0;
                }
        }
        modeTime += FRAME_LENGTH;
        return {...enemy, targetX, targetY, vx, vy, mode, modeTime};
    },
    shoot(state, enemy) {
        // Only attack while circling and retreating.
        if (enemy.mode !== 'circle' && enemy.mode !== 'retreat') return state;
        return shoot_bulletAtPlayer(state, enemy);
    },
    onDeathEffect(state, enemy) {
        const hornet = createEnemy(state, ENEMY_HORNET, {
            life: 20,
            score: enemyData[ENEMY_HORNET].props.score / 2,
            left: enemy.left,
            top: enemy.top,
            vx: 0,
            vy: 0,
            mode: 'retreat',
        })
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = removeEnemy(state, enemy);
        state = addEnemyToState(state, hornet);
        return addEnemyToState(state, enemy);
    },
    onHitGroundEffect: onHitGroundEffect_spawnMonk,
    props: {
        life: 40,
        score: 500,
        speed: 10,
        bulletSpeed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true,
        initialShotCooldownFrames: 5,
        shotCooldownFrames: 50,
        bulletX: 0.9,
        bulletY: 0.25,
        difficulty: 10,
    }
};
// This is only used for the mount falling off of the hornet knight.
enemyData[ENEMY_DEAD_KNIGHT] = {
    animation: createAnimation('gfx/enemies/hornets/ehornetsheet.png', hornetSoldierGeometry, {x: 4}),
    props: {
        life: 0,
    },
};
enemyData[ENEMY_HORNET_KNIGHT] = {
    animation: createAnimation('gfx/enemies/hornets/ehornetsheet.png', hornetSoldierGeometry, {cols: 3}),
    // This is the mask falling from the hornet when the mount falls off.
    deathAnimation: createAnimation('gfx/enemies/hornets/ehornetsheet.png', hornetSoldierGeometry, {x: 3}),
    deathSound: 'sfx/hit.mp3',
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        let {vx, vy, targetX, targetY} = enemy;
        // Retreat if the player is using the finisher on the nest.
        if (state.players[0].usingFinisher) {
            vx = 8;
            vy = 0;
            return {...enemy, vx, vy, doNotFlip: false, persist: false, permanent: false};
        }
        const theta = Math.PI / 2 + Math.PI * 4 * enemy.modeTime / 8000;
        const radius = 1;
        const playerCenter = new Rectangle(getHeroHitbox(state.players[0])).getCenter();
        const enemyCenter = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
        if (enemy.mode === 'enter') {
            vx = -3;
            if (enemyCenter[1] < 150) vy++;
            else if (enemyCenter[1] > GAME_HEIGHT - 150) vy--;
            else if (vy < 0) vy--;
            else vy++;
            vy = Math.max(-enemy.speed * 0.6, Math.min(enemy.speed * 0.6, vy));
            if (enemy.left <= WIDTH - 150) return setMode(state, enemy, 'pace');
        } else if (enemy.mode === 'pause') {
            vx *= 0.8;
            vy *= 0.8;
            if (enemy.modeTime >= 400) {
                return setMode(state, enemy, random.element(['strike', 'shoot']));
            }
        } else if (enemy.mode === 'pace') {
            // Pace up and down, roughly tracking the player and staying on screen.
            if (enemyCenter[0] >= WIDTH - 160) {
                if (enemyCenter[1] < 150) vy++;
                else if (enemyCenter[1] > GAME_HEIGHT - 150) vy--;
                else if (vy < 0) vy--;
                else vy++;
                vy = Math.max(-enemy.speed * 0.6, Math.min(enemy.speed * 0.6, vy));
            } else {
                vy *= 0.9;
            }
            if (enemyCenter[0] < WIDTH - 150) vx++;
            vx *= 0.9;
            if (enemy.modeTime >= 3000) {
                return setMode(state, enemy, 'pause');
            }
        } else if (enemy.mode === 'strike') {
            if (enemy.modeTime === FRAME_LENGTH) {
                const dx = playerCenter[0] - enemyCenter[0];
                const dy = playerCenter[1] - enemyCenter[1];
                targetX = Math.max(150, playerCenter[0]);
                targetY = Math.max(100, Math.min(GAME_HEIGHT - 100), playerCenter[1]);
                const theta = Math.atan2(dy, dx);
                vx = enemy.speed * Math.cos(theta);
                vy = enemy.speed * Math.sin(theta);
            } else {
                const dx = targetX - enemyCenter[0];
                if (dx * vx < 0) {
                    return setMode(state, enemy, 'pause');
                }
            }
        } else if (enemy.mode === 'shoot') {
            vx *= 0.8;
            vy *= 0.8;
            if (enemy.modeTime >= 3000) {
                return setMode(state, enemy, 'pace');
            }
        }
        return updateEnemy(state, enemy, {targetX, targetY, vx, vy});
    },
    shoot(state, enemy) {
        if (enemy.mode !== 'shoot') {
            if (enemy.shotCooldown > 0) {
                return updateEnemy(state, enemy, {shotCooldown: 0});
            }
            return state;
        }
        return shoot_bulletAtPlayer(state, enemy);
    },
    onDeathEffect(state, enemy) {
        const hornet = createEnemy(state, ENEMY_HORNET, {
            life: 20,
            score: enemyData[ENEMY_HORNET].props.score / 2,
            left: enemy.left,
            top: enemy.top,
            vx: 0,
            vy: 0,
            mode: 'retreat',
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = removeEnemy(state, enemy);
        state = addEnemyToState(state, hornet);
        // Add the falling knight.
        const knight = createEnemy(state, ENEMY_DEAD_KNIGHT, {
            life: 0,
            dead: true,
            left: enemy.left,
            top: enemy.top,
            vx: 0,
            vy: 0,
        });
        state = addEnemyToState(state, knight);
        return addEnemyToState(state, enemy);
    },
    props: {
        life: 50,
        score: 500,
        speed: 12,
        bulletSpeed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true,
        shootFrames: [120, 100, 80, 60, 40, 20],
        attackCooldownFrames: 121,
        shotCooldown: 0, //No delay for firing first shot.
        shotCooldownFrames: 150,
        bulletX: 0.9,
        bulletY: 0.15,
        difficulty: 20,
    }
};
enemyData[ENEMY_HORNET_CIRCLER] = {
    ...enemyData[ENEMY_HORNET],
    accelerate(state, enemy) {
        const playerSprite = state.players[0].sprite;
        let {vx, vy, seed, animationTime} = enemy;
        // Retreat if the player is using the finisher on the nest.
        if (state.players[0].usingFinisher) {
            vx = 8;
            vy = 0;
            return {...enemy, vx, vy, doNotFlip: false, persist: false, permanent: false};
        }
        const theta = Math.PI / 2 + seed * Math.PI + Math.PI * 4 * animationTime / 2000;
        const radius = 5 + animationTime / 1000;
        vx = radius * Math.cos(theta);
        vy = radius * Math.sin(theta);
        if (vx > 0) vx *= (enemy.left >= WIDTH ? 0 : 0.25);
        if (vx < 0) vx *= 2;
        if (vy > 0 && playerSprite.top < enemy.top + enemy.height) vy *= 0.5;
        else if (vy < 0 && playerSprite.top + playerSprite.height > enemy.top) vy *= 0.5;
        else vy *= 1.5;
        return {...enemy, vx, vy};
    },
    props: {
        life: 30,
        score: 500,
        speed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: false,
        doNotFlip: true,
        scale: 0.8,
        difficulty: 10,
    }
};
enemyData[ENEMY_HORNET_DASHER] = {
    ...enemyData[ENEMY_HORNET],
    accelerate(state, enemy) {
        let {vx, vy, animationTime, targetX, targetY, permanent} = enemy;
        // Retreat if the player is using the finisher on the nest.
        if (state.players[0].usingFinisher) {
            vx = 8;
            vy = 0;
            return {...enemy, vx, vy, doNotFlip: false, persist: false, permanent: false};
        }
        const target = state.players[0].sprite;
        // Don't update the targetX/Y values once the hornet starts charging.
        targetX = target.left + target.width / 2;
        targetY = target.top + target.height / 2;
        const dx = (targetX - enemy.left - enemy.width / 2);
        const dy = (targetY - enemy.top - enemy.height / 2);
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        if (animationTime < 500) {
            vx = -0.8 * dx / mag;
            vy = -0.8 * dy / mag;
        } else if (animationTime < 800) {
            vx *= 0.95;
            vy *= 0.95;
        } else if (animationTime === 800) {
            vx = 15 * dx / mag;
            vy = 15 * dy / mag;
            permanent = false;
        }
        return {...enemy, vx, vy, targetX, targetY, permanent};
    },
    props: {
        life: 30,
        score: 500,
        speed: 10,
        mode: 'enter',
        modeTime: 0,
        // Permanent until it starts dashing.
        permanent: true,
        doNotFlip: true,
        scale: 0.8,
        difficulty: 10,
    }
};

const queenGeometry = r(150, 150, {
    hitboxes: [
        {"left":19,"width":64,"top":58,"height":37},
        {"left":69,"width":53,"top":82,"height":28},
        {"left":121,"width":5,"top":87,"height":64},
        {"left":125,"width":10,"top":95,"height":35},
        {"left":29,"width":10,"top":49,"height":21},
    ]
});
enemyData[ENEMY_HORNET_QUEEN] = {
    ...enemyData[ENEMY_HORNET],
    animation: {
        frames: [
            {...queenGeometry, image: requireImage('gfx/enemies/hornets/hqueen1.png')},
            {...queenGeometry, image: requireImage('gfx/enemies/hornets/hqueen2.png')},
            {...queenGeometry, image: requireImage('gfx/enemies/hornets/hqueen3.png')},
        ],
        frameDuration: 3,
    },
    deathAnimation: createAnimation('gfx/enemies/hornets/hqueen4.png', queenGeometry),
    accelerate(state, enemy) {
        let {vx, vy} = enemy;
        // Retreat if the player is using the finisher on the nest.
        if (state.players[0].usingFinisher) {
            vx = 7;
            vy = 0;
            return {...enemy, vx, vy, doNotFlip: false, persist: false, permanent: false};
        }
        // Fly straight onto the screen initially.
        if (enemy.left + enemy.width > WIDTH) {
            vx = -5;
            vy = 0;
            return {...enemy, vx, vy};
        }
        const ceiling = Math.max(getHazardCeilingHeight(state), 0);
        const floor = Math.min(getHazardHeight(state), GAME_HEIGHT);
        const height = floor - ceiling;
        const y = (enemy.top + enemy.height / 2) - ceiling;
        const dx = WIDTH * (y - height / 2);
        const dy = height * ((enemy.left + enemy.width / 2) - WIDTH / 2);
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        vx = -5 * dx / mag;
        vy = 5 * dy / mag;
        return {...enemy, vx, vy};
    },
    props: {
        life: 300,
        score: 500,
        speed: 10,
        mode: 'enter',
        modeTime: 0,
        boss: true,
        // This will be cleared when transitioning to the next area.
        persist: true,
        doNotFlip: true,
        scale: 1.2,
        difficulty: 10,
    }
};
