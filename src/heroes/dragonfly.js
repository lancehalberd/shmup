const {
    ATTACK_OFFSET, SHOT_COOLDOWN,
    ATTACK_BLAST, ATTACK_SLASH,
    EFFECT_DEAD_DRAGONFLY, EFFECT_SWITCH_DRAGONFLY, EFFECT_REVIVE_DRAGONFLY,
    HERO_DRAGONFLY,
    LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE, LOOT_COMBO, LOOT_TRIPLE_COMBO,
} = require('gameConstants');
const {
    PRIORITY_HEROES,
    requireImage, r,
    createAnimation,
} = require('animations');
const { heroesData, updatePlayer } = require('heroes');
const { LOOT_NECKLACE, LOOT_NEEDLE } = require('loot');
const { createAttack, addPlayerAttackToState, getAttackFrame } = require('attacks');

const dragonflyHitbox = {left: 10, top: 15, width: 70, height: 30};
const dragonflyRectangle = r(88, 56, {
    hitbox: dragonflyHitbox,
    hitboxes: [
        {"left":61,"width":14,"top":18,"height":16},
        {"left":13,"width":50,"top":30,"height":7},
        {"left":40,"width":35,"top":34,"height":10},
    ]
});
const dragonflyAnimation = {
    frames: [
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly1.png', PRIORITY_HEROES)},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly2.png', PRIORITY_HEROES)},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly3.png', PRIORITY_HEROES)},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonfly4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 3,
};
const dragonflyEnterAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyflyin1.png', dragonflyRectangle, {priority: PRIORITY_HEROES});

const dragonflyCatchAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyflyin2.png', dragonflyRectangle, {priority: PRIORITY_HEROES});

const dragonflyMeleeAnimation = {
    frames: [
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym1.png', PRIORITY_HEROES)},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym2.png', PRIORITY_HEROES)},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym3.png', PRIORITY_HEROES)},
        {...dragonflyRectangle, image: requireImage('gfx/heroes/dragonfly/dragonflym4.png', PRIORITY_HEROES)},
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
            {...r(88, 56), image: requireImage('gfx/heroes/dragonfly/knightspecial1.png', PRIORITY_HEROES)},
            {...r(88, 56), image: requireImage('gfx/heroes/dragonfly/knightspecial2.png', PRIORITY_HEROES)},
        ],
        frameDuration: 8,
    },
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_DRAGONFLY,
    deathSfx: 'sfx/exclamation3.mp3',
    reviveSfx: 'dragonFlyRevive',
    specialSfx: 'sfx/dash.mp3',
    reviveEffect: EFFECT_REVIVE_DRAGONFLY,
    switchEffect: EFFECT_SWITCH_DRAGONFLY,
    portraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportrait.png', r(17, 18), {priority: PRIORITY_HEROES}),
    defeatedPortraitAnimation: createAnimation('gfx/heroes/dragonfly/dragonflyportraitdead.png', r(17, 18), {priority: PRIORITY_HEROES}),
    baseSpeed: 8,
    meleePower: 1,
    meleeScaling: 0.25,
    chargeXOffset: -18,
    hudColor: '#F03010',
    specialCost: 8,
    applySpecial(state, playerIndex) {
        const player = state.players[playerIndex];
        if (player.specialFrames < 6 * 4) {
            return updatePlayer(state, playerIndex,
                {specialFrames: player.specialFrames + 1},
            );
        }
        let invulnerableFor = 500, slowTimeFor = 8000;
        if (state.players[0].relics[LOOT_NECKLACE]) {
            invulnerableFor += 500;
            slowTimeFor += 2000;
        }
        state = updatePlayer(state, playerIndex, {usingSpecial: false, invulnerableFor});
        return {...state, slowTimeFor: 8000};
        /*
        // TODO: support multiple directions, add ghost trail behind her.
        const player = state.players[playerIndex];
        for (let i = 0; i < state.enemies.length; i++) {
            let enemy = state.enemies[i];
            if (enemyIsActive(state, enemy) &&
                isIntersectingEnemyHitboxes(state, enemy, getHeroHitbox(player))
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
        );*/
    },
    shoot(state, playerIndex) {
        let player = state.players[playerIndex];
        const attackSpeedPowers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length
        const shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, {shotCooldown});
        player = state.players[playerIndex];

        let powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
        let triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        let tripleRates = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO).length;
        if (state.players[0].relics[LOOT_NEEDLE]) {
            powers+=2;
            tripleRates+=2;
            triplePowers+=2;
        }

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
                            ][Math.min(tripleRates, 5)];
        const scale = 1 + powers + triplePowers / 2;
        for (const blastOffsets of blastPattern) {
            const blast = createAttack(ATTACK_BLAST, {
                damage: 1 + triplePowers + powers / 3,
                left: player.sprite.left + player.sprite.vx + player.sprite.width,
                xOffset: ATTACK_OFFSET,
                yOffset: 0,
                vx: blastOffsets.vx,
                vy: blastOffsets.vy,
                delay: 2,
                playerIndex,
                scale,
            });
            let { width, height } = getAttackFrame(state, blast);
            blast.left += scale * width / 2;
            blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - height) / 2);
            state = addPlayerAttackToState(state, blast);
        }
        return state;
    }
};
