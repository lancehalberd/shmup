const {
    WIDTH,
    HEIGHT,
    GAME_HEIGHT,
    MAX_ENERGY,
} = require('gameConstants');

const Rectangle = require('Rectangle');

const {
    drawImage,
    // drawTintedImage,
    embossText,
} = require('draw');

const {
    playSound,
    playTrack,
    stopTrack,
} = require('sounds');

const { renderHitBoxes } = require('editHitboxes');

const { isKeyDown, KEY_SHIFT, KEY_R } = require('keyboard');

const {
    PRIORITY_TITLE,
    PRIORITY_FIELD,
    requireImage,
    r, createAnimation,
    getFrame,
} = require('animations');

const canvas = document.createElement('canvas');
window.canvas = canvas;
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style = 'display: block; margin: 0 auto;';
const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

const HUD_PADDING = 9;

const dragonflyIdleAnimation = createAnimation('gfx/heroes/dragonfly/dragonflyidle.png', r(88, 56), {priority: PRIORITY_TITLE});

let rewindAlpha = 1;
const render = (state) => {
    if (state.hitBoxFrame) {
        renderHitBoxes(context, state);
        return;
    }
    if (state.interacted && state.bgm) {
        playTrack(state.bgm, state.world.time);
        state.bgm = false;
    }
    if (state.title) return renderTitle(context, state);
    if (state.gameover) return renderGameOver(context, state);
    context.save();
        if (state.world.transitionFrames > 0) {
            const p = state.world.transitionFrames / 100;
            context.globalAlpha = (1 - p);
            context.translate(WIDTH * p * p * p, 0);
            renderBackground(context, state);
        } else {
            if (isKeyDown(KEY_R) || state.slowTimeFor > 0) {
                rewindAlpha = Math.max(0.05, rewindAlpha - .06);
            } else {
                rewindAlpha = Math.min(1, rewindAlpha + .02);
            }
            context.globalAlpha = rewindAlpha;
            renderBackground(context, state);
            context.globalAlpha = 1;
        }

        context.save();
        context.translate(0, hudImage.height);
        state.enemies.map(enemy => renderEnemy(context, state, enemy));
        state.playerAttacks.map(attack => renderAttack(context, state, attack));
        state.loot.map(loot => renderLoot(context, state, loot));
        state.players.map(hero => renderHero(context, hero));
        state.effects.map(effect => renderEffect(context, effect));
        state.neutralAttacks.map(attack => renderAttack(context, state, attack));
        // Thinking an attack shuold display on top of other effects so it can be avoided.
        state.enemyAttacks.map(attack => renderAttack(context, state, attack));
        context.restore();

        renderForeground(context, state);

    context.restore();

    for (let enemyId in (state.world.lifebars || {})) {
        const lifebar = state.world.lifebars[enemyId];
        const enemy = state.idMap[enemyId];
        const P = Math.min(1, (state.world.time - lifebar.startTime) / 3000);
        if (P < 0) {
            console.error("Lifebar startTime is less than current world time");
            debugger;
        }
        const width = Math.ceil(lifebar.width * P);
        const p = enemy ? enemy.life / enemy.maxLife : 0;
        context.fillStyle = 'black';
        context.fillRect(lifebar.left, lifebar.top, width, lifebar.height);
        context.fillStyle = ['green', 'yellow', 'orange', 'red', 'black'][Math.floor((1 - p) / 0.25)];
        context.fillRect(lifebar.left, lifebar.top, Math.min(width, Math.ceil(lifebar.width * p)), lifebar.height);
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.beginPath();
        context.rect(lifebar.left, lifebar.top, width, lifebar.height);
        context.stroke();
    }

    if (state.deathCooldown > 0) stopTrack();
    if (state.deathCooldown > 0 && state.deathCooldown < 500) {
        context.save();
        context.globalAlpha = Math.cos(Math.PI / 2 * state.deathCooldown / 500);
        context.fillStyle = 'black';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.restore();
    }
    // Render HUD on top of the screen fading to black.
    renderHUD(context, state);
    if (state.paused) {
        stopTrack();
        context.save();
        context.globalAlpha = .3;
        context.fillStyle = 'black';
        context.fillRect(0, hudImage.height, WIDTH, GAME_HEIGHT);
        context.restore();
    }
    if (state.interacted) {
        for (const sfx in state.sfx) {
            playSound(sfx);
        }
    }
    state.sfx = {};
};

const hudImage = r(800, 36, {image: requireImage('gfx/hud/newhud.png', PRIORITY_FIELD)});
const powerupBarAnimation = createAnimation('gfx/hud/powerup0.png', r(100, 19), {priority: PRIORITY_FIELD});
const comboBarAnimation = createAnimation('gfx/hud/combo0.png', r(100, 19), {priority: PRIORITY_FIELD});
const renderHUD = (context, state) => {
    drawImage(context, hudImage.image, hudImage, hudImage);
    for (let i = 0; i < state.players[0].heroes.length; i++) {
        const heroType = state.players[0].heroes[i];
        const energy = state.players[0][heroType].energy;
        const left = HUD_PADDING + 1 + i * 20, top = HUD_PADDING;
        if (energy <= 0) {
            let frame = getFrame(heroesData[heroType].defeatedPortraitAnimation, state.world.time);
            drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(left, top));
            const grayBlock = new Rectangle(frame).stretch(1, Math.min(20, -energy) / 20);
            context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'black';
            context.fillRect(left, top + frame.height - grayBlock.height, grayBlock.width, grayBlock.height);
            context.fillStyle = 'grey';
            context.fillRect(left, top, grayBlock.width, frame.height - grayBlock.height);
            context.restore();
        } else {
            let frame = getFrame(heroesData[heroType].portraitAnimation, state.world.time);
            drawImage(context, frame.image, frame,
                new Rectangle(frame).moveTo(HUD_PADDING + 1 + i * 20, HUD_PADDING)
            );
            /*const grayBlock = new Rectangle(frame).stretch(1, Math.max(0, MAX_ENERGY - energy) / MAX_ENERGY);
            context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'grey';
            context.fillRect(left, top + frame.height - grayBlock.height, grayBlock.width, grayBlock.height);
            context.restore();*/
        }
        if (energy >= 0) {
            context.fillStyle = heroesData[heroType].hudColor;
            context.fillRect(90, 8 + i * 7, Math.floor(50 * energy / MAX_ENERGY), 6);
            if (energy >= heroesData[heroType].specialCost) {
                context.save();
                context.fillStyle = 'white';
                context.globalAlpha = 0.3 + 0.2 * Math.sin(state.world.time / 150);
                context.fillRect(90, 8 + i * 7, Math.floor(50 * energy / MAX_ENERGY), 6);
                context.restore();
            }
        }
    }

    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.font = "20px sans-serif";
    embossText(context, {
        text: `${state.players[0].score}`,
        left: 680,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA',
    });

    let {powerupPoints, powerupIndex} = state.players[0];
    let powerupBarWidth = Math.floor(98 * Math.min(1, powerupPoints / powerupGoals[powerupIndex]));
    context.fillStyle = '#0070A0';
    let frame = getFrame(powerupBarAnimation, state.world.time);
    context.fillRect(150 + 1, 8, powerupBarWidth, frame.height);
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(150, 8));

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
    context.fillStyle = nextCombo === comboScore ? '#FD0' : '#AA0';
    let comboBarWidth = Math.floor(98 * comboScore / nextCombo);
    frame = getFrame(comboBarAnimation, state.world.time);
    context.fillRect(535 + 1, 8, comboBarWidth, frame.height);
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(535, 8));

    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.font = "20px sans-serif";
    embossText(context, {
        text: (isKeyDown(KEY_SHIFT) ? `${state.players[0].comboScore} ` : '') + `${getComboMultiplier(state, 0)}x`,
        left: 530,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA',
    });

    for (let i = 0; i < state.players[0].powerups.length; i++) {
        const powerupType = state.players[0].powerups[i];
        frame = getFrame(lootData[powerupType].animation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(252 + 22 * i, 8));
    }
    if (state.players[0].relics[LOOT_HELMET]) {
        frame = getFrame(helmetAnimation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(255 + 22 * 5, 8));
    }
    if (state.players[0].relics[LOOT_GAUNTLET]) {
        frame = getFrame(gauntletAnimation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(255 + 22 * 6, 8));
    }
    if (state.players[0].relics[LOOT_NECKLACE]) {
        frame = getFrame(necklaceAnimation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(255 + 22 * 7, 8));
    }
    if (state.players[0].relics[LOOT_SHIELD]) {
        frame = getFrame(shieldAnimation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(255 + 22 * 8, 8));
    }
    if (state.flashHudUntil > state.world.time) {
        drawImage(context, requireImage('gfx/hud/hudflash.png', PRIORITY_FIELD), r(800, 36), r(800, 36));
    }
};


const selectNeedleImage = r(58, 7, {image: requireImage('gfx/needle.png', PRIORITY_TITLE)});
const startGameImage = r(116, 26, {image: requireImage('gfx/startgame.png', PRIORITY_TITLE)});
const optionsImage = r(90, 26, {image: requireImage('gfx/options.png', PRIORITY_TITLE)});
const instructionsImage = r(120, 26, {image: requireImage('gfx/instructions.png', PRIORITY_TITLE)});
// const startImage = r(58, 30, {image: requireImage('gfx/start.png', PRIORITY_TITLE)});
const titleRectangle = r(298, 88);
const titleAnimation = {
    frames: [
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee1.png', PRIORITY_TITLE)},
        {...titleRectangle, image: requireImage('gfx/titlee2.png', PRIORITY_TITLE)},
    ],
    frameDuration: 20,
};
const instructionsCard1 = r(360, 216, {image: requireImage('gfx/instructioncard.png', PRIORITY_TITLE)});
const instructionsCard2 = r(360, 216, {image: requireImage('gfx/instructioncard2.png', PRIORITY_TITLE)});

const orangeSparkleAnimation = createAnimation('gfx/sparkle.png', r(9, 9), {cols: 14, x: -7, priority: PRIORITY_TITLE});
const redSparkleAnimation = createAnimation('gfx/sparkle.png', r(9, 9), {cols: 14, x: 7, priority: PRIORITY_TITLE});
const sparkles = [];
const redCoords = [{"x":111,"y":167},{"x":111,"y":193},{"x":130,"y":160},{"x":147,"y":199},{"x":158,"y":168},{"x":200,"y":203},{"x":223,"y":164},{"x":226,"y":195},{"x":251,"y":200},{"x":267,"y":168},{"x":305,"y":200}]
for (const coords of redCoords) {
    sparkles.push({animation: redSparkleAnimation, ...coords, animationTime: Math.floor(Math.random() * 2000)});
}
const orangeCoords = [{"x":688,"y":44},{"x":692,"y":70},{"x":673,"y":38},{"x":650,"y":73},{"x":648,"y":46},{"x":600,"y":75},{"x":577,"y":41},{"x":576,"y":70},{"x":548,"y":72},{"x":534,"y":41},{"x":497,"y":72}]
for (const coords of orangeCoords) {
    sparkles.push({animation: orangeSparkleAnimation, ...coords, animationTime: Math.floor(Math.random() * 2000)});
}


//Helper for getting coords off the screen (for example, to create the sparkle coords above)
const coords = [];
canvas.onmousedown = function(event) {
    if (window.state && window.state.hitBoxFrame) return;
    coords.push({x:event.pageX - canvas.offsetLeft, y:event.pageY - canvas.offsetTop});
    console.log(JSON.stringify(coords));
};

const renderTitle = (context, state) => {
    renderBackground(context, state);
    renderForeground(context, state);


    // Draw a black gradient over the bright background to make the title pop out a little more.
    let gradient = context.createLinearGradient(0, 200, 0, HEIGHT / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;

    context.fillRect(0, 0, WIDTH, HEIGHT);
    let frame = dragonflyIdleAnimation.frames[0];
    const sprite = state.players[0].sprite;
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(sprite.left, hudImage.height + sprite.top));
    frame = getFrame(titleAnimation, state.titleTime);
    const titleRectangle = new Rectangle(frame).scale(2).moveCenterTo(WIDTH / 2, 120);
    drawImage(context, frame.image, frame, titleRectangle);

    for (const sparkle of sparkles) {
        frame = getFrame(sparkle.animation, sparkle.animationTime + state.titleTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).scale(2).moveCenterTo(sparkle.x, sparkle.y));
    }

    // When instructions are displayed, we put them in place of the title screen options.
    if (state.instructions) {
        const cardImage = state.instructions === 1 ? instructionsCard1 : instructionsCard2;
        drawImage(context, cardImage.image, cardImage,
            new Rectangle(cardImage).scale(2).moveCenterTo(WIDTH / 2, HEIGHT / 2)
        );
        return;
    }

    const options = [startGameImage, instructionsImage];
    const targets = [new Rectangle(options[0]).scale(2).moveCenterTo(WIDTH / 2, HEIGHT / 2 + 40)];
    for (let i = 1; i < options.length; i++) {
        targets.push(new Rectangle(options[i]).scale(2).moveCenterTo(
            WIDTH / 2,
            targets[i - 1].top + targets[i - 1].height + 20 + 3 * options[i].height / 2
        ));
    }
    for (let i = 0; i < options.length; i++) {
        drawImage(context, options[i].image, options[i], targets[i]);
    }
    if (state.stageSelectIndex >= 0) {
        const checkpoint = Object.keys(checkpoints)[state.stageSelectIndex];
        context.textBaseline = 'middle';
        context.textAlign = 'left';
        context.font = "30px sans-serif";
        embossText(context, {
            text: checkpoint,
            left: targets[0].right + 10,
            top: targets[0].top + targets[0].height / 2,
            backgroundColor: '#AAA',
        });
    }
    const target = targets[state.titleIndex];
    drawImage(context, selectNeedleImage.image, selectNeedleImage,
        new Rectangle(selectNeedleImage).scale(2).moveCenterTo(
            WIDTH / 2 - (2 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) - 15,
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

const gameOverImage = r(82, 30, {image: requireImage('gfx/gameover.png', PRIORITY_FIELD)});
const gameOverAnimation = createAnimation('gfx/goversheet.png', r(100, 100),
    {duration: 4, cols: 10, frameMap: [9, 4, 5, 6, 7, 8, 7, 6, 5, 6, 3, 2, 1, 0], priority: PRIORITY_FIELD},
    {loop: false}
);
const continueImage = r(82, 30, {image: requireImage('gfx/continue.png', PRIORITY_FIELD)});
const yesImage = r(20, 20, {image: requireImage('gfx/yes.png', PRIORITY_FIELD)});
const noImage = r(20, 20, {image: requireImage('gfx/no.png', PRIORITY_FIELD)});
function renderGameOver(context, state) {
    context.fillStyle = 'black';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    const menuX = WIDTH / 2;
    drawImage(context, gameOverImage.image, gameOverImage,
        new Rectangle(gameOverImage).scale(3).moveCenterTo(menuX, HEIGHT / 5));
    // Animated needle falls and breaks.
    const frame = getFrame(gameOverAnimation, state.gameOverTime);
    const fallTime = 0.5 - Math.max(0, 500 - state.gameOverTime) / 1000;
    drawImage(context, frame.image, frame,
        new Rectangle(frame).scale(2).moveCenterTo(WIDTH / 2, HEIGHT - 490 + 300 * (fallTime * fallTime + fallTime)),
    );
    // Continue options are shown after the animation over the broken needle.
    if (state.gameOverTime > 1500 && !state.finished) {
        drawImage(context, continueImage.image, continueImage,
            new Rectangle(continueImage).scale(3).moveCenterTo(menuX, 2 * HEIGHT / 5));
        const targets = [
            new Rectangle(yesImage).scale(3).moveCenterTo(menuX, 3 * HEIGHT / 5),
            new Rectangle(noImage).scale(3).moveCenterTo(menuX, 4 * HEIGHT / 5),
        ];
        drawImage(context, yesImage.image, yesImage, targets[0]);
        drawImage(context, noImage.image, noImage, targets[1]);

        const target = targets[state.continueIndex];
        drawImage(context, selectNeedleImage.image, selectNeedleImage,
            new Rectangle(selectNeedleImage).scale(2).moveCenterTo(
                menuX - (2 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) - 15,
                target.top + target.height / 2,
            ),
        );
    }

    renderHUD(context, state);
}


module.exports = render;

const {
    checkpoints, renderBackground, renderForeground,
} = require('world');

const {
    heroesData,
    renderHero,
} = require('heroes');

const {
    LOOT_HELMET,
    LOOT_GAUNTLET,
    LOOT_NECKLACE,
    LOOT_SHIELD,
    lootData,
    renderLoot,
    getComboMultiplier,
    powerupGoals,
    helmetAnimation,
    gauntletAnimation,
    necklaceAnimation,
    shieldAnimation,
} = require('loot');

const { renderEnemy } = require('enemies');

const {
    renderEffect
} = require('effects');

const {
    renderAttack,
} = require('attacks');
