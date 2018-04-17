
const { FRAME_LENGTH } = require('gameConstants');

const assetVersion = assetVersion || 0.4;
const images = {};
function loadImage(source, callback) {
    images[source] = new Image();
    images[source].onload = () => callback();
    images[source].src = source + '?v=' + assetVersion;
    images[source].originalSource = source;
    return images[source];
}
let numberOfImagesLeftToLoad = 0;
function requireImage(imageFile) {
    if (images[imageFile]) return images[imageFile];
    numberOfImagesLeftToLoad++;
    return loadImage(imageFile, () => numberOfImagesLeftToLoad--);
}
const initialImagesToLoad = [

];
for (const initialImageToLoad of initialImagesToLoad) {
    requireImage(initialImageToLoad);
}

const rectangleToFrames = (rectangle, image, numberOfFrames) => {
    const frames = [];
    for (let i = 0; i < numberOfFrames; i++) {
        frames[i] = rectangle.moveTo(i * rectangle.width, 0);
        frames[i].image = image;
    }
    return frames;
};

const r = (width, height, props) => ({left: 0, top: 0, width, height, ...props});

const heroHitBox = {left: 10, top: 15, width: 70, height: 30};
const heroRectangle = r(88, 56, {hitBox: heroHitBox});
const heroAnimation = {
    frames: [
        {...heroRectangle, image: requireImage('gfx/hero1.png')},
        {...heroRectangle, image: requireImage('gfx/hero2.png')},
        {...heroRectangle, image: requireImage('gfx/hero3.png')},
        {...heroRectangle, image: requireImage('gfx/hero4.png')},
        {...heroRectangle, image: requireImage('gfx/hero3.png')},
        {...heroRectangle, image: requireImage('gfx/hero2.png')},
    ],
    frameDuration: 3,
};


const blastRectangle = r(20, 7);
const blastStartAnimation = {
    frames: [
        {...blastRectangle, image: requireImage('gfx/attacks/b1.png')},
    ],
    frameDuration: 2,
};
const blastLoopAnimation = {
    frames: [
        {...blastRectangle, image: requireImage('gfx/attacks/b2.png')},
        {...blastRectangle, image: requireImage('gfx/attacks/b3.png')},
        {...blastRectangle, image: requireImage('gfx/attacks/b4.png')},
    ],
    frameDuration: 2,
};


const bulletRectangle = r(14, 15);
const bulletAnimation = {
    frames: [
        {...bulletRectangle, image: requireImage('gfx/attacks/eb1.png')},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb2.png')},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb3.png')},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb4.png')},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb5.png')},
    ],
    frameDuration: 2,
};

const flyRectangle = r(55, 40);
const flyAnimation = {
    frames: [
        {...flyRectangle, image: requireImage('gfx/enemies/fly1.png')},
        {...flyRectangle, image: requireImage('gfx/enemies/fly2.png')},
        {...flyRectangle, image: requireImage('gfx/enemies/fly3.png')},
        {...flyRectangle, image: requireImage('gfx/enemies/fly4.png')},
    ],
    frameDuration: 3,
};
const flyDeathAnimation = {
    frames: [
        {...flyRectangle, image: requireImage('gfx/enemies/flyded.png')},
    ],
    frameDuration: 3,
};

const hornetRectangle = r(120, 120);
const hornetHitBox = {left: 0, top: 33, width: 110, height: 87};
const hornetAnimation = {
    frames: [
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet1.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet2.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet3.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet4.png')},
    ],
    frameDuration: 3,
};
const hornetDeathAnimation = {
    frames: [
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornetded.png')},
    ],
    frameDuration: 3,
};

const flyingAntHitBox = {left: 0, top: 20, width: 35, height: 20};
const flyingAntRectangle = r(46, 41, {hitBox: flyingAntHitBox});
const flyingAntAnimation = {
    frames: [
        {...flyingAntRectangle, image: requireImage('gfx/enemies/fant1.png')},
        {...flyingAntRectangle, image: requireImage('gfx/enemies/fant2.png')},
        {...flyingAntRectangle, image: requireImage('gfx/enemies/fant3.png')},
        {...flyingAntRectangle, image: requireImage('gfx/enemies/fant4.png')},
    ],
    frameDuration: 3,
};
const flyingAntDeathAnimation = {
    frames: [
        {...flyingAntRectangle, image: requireImage('gfx/enemies/fantded.png')},
    ],
    frameDuration: 3,
};

const flyingAntSoldierHitBox = {left: 0, top: 4, width: 35, height: 36};
const flyingAntSoldierRectangle = r(46, 41, {hitBox: flyingAntSoldierHitBox});
const flyingAntSoldierAnimation = {
    frames: [
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/mfant1.png')},
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/mfant2.png')},
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/mfant3.png')},
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/mfant4.png')},
    ],
    frameDuration: 3,
};
const flyingAntSoldierDeathAnimation = {
    frames: [
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/mfantded.png')},
    ],
    frameDuration: 3,
};

const damageRectangle = r(28, 28);
const damageAnimation = {
    frames: [
        {...damageRectangle, image: requireImage('gfx/effects/dmg1.png')},
        {...damageRectangle, image: requireImage('gfx/effects/dmg2.png')},
        {...damageRectangle, image: requireImage('gfx/effects/dmg3.png')},
        {...damageRectangle, image: requireImage('gfx/effects/dmg4.png')},
    ],
    frameDuration: 3
};

const explosionRectangle = r(50, 39);
const explosionAnimation = {
    frames: [
        {...explosionRectangle, image: requireImage('gfx/effects/dead1.png')},
        {...explosionRectangle, image: requireImage('gfx/effects/dead2.png')},
        {...explosionRectangle, image: requireImage('gfx/effects/dead3.png')},
        {...explosionRectangle, image: requireImage('gfx/effects/dead4.png')},
    ],
    frameDuration: 3
};

const coinRectangle = r(9, 9);
const coinAnimation = {
    frames: [
        {...coinRectangle, image: requireImage('gfx/items/coin1.png')},
        {...coinRectangle, image: requireImage('gfx/items/coin2.png')},
        {...coinRectangle, image: requireImage('gfx/items/coin3.png')},
        {...coinRectangle, image: requireImage('gfx/items/coin4.png')},
    ],
    frameDuration: 5
};


const getFrame = (animation, animationTime) => {
    const frameIndex = Math.floor(animationTime / (FRAME_LENGTH * (animation.frameDuration || 1)));
    return animation.frames[frameIndex % animation.frames.length];
};
const getHitBox = (animation, animationTime) => {
    const frame = getFrame(animation, animationTime);
    return frame.hitBox || frame;
};

const plainsBackground = r(1200, 600, {image: requireImage('gfx/scene/plains_bg.png')});
const plainsMidground = r(2000, 600, {image: requireImage('gfx/scene/plains_mg.png')});
const plainsForeground = r(1200, 600, {image: requireImage('gfx/scene/plains_fg.png')});
const backgroundSky = r(1600, 600, {image: requireImage('gfx/scene/background_sky.png')});

const portraitImage = r(17, 18, {image: requireImage('gfx/lifeportrait.png')});
const lifeAnimation = {
    frames: [
        {...portraitImage},
    ],
    frameDuration: 5
};

const selectNeedleImage = r(58, 7, {image: requireImage('gfx/needle.png')});
const startGameImage = r(58, 13, {image: requireImage('gfx/startgame.png')});
const optionsImage = r(43, 13, {image: requireImage('gfx/options.png')});

const gameOverImage = r(82, 30, {image: requireImage('gfx/gameover.png')});

const startImage = r(58, 30, {image: requireImage('gfx/start.png')});

const hudImage = r(800, 36, {image: requireImage('gfx/hud.png')});

module.exports = {
    getFrame,
    getHitBox,
    backgroundSky,
    plainsBackground,
    plainsMidground,
    plainsForeground,
    heroRectangle,
    heroAnimation,
    requireImage,
    blastRectangle,
    blastStartAnimation,
    blastLoopAnimation,
    bulletAnimation,
    damageRectangle,
    damageAnimation,
    explosionRectangle,
    explosionAnimation,
    coinRectangle,
    coinAnimation,
    lifeAnimation,
    flyRectangle,
    flyAnimation,
    flyDeathAnimation,
    hornetRectangle,
    hornetAnimation,
    hornetDeathAnimation,
    flyingAntAnimation,
    flyingAntDeathAnimation,
    flyingAntSoldierAnimation,
    flyingAntSoldierDeathAnimation,
    selectNeedleImage,
    startGameImage,
    optionsImage,
    startImage,
    portraitImage,
    gameOverImage,
    hudImage,
};
