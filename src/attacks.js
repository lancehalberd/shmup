const { drawImage, drawTintedImage } = require('draw');

const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT, OFFSCREEN_PADDING, ATTACK_OFFSET,
    ATTACK_BLAST, ATTACK_SLASH, ATTACK_STAB, ATTACK_BULLET, ATTACK_ORB, ATTACK_DEFEATED_ENEMY,
    ATTACK_EXPLOSION
} = require('gameConstants');

const {
    playSound,
} = require('sounds');

const {
    getFrame,
    blastStartAnimation,
    blastLoopAnimation,
    slashAnimation,
    stabAnimation,
    ladybugAttackAnimation,
    bulletAnimation,
    hugeExplosionAnimation,
} = require('animations');

const { getNewSpriteState } = require('sprites');

const attacks = {
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
        animation: ladybugAttackAnimation,
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
    return {...state, newPlayerAttacks: [...state.newPlayerAttacks, attack] };
};

const addEnemyAttackToState = (state, attack) => {
    return {...state, newEnemyAttacks: [...state.newEnemyAttacks, attack] };
};

const addNeutralAttackToState = (state, attack) => {
    return {...state, newNeutralAttacks: [...state.newNeutralAttacks, attack] };
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
    if (attack.explosion || attack.damage === 1 || !attack.damage) drawImage(context, frame.image, frame, attack);
    else if (attack.damage >= 6) drawTintedImage(context, frame.image, 'white', .9, frame, attack);
    else if (attack.damage === 5) drawTintedImage(context, frame.image, 'black', .9, frame, attack);
    else if (attack.damage === 4) drawTintedImage(context, frame.image, 'blue', .5, frame, attack);
    else if (attack.damage === 3) drawTintedImage(context, frame.image, 'red', .4, frame, attack);
    else if (attack.damage === 2) drawTintedImage(context, frame.image, 'orange', .5, frame, attack);
    if (attack.sfx) {
        playSound(attack.sfx);
        attack.sfx = false;
    }
};

const advanceAttack = (state, attack) => {
    let {left, top, width, height, vx, vy, delay, animationTime, playerIndex, melee, explosion} = attack;
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
    if (melee || explosion) {
        const animation = attacks[attack.type].animation;
        done = animationTime >= animation.frames.length * animation.frameDuration * FRAME_LENGTH;
    } else {
        done = left + width  < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING ||
                top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;
    }
    return {...attack, delay, left, top, animationTime, done};
};


module.exports = {
    attacks,
    createAttack,
    addPlayerAttackToState,
    addNeutralAttackToState,
    addEnemyAttackToState,
    advanceAttack,
    renderAttack,
};
