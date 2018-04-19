const {
    WIDTH,
    HEIGHT,
    GAME_HEIGHT,
    FRAME_LENGTH,
    DEATH_COOLDOWN,
    POINTS_FOR_POWERUP,
} = require('gameConstants');

const Rectangle = require('Rectangle');

const {
    drawImage,
    drawTintedImage,
    embossText,
} = require('draw');

const {
    playSound,
    playTrack,
    stopTrack,
} = require('sounds');

const { isKeyDown, KEY_R } = require('keyboard');

const {
    backgroundSky,
    plainsBackground,
    plainsMidground,
    plainsNearground,
    blastStartAnimation,
    blastLoopAnimation,
    ladybugAttackAnimation,
    bulletAnimation,
    explosionAnimation,
    selectNeedleImage,
    startGameImage,
    optionsImage,
    startImage,
    portraitImage,
    gameOverImage,
    hudImage,
    powerupBarAnimation,
    getHitBox,
    getFrame,
} = require('animations');

const {
    renderHero
} = require('heroes');

const {
    lootData,
    renderLoot,
} = require('loot');

const {
    renderEnemy
} = require('enemies');

const {
    renderEffect
} = require('effects');

const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

const HUD_PADDING = 9;

let rewindAlpha = 1;
const render = (state) => {
    if (state.world.bgm) {
        playTrack(state.world.bgm, state.world.time);
        state.world.bgm = false;
    }
    if (state.title) {
        renderTitle(context, state);
        return;
    }
    if (state.gameover) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        drawImage(context, gameOverImage.image, gameOverImage, new Rectangle(gameOverImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2));
        return;
    }
    context.save();
        if (isKeyDown(KEY_R)) {
            rewindAlpha = Math.max(0.05, rewindAlpha - .06);
        } else {
            rewindAlpha = Math.min(1, rewindAlpha + .02);
        }
        context.globalAlpha = rewindAlpha;
        renderBackground(state.world);
        context.globalAlpha = 1;

        context.save();
        context.translate(0, hudImage.height);
        state.playerAttacks.map(renderPlayerAttack);
        state.enemies.map(enemy => renderEnemy(context, enemy));
        state.loot.map(loot => renderLoot(context, loot));
        state.effects.map(effect => renderEffect(context, effect));
        // Thinking an attack shuold display on top of other effects so it can be avoided.
        state.enemyAttacks.map(renderEnemyAttack);
        state.players.map(hero => renderHero(context, hero));
        context.restore();

    context.restore();
    renderHUD(context, state);

    if (state.deathCooldown > 0) stopTrack();
    if (state.deathCooldown > 0 && state.deathCooldown < 500) {
        context.save();
        context.globalAlpha = Math.cos(Math.PI / 2 * state.deathCooldown / 500);
        context.fillStyle = 'black';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.restore();
    }
    if (state.paused) {
        stopTrack();
        context.save();
        context.globalAlpha = .3;
        context.fillStyle = 'black';
        context.fillRect(0, hudImage.height, WIDTH, GAME_HEIGHT);
        context.restore();
    }
    for (const sfx of state.sfx) {
        playSound(sfx);
    }
    state.sfx = [];
};

const renderHUD = (context, state) => {
    drawImage(context, hudImage.image, hudImage, hudImage);
    drawImage(context, portraitImage.image, portraitImage, new Rectangle(portraitImage).moveTo(HUD_PADDING, HUD_PADDING));
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.font="20px sans-serif";
    embossText(context, {
        text: `x ${state.players[0].lives}`,
        left: HUD_PADDING + portraitImage.width + HUD_PADDING,
        top: HUD_PADDING + portraitImage.height / 2 + 1,
        backgroundColor: '#AAA',
    });

    context.textAlign = 'right';
    embossText(context, {
        text: `SCORE: ${state.players[0].score}`,
        left: WIDTH - HUD_PADDING - 2,
        top: HUD_PADDING + portraitImage.height / 2 + 1,
        backgroundColor: '#AAA',
    });

    let powerupFrame = Math.floor(powerupBarAnimation.frames.length * (state.players[0].score % POINTS_FOR_POWERUP) / POINTS_FOR_POWERUP);
    let frame = powerupBarAnimation.frames[powerupFrame];
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(100, 8));

    for (let i = 0; i < state.players[0].powerups.length; i++) {
        const powerupType = state.players[0].powerups[i];
        frame = getFrame(lootData[powerupType].animation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(210 + 20 * i, 8));
    }
};

const renderTitle = (context, state) => {
    renderBackground(state.world);

    const options = [startGameImage, optionsImage];
    const targets = [new Rectangle(options[0]).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)];
    for (let i = 1; i < options.length; i++) {
        targets.push(new Rectangle(options[i]).scale(3).moveCenterTo(
            WIDTH / 2,
            targets[i - 1].top + targets[i - 1].height + 20 + 3 * options[i].height / 2
        ));
    }
    for (let i = 0; i < options.length; i++) {
        drawImage(context, options[i].image, options[i], targets[i]);
    }
    const target = targets[state.titleIndex];
    drawImage(context, selectNeedleImage.image, selectNeedleImage,
        new Rectangle(selectNeedleImage).scale(2).moveCenterTo(
            WIDTH / 2 - (3 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) + 10,
            target.top + target.height / 2,
        ),
    );
    /*drawTintedImage(context, startGameImage.image, '#f0a400', 1, startGameImage,
        new Rectangle(startGameImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)
    );*/
    //drawTintedImage(context, frame.image, 'gold', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
    //drawImage(context, optionsImage.image, optionsImage,
    //    new Rectangle(optionsImage).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2 + startGameImage.height * 3 + 10)
    //);
    // renderForeground(state.world);
};

const renderPlayerAttack = (attack) => {
    if (attack.type === 'ladybug') {
        const frame = getFrame(ladybugAttackAnimation, attack.animationTime);
        drawImage(context, frame.image, frame, attack);
        return;
    }
    const {animationTime} = attack;
    let frameIndex = animationTime / FRAME_LENGTH;
    const startFrames = blastStartAnimation.frames.length * blastStartAnimation.frameDuration;
    let animation = blastStartAnimation;
    if (frameIndex >= startFrames) {
        animation = blastLoopAnimation;
        frameIndex -= startFrames;
    }
    frameIndex = Math.floor(frameIndex / animation.frameDuration);
    const frame = animation.frames[frameIndex % animation.frames.length];
    if (attack.damage === 3) drawTintedImage(context, frame.image, 'blue', .3, frame, attack);
    else if (attack.damage === 2) drawTintedImage(context, frame.image, 'red', .3, frame, attack);
    else drawImage(context, frame.image, frame, attack);
    if (attack.sfx) {
        playSound(attack.sfx);
        attack.sfx = false;
    }
};

const renderEnemyAttack = (attack) => {
    const frame = getFrame(bulletAnimation, attack.animationTime);
    drawImage(context, frame.image, frame, attack);
};

const renderBackgroundLayer = (context, {image, x, y}) => {
    const left = (x) % image.width;
    const right = (x + WIDTH) % image.width;
    if (right < left) {
        let leftWidth = image.width - left;
        context.drawImage(image.image, left, 0, leftWidth, image.height,
            0, y, leftWidth, image.height);
        context.drawImage(image.image, 0, 0, right, image.height,
            leftWidth, y, right, image.height);
    } else {
        context.drawImage(image.image, left, 0, image.width, image.height,
            0, y, image.width, image.height);
    }
};

const renderBackground = (world) => {
    // context.fillStyle = 'black';
    // context.fillRect(0, 0, WIDTH, HEIGHT);
    const {
        x, y,
        backgroundYFactor, backgroundXFactor, backgroundXOffset, backgroundYOffset,
        midgroundYFactor, midgroundXFactor, midgroundXOffset, midgroundYOffset,
        neargroundYFactor, neargroundXFactor, neargroundXOffset, neargroundYOffset,
    } = world;
    renderBackgroundLayer(context, {image: plainsBackground,
        x: x * backgroundXFactor + (backgroundXOffset || 0),
        y: y * backgroundYFactor + (backgroundYOffset || 0),
    });
    renderBackgroundLayer(context, {image: plainsMidground,
        x: x * midgroundXFactor + (midgroundXOffset || 0),
        y: y * midgroundYFactor + (midgroundYOffset || 0),
    });
    renderBackgroundLayer(context, {image: plainsNearground,
        x: x * neargroundXFactor + (neargroundXOffset || 0),
        y: y * neargroundYFactor + (neargroundYOffset || 0),
    });
};

/*const renderForeground = ({x, y, foregroundXFactor, foregroundYFactor, foregroundXOffset, foregroundYOffset}) => {
    renderBackgroundLayer(context, {image: plainsForeground,
        x: x * foregroundXFactor + (foregroundXOffset || 0),
        y: y * foregroundYFactor + (foregroundYOffset || 0),
    });
};*/

module.exports = render;
