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

const { isKeyDown, KEY_SHIFT, KEY_R } = require('keyboard');

const {
    blastStartAnimation,
    blastLoopAnimation,
    ladybugAttackAnimation,
    bulletAnimation,
    explosionAnimation,
    selectNeedleImage,
    startGameImage,
    optionsImage,
    startImage,
    gameOverImage,
    hudImage,
    powerupBarAnimation,
    comboBarAnimation,
    getHitBox,
    getFrame,
    dragonflyIdleAnimation,
} = require('animations');

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
        renderBackground(context, state);
        context.globalAlpha = 1;

        context.save();
        context.translate(0, hudImage.height);
        state.playerAttacks.map(attack => renderAttack(context, attack));
        state.enemies.map(enemy => renderEnemy(context, enemy));
        state.loot.map(loot => renderLoot(context, loot));
        state.effects.map(effect => renderEffect(context, effect));
        state.neutralAttacks.map(attack => renderAttack(context, attack));
        // Thinking an attack shuold display on top of other effects so it can be avoided.
        state.enemyAttacks.map(attack => renderAttack(context, attack));
        state.players.map(hero => renderHero(context, hero));
        context.restore();

        renderForeground(context, state);

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
    for (let i = 0; i < state.players[0].heroes.length; i++) {
        const { portraitAnimation } = heroesData[state.players[0].heroes[i]];
        let frame = getFrame(portraitAnimation, state.world.time);
        drawImage(context, frame.image, frame,
            new Rectangle(frame).moveTo(HUD_PADDING + 1 + i * 20, HUD_PADDING)
        );
    }

    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.font = "20px sans-serif";
    embossText(context, {
        text: `${state.players[0].score}`,
        left: 665,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA',
    });

    let {powerupPoints, powerupIndex} = state.players[0];
    let powerupFrame = Math.floor(powerupBarAnimation.frames.length * (powerupPoints / powerupGoals[powerupIndex]));
    powerupFrame = Math.min(powerupBarAnimation.frames.length - 1, powerupFrame);
    let frame = powerupBarAnimation.frames[powerupFrame];
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(190, 8));

    let comboScore = state.players[0].comboScore;
    let nextCombo = 100;
    if (comboScore < 100) {
        nextCombo = 100;
    } else if (comboScore < 200) {
        comboScore -= 100;
        nextCombo = 100;
    } else if (comboScore < 400) {
        comboScore -= 200;
        nextCombo = 200;
    } else if (comboScore < 600) {
        comboScore -= 400;
        nextCombo = 200;
    }  else {
        comboScore -= 600;
        nextCombo = 400;
    }

    let comboFrame = Math.min(
        comboBarAnimation.frames.length - 1,
        Math.floor((comboBarAnimation.frames.length - 1) * comboScore / nextCombo),
    );
    frame = comboBarAnimation.frames[comboFrame];
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(523, 8));

    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.font = "20px sans-serif";
    embossText(context, {
        text: (isKeyDown(KEY_SHIFT) ? `${state.players[0].comboScore} ` : '') + `${getComboMultiplier(state, 0)}x`,
        left: 518,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA',
    });

    for (let i = 0; i < state.players[0].powerups.length; i++) {
        const powerupType = state.players[0].powerups[i];
        frame = getFrame(lootData[powerupType].animation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(292 + 20 * i, 8));
    }
};

const renderTitle = (context, state) => {
    renderBackground(context, state);
    renderForeground(context, state);
    const frame = dragonflyIdleAnimation.frames[0];
    const sprite = state.players[0].sprite;
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(sprite.left, hudImage.height + sprite.top));

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


module.exports = render;

const {
    renderBackground, renderForeground,
} = require('world');

const {
    heroesData,
    renderHero,
} = require('heroes');

const {
    lootData,
    renderLoot,
    getComboMultiplier,
    powerupGoals,
} = require('loot');

const {
    renderEnemy
} = require('enemies');

const {
    renderEffect
} = require('effects');

const {
    renderAttack,
} = require('attacks');
