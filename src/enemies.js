
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_FLY, ENEMY_HORNET, ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    EFFECT_EXPLOSION, EFFECT_DAMAGE,
    LOOT_COIN, LOOT_LIFE,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const {
    getFrame,
    getHitBox,
    flyAnimation,
    flyDeathAnimation,
    hornetAnimation,
    hornetDeathAnimation,
    flyingAntAnimation,
    flyingAntDeathAnimation,
    flyingAntSoldierAnimation,
    flyingAntSoldierDeathAnimation,
    bulletAnimation,
} = require('animations');

const { getNewSpriteState } = require('sprites');

const { createEffect } = require('effects');
const { createLoot } = require('loot');

const enemyData = {
    [ENEMY_FLY]: {
        animation: flyAnimation,
        deathAnimation: flyDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        props: {
            life: 1,
            score: 20,
        },
    },
    [ENEMY_HORNET]: {
        animation: hornetAnimation,
        deathAnimation: hornetDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
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
                        const {dx, dy} = getTargetVector(enemy, {left: targetX, top: targetY});
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
        }
    },
    [ENEMY_FLYING_ANT]: {
        animation: flyingAntAnimation,
        deathAnimation: flyingAntDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy, seed} = enemy;
            const target = state.players[0].sprite;
            const speed = enemy.speed;
            const dx = target.left + target.width / 2 - (enemy.left + enemy.width / 2)
            const dy = target.top + target.height / 2 - (enemy.top + enemy.height / 2)
            const theta = Math.atan2(dy, dx);
            if (enemy.animationTime === 0) {
                vx = speed * Math.cos(theta);
                vy = speed * Math.sin(theta);
            } else if (enemy.animationTime < 3000) {
                vx = (vx * 20 + speed * Math.cos(theta)) / 21;
                vy = (vy * 20 + speed * Math.sin(theta)) / 21;
            }
            return {...enemy, vx, vy};
        },
        props: {
            life: 1,
            score: 30,
            speed: 6,
        }
    },
    [ENEMY_FLYING_ANT_SOLDIER]: {
        animation: flyingAntSoldierAnimation,
        deathAnimation: flyingAntSoldierDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        accelerate(state, enemy) {
            let {vx, vy, seed} = enemy;
            const speed = enemy.speed;
            const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            const theta = Math.atan2(dy, dx);
            if (enemy.animationTime === 0) {
                vx = speed * Math.cos(theta);
                vy = speed * Math.sin(theta);
            } else if (enemy.animationTime < 3000) {
                vx = (vx * 20 + speed * Math.cos(theta)) / 21;
                vy = (vy * 20 + speed * Math.sin(theta)) / 21;
            }
            return {...enemy, vx, vy};
        },
        shoot(state, enemyIndex) {
            const enemies = [...state.enemies];
            let enemy = enemies[enemyIndex];
            if (enemy.shotCooldown === undefined) {
                enemy.shotCooldown = 20 + Math.floor(100 * Math.random());
            }
            if (enemy.shotCooldown > 0) {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldown - 1 };
                return { ...state, enemies };
            } else {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldownFrames };
            }
            const bulletFrame = bulletAnimation.frames[0];
            let attack = getNewSpriteState({
                ...bulletFrame,
                left: enemy.left - enemy.vx,
                top: enemy.top + enemy.vy + Math.round((enemy.height - bulletAnimation.frames[0].height) / 2),
                vx: enemy.vx * 1.3,
                vy: enemy.vy * 1.3,
            });
            return {...state, enemies, newEnemyAttacks: [...state.newEnemyAttacks, attack] };
        },
        onDeathEffect(state, enemy) {
            const flyingAnt = createEnemy(ENEMY_FLYING_ANT, {
                left: enemy.left,
                top: enemy.top,
                speed: 9,
                vx: 10,
                vy: Math.random() < .5 ? -5 : 5,
                animationTime: 20,
            });
            return addEnemyToState(state, flyingAnt);
        },
        props: {
            life: 2,
            score: 20,
            speed: 5,
            shotCooldownFrames: 200,
        },
    },
}

const createEnemy = (type, props) => {
    const frame = enemyData[type].animation.frames[0];
    return getNewSpriteState({
        ...frame,
        ...enemyData[type].props,
        type,
        seed: Math.random(),
        ...props,
    });
};

// Return the value with the smallest absolute value.
const absMin = (A, B) => {
    if (A < 0 && B < 0) return Math.max(A, B);
    if (A > 0 && B > 0) return Math.min(A, B);
    return Math.abs(A) < Math.abs(B) ? A : B;
};

const getTargetVector = (agent, target) => {
    return {
        dx: target.left + (target.width || 0) / 2 - (agent.left + (agent.width || 0) / 2),
        dy: target.top + (target.height || 0) / 2 - (agent.top + (agent.height || 0) / 2),
    };
};

const addEnemyToState = (state, enemy) => {
    return {...state, newEnemies: [...state.newEnemies, enemy] };
}

const getEnemyHitBox = ({type, animationTime, left, top}) => {
    return new Rectangle(getHitBox(enemyData[type].animation, animationTime)).translate(left, top);
};

const damageEnemy = (state, enemyIndex, attack) => {
    let updatedState = {...state};
    updatedState.enemies = [...updatedState.enemies];
    updatedState.players = [...updatedState.players];
    updatedState.newEffects = [...updatedState.newEffects];
    const enemy = updatedState.enemies[enemyIndex];
    updatedState.enemies[enemyIndex] = {
        ...enemy,
        life: enemy.life - 1,
        dead: enemy.life <= 1,
        animationTime: enemy.life <= 1 ? 0 : enemy.animationTime,
    };
    if (updatedState.enemies[enemyIndex].dead) {
        updatedState.players[attack.playerIndex] = {
            ...updatedState.players[attack.playerIndex],
            score: updatedState.players[attack.playerIndex].score + enemy.score
        };

        updatedState.spawnDuration = Math.min(2500, updatedState.spawnDuration + 100);
        const explosion = createEffect(EFFECT_EXPLOSION);
        if (enemyData[enemy.type].onDeathEffect) {
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemy);
        }
        updatedState.newEffects.push(getNewSpriteState({
            ...explosion,
            left: enemy.left + (enemy.width - explosion.width ) / 2,
            top: enemy.top + (enemy.height - explosion.height ) / 2,
            sfx: enemyData[enemy.type].deathSound,
        }));
        if (Math.random() < enemy.score / 200) {
            const coin = createLoot(Math.random() < .03 ? LOOT_LIFE : LOOT_COIN);
            updatedState.newLoot.push(getNewSpriteState({
                ...coin,
                left: enemy.left + (enemy.width - coin.width ) / 2,
                top: enemy.top + (enemy.height - coin.height ) / 2,
            }));
        }
    } else {
        const damage = createEffect(EFFECT_DAMAGE);
        updatedState.newEffects.push(getNewSpriteState({
            ...damage,
            left: attack.left + attack.vx + (attack.width - damage.width ) / 2,
            top: attack.top + attack.vy + (attack.height - damage.height ) / 2,
            sfx: 'sfx/hit.mp3',
        }));
    }
    return updatedState;
}

const renderEnemy = (context, enemy) => {
    let animation = enemyData[enemy.type].animation;
    if (enemy.dead && enemyData[enemy.type].deathAnimation) {
        animation = enemyData[enemy.type].deathAnimation;
    }
    const frame = getFrame(animation, enemy.animationTime);
    context.save();
    if (enemy.dead) {
        context.globalAlpha = .6;
    }
    drawImage(context, frame.image, frame, enemy);
    if (isKeyDown(KEY_SHIFT)) {
        const hitBox = getEnemyHitBox(enemy);
        context.globalAlpha = .6;
        context.fillStyle = 'red';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
    }
    context.restore();
};

const advanceEnemy = (state, enemy) => {
    let {left, top, width, height, delay, animationTime} = enemy;
    left += enemy.vx;
    top += enemy.vy;
    animationTime += FRAME_LENGTH;
    if (enemy.dead) {
        enemy = {...enemy, vy: enemy.vy + 1};
    } else if (enemyData[enemy.type].accelerate) {
        enemy = enemyData[enemy.type].accelerate(state, enemy);
    }
    // cleanup dead enemies or non permanent enemies when they go off the edge of the screen.
    const done = (enemy.dead || !enemy.permanent) &&
        (left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
        top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING);
    return {...enemy, left, top, animationTime, done};
};

module.exports = {
    enemyData,
    createEnemy,
    addEnemyToState,
    damageEnemy,
    advanceEnemy,
    renderEnemy,
    getEnemyHitBox,
};