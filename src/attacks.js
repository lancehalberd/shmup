const { drawImage, drawTintedImage } = require('draw');
const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    ATTACK_BLAST, ATTACK_SLASH, ATTACK_STAB,
    ATTACK_BULLET, ATTACK_RED_LASER,
    ATTACK_DEFEATED_ENEMY,
    ATTACK_SPRAY_UP, ATTACK_SPRAY_RIGHT, ATTACK_SPRAY_DOWN,
    ATTACK_ORB, ATTACK_LASER,
    ATTACK_EXPLOSION,
} = require('gameConstants');

const {
    requireImage, r,
    createAnimation,
    getFrame,
    hugeExplosionAnimation,
    PRIORITY_HEROES,
} = require('animations');
const { isKeyDown, KEY_SHIFT } = require('keyboard');

const { getNewSpriteState } = require('sprites');

const orbRectangle = r(10, 10);
const orbAnimation = {
    frames: [
        {...orbRectangle, image: requireImage('gfx/attacks/lbshot1.png')},
        {...orbRectangle, image: requireImage('gfx/attacks/lbshot2.png')},
        {...orbRectangle, image: requireImage('gfx/attacks/lbshot3.png')},
        {...orbRectangle, image: requireImage('gfx/attacks/lbshot4.png')},
    ],
    frameDuration: 2,
};


const sprayStartAnimation = createAnimation('gfx/attacks/s1.png', r(7, 7));
const sprayAnimationUp = createAnimation('gfx/attacks/s3.png', r(9, 9));
const sprayAnimationRight = createAnimation('gfx/attacks/s2.png', r(11, 7));
const sprayAnimationDown = createAnimation('gfx/attacks/s4.png', r(9, 9));


const slashGeometry = r(30, 50, {
    hitbox: {left: -20, top: 0, width: 50, height: 50},
});
const slashAnimation = {
    frames: [
        {...slashGeometry, image: requireImage('gfx/attacks/slash1.png', PRIORITY_HEROES)},
        {...slashGeometry, image: requireImage('gfx/attacks/slash2.png', PRIORITY_HEROES)},
        {...slashGeometry, image: requireImage('gfx/attacks/slash3.png', PRIORITY_HEROES)},
        {...slashGeometry, image: requireImage('gfx/attacks/slash4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 3,
};

const stabGeometry = r(45, 45, {
    hitbox: {left: -20, top: 0, width: 65, height: 45},
});
const stabAnimation = {
    frames: [
        {...stabGeometry, image: requireImage('gfx/attacks/stab1.png', PRIORITY_HEROES)},
        {...stabGeometry, image: requireImage('gfx/attacks/stab2.png', PRIORITY_HEROES)},
        {...stabGeometry, image: requireImage('gfx/attacks/stab3.png', PRIORITY_HEROES)},
        {...stabGeometry, image: requireImage('gfx/attacks/stab4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 3,
};


const blastRectangle = r(20, 7);
const blastStartAnimation = {
    frames: [
        {...r(7, 7), image: requireImage('gfx/attacks/b1.png', PRIORITY_HEROES)},
    ],
    frameDuration: 2,
};
const blastLoopAnimation = {
    frames: [
        {...blastRectangle, image: requireImage('gfx/attacks/b2.png', PRIORITY_HEROES)},
        {...blastRectangle, image: requireImage('gfx/attacks/b3.png', PRIORITY_HEROES)},
        {...blastRectangle, image: requireImage('gfx/attacks/b4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 2,
};

const attacks = {
    [ATTACK_SPRAY_UP]: {
        startAnimation: sprayStartAnimation,
        animation: sprayAnimationUp,
        props: {
            sfx: 'sfx/shoot.mp3',
        },
    },
    [ATTACK_SPRAY_RIGHT]: {
        startAnimation: sprayStartAnimation,
        animation: sprayAnimationRight,
        props: {
            sfx: 'sfx/shoot.mp3',
        },
    },
    [ATTACK_SPRAY_DOWN]: {
        startAnimation: sprayStartAnimation,
        animation: sprayAnimationDown,
        props: {
            sfx: 'sfx/shoot.mp3',
        },
    },
    [ATTACK_BLAST]: {
        startAnimation: blastStartAnimation,
        animation: blastLoopAnimation,
        props: {
            sfx: 'sfx/shoot.mp3',
        }
    },
    [ATTACK_SLASH]: {
        animation: slashAnimation,
        hitSfx: 'sfx/meleehit.mp3',
        props: {
            melee: true,
            piercing: true,
            sfx: 'sfx/dodge.mp3',
        },
    },
    [ATTACK_STAB]: {
        animation: stabAnimation,
        hitSfx: 'sfx/meleehit.mp3',
        props: {
            melee: true,
            piercing: true,
            sfx: 'sfx/dodge.mp3',
        },
    },
    [ATTACK_BULLET]: {
        animation: createAnimation('gfx/attacks/ebout.png', r(14, 15), {cols: 4}),
        props: {
            deflectable: true,
        }
    },
    [ATTACK_ORB]: {
        animation: orbAnimation,
    },
    [ATTACK_LASER]: {
        laserBallFrame: {...r(7, 7), image: requireImage('gfx/attacks/r1.png')},
        laserStartFrame: {...r(20, 7), image: requireImage('gfx/attacks/r2.png')},
        laserBeamFrame: {...r(18, 7), image: requireImage('gfx/attacks/r3.png')},
        advance(state, attack) {
            let animationTime = attack.animationTime;
            animationTime += FRAME_LENGTH;
            return {
                ...attack,
                animationTime,
                // Attack is finished once the duration runs out or the attacker is not present.
                done: animationTime > attack.duration || !this.getSource(state, attack)
            };
        },
        render(context, state, attack) {
            const {x, y, isFiringRight, beamWidth} = this.getGeometry(state, attack);
            if (attack.animationTime <= attack.frameDelay * FRAME_LENGTH) {
                const target = new Rectangle(this.laserBallFrame).moveTo(isFiringRight ? x : x - this.laserBallFrame.width, y - 4);
                drawImage(context, this.laserBallFrame.image, this.laserBallFrame, target);
            } else if (isFiringRight) {
                const target = new Rectangle(this.laserStartFrame).moveTo(x, y - 4);
                context.save();
                context.translate(target.left + target.width / 2, target.top + target.height / 2);
                context.scale(-1, 1);
                context.translate(-target.left - target.width / 2, -target.top - target.height / 2)
                drawImage(context, this.laserStartFrame.image, this.laserStartFrame, target);
                context.restore();
                if (beamWidth - this.laserStartFrame.width > 0) {
                    target.left = x + this.laserStartFrame.width;
                    target.width = beamWidth - this.laserStartFrame.width;
                    drawImage(context, this.laserBeamFrame.image, this.laserBeamFrame, target);
                }
            } else {
                const target = new Rectangle(this.laserStartFrame).moveTo(x - this.laserStartFrame.width, y - 4);
                drawImage(context, this.laserStartFrame.image, this.laserStartFrame, target);
                if (beamWidth - this.laserStartFrame.width > 0) {
                    target.left = x - beamWidth;
                    target.width = beamWidth - this.laserStartFrame.width;
                    drawImage(context, this.laserBeamFrame.image, this.laserBeamFrame, target);
                }
            }
        },
        getHitbox(state, attack) {
            // Hack to make no hitbox when the beam hasn't fired yet.
            if (attack.animationTime <= attack.frameDelay * FRAME_LENGTH) {
                return new Rectangle(-1000, -1000, 0, 0);
            }
            const {x, y, isFiringRight, beamWidth} = this.getGeometry(state, attack);
            return new Rectangle(isFiringRight ? x : x - beamWidth, y - 4, beamWidth, 7);
        },
        getSource(state, attack) {
            const {playerIndex, ladybugIndex, enemyId} = attack;
            if (enemyId) {
                const enemy = state.idMap[enemyId];
                if (enemyIsActive(state, enemy)) return enemy;
            }
            if (playerIndex >= 0) {
                const player = state.players[playerIndex];
                if (player.spawning || player.done) return null;
                if (ladybugIndex >= 0) {
                    return state.players[playerIndex].ladybugs[ladybugIndex];
                }
                return player.sprite;
            }
            return null;
        },
        getGeometry(state, attack) {
            const source = this.getSource(state, attack);
            if (!source) return {x: -1000, y: -1000};
            const isFiringRight = !attack.enemyId || (!source.doNotFlip && source.vx > 0);
            let x, y;
            if (attack.enemyId) {
                const enemy = source;
                const bulletX = enemy.bulletX !== undefined ? enemy.bulletX : 1;
                const bulletY = enemy.bulletY !== undefined ? enemy.bulletY : 0.5;
                const hitbox = getEnemyHitbox(state, enemy);
                x = isFiringRight ?
                    hitbox.left + bulletX * hitbox.width + enemy.vx : // Facing right.
                    hitbox.left + (1 - bulletX) * hitbox.width + enemy.vx; // Facing left.
                y = hitbox.top + enemy.vy + bulletY * hitbox.height;
            } else {
                x = source.left + source.vx + (attack.xOffset || 0) + (isFiringRight ? source.width : 0);
                y = source.top + source.vy + (attack.yOffset || 0) + source.height / 2;
            }
            const beamWidth = Math.min(800, (attack.animationTime - attack.frameDelay * FRAME_LENGTH) * 4);
            return {x, y, isFiringRight, beamWidth};
        },
        props: {
            damage: 2,
            piercing: true,
            duration: 400,
            frameDelay: 3,
        },
    },
    [ATTACK_DEFEATED_ENEMY]: {
        // The animation will be the enemy death animation.
        hitSfx: 'sfx/throwhit.mp3',
        props: {
            piercing: true,
        },
    },
    [ATTACK_EXPLOSION]: {
        animation: hugeExplosionAnimation,
        props: {
            damage: 20, piercing: true,
            sfx: 'sfx/explosion.mp3',
            explosion: true,
        },
    },
};
window.attacks = attacks;

attacks[ATTACK_RED_LASER] = {
    ...attacks[ATTACK_LASER],
    laserBallFrame: {...r(8, 7), image: requireImage('gfx/attacks/elaser1.png')},
    laserStartFrame: {...r(20, 7), image: requireImage('gfx/attacks/elaser2.png')},
    laserBeamFrame: {...r(20, 7), image: requireImage('gfx/attacks/elaser3.png')},
    props: {
        piercing: true,
        duration: 700,
        frameDelay: 20,
    },
};
const ATTACK_GAS = 'gas';
attacks[ATTACK_GAS] = {
    animation: createAnimation('gfx/enemies/stinkbugsheet.png', r(30, 30), {cols: 2, x: 4}),
    props: {
        // This attack only lasts 3 seconds.
        ttl: 3000 / FRAME_LENGTH,
        relativeToGround: true,
        // This will prevent the cloud from being removed on hitting a player
        piercing: true,
    },
};
const ATTACK_WATER = 'water';
attacks[ATTACK_WATER] = {
    animation: createAnimation('gfx/attacks/archer_fish_water2.png', r(10, 10)),
    onHitHero(state, enemyAttackIndex, playerIndex) {
        return updatePlayer(state, playerIndex, {}, {vy: state.players[playerIndex].sprite.vy * 0.8 + 4});
    },
    props: {
        ay: 0.1
    },
};
const ATTACK_URCHIN_NEEDLE = 'urchinNeedle';
attacks[ATTACK_URCHIN_NEEDLE] = {
    animation: createAnimation('gfx/attacks/urchinattack.png', r(5, 23,
        // We don't support rotating hitboxes in this game, so we just make the hitboxes
        // square and centered in the graphic so it works at any rotation.
        {hitbox: {left:0, top: 9, width: 5, height:5},
    })),
};

const createAttack = (type, props) => {
    const frame = (props.animation || attacks[type].animation || {frames: [{}]}).frames[0];
    return getNewSpriteState({
        ...frame,
        ...attacks[type].props,
        type,
        hitIds: {},
        ...props,
    });
};

function getAttackFrame(state, attack) {
    const attackData = attacks[attack.type];
    let animationTime = attack.animationTime;
    let animation = attack.animation || attackData.animation;
    if (attackData.startAnimation) {
        const startAnimationLength = attackData.startAnimation.frames.length * attackData.startAnimation.frameDuration * FRAME_LENGTH;
        if (animationTime >= startAnimationLength) {
            animationTime -= startAnimationLength;
        } else {
            animation = attackData.startAnimation;
        }
    }
    return getFrame(animation, animationTime);
}

function getAttackHitbox(state, attack) {
    const attackData = attacks[attack.type];
    if (attackData.getHitbox) return attackData.getHitbox(state, attack);
    const frame = getAttackFrame(state, attack);
    let hitbox = frame.hitbox || {...frame, left: 0, top: 0};
    return attackHitboxToGlobalHitbox(state, attack, hitbox);
}
function getAttackHitboxes(state, attack) {
    const attackData = attacks[attack.type];
    if (attackData.getHitbox) return [attackData.getHitbox(state, attack)];
    const frame = getAttackFrame(state, attack);
    const hitboxes = frame.hitboxes || [frame.hitbox || new Rectangle(frame).moveTo(0, 0)];
    return hitboxes.map(hitbox => attackHitboxToGlobalHitbox(state, attack, hitbox));
}
function attackHitboxToGlobalHitbox(state, attack, hitbox) {
    const frame = getAttackFrame(state, attack);
    const scaleX = (attack.scaleX || attack.scale || 1) * (frame.scaleX || 1);
    const scaleY = (attack.scaleY || attack.scale || 1) * (frame.scaleY || 1);
    return new Rectangle(hitbox)
        .moveCenterTo(0, 0)
        .stretch(scaleX, scaleY)
        .translate(
            attack.left + hitbox.left + hitbox.width / 2,
            attack.top + hitbox.top + hitbox.height / 2,
        );
}

const addPlayerAttackToState = (state, attack) => {
    let sfx = state.sfx;
    if (attack.sfx) sfx = {...sfx, [attack.sfx]: true};
    return {...state, newPlayerAttacks: [...state.newPlayerAttacks, attack], sfx};
};

const addEnemyAttackToState = (state, attack) => {
    let sfx = state.sfx;
    if (attack.sfx) sfx = {...sfx, [attack.sfx]: true};
    return {...state, newEnemyAttacks: [...state.newEnemyAttacks, attack], sfx };
};

const addNeutralAttackToState = (state, attack) => {
    let sfx = state.sfx;
    if (attack.sfx) sfx = {...sfx, [attack.sfx]: true};
    return {...state, newNeutralAttacks: [...state.newNeutralAttacks, attack], sfx };
};

const renderAttack = (context, state, attack) => {
    const attackData = attacks[attack.type];
    if (attackData.render) return attackData.render(context, state, attack);
    if (attack.explosion && attack.delay) return;
    const frame = getAttackFrame(state, attack);
    // These should only apply to player attacks since any damage defeats a player.
    const {color, amount} = getAttackTint(attack);
    const scaleX = attack.scaleX || attack.scale || 1;
    const scaleY = attack.scaleY || attack.scale || 1;
    let target = new Rectangle(frame).moveTo(attack.left, attack.top);
    context.save();
    const rotation = attack.rotation || 0;
    context.translate(attack.left + target.width / 2, attack.top + target.height / 2);
    target = new Rectangle(target).moveTo(-target.width / 2, -target.height / 2);
    if (scaleX !== 1 || scaleY !== 1) {
        context.scale(scaleX, scaleY);
    }
    if (rotation !== 0) {
        //context.translate(-target.width / 2, -target.height / 2);
        context.rotate(rotation);
        //context.translate(target.width / 2, target.height / 2);
    }
    if (!amount) drawImage(context, frame.image, frame, target);
    else drawTintedImage(context, frame.image, color, amount, frame, target);
    context.restore();
    if (isKeyDown(KEY_SHIFT)) {
        context.save();
        context.globalAlpha = .15;
        context.fillStyle = 'red';
        let hitboxes = getAttackHitboxes(state, attack);
        hitboxes.push(getAttackHitbox(state, attack));
        for (const hitbox of hitboxes) {
            context.fillRect(hitbox.left, hitbox.top, hitbox.width, hitbox.height);
        }
        context.restore();
    }
};

function getAttackTint(attack) {
    if (attack.tint) return attack.tint;
    const damage = attack.damage;
    if (attack.explosion || attack.type === ATTACK_DEFEATED_ENEMY || !damage || damage <= 1) return {};
    if (damage >= 6) return {color: 'white', amount: 0.9};
    if (damage >= 5) return {color: 'black', amount: 0.9};
    if (damage >= 4) return {color: 'blue', amount: 0.5};
    if (damage >= 3) return {color: 'green', amount: 0.4};
    if (damage >= 2) return {color: 'orange', amount: 0.5};
    return {};
}
function default_advanceAttack(state, attack) {
    let {left, top, vx, vy, delay, animationTime, playerIndex, ladybugIndex, melee, explosion, ttl} = attack;
    let frame = getAttackFrame(state, attack);
    let { width, height } = frame;
    if ((delay > 0 || melee)) {
        delay--;
        if (!explosion && playerIndex >= 0) {
            let source = state.players[playerIndex].sprite;
            if (ladybugIndex >= 0) {
                source = state.players[playerIndex].ladybugs[ladybugIndex];
            }
            left = source.left + source.vx + source.width + (attack.xOffset || 0) + Math.round(width * (attack.scale || 1) / 2);
            top = source.top + source.vy + (source.height - attack.height) / 2 + (attack.yOffset || 0);
            const startAnimation = attacks[attack.type].startAnimation;
            if (delay === 0 && startAnimation) {
                animationTime = startAnimation.frames.length * startAnimation.frameDuration * FRAME_LENGTH;
            }
        }
    }
    if (!(delay > 0)) {
        if (attack.ax) vx += attack.ax;
        if (attack.ay) vy += attack.ay;
        left += vx;
        top += vy;
        if (attack.relativeToGround) {
            const neargroundKey = state.world.mgLayerNames[state.world.mgLayerNames.length - 1];
            left -= state.world[neargroundKey].xFactor * state.world.vx;
            top += state.world[neargroundKey].yFactor * state.world.vy;
        }
    } else {
        return {...attack, delay, left, top, animationTime, done, ttl};
    }
    animationTime += FRAME_LENGTH;
    let done = false;
    if (ttl > 0) {
        ttl--;
        done = (ttl <= 0);
    } else if (melee || explosion) {
        const animation = attacks[attack.type].animation;
        done = animationTime >= animation.frames.length * animation.frameDuration * FRAME_LENGTH;
    } else {
        done = left + width  < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
                top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;
    }
    return {...attack, delay, left, top, animationTime, done, vx, vy, ttl};
}

function advanceAttack(state, attack) {
    const attackData = attacks[attack.type];
    if (attackData.advance) return attackData.advance(state, attack);
    return default_advanceAttack(state, attack);
}

module.exports = {
    attacks,
    getAttackFrame,
    createAttack,
    getAttackHitbox,
    getAttackHitboxes,
    addPlayerAttackToState,
    addNeutralAttackToState,
    addEnemyAttackToState,
    advanceAttack,
    default_advanceAttack,
    renderAttack,
    getAttackTint,
    ATTACK_GAS,
    ATTACK_WATER,
    ATTACK_URCHIN_NEEDLE,
};

const { enemyIsActive, getEnemyHitbox } = require('enemies');
const { updatePlayer } = require('heroes');
