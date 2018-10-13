const {
    ATTACK_OFFSET, SHOT_COOLDOWN,
    ATTACK_SPRAY_UP, ATTACK_SPRAY_RIGHT, ATTACK_SPRAY_DOWN, ATTACK_SLASH,
    EFFECT_DEAD_MOTH, EFFECT_SWITCH_MOTH, EFFECT_REVIVE_MOTH,
    HERO_MOTH,
    LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
} = require('gameConstants');
const {
    PRIORITY_HEROES,
    requireImage, r,
    createAnimation,
} = require('animations');
const { heroesData, updatePlayer } = require('heroes');

const mothHitBox = {left: 27, top: 10, width: 48, height: 40};
const mothRectangle = r(88, 56, {hitBox: mothHitBox});
const mothAnimation = {
    frames: [
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth1.png', PRIORITY_HEROES)},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth2.png', PRIORITY_HEROES)},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth3.png', PRIORITY_HEROES)},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/moth4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 3,
};
const mothEnterAnimation = createAnimation('gfx/heroes/moth/mothflyin1.png', mothRectangle, {priority: PRIORITY_HEROES});
const mothCatchAnimation = createAnimation('gfx/heroes/moth/mothflyin2.png', mothRectangle, {priority: PRIORITY_HEROES});
const mothMeleeAnimation = {
    frames: [
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm1.png', PRIORITY_HEROES)},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm2.png', PRIORITY_HEROES)},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm3.png', PRIORITY_HEROES)},
        {...mothRectangle, image: requireImage('gfx/heroes/moth/mothm4.png', PRIORITY_HEROES)},
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
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial1.png', PRIORITY_HEROES)},
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial2.png', PRIORITY_HEROES)},
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial3.png', PRIORITY_HEROES)},
            {...r(88, 56), image: requireImage('gfx/heroes/moth/mothspecial4.png', PRIORITY_HEROES)},
        ],
        frameDuration: 6,
    },
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_MOTH,
    deathSfx: 'sfx/exclamation2.mp3',
    reviveSfx: 'sfx/special.mp3',
    specialSfx: 'activateInvisibility',
    reviveEffect: EFFECT_REVIVE_MOTH,
    switchEffect: EFFECT_SWITCH_MOTH,
    portraitAnimation: createAnimation('gfx/heroes/moth/mothportrait.png', r(17, 18), {priority: PRIORITY_HEROES}),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/moth/mothportraitdead.png', r(17, 18), {priority: PRIORITY_HEROES}),
    baseSpeed: 6,
    meleePower: 1,
    meleeScaling: 0.5,
    chargeXOffset: -24,
    hudColor: '#B0B0B0',
    specialCost: 10,
    applySpecial(state, playerIndex) {
        const player = state.players[playerIndex];
        if (player.specialFrames < 6 * 4) {
            return updatePlayer(state, playerIndex,
                {specialFrames: player.specialFrames + 1},
            );
        }
        // Using 4001 will trigger a warning noise from code in
        // heroes.js when there is 1 second left.
        return updatePlayer(state, playerIndex,
            {usingSpecial: false, invulnerableFor: 4001},
        );
    },
    shotCooldown: 16,
    shoot(state, playerIndex) {
        let player = state.players[playerIndex];
        const attackSpeedPowers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length
        const shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, {shotCooldown});
        player = state.players[playerIndex];
        const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
        const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        const tripleRates = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO).length;
        const scale = 1.5 + triplePowers / 2;
        // This maxes out at 13 bullets.
        const numBullets = 3 + 2 * powers;
        // This is between ~PI/4 and PI/2
        const minAngle = - Math.PI / 6 - numBullets * Math.PI / 96;
        const angleBetween = 2 * -minAngle / 3;
        for (let i = 0; i < numBullets; i++) {
            const theta = minAngle + angleBetween * ((i % 3) + Math.random());
            const vx = (3 * tripleRates + 7 + 2 * Math.floor(i / 3)) * Math.cos(theta);
            const vy = (3 * tripleRates + 7 + 2 * Math.floor(i / 3)) * Math.sin(theta);
            let type = ATTACK_SPRAY_RIGHT
            if (theta > Math.PI / 12) type = ATTACK_SPRAY_DOWN;
            else if (theta < -Math.PI / 12) type = ATTACK_SPRAY_UP;
            const blast = createAttack(type, {
                damage: 1 + triplePowers,
                left: player.sprite.left + player.sprite.vx + player.sprite.width,
                xOffset: ATTACK_OFFSET,
                yOffset: 0,
                vx: vx,
                vy: vy,
                delay: 2,
                playerIndex,
                ttl: 20,
                piercing: true,
                scale,
            });
            blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
            state = addPlayerAttackToState(state, blast);
        }
        return state;
    }
};

const { createAttack, addPlayerAttackToState } = require('attacks');
