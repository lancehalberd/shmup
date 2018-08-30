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
    blastStartAnimation,
    blastLoopAnimation,
    slashAnimation,
    stabAnimation,
    bulletAnimation,
    hugeExplosionAnimation,
} = require('animations');

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


const sprayStartAnimation = createAnimation('gfx/attacks/s1.png', r(9, 9));
const sprayAnimationUp = createAnimation('gfx/attacks/s3.png', r(9, 9));
const sprayAnimationRight = createAnimation('gfx/attacks/s2.png', r(9, 9));
const sprayAnimationDown = createAnimation('gfx/attacks/s4.png', r(9, 9));

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
        animation: bulletAnimation,
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
        getHitBox(state, attack) {
            // Hack to make no hitBox when the beam hasn't fired yet.
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
                const hitBox = getEnemyHitBox(state, enemy);
                x = isFiringRight ?
                    hitBox.left + bulletX * hitBox.width + enemy.vx : // Facing right.
                    hitBox.left + (1 - bulletX) * hitBox.width + enemy.vx; // Facing left.
                y = hitBox.top + enemy.vy + bulletY * hitBox.height;
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
}

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

function getAttackHitBox(state, attack) {
    const attackData = attacks[attack.type];
    if (attackData.getHitBox) return attackData.getHitBox(state, attack);
    const frame = getAttackFrame(state, attack);
    if (frame.hitBox) return new Rectangle(frame.hitBox).translate(attack.left, attack.top);
    return new Rectangle(frame).moveTo(attack.left, attack.top);
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
    const scaleX = attack.scaleX || 1;
    const scaleY = attack.scaleY || 1;
    let target = attack;
    context.save();
    if (scaleX !== 1 || scaleY !== 1) {
        context.translate(attack.left + attack.width / 2, attack.top + attack.height / 2);
        context.scale(scaleX, scaleY);
        target = new Rectangle(attack).moveCenterTo(0, 0);
    }
    if (!amount) drawImage(context, frame.image, frame, target);
    else drawTintedImage(context, frame.image, color, amount, frame, target);
    context.restore();
};

function getAttackTint(attack) {
    const damage = attack.damage;
    if (attack.explosion || !damage || damage <= 1) return {};
    if (damage >= 6) return {color: 'white', amount: 0.9};
    if (damage >= 5) return {color: 'black', amount: 0.9};
    if (damage >= 4) return {color: 'blue', amount: 0.5};
    if (damage >= 3) return {color: 'green', amount: 0.4};
    if (damage >= 2) return {color: 'orange', amount: 0.5};
    return {};
}
function default_advanceAttack(state, attack) {
    let {left, top, width, height, vx, vy, delay, animationTime, playerIndex, ladybugIndex, melee, explosion, ttl} = attack;
    if ((delay > 0 || melee)) {
        delay--;
        if (!explosion && playerIndex >= 0) {
            let source = state.players[playerIndex].sprite;
            if (ladybugIndex >= 0) {
                source = state.players[playerIndex].ladybugs[ladybugIndex];
            }
            left = source.left + source.vx + source.width + (attack.xOffset || 0);
            top = source.top + source.vy + Math.round((source.height - height) / 2) + (attack.yOffset || 0);
        }
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
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
    return {...attack, delay, left, top, animationTime, done, ttl};
}

function advanceAttack(state, attack) {
    const attackData = attacks[attack.type];
    if (attackData.advance) return attackData.advance(state, attack);
    return default_advanceAttack(state, attack);
}

module.exports = {
    attacks,
    createAttack,
    getAttackHitBox,
    addPlayerAttackToState,
    addNeutralAttackToState,
    addEnemyAttackToState,
    advanceAttack,
    default_advanceAttack,
    renderAttack,
    getAttackTint,
};

const { enemyIsActive, getEnemyHitBox } = require('enemies');
