const {
    ATTACK_OFFSET,
    ATTACK_BLAST, ATTACK_STAB,
    EFFECT_DEAD_BEE, EFFECT_SWITCH_BEE,
    HERO_BEE,
    LOOT_ATTACK_POWER,
    LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
} = require('gameConstants');
const {
    requireImage, r,
    createAnimation,
} = require('animations');
const { heroesData, updatePlayer } = require('heroes');

const beeHitBox = {left: 10, top: 12, width: 60, height: 40};
const beeRectangle = r(88, 56, {hitBox: beeHitBox});

heroesData[HERO_BEE] = {
    animation: {
        frames: [
            {...beeRectangle, image: requireImage('gfx/heroes/bee/bee1.png')},
            {...beeRectangle, image: requireImage('gfx/heroes/bee/bee2.png')},
            {...beeRectangle, image: requireImage('gfx/heroes/bee/bee3.png')},
            {...beeRectangle, image: requireImage('gfx/heroes/bee/bee4.png')},
        ],
        frameDuration: 3,
    },
    enterAnimation: createAnimation('gfx/heroes/bee/beeflyin1.png', beeRectangle),
    catchAnimation: createAnimation('gfx/heroes/bee/beeflyin2.png', beeRectangle),
    meleeAnimation: {
        frames: [
            {...beeRectangle, image: requireImage('gfx/heroes/bee/beem1.png')},
            {...beeRectangle, image: requireImage('gfx/heroes/bee/beem2.png')},
            {...beeRectangle, image: requireImage('gfx/heroes/bee/beem3.png')},
            {...beeRectangle, image: requireImage('gfx/heroes/bee/beem4.png')},
        ],
        frameDuration: 3,
    },
    specialAnimation: {
        frames: [
            {...r(88, 56), image: requireImage('gfx/heroes/bee/beespecial1.png')},
            {...r(88, 56), image: requireImage('gfx/heroes/bee/beespecial2.png')},
            {...r(88, 56), image: requireImage('gfx/heroes/bee/beespecial3.png')},
        ],
        frameDuration: 6,
    },
    meleeAttack: ATTACK_STAB,
    deathEffect: EFFECT_DEAD_BEE,
    deathSfx: 'sfx/exclamation.mp3',
    switchEffect: EFFECT_SWITCH_BEE,
    portraitAnimation: createAnimation('gfx/heroes/bee/beeportrait.png', r(17, 18)),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/bee/beeportraitdead.png', r(17, 18)),
    baseSpeed: 7,
    meleePower: 2,
    meleeScaling: 0.25,
    hudColor: '#603820',
    // hudColor: '#E85038'
    specialCost: 12,
    applySpecial(state, playerIndex) {
        // TODO: Brighten screen during lightning.
        const player = state.players[playerIndex];
        if (player.specialFrames < 6 * 3) {
            return updatePlayer(state, playerIndex,
                {specialFrames: player.specialFrames + 1},
            );
        }
        state = checkToAddLightning(state, {
            left: player.sprite.left + player.sprite.width - 10,
            top: player.sprite.top + player.sprite.height / 2,
        });
        return updatePlayer(state, playerIndex,
            {usingSpecial: false, invulnerableFor: 500},
        );
    },
    shoot(state, playerIndex) {
        const player = state.players[playerIndex];
        const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
        const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        const tripleRates = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO).length;
        const middleShot = {x: ATTACK_OFFSET, y: 0, vx: 20, vy: 0};
        const upperA = {x: ATTACK_OFFSET, y: -5, vx: 19, vy: -1}, lowerA = {x: ATTACK_OFFSET, y: 5, vx: 19, vy: 1};
        const upperB = {x: ATTACK_OFFSET - 4, y: -10, vx: 18.5, vy: -2}, lowerB = {x: ATTACK_OFFSET - 4, y: 10, vx: 18.5, vy: 2};
        const upperC = {x: ATTACK_OFFSET - 4, y: -15, vx: 17, vy: -4}, lowerC = {x: ATTACK_OFFSET - 4, y: 15, vx: 18, vy: 4};
        const upperD = {x: ATTACK_OFFSET - 10, y: -20, vx: 15, vy: -6}, lowerD = {x: ATTACK_OFFSET - 10, y: 20, vx: 15, vy: 6};
        const upperE = {x: ATTACK_OFFSET - 10, y: -25, vx: 15, vy: -6}, lowerE = {x: ATTACK_OFFSET - 10, y: 25, vx: 15, vy: 6};
        const blastPattern = [
                                [middleShot],
                                [upperA, lowerA],
                                [upperB, middleShot, lowerB],
                                [upperC, upperA, lowerA, lowerC],
                                [upperD, upperB, middleShot, lowerB, lowerD],
                                [upperE, upperC, upperA, lowerA, lowerC, lowerE],
                            ][tripleRates];
        const scale = 1 + powers + triplePowers / 2;
        for (const blastOffsets of blastPattern) {
            const blast = createAttack(ATTACK_BLAST, {
                damage: 1 + triplePowers,
                left: player.sprite.left + player.sprite.vx + player.sprite.width,
                xOffset: ATTACK_OFFSET,
                yOffset: 0,
                vx: blastOffsets.vx,
                vy: blastOffsets.vy,
                delay: 2,
                playerIndex,
            });
            blast.width *= scale;
            blast.height *= scale;
            blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
            state = addPlayerAttackToState(state, blast);
        }
        return state;
    },
};

const { createAttack, addPlayerAttackToState } = require('attacks');
const { checkToAddLightning } = require('effects/lightning');
