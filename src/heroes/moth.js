const {
    ATTACK_OFFSET,
    ATTACK_SPRAY_UP, ATTACK_SPRAY_RIGHT, ATTACK_SPRAY_DOWN, ATTACK_SLASH,
    EFFECT_DEAD_MOTH, EFFECT_SWITCH_MOTH,
    HERO_MOTH,
    LOOT_ATTACK_POWER,
    LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
} = require('gameConstants');
const {
    requireImage, r,
    createAnimation,
} = require('animations');
const { heroesData, updatePlayer } = require('heroes');

const mothHitBox = {left: 27, top: 10, width: 48, height: 40};
const mothRectangle = r(88, 56, {hitBox: mothHitBox});
const mothAnimation = {
    frames: [
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth1.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth2.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth3.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth4.png')},
    ],
    frameDuration: 3,
};
const mothEnterAnimation = createAnimation('gfx/heroes/moth/mothflyin1.png', mothRectangle);
const mothCatchAnimation = createAnimation('gfx/heroes/moth/mothflyin2.png', mothRectangle);
const mothMeleeAnimation = {
    frames: [
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm1.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm2.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm3.png')},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm4.png')},
    ],
    frameDuration: 3,
};

heroesData[HERO_MOTH] = {
    animation: mothAnimation,
    enterAnimation: mothEnterAnimation,
    catchAnimation: mothCatchAnimation,
    meleeAnimation: mothMeleeAnimation,
    specialAnimation: {
        frames: [
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial1.png')},
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial2.png')},
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial3.png')},
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial4.png')},
        ],
        frameDuration: 6,
    },
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_MOTH,
    deathSfx: 'sfx/exclamation2.mp3',
    specialSfx: 'sfx/special.mp3',
    switchEffect: EFFECT_SWITCH_MOTH,
    portraitAnimation: createAnimation('gfx/heroes/moth/mothportrait.png', r(17, 18)),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/moth/mothportraitdead.png', r(17, 18)),
    baseSpeed: 6,
    meleePower: 1,
    meleeScaling: 0.5,
    hudColor: '#B0B0B0',
    specialCost: 10,
    applySpecial(state, playerIndex) {
        const player = state.players[playerIndex];
        if (player.specialFrames < 6 * 4) {
            return updatePlayer(state, playerIndex,
                {specialFrames: player.specialFrames + 1},
            );
        }
        return updatePlayer(state, playerIndex,
            {usingSpecial: false, invulnerableFor: 4000},
        );
    },
    shotCooldown: 16,
    shoot(state, playerIndex) {
        const player = state.players[playerIndex];
        const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
        const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        const tripleRates = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO).length;
        const scale = 1.5 + powers / 2 + triplePowers / 4;
        // This maxes out at 13 bullets.
        const numBullets = 3 + 3 * triplePowers;
        // This is between ~PI/4 and PI/2
        const minAngle = - Math.PI / 6 - numBullets * Math.PI / 96;
        const angleBetween = 2 * -minAngle / 3;
        for (let i = 0; i < numBullets; i++) {
            const theta = minAngle + angleBetween * ((i % 3) + Math.random());
            const vx = (tripleRates + 7 + 2 * Math.floor(i / 3)) * Math.cos(theta);
            const vy = (tripleRates + 7 + 2 * Math.floor(i / 3)) * Math.sin(theta);
            let type = ATTACK_SPRAY_RIGHT
            if (theta > Math.PI / 12) type = ATTACK_SPRAY_DOWN;
            else if (theta < -Math.PI / 12) type = ATTACK_SPRAY_UP;
            const blast = createAttack(type, {
                damage: 1,
                left: player.sprite.left + player.sprite.vx + player.sprite.width,
                xOffset: ATTACK_OFFSET,
                yOffset: 0,
                vx: vx,
                vy: vy,
                delay: 2,
                playerIndex,
                ttl: 20,
                piercing: true,
            });
            blast.width *= scale;
            blast.height *= scale;
            blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
            state = addPlayerAttackToState(state, blast);
        }
        return state;
    }
};

const { createAttack, addPlayerAttackToState } = require('attacks');