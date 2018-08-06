
const { createAnimation, r } = require('animations');

const {
    GAME_HEIGHT,
} = require('gameConstants');

const { enemyData, updateEnemy, getDefaultEnemyAnimation } = require('enemies');
const { getGroundHeight, getHazardCeilingHeight } = require('world');

function getMinHeight(state) {
    return Math.max(-10, getHazardCeilingHeight(state) + 5);
}

const ENEMY_JUMPING_SPIDER = 'jumpingSpider';
enemyData[ENEMY_JUMPING_SPIDER] = {
    animation: createAnimation('gfx/enemies/spiders/jspider.png', r(55, 40), {rows: 2, duration: 30}),
    deathAnimation: createAnimation('gfx/enemies/spiders/jspider.png', r(55, 40), {y: 2, duration: 30}),
    crouchingAnimation: createAnimation('gfx/enemies/spiders/jspider.png', r(55, 40), {y: 3, duration: 30}),
    jumpingAnimation: createAnimation('gfx/enemies/spiders/jspider.png', r(55, 40), {y: 4, duration: 30}),
    getAnimation(state, enemy) {
        if (enemy.grounded && !enemy.dead) {
            return enemy.vy < 0 ? this.jumpingAnimation: this.crouchingAnimation;
        }
        return getDefaultEnemyAnimation(state, enemy);
    },
    // needs death soundfx
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: (state, enemy) => {
        let {mode, targetY, vx, vy, jumps, grounded} = enemy;
        const playerSprite = state.players[0].sprite;
        if (!grounded) {
            const meleeAttacks = state.playerAttacks.filter(attack => attack.melee);
            for (const meleeAttack of meleeAttacks) {
                if (meleeAttack.top + meleeAttack.height / 2 < enemy.top &&
                    meleeAttack.left + meleeAttack.width > enemy.left + enemy.width / 2 &&
                    meleeAttack.left < enemy.left + enemy.width / 2
                ) {
                    return {...enemy, grounded: true, hanging: false, mode: 'jumping'};
                }
            }
        }

        switch (mode) {
            case 'climbing':
                // If the player is under the spider.
                if (enemy.top + enemy.height < playerSprite.top &&
                    !(playerSprite.left + playerSprite.width < enemy.left ||
                        playerSprite.left > enemy.left + enemy.width)
                ) {
                    //set spider state as grounded to let go of web and fall
                    return {...enemy, grounded: true, hanging: false, mode: 'jumping'};
                } else if (enemy.top > getMinHeight(state)) {
                    vy = Math.max(-2, vy - 1);
                } else {
                    vy = Math.min(0, vy + 1);
                }
                break;
            case 'jumping': {
                // The spider cannot do anything if it isn't touching the ground.
                if (enemy.top + enemy.height < getGroundHeight(state)) {
                    //console.log('falling');
                    return enemy;
                }
                if (jumps >= 3) {
                    return {...enemy, vx: enemy.vx * 1.3, vy: -Math.abs(2 * vx)};
                }

                //set base speed to world velocity
                jumps = jumps || 0;

                const baseSpeed = state.world.vx * state.world.ground.xFactor

                //if on ground, move toward player if player is not above
                //otherwise jump at player
                if (playerSprite.left + playerSprite.width < enemy.left) {
                    //console.log('left');
                    vx = baseSpeed - 5;
                    vy = -4;
                } else if (playerSprite.left > enemy.left + enemy.width) {
                    //console.log('right');
                    vx = baseSpeed + 2;
                    vy = -4;
                } else {
                    targetY = playerSprite.top + playerSprite.height/2;
                    //vx = baseSpeed;
                    // begin jump
                    if (targetY > 2*GAME_HEIGHT/3) {
                        vy = -15;
                    } else if (targetY > GAME_HEIGHT/3) {
                        vy = -21;
                    } else {
                        vy = -30;
                    }

                    jumps++;
                }
                break;
            }

        }
        return {...enemy, targetY, jumps, vx, vy, mode};
    },
    drawUnder(context, state, enemy) {
        if (enemy.dead || enemy.grounded) return;
        context.strokeStyle = 'white';
        for (let lineWidth = 1; lineWidth <= 4; lineWidth++) {
            context.beginPath();
            context.lineWidth = lineWidth;
            context.moveTo(enemy.left + enemy.width / 2, enemy.top + enemy.height / 2);
            context.lineTo(enemy.left + enemy.width / 2, (lineWidth - 1) * (enemy.top + enemy.height / 2) / 3.5);
            context.stroke();
        }
    },
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {ttl: 600});
    },
    props: {
        life: 10,
        score: 100,
        hanging: true,
        mode: 'climbing',
        modeTime: 0,
        vx: 0,
    }
};


const ENEMY_BROWN_SPIDER = 'brownSpider';
enemyData[ENEMY_BROWN_SPIDER] = {
    animation: createAnimation('gfx/enemies/spiders/bspidersheet.png', r(70, 55), {cols: 2, duration: 30}),
    deathAnimation: createAnimation('gfx/enemies/spiders/bspidersheet.png', r(70, 55), {x: 2, duration: 30}),

    // needs death soundfx
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: (state, enemy) => {
        let {mode, targetY, vy, grounded} = enemy;
        if (grounded) return enemy;
        const playerSprite = state.players[0].sprite;

        const meleeAttacks = state.playerAttacks.filter(attack => attack.melee);
        for (const meleeAttack of meleeAttacks) {
            if (meleeAttack.top + meleeAttack.height / 2 < enemy.top &&
                meleeAttack.left + meleeAttack.width > enemy.left + enemy.width / 2 &&
                meleeAttack.left < enemy.left + enemy.width / 2
            ) {
                return {...enemy, grounded: true};
            }
        }

        switch (mode) {
            case 'climbing':
                // If the player is under the spider.
                if (enemy.top + enemy.height < playerSprite.top &&
                    !(playerSprite.left + playerSprite.width < enemy.left ||
                        playerSprite.left > enemy.left + enemy.width)
                ) {
                    mode = 'plunging';
                    targetY = playerSprite.top + playerSprite.height;
                } else if (enemy.top > getMinHeight(state)) {
                    vy = Math.max(-2, vy - 1);
                } else {
                    vy = Math.min(0, vy + 1);
                }
                break;
            case 'plunging':
                if (enemy.top + enemy.height >= Math.min(targetY, getGroundHeight(state))) {
                    mode = 'climbing';
                } else {
                    vy = 10;
                }
                break;
        }
        return {...enemy, targetY, vy, mode};
    },
    drawUnder(context, state, enemy) {
        if (enemy.dead || enemy.grounded) return;
        context.strokeStyle = 'white';
        for (let lineWidth = 1; lineWidth <= 4; lineWidth++) {
            context.beginPath();
            context.lineWidth = lineWidth;
            context.moveTo(enemy.left + enemy.width / 2, enemy.top + enemy.height / 2);
            context.lineTo(enemy.left + enemy.width / 2, (lineWidth - 1) * (enemy.top + enemy.height / 2) / 3.5);
            context.stroke();
        }
    },
    props: {
        life: 10,
        score: 100,
        hanging: true,
        mode: 'climbing',
        modeTime: 0,
        doNotFlip: true,
        vx: 0,
    }
};
module.exports = {
    ENEMY_BROWN_SPIDER,
    ENEMY_JUMPING_SPIDER,
};
