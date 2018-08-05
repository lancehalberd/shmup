const {
    FRAME_LENGTH, SHOT_COOLDOWN,
    ATTACK_OFFSET,
    ATTACK_STAB,
    EFFECT_DEAD_BEE, EFFECT_SWITCH_BEE,
    HERO_BEE,
    LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_POWER, LOOT_TRIPLE_RATE,
    LOOT_COMBO,
    LOOT_TRIPLE_COMBO,
} = require('gameConstants');
const random = require('random');
const { drawImage } = require('draw');
const {
    requireImage, r,
    createAnimation,
    getFrame,
} = require('animations');
const { heroesData, updatePlayer, isHeroSwapping } = require('heroes');

const beeHitBox = {left: 10, top: 12, width: 60, height: 40};
const beeRectangle = r(88, 56, {hitBox: beeHitBox});

const crosshairAnimation = createAnimation('gfx/heroes/bee/crosshair1.png', r(30, 30));
const crosshairLockedAnimation = {
    frames: [
        {...r(30, 30), image: requireImage('gfx/heroes/bee/crosshair2.png')},
        {...r(30, 30), image: requireImage('gfx/heroes/bee/crosshair3.png')},
    ],
    frameDuration: 12,
};

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
    specialSfx: 'sfx/special.mp3',
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
    advanceHero(state, playerIndex) {
        const player = state.players[playerIndex];
        const sprite = player.sprite;
        const powers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO).length;
        const tripleRates = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO).length;
        const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        const numTargets = 3 + tripleRates;
        const size = 50 + powers * 10 + triplePowers * 5;
        const targets = [...player[HERO_BEE].targets].slice(0, numTargets);
        const middle = {x: sprite.left + sprite.width / 2, y: sprite.top + sprite.height / 2};
        for (let i = 0; i < numTargets; i++) {
            if (!targets[i]) {
                if (isHeroSwapping(state.players[playerIndex])) break;
                targets[i] = {
                    left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET - 2,
                    top: player.sprite.top + player.sprite.vy + player.sprite.height / 2 - 2,
                    vx: player.sprite.vx,
                    vy: player.sprite.vy,
                    width: 2, height: 2,
                };
                break;
            }
            // Follow the enemy
            if (player.actions.shoot && targets[i].enemyId && state.idMap[targets[i].enemyId] &&
                !state.idMap[targets[i].enemyId].dead
            ) {
                const hitBox = getEnemyHitBox(state.idMap[targets[i].enemyId]);
                targets[i] = {
                    left: (targets[i].left + hitBox.left + hitBox.width / 2 - targets[i].width / 2) / 2,
                    top: (targets[i].top + hitBox.top + hitBox.height / 2 - targets[i].height / 2) / 2,
                    vx: 0, vy: 0,
                    width: (targets[i].width * 10 + size) / 11,
                    height: (targets[i].height * 10 + size) / 11,
                    enemyId: targets[i].enemyId,
                };
                continue;
            }
            const x = targets[i].left + targets[i].width / 2, y = targets[i].top + targets[i].height / 2;
            let vx = targets[i].vx * 0.8,
                vy = targets[i].vy * 0.8;
            const factor = (i % 2) ? -0.8 : 1.5;
            if (player.actions.right) vx += factor * 3;
            if (player.actions.left) vx -= factor * 2;
            if (player.actions.down) vy += factor * 2;
            if (player.actions.up) vy -= factor * 2;
            for (var j = 0; j < player[HERO_BEE].targets.length; j++) {
                if ( j === i) continue;
                const otherTarget = player[HERO_BEE].targets[j];
                if (otherTarget.enemyId) continue;
                const dx = targets[i].left - otherTarget.left, dy = targets[i].top - otherTarget.top;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance === 0) {
                    vx += 10 * Math.random() - 5;
                    vy += 10 * Math.random() - 5;
                } else {
                    vx += 20 * dx / (distance * distance);
                    vy += 20 * dy / (distance * distance);
                }
            }
            const dx = x - middle.x, dy = y - middle.y;
            const distance = Math.min(180, Math.sqrt(dx * dx + dy * dy));
            //if (distance < 140) {
                vx += 20 * dx / Math.max(0.5, (distance * distance));
                vy += 20 * dy / Math.max(0.5, (distance * distance));
            //} else if (distance > 160) {
                vx -= dx / Math.max(0.5, (180 - distance) * (180 - distance)) / 200;
                vy -= dy / Math.max(0.5, (180 - distance) * (180 - distance)) / 200;
            //}
            vx = Math.max(-20, Math.min(20, vx));
            vy = Math.max(-20, Math.min(20, vy));
            targets[i] = {
                left: targets[i].left + targets[i].vx,// + sprite.vx,
                top: targets[i].top + targets[i].vy,// + sprite.vy,
                vx, vy,
                width: (targets[i].width * 10 + size) / 11,
                height: (targets[i].height * 10 + size) / 11,
            };
        }
        return updatePlayer(state, playerIndex, {[HERO_BEE]: {...player[HERO_BEE], targets}});
    },
    render(context, player) {
        if (player.usingFinisher) return;
        context.save();
        for (const target of player[HERO_BEE].targets) {
            const animation = target.enemyId ? crosshairLockedAnimation : crosshairAnimation;
            const frame = getFrame(animation, player.sprite.animationTime);
            drawImage(context, frame.image, frame, target);
        }
        /*context.globalAlpha = 0.5;
        context.fillStyle = 'orange';
        for (const target of player[HERO_BEE].targets) {
            context.fillRect(target.left, target.top, target.width, target.height);
        }*/
        context.restore();
    },
    shoot(state, playerIndex) {
        let player = state.players[playerIndex];
        const attackSpeedPowers = player.powerups.filter(powerup => powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO).length
        const shotCooldown = (this.shotCooldown || SHOT_COOLDOWN) - attackSpeedPowers;
        state = updatePlayer(state, playerIndex, {shotCooldown});
        const triplePowers = player.powerups.filter(powerup => powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO).length;
        const damage = 1 + triplePowers;
        const tint = getAttackTint({damage});
        let hit = false;
        const targets = [...player[HERO_BEE].targets];
        for (let i = 0; i < targets.length; i++) {
            const targetHitBox = targets[i];
            for (let j = 0; j < state.enemies.length; j++) {
                const enemy = state.idMap[state.enemies[j].id];
                if (!enemyIsActive(state, enemy)) continue;
                if (targetHitBox.enemyId && targetHitBox.enemyId != enemy.id) continue;
                if (isIntersectingEnemyHitBoxes(enemy, targetHitBox)) {
                    const hitBox = getEnemyHitBox(enemy);
                    state = addEffectToState(state, createEffect(EFFECT_ARC_LIGHTNING, {
                        playerIndex, enemyId: enemy.id,
                        sx: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
                        sy: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
                        dx: Math.random() * 50 +
                            2 * ((targetHitBox.left + targetHitBox.width / 2) - (hitBox.left + hitBox.width / 2)),
                        dy: Math.random() * 50 +
                            2 * ((targetHitBox.top + targetHitBox.height / 2) - (hitBox.top + hitBox.height / 2)),
                        duration: 6 * FRAME_LENGTH,
                        // This will be rendered before it is positioned correctly,
                        // so just stick it off screen.
                        left: -200,
                        tint,
                        damage,
                    }));
                    hit = true;
                    targets[i] = {...targets[i], enemyId: enemy.id};
                    break;
                }
            }
        }
        // If no enemies are in range, just fire a random shot, otherwise the player may not
        // realize they are attacking.
        if (!hit) {
            const targetHitBox = random.element(targets);
            return addEffectToState(state, createEffect(EFFECT_ARC_LIGHTNING, {
                playerIndex,
                tx: targetHitBox.left + targetHitBox.width / 2,
                ty: targetHitBox.top + targetHitBox.height / 2,
                sx: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
                sy: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
                dx: Math.random() * 40,
                dy: Math.random() * 40,
                duration: 6 * FRAME_LENGTH,
                // This will be rendered before it is positioned correctly,
                // so just stick it off screen.
                left: -200,
                tint,
                damage,
            }));
        }
        return updatePlayer(state, playerIndex, {[HERO_BEE]: {...player[HERO_BEE], targets}});
    },
};

const { getAttackTint } = require('attacks');
const { addEffectToState, createEffect } = require('effects');
const { getEnemyHitBox, enemyIsActive, isIntersectingEnemyHitBoxes } = require('enemies');
const { checkToAddLightning, EFFECT_ARC_LIGHTNING } = require('effects/lightning');

