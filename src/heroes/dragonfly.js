const {
    ATTACK_OFFSET, SHOT_COOLDOWN,
    ATTACK_BLAST, ATTACK_SLASH,
    EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY,
    HERO_DRAGONFLY,
    LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
} = require('gameConstants');
const Rectangle = require('Rectangle');
const {
    requireImage, r,
    createAnimation,
} = require('animations');
const { heroesData, updatePlayer, useMeleeAttack, getHeroHitBox } = require('heroes');

const dragonflyHitBox = {left: 10, top: 15, width: 70, height: 30};
const dragonflyRectangle = r(88, 56, {hitBox: dragonflyHitBox});
const dragonflyAnimation = {
    frames: [
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly1.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly2.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly3.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly4.png')},
    ],
    frameDuration: 3,
};
const dragonflyEnterAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyflyin1.png', dragonflyRectangle);

const dragonflyCatchAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyflyin2.png', dragonflyRectangle);

const dragonflyMeleeAnimation = {
    frames: [
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym1.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym2.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym3.png')},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym4.png')},
    ],
    frameDuration: 3,
};

heroesData[HERO_DRAGONFLY] = {
    animation: dragonflyAnimation,
    enterAnimation: dragonflyEnterAnimation,
    catchAnimation: dragonflyCatchAnimation,
    meleeAnimation: dragonflyMeleeAnimation,
    specialAnimation: {
        frames: [
            {...r(88, 56), image: requireImage('gfx/heroes/dragonfly/knightspecial1.png')},
            {...r(88, 56), image: requireImage('gfx/heroes/dragonfly/knightspecial2.png')},
        ],
        frameDuration: 8,
    },
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_DRAGONFLY,
    deathSfx: 'sfx/exclamation3.mp3',
    specialSfx: 'sfx/dash.mp3',
    switchEffect: EFFECT_SWITCH_DRAGONFLY,
    portraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportrait.png', r(17, 18)),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportraitdead.png', r(17, 18)),
    baseSpeed: 8,
    meleePower: 1,
    meleeScaling: 0.25,
    hudColor: '#F03010',
    specialCost: 8,
    applySpecial(state, playerIndex) {
        // TODO: support multiple directions, add ghost trail behind her.
        const player = state.players[playerIndex];
        for (let i = 0; i < state.enemies.length; i++) {
            let enemy = state.enemies[i];
            const enemyHitBox = getEnemyHitBox(enemy);
            if (enemyIsActive(state, enemy) &&
                Rectangle.collision(enemyHitBox, getHeroHitBox(player))
            ) {
                state = damageEnemy(state, enemy.id, {playerIndex});
            }
        }
        if (player.specialFrames <= 20) {
            return updatePlayer(state, playerIndex,
                {specialFrames: player.specialFrames + 1},
                {left: player.sprite.left + 15}
            );
        }
        state = useMeleeAttack(state, playerIndex);
        return updatePlayer(state, playerIndex,
            {usingSpecial: false, invulnerableFor: 500},
        );
    },
    shoot(state, playerIndex) {
        let player = state.players[playerIndex];
        const attackSpeedPowers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length
        const shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, {shotCooldown});
        player = state.players[playerIndex];

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
    }
};

const { createAttack, addPlayerAttackToState } = require('attacks');
const { getEnemyHitBox, damageEnemy, enemyIsActive } = require('enemies');

