/* globals Image */
const { FRAME_LENGTH } = require('gameConstants');

const Rectangle = require('Rectangle');

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

const i = (width, height, source) => ({left: 0, top: 0, width, height, image: requireImage(source)});
const r = (width, height, props) => ({left: 0, top: 0, width, height, ...props});

const createAnimation = (source, rectangle, {x = 0, y = 0, rows = 1, cols = 1, top = 0, left = 0, duration = 8, frameMap} = {}, props) => {
    let frames = [];
    const image = requireImage(source);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            frames[row * cols + col] = {
                ...rectangle,
                left: left + rectangle.width * (x + col),
                top: top + rectangle.height * (y + row),
                image
            };
        }
    }
    // Say an animation has 3 frames, but you want to order them 0, 1, 2, 1, then pass frameMap = [0, 1, 2, 1],
    // to remap the order of the frames accordingly.
    if (frameMap) {
       frames = frameMap.map(originalIndex => frames[originalIndex]);
    }
    return {frames, frameDuration: duration, ...props};
};
const createFrames = (rect, count, source, offset = 0) => {
    const frames = [];
    const image = requireImage(source);
    for (let i = 0; i < count; i++) {
        frames[i] = {...rect, left: rect.width * (offset + i), image}
    }
    return frames;
};

const createVerticalFrames = (rect, count, source, offset = 0) => {
    const frames = [];
    const image = requireImage(source);
    for (let i = 0; i < count; i++) {
        frames[i] = {...rect, top: rect.height * (offset + i), image}
    }
    return frames;
};

const allAnimations = {};

const needleFlipRectangle = r(88, 56);
const needleFlipAnimation = {
    frames: [
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip1.png')},
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip2.png')},
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip3.png')},
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip4.png')},
    ],
    frameDuration: 6,
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

const slashRectangle = r(30, 50);
const slashAnimation = {
    frames: [
        {...slashRectangle, image: requireImage('gfx/attacks/slash1.png')},
        {...slashRectangle, image: requireImage('gfx/attacks/slash2.png')},
        {...slashRectangle, image: requireImage('gfx/attacks/slash3.png')},
        {...slashRectangle, image: requireImage('gfx/attacks/slash4.png')},
    ],
    frameDuration: 3,
};

const stabRectangle = r(45, 45);
const stabAnimation = {
    frames: [
        {...stabRectangle, image: requireImage('gfx/attacks/stab1.png')},
        {...stabRectangle, image: requireImage('gfx/attacks/stab2.png')},
        {...stabRectangle, image: requireImage('gfx/attacks/stab3.png')},
        {...stabRectangle, image: requireImage('gfx/attacks/stab4.png')},
    ],
    frameDuration: 3,
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
const deflectAnimation = {
    frames: [
        {...bulletRectangle, image: requireImage('gfx/attacks/deflect1.png')},
        {...bulletRectangle, image: requireImage('gfx/attacks/deflect2.png')},
    ],
    frameDuration: 4,
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
const hornetSoldierAnimation = {
    frames: [
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet1.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet2.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet3.png')},
        {...hornetRectangle, hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet4.png')},
    ],
    frameDuration: 3,
};
const fallingHornetSoldierHitBox = {left: 46, top: 48, width: 40, height: 40};
const hornetSoldierDeathAnimation = {
    frames: [
        {...hornetRectangle, hitBox: fallingHornetSoldierHitBox, image: requireImage('gfx/enemies/mhornetded.png')},
    ],
    frameDuration: 3,
};

const locustRectangle = r(100, 100, {hitBox: {left: 0, top: 40, width: 100, height: 60}});
const locustAnimation = {
    frames: createFrames(locustRectangle, 3, 'gfx/enemies/locust.png', 1), frameDuration: 3,
};
const locustDeathAnimation = {
    frames: createFrames(locustRectangle, 1, 'gfx/enemies/locust.png', 0), frameDuration: 3,
};
const locustSoldierRectangle = {...locustRectangle, hitBox: {left: 0, top: 18, width: 100, height: 82}};
const locustSoldierAnimation = {
    frames: createFrames(locustSoldierRectangle, 3, 'gfx/enemies/locust.png', 4), frameDuration: 3,
};
const locustSoldierDeathAnimation = {
    frames: createFrames(locustSoldierRectangle, 1, 'gfx/enemies/locust.png', 7), frameDuration: 3,
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

const monkHitBox = {left: 0, top: 8, width: 42, height: 42};
const monkRectangle = r(42, 50, {hitBox: monkHitBox});
const monkAnimation = {
    frames: [
        {...monkRectangle, image: requireImage('gfx/enemies/robe1.png')},
        {...monkRectangle, image: requireImage('gfx/enemies/robe2.png')},
        {...monkRectangle, image: requireImage('gfx/enemies/robe3.png')},
        {...monkRectangle, image: requireImage('gfx/enemies/robe4.png')},
    ],
    frameDuration: 6,
};
const monkAttackAnimation = {
    frames: [
        {...monkRectangle, image: requireImage('gfx/enemies/robeAttack.png')},
    ],
    frameDuration: 5,
};
const monkDeathAnimation = {
    frames: [
        {...r(46, 41), image: requireImage('gfx/enemies/robeded.png')},
    ],
    frameDuration: 5,
};

const cargoBeetleHitBox = {left: 0, top: 16, width: 100, height: 84};
const cargoBeetleRectangle = r(100, 100, {hitBox: cargoBeetleHitBox});
const cargoBeetleAnimation = {
    frames: [
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/bfly1.png')},
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/bfly2.png')},
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/bfly3.png')},
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/bfly4.png')},
    ],
    frameDuration: 6,
};
const cargoBeetleDeathAnimation = {
    frames: [
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/bflyded.png')},
    ],
    frameDuration: 5,
};
const explosiveBeetleAnimation = {
    frames: [
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/expbfly1.png')},
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/expbfly2.png')},
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/expbfly3.png')},
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/expbfly4.png')},
    ],
    frameDuration: 6,
};
const explosiveBeetleDeathAnimation = {
    frames: [
        {...cargoBeetleRectangle, image: requireImage('gfx/enemies/expbflyded.png')},
    ],
    frameDuration: 5,
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

const hugeExplosionRectangle = r(67, 67);
const hugeExplosionAnimation = {
    frames: [
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode1.png')},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode2.png')},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode3.png')},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode4.png')},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode5.png')},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode6.png')},
    ],
    frameDuration: 6,
};


const dustRectangle = r(20, 20);
const dustAnimation = {
    frames: [
        {...dustRectangle, image: requireImage('gfx/effects/dust1.png')},
        {...dustRectangle, image: requireImage('gfx/effects/dust2.png')},
        {...dustRectangle, image: requireImage('gfx/effects/dust3.png')},
        {...dustRectangle, image: requireImage('gfx/effects/dust4.png')},
    ],
    frameDuration: 4
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

let frameDuration = 12;
const powerupRectangle = r(20, 20);
const powerupDiamondAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/diamond1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/diamond2.png')},
    ],
    frameDuration,
};
const powerupSquareAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/square1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/square2.png')},
    ],
    frameDuration,
};
const powerupTriangleAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/triangle1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/triangle2.png')},
    ],
    frameDuration,
};
const powerupTripleDiamondAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/tripdiamond1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/tripdiamond2.png')},
    ],
    frameDuration,
};
const powerupTripleSquareAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/tripsquare1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/tripsquare2.png')},
    ],
    frameDuration,
};
const powerupTripleTriangleAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/triptriangle1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/triptriangle2.png')},
    ],
    frameDuration,
};
const powerupComboAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/tripcombo1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/tripcombo2.png')},
    ],
    frameDuration,
};
const powerupTripleComboAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/ultcombo1.png')},
        {...powerupRectangle, image: requireImage('gfx/items/ultcombo2.png')},
    ],
    frameDuration,
};
const sizeTextRectangle = r(44, 20);
const sizeTextAnimation = {
    frames: [
        {...sizeTextRectangle, image: requireImage('gfx/items/size1.png')},
        {...sizeTextRectangle, image: requireImage('gfx/items/size2.png')},
    ],
    frameDuration,
};
const speedTextAnimation = {
    frames: [
        {...sizeTextRectangle, image: requireImage('gfx/items/speed1.png')},
        {...sizeTextRectangle, image: requireImage('gfx/items/speed2.png')},
    ],
    frameDuration,
};
const rateTextAnimation = {
    frames: [
        {...sizeTextRectangle, image: requireImage('gfx/items/rate1.png')},
        {...sizeTextRectangle, image: requireImage('gfx/items/rate2.png')},
    ],
    frameDuration,
};

const getFrame = (animation, animationTime) => {
    let frameIndex = Math.floor(animationTime / (FRAME_LENGTH * (animation.frameDuration || 1)));
    if (animation.loop === false) { // You can set this to prevent an animation from looping.
        frameIndex = Math.min(frameIndex, animation.frames.length - 1);
    }
    if (animation.loopFrame && frameIndex >= animation.frames.length) {
        frameIndex -= animation.loopFrame;
        frameIndex %= (animation.frames.length - animation.loopFrame);
        frameIndex += animation.loopFrame;
    }
    return animation.frames[frameIndex % animation.frames.length];
};
const getAnimationLength = (animation) => animation.frames.length * animation.frameDuration;
const getHitBox = (animation, animationTime) => {
    const frame = getFrame(animation, animationTime);
    return new Rectangle(frame.hitBox || frame);
};

const selectNeedleImage = r(58, 7, {image: requireImage('gfx/needle.png')});
const startGameImage = r(58, 13, {image: requireImage('gfx/startgame.png')});
const optionsImage = r(43, 13, {image: requireImage('gfx/options.png')});

const startImage = r(58, 30, {image: requireImage('gfx/start.png')});

module.exports = {
    requireImage,
    r, i,
    allAnimations,
    getFrame,
    getAnimationLength,
    createAnimation,
    createFrames,
    createVerticalFrames,
    getHitBox,
    needleFlipAnimation,
    blastStartAnimation,
    blastLoopAnimation,
    slashAnimation,
    stabAnimation,
    bulletAnimation,
    deflectAnimation,
    damageAnimation,
    explosionAnimation,
    hugeExplosionAnimation,
    dustAnimation,
    coinAnimation,
    powerupDiamondAnimation,
    powerupTriangleAnimation,
    powerupSquareAnimation,
    powerupTripleDiamondAnimation,
    powerupTripleSquareAnimation,
    powerupTripleTriangleAnimation,
    powerupComboAnimation,
    powerupTripleComboAnimation,
    rateTextAnimation,
    sizeTextAnimation,
    speedTextAnimation,
    flyAnimation, flyDeathAnimation,
    hornetAnimation, hornetDeathAnimation,
    hornetSoldierAnimation, hornetSoldierDeathAnimation,
    locustAnimation, locustDeathAnimation,
    locustSoldierAnimation, locustSoldierDeathAnimation,
    flyingAntAnimation, flyingAntDeathAnimation,
    flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation,
    monkAnimation, monkDeathAnimation, monkAttackAnimation,
    cargoBeetleAnimation, cargoBeetleDeathAnimation,
    explosiveBeetleAnimation, explosiveBeetleDeathAnimation,
    selectNeedleImage,
    startGameImage,
    optionsImage,
    startImage,
};
