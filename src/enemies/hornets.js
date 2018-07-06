
const { requireImage, createAnimation, r } = require('animations');

const {
    WIDTH, GAME_HEIGHT, ATTACK_BULLET, FRAME_LENGTH,
} = require('gameConstants');
const {
    enemyData, updateEnemy, spawnMonkOnGround,
    addEnemyToState, createEnemy, removeEnemy,
} = require('enemies');
const { createAttack, addEnemyAttackToState } = require('attacks');
const { getTargetVector } = require('sprites');

const hornetRectangle = r(120, 120);
const hornetHitBox = {left: 0, top: 33, width: 110, height: 87};
const hornetAnimation = {
    frames: [
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet1.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet2.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet3.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet4.png')},
    ],
    frameDuration: 3,
};
const hornetDeathAnimation = createAnimation('gfx/enemies/hornetded.png', hornetRectangle);
const hornetSoldierAnimation = {
    frames: [
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet1.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet2.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet3.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet4.png')},
    ],
    frameDuration: 3,
};
const fallingHornetSoldierHitBox = {left: 46, top: 48, width: 40, height: 40};
const hornetSoldierDeathAnimation =
    createAnimation('gfx/enemies/mhornetded.png', {...hornetRectangle, hitBox: fallingHornetSoldierHitBox});

const ENEMY_HORNET = 'hornet';
const ENEMY_HORNET_SOLDIER = 'hornetSoldier';
enemyData[ENEMY_HORNET] = {
    animation: hornetAnimation,
    deathAnimation: hornetDeathAnimation,
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: (state, enemy) => {
        let {vx, vy, seed, targetX, targetY, mode, modeTime} = enemy;
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
    }
};
enemyData[ENEMY_HORNET_SOLDIER] = {
    animation: hornetSoldierAnimation,
    deathAnimation: hornetSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate: (state, enemy) => {
        let {vx, vy, targetX, targetY, mode, modeTime} = enemy;
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
        if (enemy.mode !== 'circle' && enemy.mode !== 'retreat') return state;
        if (enemy.shotCooldown > 0) {
            return updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - 1});
        }
        state = updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldownFrames});
        const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
        const theta = Math.atan2(dy, dx);
        const bullet = createAttack(ATTACK_BULLET, {
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta),
            top: enemy.top + enemy.vy + enemy.height / 2,
            left: enemy.left + enemy.vx,
        });
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    onDeathEffect(state, enemy) {
        const hornet = createEnemy(ENEMY_HORNET, {
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
    onHitGroundEffect: spawnMonkOnGround,
    props: {
        life: 40,
        score: 500,
        speed: 10,
        bulletSpeed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true,
        shotCooldownFrames: 50,
    }
};
const ENEMY_HORNET_CIRCLER = 'hornetCircler';
enemyData[ENEMY_HORNET_CIRCLER] = {
    ...enemyData[ENEMY_HORNET],
    accelerate: (state, enemy) => {
        const playerSprite = state.players[0].sprite;
        let {vx, vy, seed, animationTime} = enemy;
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
        scale: 0.5,
    }
};
const ENEMY_HORNET_DASHER = 'hornetDasher';
enemyData[ENEMY_HORNET_DASHER] = {
    ...enemyData[ENEMY_HORNET],
    accelerate: (state, enemy) => {
        let {vx, vy, seed, animationTime, targetX, targetY, permanent} = enemy;
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
        scale: 0.5,
    }
};

module.exports = {
    ENEMY_HORNET,
    ENEMY_HORNET_SOLDIER,
    ENEMY_HORNET_CIRCLER,
    ENEMY_HORNET_DASHER,
};