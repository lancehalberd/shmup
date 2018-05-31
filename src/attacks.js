const { drawImage, drawTintedImage } = require('draw');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING,
    ATTACK_BLAST, ATTACK_SLASH, ATTACK_STAB, ATTACK_BULLET, ATTACK_DEFEATED_ENEMY,
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

const laserRectangle = r(20, 7);
const laserStartAnimation = {
    frames: [
        {...laserRectangle, image: requireImage('gfx/attacks/r1.png')},
        {...laserRectangle, image: requireImage('gfx/attacks/r2.png')},
    ],
    frameDuration: 3,
};
const laserAnimation = createAnimation('gfx/attacks/r3.png', laserRectangle);

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
        startAnimation: laserStartAnimation,
        animation: laserAnimation,
        props: {
            damage: 2,
            piercing: true,
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

const createAttack = (type, props) => {
    const frame = (props.animation || attacks[type].animation).frames[0];
    return getNewSpriteState({
        ...frame,
        ...attacks[type].props,
        type,
        hitIds: {},
        ...props,
    });
};

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

const renderAttack = (context, attack) => {
    let {animationTime} = attack;
    const attackData = attacks[attack.type];
    let animation = attack.animation || attackData.animation;
    if (attackData.startAnimation) {
        const startAnimationLength = attackData.startAnimation.frames.length * attackData.startAnimation.frameDuration * FRAME_LENGTH;
        if (animationTime >= startAnimationLength) {
            animationTime -= startAnimationLength;
        } else {
            animation = attackData.startAnimation;
        }
    }
    const frame = getFrame(animation, animationTime);
    if (attack.explosion && attack.delay) return;
    // These should only apply to player attacks since any damage defeats a player.
    const {color, amount} = getAttackTint(attack);
    if (!amount) drawImage(context, frame.image, frame, attack);
    else drawTintedImage(context, frame.image, color, amount, frame, attack);
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

const advanceAttack = (state, attack) => {
    let {left, top, width, height, vx, vy, delay, animationTime, playerIndex, melee, explosion, ttl} = attack;
    if ((delay > 0 || melee)) {
        delay--;
        if (!explosion && playerIndex >= 0) {
            const source = state.players[playerIndex].sprite;
            left = source.left + source.vx + source.width + (attack.xOffset || 0);
            top = source.top + source.vy + Math.round((source.height - height) / 2) + (attack.yOffset || 0);
        }
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
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
};


module.exports = {
    attacks,
    createAttack,
    addPlayerAttackToState,
    addNeutralAttackToState,
    addEnemyAttackToState,
    advanceAttack,
    renderAttack,
    getAttackTint,
};
