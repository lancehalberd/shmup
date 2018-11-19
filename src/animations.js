/* globals Image */
const { FRAME_LENGTH } = require('gameConstants');

const Rectangle = require('Rectangle');

const assetVersion = assetVersion || 0.4;
const PRIORITY_PRELOADER = 0;
const PRIORITY_TITLE = 1;
const PRIORITY_FIELD = 2;
const PRIORITY_HEROES = 2;
const PRIORITY_BONUS = 3;
const PRIORITY_FIELD_BOSS = 4;
const PRIORITY_FOREST = 5;
// P0: Preloader
// P1: Title Scene + Dragonfly frame
// P2: Level 1 + Character animations
// P3: Bonus Stage
// P4: Level 1 Boss
// P5: Level 2
// P10: Everything else.
const priorityCounts = [];
const priorityQueues = [];
// This will be useful for debugging if some images do not load.
window.priorityQueues = priorityQueues;
const images = {};
function startLoadingImage(source) {
    images[source].src = source + '?v=' + assetVersion;
}
function loadImage(source, priority, callback) {
    images[source] = new Image();
    images[source].onload = () => callback();
    images[source].originalSource = source;
    priorityCounts[priority] = priorityCounts[priority] || 0;
    priorityCounts[priority]++;
    // If there are any higher priority images, defer loading this image.
    for (let i = priority - 1; i >= 0; i--) {
        if (priorityCounts[i] > 0) {
            priorityQueues[priority] = priorityQueues[priority] || [];
            priorityQueues[priority].push(source);
            return images[source];
        }
    }
    startLoadingImage(source);
    return images[source];
}
function requireImage(imageFile, priority = 10) {
    if (images[imageFile]) return images[imageFile];
    return loadImage(imageFile, priority, () => {
        priorityCounts[priority]--;
        if (priorityCounts[priority] === 0) {
            processPriorityQueue();
        }
    });
}
function processPriorityQueue() {
    for (let priority = 0; priority < priorityQueues.length; priority++) {
        const queue = priorityQueues[priority];
        if (!queue || !queue.length) continue;
        while (queue.length) startLoadingImage(queue.pop());
        break;
    }
}
// Add at least one title image ASAP, otherwise lower priority images might load first.
requireImage('gfx/logo.png', PRIORITY_TITLE);

const i = (width, height, source, priority) =>
    ({left: 0, top: 0, width, height, image: requireImage(source, priority)});
const r = (width, height, props) => ({left: 0, top: 0, width, height, ...props});
// Sets the anchor for a frame's geometry based on percent values passed for h and v.
// Default anchor is h=v=0 is the top left. Center would be h=v=0.5. Left center
// would be h=0, v=0.5
const a = (rectangle, h, v) => {
    const hitBox = rectangle.hitBox || rectangle;
    return {...rectangle, anchor: {
        x: hitBox.left + h * hitBox.width, y: hitBox.top + v * hitBox.height,
    }};
};

function createAnimation(
    source,
    rectangle,
    {x = 0, y = 0, rows = 1, cols = 1, top = 0, left = 0, bottom = 0, right = 0, duration = 8, priority = 10, frameMap} = {},
    props,
) {
    let frames = [];
    const image = requireImage(source, priority);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            frames[row * cols + col] = {
                ...rectangle,
                left: left + rectangle.width * (x + col),
                top: top + rectangle.height * (y + row),
                image
            };
            if (right) frames[row * cols + col].width -= right;
            if (bottom) frames[row * cols + col].height -= bottom;
        }
    }
    // Say an animation has 3 frames, but you want to order them 0, 1, 2, 1,
    // then pass `frameMap = [0, 1, 2, 1]` to remap the order of the frames accordingly.
    if (frameMap) {
       frames = frameMap.map(originalIndex => frames[originalIndex]);
    }
    return {frames, frameDuration: duration, ...props};
}

const needleFlipRectangle = r(88, 56);
const needleFlipAnimation = {
    frames: [
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip1.png', PRIORITY_HEROES)},
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip2.png', PRIORITY_HEROES)},
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip3.png', PRIORITY_HEROES)},
        {...needleFlipRectangle, image: requireImage('gfx/effects/needleflip4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 6,
};


const blastRectangle = r(20, 7);
const blastStartAnimation = {
    frames: [
        {...blastRectangle, image: requireImage('gfx/attacks/b1.png', PRIORITY_HEROES)},
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

const slashRectangle = r(30, 50);
const slashAnimation = {
    frames: [
        {...slashRectangle, image: requireImage('gfx/attacks/slash1.png', PRIORITY_HEROES)},
        {...slashRectangle, image: requireImage('gfx/attacks/slash2.png', PRIORITY_HEROES)},
        {...slashRectangle, image: requireImage('gfx/attacks/slash3.png', PRIORITY_HEROES)},
        {...slashRectangle, image: requireImage('gfx/attacks/slash4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 3,
};

const stabRectangle = r(45, 45);
const stabAnimation = {
    frames: [
        {...stabRectangle, image: requireImage('gfx/attacks/stab1.png', PRIORITY_HEROES)},
        {...stabRectangle, image: requireImage('gfx/attacks/stab2.png', PRIORITY_HEROES)},
        {...stabRectangle, image: requireImage('gfx/attacks/stab3.png', PRIORITY_HEROES)},
        {...stabRectangle, image: requireImage('gfx/attacks/stab4.png', PRIORITY_HEROES)},
    ],
    frameDuration: 3,
};

const bulletRectangle = r(14, 15);
const bulletAnimation = {
    frames: [
        {...bulletRectangle, image: requireImage('gfx/attacks/eb1.png', PRIORITY_FIELD)},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb2.png', PRIORITY_FIELD)},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb3.png', PRIORITY_FIELD)},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb4.png', PRIORITY_FIELD)},
        {...bulletRectangle, image: requireImage('gfx/attacks/eb5.png', PRIORITY_FIELD)},
    ],
    frameDuration: 2,
};
const deflectAnimation = {
    frames: [
        {...bulletRectangle, image: requireImage('gfx/attacks/deflect1.png', PRIORITY_FIELD)},
        {...bulletRectangle, image: requireImage('gfx/attacks/deflect2.png', PRIORITY_FIELD)},
    ],
    frameDuration: 4,
};

const flyRectangle = r(55, 40);
const flyAnimation = {
    frames: [
        {...flyRectangle, image: requireImage('gfx/enemies/flies/fly1.png', PRIORITY_FIELD)},
        {...flyRectangle, image: requireImage('gfx/enemies/flies/fly2.png', PRIORITY_FIELD)},
        {...flyRectangle, image: requireImage('gfx/enemies/flies/fly3.png', PRIORITY_FIELD)},
        {...flyRectangle, image: requireImage('gfx/enemies/flies/fly4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};
const flyDeathAnimation = {
    frames: [
        {...flyRectangle, image: requireImage('gfx/enemies/flies/flyded.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};

const locustRectangle = r(100, 100, {hitBox: {left: 0, top: 40, width: 100, height: 60}});
const locustAnimation = createAnimation('gfx/enemies/locust.png', locustRectangle,
    {x: 1, cols: 3, duration: 3, priority: PRIORITY_FIELD}
);
const locustDeathAnimation = createAnimation('gfx/enemies/locust.png', locustRectangle,
    {cols: 1, duration: 3, priority: PRIORITY_FIELD}
);
const locustSoldierRectangle = {...locustRectangle, hitBox: {left: 0, top: 18, width: 100, height: 82}};
const locustSoldierAnimation = createAnimation('gfx/enemies/locust.png', locustSoldierRectangle,
    {x: 4, cols: 3, duration: 3, priority: PRIORITY_FIELD}
);
const locustSoldierDeathAnimation = createAnimation('gfx/enemies/locust.png', locustRectangle,
    {x: 7, cols: 1, duration: 3, priority: PRIORITY_FIELD}
);

const flyingAntHitBox = {left: 0, top: 20, width: 35, height: 20};
const flyingAntRectangle = r(46, 41, {hitBox: flyingAntHitBox});
const flyingAntAnimation = {
    frames: [
        {...flyingAntRectangle, image: requireImage('gfx/enemies/flies/fant1.png', PRIORITY_FIELD)},
        {...flyingAntRectangle, image: requireImage('gfx/enemies/flies/fant2.png', PRIORITY_FIELD)},
        {...flyingAntRectangle, image: requireImage('gfx/enemies/flies/fant3.png', PRIORITY_FIELD)},
        {...flyingAntRectangle, image: requireImage('gfx/enemies/flies/fant4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};
const flyingAntDeathAnimation = {
    frames: [
        {...flyingAntRectangle, image: requireImage('gfx/enemies/flies/fantded.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};

const flyingAntSoldierHitBox = {left: 0, top: 4, width: 35, height: 36};
const flyingAntSoldierRectangle = r(46, 41, {hitBox: flyingAntSoldierHitBox});
const flyingAntSoldierAnimation = {
    frames: [
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/flies/mfant1.png', PRIORITY_FIELD)},
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/flies/mfant2.png', PRIORITY_FIELD)},
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/flies/mfant3.png', PRIORITY_FIELD)},
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/flies/mfant4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};
const flyingAntSoldierDeathAnimation = {
    frames: [
        {...flyingAntSoldierRectangle, image: requireImage('gfx/enemies/flies/mfantded.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3,
};

const monkHitBox = {left: 0, top: 8, width: 42, height: 42};
const monkRectangle = r(42, 50, {hitBox: monkHitBox});
const monkAnimation = {
    frames: [
        {...monkRectangle, image: requireImage('gfx/enemies/monks/robe1.png', PRIORITY_FIELD)},
        {...monkRectangle, image: requireImage('gfx/enemies/monks/robe2.png', PRIORITY_FIELD)},
        {...monkRectangle, image: requireImage('gfx/enemies/monks/robe3.png', PRIORITY_FIELD)},
        {...monkRectangle, image: requireImage('gfx/enemies/monks/robe4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 6,
};
const monkAttackAnimation = {
    frames: [
        {...monkRectangle, image: requireImage('gfx/enemies/monks/robeAttack.png', PRIORITY_FIELD)},
    ],
    frameDuration: 5,
};
const monkDeathAnimation = {
    frames: [
        {...r(46, 41, {hitBox: {left: 0, top: 8, width: 42, height: 33}}), image: requireImage('gfx/enemies/monks/robeded.png', PRIORITY_FIELD)},
    ],
    frameDuration: 5,
};

const damageRectangle = r(28, 28);
const damageAnimation = {
    frames: [
        {...damageRectangle, image: requireImage('gfx/effects/dmg1.png', PRIORITY_FIELD)},
        {...damageRectangle, image: requireImage('gfx/effects/dmg2.png', PRIORITY_FIELD)},
        {...damageRectangle, image: requireImage('gfx/effects/dmg3.png', PRIORITY_FIELD)},
        {...damageRectangle, image: requireImage('gfx/effects/dmg4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3
};

const explosionRectangle = r(50, 39);
const explosionAnimation = {
    frames: [
        {...explosionRectangle, image: requireImage('gfx/effects/dead1.png', PRIORITY_FIELD)},
        {...explosionRectangle, image: requireImage('gfx/effects/dead2.png', PRIORITY_FIELD)},
        {...explosionRectangle, image: requireImage('gfx/effects/dead3.png', PRIORITY_FIELD)},
        {...explosionRectangle, image: requireImage('gfx/effects/dead4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 3
};

const hugeExplosionRectangle = r(67, 67);
const hugeExplosionAnimation = {
    frames: [
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode1.png', PRIORITY_FIELD)},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode2.png', PRIORITY_FIELD)},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode3.png', PRIORITY_FIELD)},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode4.png', PRIORITY_FIELD)},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode5.png', PRIORITY_FIELD)},
        {...hugeExplosionRectangle, image: requireImage('gfx/effects/explode6.png', PRIORITY_FIELD)},
    ],
    frameDuration: 6,
};


const dustRectangle = r(20, 20);
const dustAnimation = {
    frames: [
        {...dustRectangle, image: requireImage('gfx/effects/dust1.png', PRIORITY_FIELD)},
        {...dustRectangle, image: requireImage('gfx/effects/dust2.png', PRIORITY_FIELD)},
        {...dustRectangle, image: requireImage('gfx/effects/dust3.png', PRIORITY_FIELD)},
        {...dustRectangle, image: requireImage('gfx/effects/dust4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 4
};

const coinRectangle = r(9, 9);
const coinAnimation = {
    frames: [
        {...coinRectangle, image: requireImage('gfx/items/coin1.png', PRIORITY_FIELD)},
        {...coinRectangle, image: requireImage('gfx/items/coin2.png', PRIORITY_FIELD)},
        {...coinRectangle, image: requireImage('gfx/items/coin3.png', PRIORITY_FIELD)},
        {...coinRectangle, image: requireImage('gfx/items/coin4.png', PRIORITY_FIELD)},
    ],
    frameDuration: 5
};

let frameDuration = 12;
const powerupRectangle = r(20, 20);
const powerupDiamondAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/diamond1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/diamond2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupSquareAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/square1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/square2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupTriangleAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/triangle1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/triangle2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupTripleDiamondAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/tripdiamond1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/tripdiamond2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupTripleSquareAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/tripsquare1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/tripsquare2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupTripleTriangleAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/triptriangle1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/triptriangle2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupComboAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/tripcombo1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/tripcombo2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const powerupTripleComboAnimation = {
    frames: [
        {...powerupRectangle, image: requireImage('gfx/items/ultcombo1.png', PRIORITY_FIELD)},
        {...powerupRectangle, image: requireImage('gfx/items/ultcombo2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const sizeTextRectangle = r(44, 20);
const sizeTextAnimation = {
    frames: [
        {...sizeTextRectangle, image: requireImage('gfx/items/size1.png', PRIORITY_FIELD)},
        {...sizeTextRectangle, image: requireImage('gfx/items/size2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const speedTextAnimation = {
    frames: [
        {...sizeTextRectangle, image: requireImage('gfx/items/speed1.png', PRIORITY_FIELD)},
        {...sizeTextRectangle, image: requireImage('gfx/items/speed2.png', PRIORITY_FIELD)},
    ],
    frameDuration,
};
const rateTextAnimation = {
    frames: [
        {...sizeTextRectangle, image: requireImage('gfx/items/rate1.png', PRIORITY_FIELD)},
        {...sizeTextRectangle, image: requireImage('gfx/items/rate2.png', PRIORITY_FIELD)},
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
    const scaleX = frame.scaleX || 1;
    const scaleY = frame.scaleY || 1;
    return (frame.hitBox ?
        new Rectangle(frame.hitBox) :
        new Rectangle(frame).moveTo(0, 0)).stretch(scaleX, scaleY);
};

module.exports = {
    PRIORITY_PRELOADER,
    PRIORITY_TITLE,
    PRIORITY_FIELD,
    PRIORITY_HEROES,
    PRIORITY_BONUS,
    PRIORITY_FIELD_BOSS,
    PRIORITY_FOREST,
    priorityCounts,
    requireImage,
    r, i, a,
    getFrame,
    getAnimationLength,
    createAnimation,
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
    locustAnimation, locustDeathAnimation,
    locustSoldierAnimation, locustSoldierDeathAnimation,
    flyingAntAnimation, flyingAntDeathAnimation,
    flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation,
    monkAnimation, monkDeathAnimation, monkAttackAnimation,
};
for (let key in module.exports) window[key] = module.exports[key];
