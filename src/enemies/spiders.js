
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');
const { createAnimation, r } = require('animations');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_HORNET, ENEMY_HORNET_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET, ATTACK_DEFEATED_ENEMY, ATTACK_EXPLOSION,
    EFFECT_EXPLOSION, EFFECT_DAMAGE, EFFECT_DUST,
    LOOT_COIN,
} = require('gameConstants');

const { enemyData, updateEnemy } = require('enemies');
const { getGroundHeight } = require('world');

const ENEMY_BROWN_SPIDER = 'brownSpider';
enemyData[ENEMY_BROWN_SPIDER] = {
    animation: createAnimation('gfx/enemies/bspidersheet.png', r(70, 55), {cols: 2, duration: 30}),
    deathAnimation: createAnimation('gfx/enemies/bspidersheet.png', r(70, 55), {x: 2, duration: 30}),
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: (state, enemy) => {
        let {mode, targetY, vy, grounded} = enemy;
        if (grounded) return state;
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
                } else if (enemy.top > -10) {
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
    drawUnder(context, enemy) {
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
}
