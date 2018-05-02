(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rectangle = function () {
    _createClass(Rectangle, null, [{
        key: 'defineByCenter',
        value: function defineByCenter(x, y, width, height) {
            return new Rectangle(x - width / 2, y - height / 2, width, height);
        }
    }, {
        key: 'defineFromPoints',
        value: function defineFromPoints(A, B) {
            // convert arrays to objects.
            if (A.length) A = { x: A[0], y: A[1] };
            if (B.length) B = { x: B[0], y: B[1] };
            return new Rectangle(Math.min(A.x, B.x), Math.min(A.y, B.y), Math.abs(A.x - B.x), Math.abs(A.y - B.y));
        }
    }, {
        key: 'defineFromElement',
        value: function defineFromElement($element) {
            return new Rectangle($element.offset().left, $element.offset().top, $element.outerWidth(true), $element.outerHeight(true));
        }

        // Image needs to be loaded already.

    }, {
        key: 'defineFromImage',
        value: function defineFromImage(image) {
            return new Rectangle(0, 0, image.width, image.height);
        }
    }, {
        key: 'collision',
        value: function collision(A, B) {
            return !(A.top + A.height <= B.top || A.top >= B.top + B.height || A.left + A.width <= B.left || A.left >= B.left + B.width);
        }
    }]);

    function Rectangle() {
        var left = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var top = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        _classCallCheck(this, Rectangle);

        if ((typeof left === 'undefined' ? 'undefined' : _typeof(left)) === 'object') {
            top = left.top || 0;
            width = left.width || 0;
            height = left.height || 0;
            left = left.left || 0;
        }
        this.left = left;
        this.top = top;
        // Don't allow negative width/height. Update left/top so
        // that width/height are always positive.
        if (width <= 0) {
            width *= -1;
            this.left -= width;
        }
        this.width = width;
        if (height <= 0) {
            height *= -1;
            this.top -= height;
        }
        this.height = height;
        this.right = left + width;
        this.bottom = top + height;
    }

    _createClass(Rectangle, [{
        key: 'snap',
        value: function snap() {
            return new Rectangle(Math.round(this.left), Math.round(this.top), Math.round(this.width), Math.round(this.height));
        }
    }, {
        key: 'translate',
        value: function translate(dx, dy) {
            return new Rectangle(this.left + dx, this.top + dy, this.width, this.height);
        }
    }, {
        key: 'moveTo',
        value: function moveTo(x, y) {
            return new Rectangle(x, y, this.width, this.height);
        }
    }, {
        key: 'moveCenterTo',
        value: function moveCenterTo(x, y) {
            return this.moveTo(x - this.width / 2, y - this.height / 2);
        }
    }, {
        key: 'resize',
        value: function resize(width, height) {
            return new Rectangle(this.left, this.top, width, height);
        }
    }, {
        key: 'pad',
        value: function pad(padding) {
            return new Rectangle(this.left - padding, this.top - padding, this.width + 2 * padding, this.height + 2 * padding);
        }
    }, {
        key: 'scale',
        value: function scale(_scale) {
            return new Rectangle(this.left * _scale, this.top * _scale, this.width * _scale, this.height * _scale);
        }
    }, {
        key: 'scaleFromCenter',
        value: function scaleFromCenter(scale) {
            var center = this.getCenter();
            return this.moveCenterTo(0, 0).scale(scale).moveCenterTo(center[0], center[1]);
        }
    }, {
        key: 'stretch',
        value: function stretch(scaleX, scaleY) {
            return new Rectangle(this.left * scaleX, this.top * scaleY, this.width * scaleX, this.height * scaleY);
        }
    }, {
        key: 'stretchFromCenter',
        value: function stretchFromCenter(scaleX, scaleY) {
            var center = this.getCenter();
            return this.moveCenterTo(0, 0).stretch(scaleX, scaleY).moveCenterTo(center[0], center[1]);
        }
    }, {
        key: 'getCenter',
        value: function getCenter() {
            return [this.left + this.width / 2, this.top + this.height / 2];
        }
    }, {
        key: 'containsPoint',
        value: function containsPoint(x, y) {
            return !(y < this.top || y > this.bottom || x < this.left || x > this.right);
        }

        // By default overlapping at a single point counts, but if includeBoundary is false, then the overlap counts
        // only if the overlapping area has positive area,

    }, {
        key: 'overlapsRectangle',
        value: function overlapsRectangle(rectangle) {
            var includeBoundary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            if (includeBoundary) {
                return !(this.bottom < rectangle.top || this.top > rectangle.bottom || this.right < rectangle.left || this.left > rectangle.right);
            }
            return !(this.bottom <= rectangle.top || this.top >= rectangle.bottom || this.right <= rectangle.left || this.left >= rectangle.right);
        }
    }]);

    return Rectangle;
}();

module.exports = Rectangle;

},{}],2:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH;

var assetVersion = assetVersion || 0.4;
var images = {};
function loadImage(source, callback) {
    images[source] = new Image();
    images[source].onload = function () {
        return callback();
    };
    images[source].src = source + '?v=' + assetVersion;
    images[source].originalSource = source;
    return images[source];
}
var numberOfImagesLeftToLoad = 0;
function requireImage(imageFile) {
    if (images[imageFile]) return images[imageFile];
    numberOfImagesLeftToLoad++;
    return loadImage(imageFile, function () {
        return numberOfImagesLeftToLoad--;
    });
}
var initialImagesToLoad = [];
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = initialImagesToLoad[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var initialImageToLoad = _step.value;

        requireImage(initialImageToLoad);
    }
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally {
    try {
        if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
        }
    } finally {
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}

var rectangleToFrames = function rectangleToFrames(rectangle, image, numberOfFrames) {
    var frames = [];
    for (var i = 0; i < numberOfFrames; i++) {
        frames[i] = rectangle.moveTo(i * rectangle.width, 0);
        frames[i].image = image;
    }
    return frames;
};

var r = function r(width, height, props) {
    return _extends({ left: 0, top: 0, width: width, height: height }, props);
};

var createFrames = function createFrames(rect, count, source) {
    var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

    var frames = [];
    var image = requireImage(source);
    for (var i = 0; i < count; i++) {
        frames[i] = _extends({}, rect, { left: rect.width * (offset + i), image: image });
    }
    return frames;
};

var beeHitBox = { left: 10, top: 12, width: 60, height: 40 };
var beeRectangle = r(88, 56, { hitBox: beeHitBox });
var beeAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/bee4.png') })],
    frameDuration: 3
};
var beeEnterAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeflyin1.png') })],
    frameDuration: 3
};
var beeCatchAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeflyin2.png') })],
    frameDuration: 3
};
var beeSwitchAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beeswitch4.png') })],
    frameDuration: 6
};
var beeMeleeAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beem4.png') })],
    frameDuration: 3
};
var beeDeathAnimation = {
    frames: [_extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie1.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie2.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie3.png') }), _extends({}, beeRectangle, { image: requireImage('gfx/heroes/bee/beedie4.png') })],
    frameDuration: 6
};
var beePortraitAnimation = {
    frames: [_extends({}, r(17, 18), { image: requireImage('gfx/heroes/bee/beeportrait.png') })],
    frameDuration: 5
};

var dragonflyHitBox = { left: 10, top: 15, width: 70, height: 30 };
var dragonflyRectangle = r(88, 56, { hitBox: dragonflyHitBox });
var dragonflyAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonfly4.png') })],
    frameDuration: 3
};
var dragonflyEnterAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyflyin1.png') })],
    frameDuration: 3
};
var dragonflyCatchAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyflyin2.png') })],
    frameDuration: 3
};
var dragonflySwitchAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyswitch4.png') })],
    frameDuration: 6
};
var dragonflyMeleeAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflym4.png') })],
    frameDuration: 3
};
var dragonflyDeathAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie1.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie2.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie3.png') }), _extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflydie4.png') })],
    frameDuration: 6
};
var dragonflyIdleAnimation = {
    frames: [_extends({}, dragonflyRectangle, { image: requireImage('gfx/heroes/dragonfly/dragonflyidle.png') })],
    frameDuration: 6
};
var dragonflyPortraitAnimation = {
    frames: [_extends({}, r(17, 18), { image: requireImage('gfx/heroes/dragonfly/dragonflyportrait.png') })],
    frameDuration: 5
};

var mothHitBox = { left: 10, top: 10, width: 65, height: 42 };
var mothRectangle = r(88, 56, { hitBox: mothHitBox });
var mothAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/moth4.png') })],
    frameDuration: 3
};
var mothEnterAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothflyin1.png') })],
    frameDuration: 3
};
var mothCatchAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothflyin2.png') })],
    frameDuration: 3
};
var mothSwitchAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothswitch4.png') })],
    frameDuration: 6
};
var mothMeleeAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothm4.png') })],
    frameDuration: 3
};
var mothDeathAnimation = {
    frames: [_extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie1.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie2.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie3.png') }), _extends({}, mothRectangle, { image: requireImage('gfx/heroes/moth/mothdie4.png') })],
    frameDuration: 6
};
var mothPortraitAnimation = {
    frames: [_extends({}, r(17, 18), { image: requireImage('gfx/heroes/moth/mothportrait.png') })],
    frameDuration: 5
};

var ladybugRectangle = r(25, 20);
var ladybugAnimation = {
    frames: [_extends({}, ladybugRectangle, { image: requireImage('gfx/heroes/ladybug1.png') }), _extends({}, ladybugRectangle, { image: requireImage('gfx/heroes/ladybug2.png') }), _extends({}, ladybugRectangle, { image: requireImage('gfx/heroes/ladybug3.png') }), _extends({}, ladybugRectangle, { image: requireImage('gfx/heroes/ladybug4.png') })],
    frameDuration: 3
};

var needleFlipRectangle = r(88, 56);
var needleFlipAnimation = {
    frames: [_extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip1.png') }), _extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip2.png') }), _extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip3.png') }), _extends({}, needleFlipRectangle, { image: requireImage('gfx/effects/needleflip4.png') })],
    frameDuration: 6
};

var blastRectangle = r(20, 7);
var blastStartAnimation = {
    frames: [_extends({}, blastRectangle, { image: requireImage('gfx/attacks/b1.png') })],
    frameDuration: 2
};
var blastLoopAnimation = {
    frames: [_extends({}, blastRectangle, { image: requireImage('gfx/attacks/b2.png') }), _extends({}, blastRectangle, { image: requireImage('gfx/attacks/b3.png') }), _extends({}, blastRectangle, { image: requireImage('gfx/attacks/b4.png') })],
    frameDuration: 2
};

var slashRectangle = r(30, 50);
var slashAnimation = {
    frames: [_extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash1.png') }), _extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash2.png') }), _extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash3.png') }), _extends({}, slashRectangle, { image: requireImage('gfx/attacks/slash4.png') })],
    frameDuration: 3
};

var stabRectangle = r(45, 45);
var stabAnimation = {
    frames: [_extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab1.png') }), _extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab2.png') }), _extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab3.png') }), _extends({}, stabRectangle, { image: requireImage('gfx/attacks/stab4.png') })],
    frameDuration: 3
};

var ladybugAttackRectangle = r(10, 10);
var ladybugAttackAnimation = {
    frames: [_extends({}, ladybugAttackRectangle, { image: requireImage('gfx/attacks/lbshot1.png') }), _extends({}, ladybugAttackRectangle, { image: requireImage('gfx/attacks/lbshot2.png') }), _extends({}, ladybugAttackRectangle, { image: requireImage('gfx/attacks/lbshot3.png') }), _extends({}, ladybugAttackRectangle, { image: requireImage('gfx/attacks/lbshot4.png') })],
    frameDuration: 2
};

var bulletRectangle = r(14, 15);
var bulletAnimation = {
    frames: [_extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb1.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb2.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb3.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb4.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/eb5.png') })],
    frameDuration: 2
};
var deflectAnimation = {
    frames: [_extends({}, bulletRectangle, { image: requireImage('gfx/attacks/deflect1.png') }), _extends({}, bulletRectangle, { image: requireImage('gfx/attacks/deflect2.png') })],
    frameDuration: 4
};

var flyRectangle = r(55, 40);
var flyAnimation = {
    frames: [_extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly1.png') }), _extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly2.png') }), _extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly3.png') }), _extends({}, flyRectangle, { image: requireImage('gfx/enemies/fly4.png') })],
    frameDuration: 3
};
var flyDeathAnimation = {
    frames: [_extends({}, flyRectangle, { image: requireImage('gfx/enemies/flyded.png') })],
    frameDuration: 3
};

var hornetRectangle = r(120, 120);
var hornetHitBox = { left: 0, top: 33, width: 110, height: 87 };
var hornetAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet1.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet2.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet3.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornet4.png') })],
    frameDuration: 3
};
var hornetDeathAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/hornetded.png') })],
    frameDuration: 3
};
var hornetSoldierAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet1.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet2.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet3.png') }), _extends({}, hornetRectangle, { hitBox: hornetHitBox, image: requireImage('gfx/enemies/mhornet4.png') })],
    frameDuration: 3
};
var fallingHornetSoldierHitBox = { left: 46, top: 48, width: 40, height: 40 };
var hornetSoldierDeathAnimation = {
    frames: [_extends({}, hornetRectangle, { hitBox: fallingHornetSoldierHitBox, image: requireImage('gfx/enemies/mhornetded.png') })],
    frameDuration: 3
};

var locustRectangle = r(100, 100, { hitBox: { left: 0, top: 40, width: 100, height: 60 } });
var locustAnimation = {
    frames: createFrames(locustRectangle, 3, 'gfx/enemies/locust.png', 1), frameDuration: 3
};
var locustDeathAnimation = {
    frames: createFrames(locustRectangle, 1, 'gfx/enemies/locust.png', 0), frameDuration: 3
};
var locustSoldierRectangle = _extends({}, locustRectangle, { hitBox: { left: 0, top: 18, width: 100, height: 82 } });
var locustSoldierAnimation = {
    frames: createFrames(locustSoldierRectangle, 3, 'gfx/enemies/locust.png', 4), frameDuration: 3
};
var locustSoldierDeathAnimation = {
    frames: createFrames(locustSoldierRectangle, 1, 'gfx/enemies/locust.png', 7), frameDuration: 3
};

var flyingAntHitBox = { left: 0, top: 20, width: 35, height: 20 };
var flyingAntRectangle = r(46, 41, { hitBox: flyingAntHitBox });
var flyingAntAnimation = {
    frames: [_extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant1.png') }), _extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant2.png') }), _extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant3.png') }), _extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fant4.png') })],
    frameDuration: 3
};
var flyingAntDeathAnimation = {
    frames: [_extends({}, flyingAntRectangle, { image: requireImage('gfx/enemies/fantded.png') })],
    frameDuration: 3
};

var flyingAntSoldierHitBox = { left: 0, top: 4, width: 35, height: 36 };
var flyingAntSoldierRectangle = r(46, 41, { hitBox: flyingAntSoldierHitBox });
var flyingAntSoldierAnimation = {
    frames: [_extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant1.png') }), _extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant2.png') }), _extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant3.png') }), _extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfant4.png') })],
    frameDuration: 3
};
var flyingAntSoldierDeathAnimation = {
    frames: [_extends({}, flyingAntSoldierRectangle, { image: requireImage('gfx/enemies/mfantded.png') })],
    frameDuration: 3
};

var monkHitBox = { left: 0, top: 8, width: 42, height: 42 };
var monkRectangle = r(42, 50, { hitBox: monkHitBox });
var monkAnimation = {
    frames: [_extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe1.png') }), _extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe2.png') }), _extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe3.png') }), _extends({}, monkRectangle, { image: requireImage('gfx/enemies/robe4.png') })],
    frameDuration: 6
};
var monkAttackAnimation = {
    frames: [_extends({}, r(42, 50), { image: requireImage('gfx/enemies/robeAttack.png') })],
    frameDuration: 5
};
var monkDeathAnimation = {
    frames: [_extends({}, r(46, 41), { image: requireImage('gfx/enemies/robeded.png') })],
    frameDuration: 5
};

var cargoBeetleHitBox = { left: 0, top: 16, width: 100, height: 84 };
var cargoBeetleRectangle = r(100, 100, { hitBox: cargoBeetleHitBox });
var cargoBeetleAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly1.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly2.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly3.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bfly4.png') })],
    frameDuration: 6
};
var cargoBeetleDeathAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/bflyded.png') })],
    frameDuration: 5
};
var explosiveBeetleAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly1.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly2.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly3.png') }), _extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbfly4.png') })],
    frameDuration: 6
};
var explosiveBeetleDeathAnimation = {
    frames: [_extends({}, cargoBeetleRectangle, { image: requireImage('gfx/enemies/expbflyded.png') })],
    frameDuration: 5
};

var damageRectangle = r(28, 28);
var damageAnimation = {
    frames: [_extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg1.png') }), _extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg2.png') }), _extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg3.png') }), _extends({}, damageRectangle, { image: requireImage('gfx/effects/dmg4.png') })],
    frameDuration: 3
};

var explosionRectangle = r(50, 39);
var explosionAnimation = {
    frames: [_extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead1.png') }), _extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead2.png') }), _extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead3.png') }), _extends({}, explosionRectangle, { image: requireImage('gfx/effects/dead4.png') })],
    frameDuration: 3
};

var hugeExplosionRectangle = r(67, 67);
var hugeExplosionAnimation = {
    frames: [_extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode1.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode2.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode3.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode4.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode5.png') }), _extends({}, hugeExplosionRectangle, { image: requireImage('gfx/effects/explode6.png') })],
    frameDuration: 6
};

var dustRectangle = r(20, 20);
var dustAnimation = {
    frames: [_extends({}, dustRectangle, { image: requireImage('gfx/effects/dust1.png') }), _extends({}, dustRectangle, { image: requireImage('gfx/effects/dust2.png') }), _extends({}, dustRectangle, { image: requireImage('gfx/effects/dust3.png') }), _extends({}, dustRectangle, { image: requireImage('gfx/effects/dust4.png') })],
    frameDuration: 4
};

var coinRectangle = r(9, 9);
var coinAnimation = {
    frames: [_extends({}, coinRectangle, { image: requireImage('gfx/items/coin1.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin2.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin3.png') }), _extends({}, coinRectangle, { image: requireImage('gfx/items/coin4.png') })],
    frameDuration: 5
};

var frameDuration = 12;
var powerupRectangle = r(20, 20);
var powerupDiamondAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/diamond1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/diamond2.png') })],
    frameDuration: frameDuration
};
var powerupSquareAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/square1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/square2.png') })],
    frameDuration: frameDuration
};
var powerupTriangleAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/triangle1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/triangle2.png') })],
    frameDuration: frameDuration
};
var powerupTripleDiamondAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/tripdiamond1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/tripdiamond2.png') })],
    frameDuration: frameDuration
};
var powerupTripleSquareAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/tripsquare1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/tripsquare2.png') })],
    frameDuration: frameDuration
};
var powerupTripleTriangleAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/triptriangle1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/triptriangle2.png') })],
    frameDuration: frameDuration
};
var powerupComboAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/tripcombo1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/tripcombo2.png') })],
    frameDuration: frameDuration
};
var powerupTripleComboAnimation = {
    frames: [_extends({}, powerupRectangle, { image: requireImage('gfx/items/ultcombo1.png') }), _extends({}, powerupRectangle, { image: requireImage('gfx/items/ultcombo2.png') })],
    frameDuration: frameDuration
};
var sizeTextRectangle = r(44, 20);
var sizeTextAnimation = {
    frames: [_extends({}, sizeTextRectangle, { image: requireImage('gfx/items/size1.png') }), _extends({}, sizeTextRectangle, { image: requireImage('gfx/items/size2.png') })],
    frameDuration: frameDuration
};
var speedTextAnimation = {
    frames: [_extends({}, sizeTextRectangle, { image: requireImage('gfx/items/speed1.png') }), _extends({}, sizeTextRectangle, { image: requireImage('gfx/items/speed2.png') })],
    frameDuration: frameDuration
};
var rateTextAnimation = {
    frames: [_extends({}, sizeTextRectangle, { image: requireImage('gfx/items/rate1.png') }), _extends({}, sizeTextRectangle, { image: requireImage('gfx/items/rate2.png') })],
    frameDuration: frameDuration
};

var powerupLadybugAnimation = {
    frames: [_extends({}, r(30, 15), { image: requireImage('gfx/items/ladybugicon.png') })],
    frameDuration: 8
};

var getFrame = function getFrame(animation, animationTime) {
    var frameIndex = Math.floor(animationTime / (FRAME_LENGTH * (animation.frameDuration || 1)));
    if (animation.loop === false) {
        // You can set this to prevent an animation from looping.
        frameIndex = Math.min(frameIndex, animation.frames.length - 1);
    }
    return animation.frames[frameIndex % animation.frames.length];
};
var getHitBox = function getHitBox(animation, animationTime) {
    var frame = getFrame(animation, animationTime);
    return frame.hitBox || frame;
};

var plainsBackground = r(1200, 600, { image: requireImage('gfx/scene/plains_bg.png') });
var plainsMidground = r(2000, 600, { image: requireImage('gfx/scene/plains_mg.png') });
var plainsNearground = r(1200, 600, { image: requireImage('gfx/scene/plains_ng.png') });
var backgroundSky = r(1600, 600, { image: requireImage('gfx/scene/background_sky.png') });

var selectNeedleImage = r(58, 7, { image: requireImage('gfx/needle.png') });
var startGameImage = r(58, 13, { image: requireImage('gfx/startgame.png') });
var optionsImage = r(43, 13, { image: requireImage('gfx/options.png') });

var gameOverImage = r(82, 30, { image: requireImage('gfx/gameover.png') });

var startImage = r(58, 30, { image: requireImage('gfx/start.png') });

var hudImage = r(800, 36, { image: requireImage('gfx/hud/newhud.png') });

var powerupBarRectangle = r(100, 19);
var powerupBarAnimation = {
    frames: [_extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup0.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup1.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup2.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup3.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup4.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup5.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup6.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup7.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup8.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup9.png') }), _extends({}, powerupBarRectangle, { image: requireImage('gfx/hud/powerup10.png') })],
    frameDuration: 5
};

var comboBarRectangle = r(100, 19);
var comboBarAnimation = {
    frames: [_extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo0.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo1.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo2.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo3.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo4.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo5.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo6.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo7.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo8.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo9.png') }), _extends({}, comboBarRectangle, { image: requireImage('gfx/hud/combo10.png') })],
    frameDuration: 5
};

module.exports = _defineProperty({
    getFrame: getFrame,
    createFrames: createFrames,
    getHitBox: getHitBox,
    backgroundSky: backgroundSky,
    plainsBackground: plainsBackground,
    plainsMidground: plainsMidground,
    plainsNearground: plainsNearground,
    beeAnimation: beeAnimation,
    beeEnterAnimation: beeEnterAnimation,
    beeCatchAnimation: beeCatchAnimation,
    beeSwitchAnimation: beeSwitchAnimation,
    beeMeleeAnimation: beeMeleeAnimation,
    beeDeathAnimation: beeDeathAnimation,
    beePortraitAnimation: beePortraitAnimation,
    dragonflyAnimation: dragonflyAnimation,
    dragonflyEnterAnimation: dragonflyEnterAnimation,
    dragonflyCatchAnimation: dragonflyCatchAnimation,
    dragonflySwitchAnimation: dragonflySwitchAnimation,
    dragonflyMeleeAnimation: dragonflyMeleeAnimation,
    dragonflyIdleAnimation: dragonflyIdleAnimation,
    dragonflyDeathAnimation: dragonflyDeathAnimation,
    dragonflyPortraitAnimation: dragonflyPortraitAnimation,
    mothAnimation: mothAnimation,
    mothEnterAnimation: mothEnterAnimation,
    mothCatchAnimation: mothCatchAnimation,
    mothSwitchAnimation: mothSwitchAnimation,
    mothMeleeAnimation: mothMeleeAnimation,
    mothDeathAnimation: mothDeathAnimation,
    mothPortraitAnimation: mothPortraitAnimation,
    needleFlipAnimation: needleFlipAnimation,
    ladybugAnimation: ladybugAnimation,
    requireImage: requireImage,
    blastStartAnimation: blastStartAnimation,
    blastLoopAnimation: blastLoopAnimation,
    slashAnimation: slashAnimation,
    stabAnimation: stabAnimation,
    ladybugAttackAnimation: ladybugAttackAnimation,
    bulletAnimation: bulletAnimation,
    deflectAnimation: deflectAnimation,
    damageAnimation: damageAnimation,
    explosionAnimation: explosionAnimation,
    hugeExplosionAnimation: hugeExplosionAnimation,
    dustAnimation: dustAnimation,
    coinAnimation: coinAnimation,
    powerupDiamondAnimation: powerupDiamondAnimation,
    powerupTriangleAnimation: powerupTriangleAnimation,
    powerupSquareAnimation: powerupSquareAnimation,
    powerupTripleDiamondAnimation: powerupTripleDiamondAnimation,
    powerupTripleSquareAnimation: powerupTripleSquareAnimation,
    powerupTripleTriangleAnimation: powerupTripleTriangleAnimation,
    powerupComboAnimation: powerupComboAnimation,
    powerupTripleComboAnimation: powerupTripleComboAnimation,
    rateTextAnimation: rateTextAnimation,
    sizeTextAnimation: sizeTextAnimation,
    speedTextAnimation: speedTextAnimation,
    powerupLadybugAnimation: powerupLadybugAnimation,
    flyAnimation: flyAnimation, flyDeathAnimation: flyDeathAnimation,
    hornetAnimation: hornetAnimation, hornetDeathAnimation: hornetDeathAnimation,
    hornetSoldierAnimation: hornetSoldierAnimation, hornetSoldierDeathAnimation: hornetSoldierDeathAnimation,
    locustAnimation: locustAnimation, locustDeathAnimation: locustDeathAnimation,
    locustSoldierAnimation: locustSoldierAnimation, locustSoldierDeathAnimation: locustSoldierDeathAnimation,
    flyingAntAnimation: flyingAntAnimation, flyingAntDeathAnimation: flyingAntDeathAnimation,
    flyingAntSoldierAnimation: flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation: flyingAntSoldierDeathAnimation,
    monkAnimation: monkAnimation, monkDeathAnimation: monkDeathAnimation, monkAttackAnimation: monkAttackAnimation,
    cargoBeetleAnimation: cargoBeetleAnimation, cargoBeetleDeathAnimation: cargoBeetleDeathAnimation,
    explosiveBeetleAnimation: explosiveBeetleAnimation, explosiveBeetleDeathAnimation: explosiveBeetleDeathAnimation,
    selectNeedleImage: selectNeedleImage,
    startGameImage: startGameImage,
    optionsImage: optionsImage,
    startImage: startImage,
    gameOverImage: gameOverImage,
    hudImage: hudImage,
    powerupBarAnimation: powerupBarAnimation,
    comboBarAnimation: comboBarAnimation
}, 'requireImage', requireImage);

},{"gameConstants":8}],3:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _attacks;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('draw'),
    drawImage = _require.drawImage,
    drawTintedImage = _require.drawTintedImage;

var _require2 = require('gameConstants'),
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    ATTACK_OFFSET = _require2.ATTACK_OFFSET,
    ATTACK_BLAST = _require2.ATTACK_BLAST,
    ATTACK_SLASH = _require2.ATTACK_SLASH,
    ATTACK_STAB = _require2.ATTACK_STAB,
    ATTACK_BULLET = _require2.ATTACK_BULLET,
    ATTACK_ORB = _require2.ATTACK_ORB,
    ATTACK_DEFEATED_ENEMY = _require2.ATTACK_DEFEATED_ENEMY,
    ATTACK_EXPLOSION = _require2.ATTACK_EXPLOSION;

var _require3 = require('sounds'),
    playSound = _require3.playSound;

var _require4 = require('animations'),
    getFrame = _require4.getFrame,
    blastStartAnimation = _require4.blastStartAnimation,
    blastLoopAnimation = _require4.blastLoopAnimation,
    slashAnimation = _require4.slashAnimation,
    stabAnimation = _require4.stabAnimation,
    ladybugAttackAnimation = _require4.ladybugAttackAnimation,
    bulletAnimation = _require4.bulletAnimation,
    hugeExplosionAnimation = _require4.hugeExplosionAnimation;

var _require5 = require('sprites'),
    getNewSpriteState = _require5.getNewSpriteState;

var attacks = (_attacks = {}, _defineProperty(_attacks, ATTACK_BLAST, {
    startAnimation: blastStartAnimation,
    animation: blastLoopAnimation,
    props: {
        sfx: 'sfx/shoot.mp3'
    }
}), _defineProperty(_attacks, ATTACK_SLASH, {
    animation: slashAnimation,
    hitSfx: 'sfx/meleehit.mp3',
    props: {
        melee: true,
        piercing: true,
        sfx: 'sfx/dodge.mp3'
    }
}), _defineProperty(_attacks, ATTACK_STAB, {
    animation: stabAnimation,
    hitSfx: 'sfx/meleehit.mp3',
    props: {
        melee: true,
        piercing: true,
        sfx: 'sfx/dodge.mp3'
    }
}), _defineProperty(_attacks, ATTACK_BULLET, {
    animation: bulletAnimation
}), _defineProperty(_attacks, ATTACK_ORB, {
    animation: ladybugAttackAnimation
}), _defineProperty(_attacks, ATTACK_DEFEATED_ENEMY, {
    // The animation will be the enemy death animation.
    hitSfx: 'sfx/throwhit.mp3',
    props: {
        piercing: true
    }
}), _defineProperty(_attacks, ATTACK_EXPLOSION, {
    animation: hugeExplosionAnimation,
    props: {
        damage: 20, piercing: true,
        sfx: 'sfx/explosion.mp3',
        explosion: true
    }
}), _attacks);

var createAttack = function createAttack(type, props) {
    var frame = (props.animation || attacks[type].animation).frames[0];
    return getNewSpriteState(_extends({}, frame, attacks[type].props, {
        type: type,
        hitIds: {}
    }, props));
};

var addPlayerAttackToState = function addPlayerAttackToState(state, attack) {
    return _extends({}, state, { newPlayerAttacks: [].concat(_toConsumableArray(state.newPlayerAttacks), [attack]) });
};

var addEnemyAttackToState = function addEnemyAttackToState(state, attack) {
    return _extends({}, state, { newEnemyAttacks: [].concat(_toConsumableArray(state.newEnemyAttacks), [attack]) });
};

var addNeutralAttackToState = function addNeutralAttackToState(state, attack) {
    return _extends({}, state, { newNeutralAttacks: [].concat(_toConsumableArray(state.newNeutralAttacks), [attack]) });
};

var renderAttack = function renderAttack(context, attack) {
    var animationTime = attack.animationTime;

    var attackData = attacks[attack.type];
    var animation = attack.animation || attackData.animation;
    if (attackData.startAnimation) {
        var startAnimationLength = attackData.startAnimation.frames.length * attackData.startAnimation.frameDuration * FRAME_LENGTH;
        if (animationTime >= startAnimationLength) {
            animationTime -= startAnimationLength;
        } else {
            animation = attackData.startAnimation;
        }
    }
    var frame = getFrame(animation, animationTime);
    if (attack.explosion && attack.delay) return;
    // These should only apply to player attacks since any damage defeats a player.
    if (attack.explosion || attack.damage === 1 || !attack.damage) drawImage(context, frame.image, frame, attack);else if (attack.damage >= 6) drawTintedImage(context, frame.image, 'white', .9, frame, attack);else if (attack.damage === 5) drawTintedImage(context, frame.image, 'black', .9, frame, attack);else if (attack.damage === 4) drawTintedImage(context, frame.image, 'blue', .5, frame, attack);else if (attack.damage === 3) drawTintedImage(context, frame.image, 'red', .4, frame, attack);else if (attack.damage === 2) drawTintedImage(context, frame.image, 'orange', .5, frame, attack);
    if (attack.sfx) {
        playSound(attack.sfx);
        attack.sfx = false;
    }
};

var advanceAttack = function advanceAttack(state, attack) {
    var left = attack.left,
        top = attack.top,
        width = attack.width,
        height = attack.height,
        vx = attack.vx,
        vy = attack.vy,
        delay = attack.delay,
        animationTime = attack.animationTime,
        playerIndex = attack.playerIndex,
        melee = attack.melee,
        explosion = attack.explosion;

    if (delay > 0 || melee) {
        delay--;
        if (!explosion && playerIndex >= 0) {
            var source = state.players[playerIndex].sprite;
            left = source.left + source.vx + source.width + (attack.xOffset || 0);
            top = source.top + source.vy + Math.round((source.height - height) / 2) + (attack.yOffset || 0);
        }
    }
    if (!(delay > 0)) {
        left += vx;
        top += vy;
    }
    animationTime += FRAME_LENGTH;
    var done = false;
    if (melee || explosion) {
        var animation = attacks[attack.type].animation;
        done = animationTime >= animation.frames.length * animation.frameDuration * FRAME_LENGTH;
    } else {
        done = left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;
    }
    return _extends({}, attack, { delay: delay, left: left, top: top, animationTime: animationTime, done: done });
};

module.exports = {
    attacks: attacks,
    createAttack: createAttack,
    addPlayerAttackToState: addPlayerAttackToState,
    addNeutralAttackToState: addNeutralAttackToState,
    addEnemyAttackToState: addEnemyAttackToState,
    advanceAttack: advanceAttack,
    renderAttack: renderAttack
};

},{"animations":2,"draw":5,"gameConstants":8,"sounds":14,"sprites":15}],4:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH;

var _require2 = require('state'),
    getNewState = _require2.getNewState,
    advanceState = _require2.advanceState,
    applyPlayerActions = _require2.applyPlayerActions;

var render = require('render');

var _require3 = require('keyboard'),
    isKeyDown = _require3.isKeyDown,
    KEY_UP = _require3.KEY_UP,
    KEY_DOWN = _require3.KEY_DOWN,
    KEY_LEFT = _require3.KEY_LEFT,
    KEY_RIGHT = _require3.KEY_RIGHT,
    KEY_SPACE = _require3.KEY_SPACE,
    KEY_ENTER = _require3.KEY_ENTER,
    KEY_R = _require3.KEY_R,
    KEY_X = _require3.KEY_X,
    KEY_C = _require3.KEY_C;

var now = function now() {
    return Date.now();
};

// Currently we only support a single player.
var playerIndex = 0;

var stateQueue = [];
var state = getNewState();

var update = function update() {
    state = applyPlayerActions(state, playerIndex, {
        // Make sure up/down only trigger once per press during the title sequence.
        up: isKeyDown(KEY_UP, state.title), down: isKeyDown(KEY_DOWN, state.title),
        left: isKeyDown(KEY_LEFT), right: isKeyDown(KEY_RIGHT),
        shoot: isKeyDown(KEY_SPACE),
        melee: isKeyDown(KEY_C),
        switch: isKeyDown(KEY_X),
        start: isKeyDown(KEY_ENTER, true)
    });

    if (stateQueue.length && isKeyDown(KEY_R)) {
        state = stateQueue.shift();
    } else {
        state = advanceState(state);
        if (!state.title && !state.paused) {
            stateQueue.unshift(state);
        }
    }

    stateQueue = stateQueue.slice(0, 100);
    //render(state);
    // This is here to help with debugging from console.
    window.state = state;
};
setInterval(update, FRAME_LENGTH);

var renderLoop = function renderLoop() {
    try {
        render(state);
        window.requestAnimationFrame(renderLoop);
    } catch (e) {
        console.log(e);
        debugger;
    }
};
renderLoop();

},{"gameConstants":8,"keyboard":10,"render":13,"state":16}],5:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT;

var drawImage = function drawImage(context, image, source, target) {
    context.drawImage(image, source.left, source.top, source.width, source.height, target.left, target.top, target.width, target.height);
};

var tintCanvas = document.createElement('canvas');
tintCanvas.width = WIDTH;
tintCanvas.height = HEIGHT;
var tintContext = tintCanvas.getContext('2d');
tintContext.imageSmoothingEnabled = false;

var drawTintedImage = function drawTintedImage(context, image, tint, amount, source, target) {
    context.save();
    // First make a solid color in the shape of the image to tint.
    tintContext.save();
    tintContext.fillStyle = tint;
    tintContext.clearRect(0, 0, source.width, source.height);
    tintContext.drawImage(image, source.left, source.top, source.width, source.height, 0, 0, source.width, source.height);
    tintContext.globalCompositeOperation = "source-in";
    tintContext.fillRect(0, 0, source.width, source.height);
    tintContext.restore();
    // Next draw the untinted image to the target.
    context.drawImage(image, source.left, source.top, source.width, source.height, target.left, target.top, target.width, target.height);
    // Finally draw the tint color on top of the target with the desired opacity.
    context.globalAlpha *= amount; // This needs to be multiplicative since we might be drawing a partially transparent image already.
    context.drawImage(tintCanvas, 0, 0, source.width, source.height, target.left, target.top, target.width, target.height);
    context.restore();
};

var embossText = function embossText(context, _ref) {
    var left = _ref.left,
        top = _ref.top,
        text = _ref.text,
        _ref$color = _ref.color,
        color = _ref$color === undefined ? 'white' : _ref$color,
        _ref$backgroundColor = _ref.backgroundColor,
        backgroundColor = _ref$backgroundColor === undefined ? 'black' : _ref$backgroundColor;

    context.fillStyle = backgroundColor;
    context.fillText(text, left + 1, top + 1);
    context.fillStyle = color;
    context.fillText(text, left, top);
};

module.exports = {
    drawImage: drawImage,
    drawTintedImage: drawTintedImage,
    embossText: embossText
};

},{"gameConstants":8}],6:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _effects;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('draw'),
    drawImage = _require.drawImage;

var _require2 = require('gameConstants'),
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    EFFECT_DAMAGE = _require2.EFFECT_DAMAGE,
    EFFECT_EXPLOSION = _require2.EFFECT_EXPLOSION,
    EFFECT_DUST = _require2.EFFECT_DUST,
    EFFECT_DEAD_BEE = _require2.EFFECT_DEAD_BEE,
    EFFECT_SWITCH_BEE = _require2.EFFECT_SWITCH_BEE,
    EFFECT_DEAD_DRAGONFLY = _require2.EFFECT_DEAD_DRAGONFLY,
    EFFECT_SWITCH_DRAGONFLY = _require2.EFFECT_SWITCH_DRAGONFLY,
    EFFECT_DEAD_MOTH = _require2.EFFECT_DEAD_MOTH,
    EFFECT_SWITCH_MOTH = _require2.EFFECT_SWITCH_MOTH,
    EFFECT_NEEDLE_FLIP = _require2.EFFECT_NEEDLE_FLIP,
    EFFECT_RATE_UP = _require2.EFFECT_RATE_UP,
    EFFECT_SIZE_UP = _require2.EFFECT_SIZE_UP,
    EFFECT_SPEED_UP = _require2.EFFECT_SPEED_UP,
    EFFECT_DEFLECT_BULLET = _require2.EFFECT_DEFLECT_BULLET;

var _require3 = require('animations'),
    getFrame = _require3.getFrame,
    damageAnimation = _require3.damageAnimation,
    dustAnimation = _require3.dustAnimation,
    explosionAnimation = _require3.explosionAnimation,
    beeDeathAnimation = _require3.beeDeathAnimation,
    beeSwitchAnimation = _require3.beeSwitchAnimation,
    dragonflyDeathAnimation = _require3.dragonflyDeathAnimation,
    dragonflySwitchAnimation = _require3.dragonflySwitchAnimation,
    mothDeathAnimation = _require3.mothDeathAnimation,
    mothSwitchAnimation = _require3.mothSwitchAnimation,
    needleFlipAnimation = _require3.needleFlipAnimation,
    rateTextAnimation = _require3.rateTextAnimation,
    sizeTextAnimation = _require3.sizeTextAnimation,
    speedTextAnimation = _require3.speedTextAnimation,
    deflectAnimation = _require3.deflectAnimation;

var _require4 = require('sounds'),
    playSound = _require4.playSound;

var _require5 = require('sprites'),
    getNewSpriteState = _require5.getNewSpriteState;

var effects = (_effects = {}, _defineProperty(_effects, EFFECT_DAMAGE, {
    animation: damageAnimation
}), _defineProperty(_effects, EFFECT_EXPLOSION, {
    animation: explosionAnimation
}), _defineProperty(_effects, EFFECT_DUST, {
    animation: dustAnimation,
    props: {
        relativeToGround: true
    }
}), _defineProperty(_effects, EFFECT_NEEDLE_FLIP, {
    animation: needleFlipAnimation
}), _defineProperty(_effects, EFFECT_DEAD_BEE, {
    animation: beeDeathAnimation
}), _defineProperty(_effects, EFFECT_SWITCH_BEE, {
    animation: beeSwitchAnimation
}), _defineProperty(_effects, EFFECT_DEAD_DRAGONFLY, {
    animation: dragonflyDeathAnimation
}), _defineProperty(_effects, EFFECT_SWITCH_DRAGONFLY, {
    animation: dragonflySwitchAnimation
}), _defineProperty(_effects, EFFECT_DEAD_MOTH, {
    animation: mothDeathAnimation
}), _defineProperty(_effects, EFFECT_SWITCH_MOTH, {
    animation: mothSwitchAnimation
}), _defineProperty(_effects, EFFECT_RATE_UP, {
    animation: rateTextAnimation,
    props: {
        vy: -0.5,
        loops: 3
    }
}), _defineProperty(_effects, EFFECT_SIZE_UP, {
    animation: sizeTextAnimation,
    props: {
        vy: -0.5,
        loops: 3
    }
}), _defineProperty(_effects, EFFECT_SPEED_UP, {
    animation: speedTextAnimation,
    props: {
        vy: -0.5,
        loops: 3
    }
}), _defineProperty(_effects, EFFECT_DEFLECT_BULLET, {
    animation: deflectAnimation
}), _effects);

var createEffect = function createEffect(type, props) {
    var frame = effects[type].animation.frames[0];
    return getNewSpriteState(_extends({}, frame, effects[type].props, {
        type: type
    }, props));
};

var addEffectToState = function addEffectToState(state, effect) {
    return _extends({}, state, { newEffects: [].concat(_toConsumableArray(state.newEffects), [effect]) });
};

var renderEffect = function renderEffect(context, effect) {
    var frame = getFrame(effects[effect.type].animation, effect.animationTime);
    drawImage(context, frame.image, frame, effect);
    if (effect.sfx) {
        playSound(effect.sfx);
        effect.sfx = false;
    }
};

var advanceEffect = function advanceEffect(state, effect) {
    var left = effect.left,
        top = effect.top,
        width = effect.width,
        height = effect.height,
        vx = effect.vx,
        vy = effect.vy,
        delay = effect.delay,
        duration = effect.duration,
        animationTime = effect.animationTime,
        type = effect.type;

    var animation = effects[type].animation;
    left += vx;
    top += vy;
    if (effect.relativeToGround) {
        left -= state.world.nearground.xFactor * state.world.vx;
        top += state.world.nearground.yFactor * state.world.vy;
    }
    animationTime += FRAME_LENGTH;

    var done = animationTime >= FRAME_LENGTH * animation.frames.length * animation.frameDuration * (effect.loops || 1) || left + width < -OFFSCREEN_PADDING || left > WIDTH + OFFSCREEN_PADDING || top + height < -OFFSCREEN_PADDING || top > GAME_HEIGHT + OFFSCREEN_PADDING;

    return _extends({}, effect, { left: left, top: top, animationTime: animationTime, done: done });
};

module.exports = {
    createEffect: createEffect,
    addEffectToState: addEffectToState,
    advanceEffect: advanceEffect,
    renderEffect: renderEffect
};

},{"animations":2,"draw":5,"gameConstants":8,"sounds":14,"sprites":15}],7:[function(require,module,exports){
'use strict';

var _enemyData;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Rectangle = require('Rectangle');

var _require = require('draw'),
    drawImage = _require.drawImage;

var _require2 = require('gameConstants'),
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    ENEMY_FLY = _require2.ENEMY_FLY,
    ENEMY_MONK = _require2.ENEMY_MONK,
    ENEMY_FLYING_ANT = _require2.ENEMY_FLYING_ANT,
    ENEMY_FLYING_ANT_SOLDIER = _require2.ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_HORNET = _require2.ENEMY_HORNET,
    ENEMY_HORNET_SOLDIER = _require2.ENEMY_HORNET_SOLDIER,
    ENEMY_LOCUST = _require2.ENEMY_LOCUST,
    ENEMY_LOCUST_SOLDIER = _require2.ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE = _require2.ENEMY_CARGO_BEETLE,
    ENEMY_EXPLOSIVE_BEETLE = _require2.ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET = _require2.ATTACK_BULLET,
    ATTACK_DEFEATED_ENEMY = _require2.ATTACK_DEFEATED_ENEMY,
    ATTACK_EXPLOSION = _require2.ATTACK_EXPLOSION,
    EFFECT_EXPLOSION = _require2.EFFECT_EXPLOSION,
    EFFECT_DAMAGE = _require2.EFFECT_DAMAGE,
    EFFECT_DUST = _require2.EFFECT_DUST,
    LOOT_COIN = _require2.LOOT_COIN,
    LOOT_SPEED = _require2.LOOT_SPEED,
    LOOT_ATTACK_POWER = _require2.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require2.LOOT_ATTACK_SPEED;

var _require3 = require('keyboard'),
    isKeyDown = _require3.isKeyDown,
    KEY_SHIFT = _require3.KEY_SHIFT;

var _require4 = require('animations'),
    getFrame = _require4.getFrame,
    getHitBox = _require4.getHitBox,
    flyAnimation = _require4.flyAnimation,
    flyDeathAnimation = _require4.flyDeathAnimation,
    hornetAnimation = _require4.hornetAnimation,
    hornetDeathAnimation = _require4.hornetDeathAnimation,
    hornetSoldierAnimation = _require4.hornetSoldierAnimation,
    hornetSoldierDeathAnimation = _require4.hornetSoldierDeathAnimation,
    locustAnimation = _require4.locustAnimation,
    locustDeathAnimation = _require4.locustDeathAnimation,
    locustSoldierAnimation = _require4.locustSoldierAnimation,
    locustSoldierDeathAnimation = _require4.locustSoldierDeathAnimation,
    flyingAntAnimation = _require4.flyingAntAnimation,
    flyingAntDeathAnimation = _require4.flyingAntDeathAnimation,
    flyingAntSoldierAnimation = _require4.flyingAntSoldierAnimation,
    flyingAntSoldierDeathAnimation = _require4.flyingAntSoldierDeathAnimation,
    monkAnimation = _require4.monkAnimation,
    monkDeathAnimation = _require4.monkDeathAnimation,
    monkAttackAnimation = _require4.monkAttackAnimation,
    cargoBeetleAnimation = _require4.cargoBeetleAnimation,
    cargoBeetleDeathAnimation = _require4.cargoBeetleDeathAnimation,
    explosiveBeetleAnimation = _require4.explosiveBeetleAnimation,
    explosiveBeetleDeathAnimation = _require4.explosiveBeetleDeathAnimation;

var uniqueIdCounter = 0;

var spawnMonkOnGround = function spawnMonkOnGround(state, enemyIndex) {
    var enemy = state.enemies[enemyIndex];
    var fallDamage = Math.floor(enemy.vy / 13);
    var monk = createEnemy(ENEMY_MONK, {
        left: enemy.left,
        top: getGroundHeight(state),
        animationTime: 20,
        pendingDamage: fallDamage
    });
    monk.top -= monk.height;
    // Add the new enemy to the state.
    state = addEnemyToState(state, monk);
    // Remove the current enemy from the state.
    return updateEnemy(state, enemyIndex, { done: true });
};

var enemyData = (_enemyData = {}, _defineProperty(_enemyData, ENEMY_FLY, {
    animation: flyAnimation,
    deathAnimation: flyDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    props: {
        life: 1,
        score: 20
    }
}), _defineProperty(_enemyData, ENEMY_HORNET, {
    animation: hornetAnimation,
    deathAnimation: hornetDeathAnimation,
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            mode = enemy.mode,
            modeTime = enemy.modeTime;

        var theta = Math.PI / 2 + Math.PI * 4 * modeTime / 2000;
        var radius = seed * 2 + 2;
        switch (mode) {
            case 'enter':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vx < 0) vx *= 2;
                if (vx > 0) vx *= .5;
                if (modeTime > 2000) {
                    mode = 'circle';
                    modeTime = 0;
                }
                break;
            case 'circle':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vy > 0 && enemy.top < 50) vy *= 1 + (50 - enemy.top) / 100;
                if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
                    vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100;
                }
                if (modeTime > 2000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack':
                if (modeTime === FRAME_LENGTH) {
                    var target = state.players[0].sprite;
                    targetX = target.left + target.width / 2;
                    targetY = target.top + target.height / 2;

                    var _getTargetVector = getTargetVector(enemy, target),
                        dx = _getTargetVector.dx,
                        dy = _getTargetVector.dy;

                    var _theta = Math.atan2(dy, dx);
                    vx = enemy.speed * Math.cos(_theta);
                    vy = enemy.speed * Math.sin(_theta);
                } else {
                    var _getTargetVector2 = getTargetVector(enemy, { left: targetX, top: targetY }),
                        _dx = _getTargetVector2.dx,
                        _dy = _getTargetVector2.dy;

                    if (_dx * vx < 0) {
                        mode = 'retreat';
                        modeTime = 0;
                    }
                }
                break;
            case 'retreat':
                if (modeTime === FRAME_LENGTH) {
                    vx = 0;
                    vy = 0; //-vy;
                } else if (modeTime === 200) {
                    vx = enemy.speed * 1.5;
                } else if (enemy.left + enemy.width / 2 > WIDTH - 100) {
                    mode = 'circle';
                    modeTime = 0;
                }
        }
        modeTime += FRAME_LENGTH;
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy, mode: mode, modeTime: modeTime });
    },
    props: {
        life: 30,
        score: 500,
        speed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true
    }
}), _defineProperty(_enemyData, ENEMY_HORNET_SOLDIER, {
    animation: hornetSoldierAnimation,
    deathAnimation: hornetSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            mode = enemy.mode,
            modeTime = enemy.modeTime;

        var theta = Math.PI / 2 + Math.PI * 4 * modeTime / 8000;
        var radius = 1;
        switch (mode) {
            case 'enter':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vx < 0) vx *= 2;
                if (vx > 0) vx *= .5;
                if (modeTime > 4000) {
                    mode = 'circle';
                    modeTime = 0;
                }
                break;
            case 'circle':
                // Advance circling until almost fully in frame, then circle in place.
                vx = radius * Math.cos(theta);
                vy = radius * Math.sin(theta);
                if (vy > 0 && enemy.top < 100) vy *= 1 + (100 - enemy.top) / 100;
                if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
                    vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100;
                }
                if (modeTime > 4000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack':
                if (modeTime === FRAME_LENGTH) {
                    var target = state.players[0].sprite;
                    targetX = target.left + target.width / 2;
                    targetY = target.top + target.height / 2;

                    var _getTargetVector3 = getTargetVector(enemy, target),
                        dx = _getTargetVector3.dx,
                        dy = _getTargetVector3.dy;

                    var _theta2 = Math.atan2(dy, dx);
                    vx = enemy.speed * Math.cos(_theta2);
                    vy = enemy.speed * Math.sin(_theta2);
                } else {
                    var _getTargetVector4 = getTargetVector(enemy, { left: targetX, top: targetY }),
                        _dx2 = _getTargetVector4.dx,
                        _dy2 = _getTargetVector4.dy;

                    if (_dx2 * vx < 0) {
                        mode = 'retreat';
                        modeTime = 0;
                    }
                }
                break;
            case 'retreat':
                if (modeTime === FRAME_LENGTH) {
                    vx = 0;
                    vy = 0; //-vy;
                } else if (modeTime === 200) {
                    vx = enemy.speed * 1.5;
                } else if (enemy.left + enemy.width / 2 > WIDTH - 100) {
                    mode = 'circle';
                    modeTime = 0;
                }
        }
        modeTime += FRAME_LENGTH;
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy, mode: mode, modeTime: modeTime });
    },
    shoot: function shoot(state, enemyIndex) {
        var enemies = [].concat(_toConsumableArray(state.enemies));
        var enemy = enemies[enemyIndex];
        if (enemy.mode !== 'circle' && enemy.mode !== 'retreat') return state;
        if (enemy.shotCooldown > 0) {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldown - 1 });
            return _extends({}, state, { enemies: enemies });
        }

        var _getTargetVector5 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector5.dx,
            dy = _getTargetVector5.dy;

        var theta = Math.atan2(dy, dx);
        enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldownFrames });
        var bullet = createAttack(ATTACK_BULLET, {
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta),
            top: enemy.top + enemy.vy + enemy.height / 2,
            left: enemy.left + enemy.vx
        });
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(_extends({}, state, { enemies: enemies }), bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemyIndex) {
        var enemy = state.enemies[enemyIndex];
        var hornet = createEnemy(ENEMY_HORNET, {
            life: 20,
            score: enemyData[ENEMY_HORNET].props.score / 2,
            left: enemy.left,
            top: enemy.top,
            vx: 0,
            vy: 0,
            mode: 'retreat'
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = updateEnemy(state, enemyIndex, { done: true });
        state = addEnemyToState(state, hornet);
        return addEnemyToState(state, enemy);
    },

    onHitGroundEffect: spawnMonkOnGround,
    props: {
        life: 40,
        score: 500,
        speed: 10,
        bulletSpeed: 10,
        mode: 'enter',
        modeTime: 0,
        permanent: true,
        doNotFlip: true,
        shotCooldownFrames: 50
    }
}), _defineProperty(_enemyData, ENEMY_LOCUST, {
    animation: locustAnimation,
    deathAnimation: locustDeathAnimation,
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            animationTime = enemy.animationTime;

        var theta = Math.PI / 2 + Math.PI * 2 * animationTime / 2000;
        vy = 2 * enemy.speed * Math.sin(theta);
        vx = -enemy.speed;
        if (vy > 0 && enemy.top < 50) vy *= 1 + (50 - enemy.top) / 100;
        if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
            vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100;
        }
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy });
    },
    props: {
        life: 8,
        score: 100,
        speed: 3,
        doNotFlip: true
    }
}), _defineProperty(_enemyData, ENEMY_LOCUST_SOLDIER, {
    animation: locustSoldierAnimation,
    deathAnimation: locustSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            targetX = enemy.targetX,
            targetY = enemy.targetY,
            animationTime = enemy.animationTime;

        var theta = Math.PI / 2 + Math.PI * 2 * animationTime / 2000;
        vy = 2 * enemy.speed * Math.sin(theta);
        vx = -enemy.speed;
        if (vy > 0 && enemy.top < 100) vy *= 1 + (100 - enemy.top) / 100;
        if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
            vy *= 1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100;
        }
        return _extends({}, enemy, { targetX: targetX, targetY: targetY, vx: vx, vy: vy });
    },
    shoot: function shoot(state, enemyIndex) {
        var enemies = [].concat(_toConsumableArray(state.enemies));
        var enemy = enemies[enemyIndex];
        if (enemy.shotCooldown > 0) {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldown - 1 });
            return _extends({}, state, { enemies: enemies });
        }

        var _getTargetVector6 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector6.dx,
            dy = _getTargetVector6.dy;

        var theta = Math.atan2(dy, dx);
        enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldownFrames });
        var bullet = createAttack(ATTACK_BULLET, {
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta),
            top: enemy.top + enemy.vy + enemy.height / 2,
            left: enemy.left + enemy.vx
        });
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(_extends({}, state, { enemies: enemies }), bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemyIndex) {
        var enemy = state.enemies[enemyIndex];
        var locust = createEnemy(ENEMY_LOCUST, {
            life: 6,
            score: enemyData[ENEMY_LOCUST].props.score / 2,
            left: enemy.left,
            top: enemy.top,
            vx: enemy.vx,
            vy: enemy.vy,
            animationTime: enemy.animationTime, // This helps keep acceleration in sync.
            speed: 3,
            mode: 'retreat'
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = updateEnemy(state, enemyIndex, { done: true });
        state = addEnemyToState(state, locust);
        return addEnemyToState(state, enemy);
    },

    onHitGroundEffect: spawnMonkOnGround,
    props: {
        life: 12,
        score: 500,
        speed: 1,
        bulletSpeed: 10,
        doNotFlip: true,
        shotCooldownFrames: 80
    }
}), _defineProperty(_enemyData, ENEMY_FLYING_ANT, {
    animation: flyingAntAnimation,
    deathAnimation: flyingAntDeathAnimation,
    deathSound: 'sfx/flydeath.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed;

        var target = state.players[0].sprite;
        var speed = enemy.speed;
        var dx = target.left + target.width / 2 - (enemy.left + enemy.width / 2);
        var dy = target.top + target.height / 2 - (enemy.top + enemy.height / 2);
        var theta = Math.atan2(dy, dx);
        if (enemy.animationTime === 0) {
            vx = speed * Math.cos(theta);
            vy = speed * Math.sin(theta);
        } else if (enemy.animationTime < 3000) {
            vx = (vx * 20 + speed * Math.cos(theta)) / 21;
            vy = (vy * 20 + speed * Math.sin(theta)) / 21;
        } else {
            var tvx = 6 * Math.abs(vx) / vx;
            vx = (vx * 20 + tvx) / 21;
            vy = (vy * 20 + 0) / 21;
        }
        return _extends({}, enemy, { vx: vx, vy: vy });
    },
    props: {
        life: 1,
        score: 30,
        speed: 6
    }
}), _defineProperty(_enemyData, ENEMY_FLYING_ANT_SOLDIER, {
    animation: flyingAntSoldierAnimation,
    deathAnimation: flyingAntSoldierDeathAnimation,
    deathSound: 'sfx/hit.mp3',
    accelerate: function accelerate(state, enemy) {
        var vx = enemy.vx,
            vy = enemy.vy,
            seed = enemy.seed;

        var speed = enemy.speed;

        var _getTargetVector7 = getTargetVector(enemy, state.players[0].sprite),
            dx = _getTargetVector7.dx,
            dy = _getTargetVector7.dy;

        var theta = Math.atan2(dy, dx);
        if (enemy.animationTime === 0) {
            vx = speed * Math.cos(theta);
            vy = speed * Math.sin(theta);
        } else if (enemy.animationTime < 5000) {
            vx = (vx * 20 + speed * Math.cos(theta)) / 21;
            vy = (vy * 20 + speed * Math.sin(theta)) / 21;
        } else {
            var tvx = 6 * Math.abs(vx) / vx;
            vx = (vx * 20 + tvx) / 21;
            vy = (vy * 20 + 0) / 21;
        }
        return _extends({}, enemy, { vx: vx, vy: vy });
    },
    shoot: function shoot(state, enemyIndex) {
        var enemies = [].concat(_toConsumableArray(state.enemies));
        var enemy = enemies[enemyIndex];
        if (enemy.shotCooldown === undefined) {
            enemy.shotCooldown = 20 + Math.floor(50 * Math.random());
        }
        if (enemy.shotCooldown > 0) {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldown - 1 });
            return _extends({}, state, { enemies: enemies });
        } else {
            var _getTargetVector8 = getTargetVector(enemy, state.players[0].sprite),
                dx = _getTargetVector8.dx,
                dy = _getTargetVector8.dy;
            // Don't shoot unless aiming approximately towards the player.
            //if (dx * enemy.vx < 0 || dy * enemy.vy < 0) return state;


            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldownFrames });
        }
        var theta = Math.atan2(enemy.vy, enemy.vx);
        var bullet = createAttack(ATTACK_BULLET, {
            left: enemy.left - enemy.vx,
            vx: enemy.bulletSpeed * Math.cos(theta),
            vy: enemy.bulletSpeed * Math.sin(theta)
        });
        bullet.top = enemy.top + enemy.vy + Math.round((enemy.height - bullet.height) / 2);
        return addEnemyAttackToState(_extends({}, state, { enemies: enemies }), bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemyIndex) {
        var enemy = state.enemies[enemyIndex];
        var flyingAnt = createEnemy(ENEMY_FLYING_ANT, {
            left: enemy.left,
            top: enemy.top,
            speed: 9,
            vx: 10,
            vy: Math.random() < .5 ? -5 : 5,
            animationTime: 20
        });
        // Delete the current enemy from the state so it can be
        // added on top of the mount enemy.
        state = updateEnemy(state, enemyIndex, { done: true });
        state = addEnemyToState(state, flyingAnt);
        return addEnemyToState(state, enemy);
    },

    onHitGroundEffect: spawnMonkOnGround,
    props: {
        bulletSpeed: 8,
        life: 2,
        score: 20,
        speed: 5,
        shotCooldownFrames: 100
    }
}), _defineProperty(_enemyData, ENEMY_MONK, {
    animation: monkAnimation,
    deathAnimation: monkDeathAnimation,
    attackAnimation: monkAttackAnimation,
    deathSound: 'sfx/robedeath1.mp3',
    accelerate: function accelerate(state, enemy) {
        // Stop moving while attacking.
        var vx = enemy.attackCooldownFramesLeft > 0 ? 0.001 : enemy.speed;
        return _extends({}, enemy, { vx: vx });
    },
    shoot: function shoot(state, enemyIndex) {
        var enemies = [].concat(_toConsumableArray(state.enemies));
        var enemy = enemies[enemyIndex];
        if (enemy.shotCooldown === undefined) {
            enemy.shotCooldown = 20 + Math.floor(enemy.shotCooldownFrames * Math.random());
        }
        if (enemy.shotCooldown > 0) {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldown - 1 });
            return _extends({}, state, { enemies: enemies });
        } else {
            enemies[enemyIndex] = _extends({}, enemy, { shotCooldown: enemy.shotCooldownFrames });
        }
        var target = state.players[0].sprite;
        target = _extends({}, target, { left: target.left + state.world.vx * 40 });

        var _getTargetVector9 = getTargetVector(enemy, target),
            dx = _getTargetVector9.dx,
            dy = _getTargetVector9.dy;

        var mag = Math.sqrt(dx * dx + dy * dy);
        if (!mag) {
            return state;
        }

        var bullet = createAttack(ATTACK_BULLET, {
            left: enemy.left - enemy.vx + enemy.width / 2,
            top: enemy.top + enemy.vy,
            vx: enemy.bulletSpeed * dx / mag - state.world.vx,
            vy: enemy.bulletSpeed * dy / mag
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height;
        enemies[enemyIndex] = _extends({}, enemies[enemyIndex], { attackCooldownFramesLeft: enemy.attackCooldownFrames });
        return addEnemyAttackToState(_extends({}, state, { enemies: enemies }), bullet);
    },
    onDeathEffect: function onDeathEffect(state, enemyIndex) {
        var enemy = state.enemies[enemyIndex];
        var enemies = [].concat(_toConsumableArray(state.enemies));
        enemies[enemyIndex] = _extends({}, enemy, { ttl: 600, vx: 0, vy: 0 });
        return _extends({}, state, { enemies: enemies });
    },

    props: {
        life: 2,
        score: 30,
        speed: 2,
        grounded: true,
        bulletSpeed: 5,
        attackCooldownFrames: 15,
        shotCooldownFrames: 80
    }
}), _defineProperty(_enemyData, ENEMY_CARGO_BEETLE, {
    animation: cargoBeetleAnimation,
    deathAnimation: cargoBeetleDeathAnimation,
    accelerate: function accelerate(state, enemy) {
        // Move up and down in a sin wave.
        var theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
        var vy = 2 * Math.sin(theta);
        return _extends({}, enemy, { vy: vy });
    },

    deathSound: 'sfx/flydeath.mp3',
    onDeathEffect: function onDeathEffect(state, enemyIndex) {
        var enemy = state.enemies[enemyIndex];
        var loot = createLoot(enemy.lootType || getAdaptivePowerupType(state));
        var newLoot = [].concat(_toConsumableArray(state.newLoot), [getNewSpriteState(_extends({}, loot, {
            // These offsets are chosen to match the position of the bucket.
            left: enemy.left + 50 - loot.width / 2,
            top: enemy.top + 85 - loot.height / 2
        }))]);
        return _extends({}, state, { newLoot: newLoot });
    },

    props: {
        life: 5,
        score: 0,
        speed: 1,
        vx: -3
    }
}), _defineProperty(_enemyData, ENEMY_EXPLOSIVE_BEETLE, {
    animation: explosiveBeetleAnimation,
    deathAnimation: explosiveBeetleDeathAnimation,
    accelerate: function accelerate(state, enemy) {
        // Move up and down in a sin wave.
        var theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
        var vy = 2 * Math.sin(theta);
        return _extends({}, enemy, { vy: vy });
    },

    // deathSound: 'sfx/flydeath.mp3',
    onDeathEffect: function onDeathEffect(state, enemyIndex) {
        var playerIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        var enemy = state.enemies[enemyIndex];
        // The bucket explodes on death.
        var explosion = createAttack(ATTACK_EXPLOSION, {
            // These offsets are chosen to match the position of the bucket.
            left: enemy.left + 30 + enemy.vx,
            top: enemy.top + 90 + enemy.vy,
            playerIndex: playerIndex,
            delay: 10,
            vx: enemy.vx, vy: enemy.vy
        });
        explosion.width *= 4;
        explosion.height *= 4;
        explosion.left -= explosion.width / 2;
        explosion.top -= explosion.height / 2;
        return addNeutralAttackToState(state, explosion);
    },

    props: {
        life: 3,
        score: 0,
        speed: 1,
        vx: -3
    }
}), _enemyData);

var createEnemy = function createEnemy(type, props) {
    var frame = enemyData[type].animation.frames[0];
    return getNewSpriteState(_extends({}, frame, enemyData[type].props, {
        type: type,
        seed: Math.random()
    }, props, {
        id: 'enemy' + uniqueIdCounter++
    }));
};

var updateEnemy = function updateEnemy(state, enemyIndex, props) {
    var enemies = [].concat(_toConsumableArray(state.enemies));
    enemies[enemyIndex] = _extends({}, enemies[enemyIndex], props);
    return _extends({}, state, { enemies: enemies });
};

// Return the value with the smallest absolute value.
var absMin = function absMin(A, B) {
    if (A < 0 && B < 0) return Math.max(A, B);
    if (A > 0 && B > 0) return Math.min(A, B);
    return Math.abs(A) < Math.abs(B) ? A : B;
};

var getTargetVector = function getTargetVector(agent, target) {
    return {
        dx: target.left + (target.width || 0) / 2 - (agent.left + (agent.width || 0) / 2),
        dy: target.top + (target.height || 0) / 2 - (agent.top + (agent.height || 0) / 2)
    };
};

var addEnemyToState = function addEnemyToState(state, enemy) {
    return _extends({}, state, { newEnemies: [].concat(_toConsumableArray(state.newEnemies), [enemy]) });
};

var getEnemyHitBox = function getEnemyHitBox(_ref) {
    var type = _ref.type,
        animationTime = _ref.animationTime,
        left = _ref.left,
        top = _ref.top;

    return new Rectangle(getHitBox(enemyData[type].animation, animationTime)).translate(left, top);
};

var damageEnemy = function damageEnemy(state, enemyIndex, attack) {
    var updatedState = _extends({}, state);
    updatedState.enemies = [].concat(_toConsumableArray(updatedState.enemies));
    updatedState.players = [].concat(_toConsumableArray(updatedState.players));
    updatedState.newEffects = [].concat(_toConsumableArray(updatedState.newEffects));
    var enemy = updatedState.enemies[enemyIndex];
    var damage = attack.damage || 1;
    updatedState.enemies[enemyIndex] = _extends({}, enemy, {
        life: enemy.life - damage,
        dead: enemy.life <= damage,
        animationTime: enemy.life <= damage ? 0 : enemy.animationTime
    });
    if (updatedState.enemies[enemyIndex].dead) {
        if (attack.playerIndex >= 0) {
            var hits = attack.hitIds ? 1 + Object.keys(attack.hitIds).length : 1;
            var comboScore = Math.min(1000, updatedState.players[attack.playerIndex].comboScore + 10 * hits);
            updatedState = updatePlayer(updatedState, attack.playerIndex, { comboScore: comboScore });
        }
        updatedState = gainPoints(updatedState, attack.playerIndex, enemy.score);
        if (enemyData[enemy.type].onDeathEffect) {
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemyIndex);
        }
        var explosion = createEffect(EFFECT_EXPLOSION, {
            sfx: enemyData[enemy.type].deathSound
        });
        explosion.left = enemy.left + (enemy.width - explosion.width) / 2;
        explosion.top = enemy.top + (enemy.height - explosion.height) / 2;
        updatedState = addEffectToState(updatedState, explosion);

        if (attack.melee) {
            var playerSprite = updatedState.players[attack.playerIndex].sprite;

            var _getTargetVector10 = getTargetVector(playerSprite, enemy),
                dx = _getTargetVector10.dx,
                dy = _getTargetVector10.dy;

            var theta = Math.atan2(dy, dx);
            var defeatedEnemyAttack = createAttack(ATTACK_DEFEATED_ENEMY, {
                animation: enemyData[enemy.type].deathAnimation || enemyData[enemy.type].animation,
                damage: 1,
                top: enemy.top,
                left: enemy.left,
                vx: 10 * Math.cos(theta),
                vy: 10 * Math.sin(theta),
                playerIndex: attack.playerIndex,
                hitIds: _defineProperty({}, enemy.id, true)
            });
            // Remove the enemy, it is replaced by the defeatedEnemyAttack.
            updatedState.enemies[enemyIndex] = _extends({}, enemy, { done: true });
            updatedState = addPlayerAttackToState(updatedState, defeatedEnemyAttack);
        }

        // Knock grounded enemies back when killed by an attack (but not if they died from other damage).
        if (enemy.grounded && attack.left) {
            updatedState = updateEnemy(updatedState, enemyIndex, { vx: 6, vy: -6 });
            enemy = updatedState.enemies[enemyIndex];
        }
        if (Math.random() < enemy.score / 200) {
            var loot = createLoot(LOOT_COIN);
            updatedState.newLoot.push(getNewSpriteState(_extends({}, loot, {
                left: enemy.left + (enemy.width - loot.width) / 2,
                top: enemy.top + (enemy.height - loot.height) / 2
            })));
        }
    } else {
        if (attack.left) {
            var _damage = createEffect(EFFECT_DAMAGE, {
                sfx: 'sfx/hit.mp3'
            });
            _damage.left = attack.left + attack.vx + (attack.width - _damage.width) / 2;
            _damage.top = attack.top + attack.vy + (attack.height - _damage.height) / 2;
            updatedState = addEffectToState(updatedState, _damage);
        }
    }
    if (attack.type && attacks[attack.type].hitSfx) {
        updatedState = _extends({}, updatedState, { sfx: [].concat(_toConsumableArray(updatedState.sfx), [attacks[attack.type].hitSfx]) });
    }
    return updatedState;
};

var renderEnemy = function renderEnemy(context, enemy) {
    var animation = enemyData[enemy.type].animation;
    if (enemy.dead) {
        animation = enemyData[enemy.type].deathAnimation || animation;
    } else if (enemy.attackCooldownFramesLeft > 0) {
        animation = enemyData[enemy.type].attackAnimation || animation;
    }
    var frame = getFrame(animation, enemy.animationTime);
    context.save();
    if (enemy.dead) {
        context.globalAlpha = .6;
    }
    if (enemy.vx > 0 && !enemy.doNotFlip) {
        var hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
        // This moves the origin to where we want the center of the enemies hitBox to be.
        context.save();
        context.translate(enemy.left + hitBox.left + hitBox.width / 2, enemy.top + hitBox.top + hitBox.height / 2);
        context.scale(-1, 1);
        // This draws the image frame so that the center is exactly at the origin.
        var target = new Rectangle(enemy).moveTo(-(hitBox.left + hitBox.width / 2), -(hitBox.top + hitBox.height / 2));
        drawImage(context, frame.image, frame, target);
        context.restore();
    } else {
        drawImage(context, frame.image, frame, enemy);
    }
    // context.translate(x, y - hitBox.height * yScale / 2);
    // if (rotation) context.rotate(rotation * Math.PI/180);
    // if (xScale !== 1 || yScale !== 1) context.scale(xScale, yScale);

    if (isKeyDown(KEY_SHIFT)) {
        var _hitBox = getEnemyHitBox(enemy);
        context.globalAlpha = .6;
        context.fillStyle = 'red';
        context.fillRect(_hitBox.left, _hitBox.top, _hitBox.width, _hitBox.height);
    }
    context.restore();
};

var advanceEnemy = function advanceEnemy(state, enemyIndex) {
    var enemy = state.enemies[enemyIndex];
    // This is kind of a hack to support fall damage being applied to newly created enemies.
    if (enemy.pendingDamage) {
        state = damageEnemy(state, enemyIndex, { playerIndex: 0, damage: enemy.pendingDamage });
        enemy = state.enemies[enemyIndex];
    }
    var animation = enemyData[enemy.type].animation;
    if (enemy.dead && enemyData[enemy.type].deathAnimation) {
        animation = enemyData[enemy.type].deathAnimation;
    }
    var frame = getFrame(animation, enemy.animationTime);
    var hitBox = frame || frame.hitBox;

    // Grounded enemies should move relative to the ground.
    if (enemy.grounded) {
        state = updateEnemy(state, enemyIndex, {
            left: enemy.left - state.world.nearground.xFactor * state.world.vx
        });
        enemy = state.enemies[enemyIndex];
    }

    var _enemy = enemy,
        left = _enemy.left,
        top = _enemy.top,
        animationTime = _enemy.animationTime;

    left += enemy.vx;
    top += enemy.vy;
    if (!enemy.dead) {
        top = Math.min(top, getGroundHeight(state) - (hitBox.top + hitBox.height));
    }
    animationTime += FRAME_LENGTH;
    state = updateEnemy(state, enemyIndex, { left: left, top: top, animationTime: animationTime });

    enemy = state.enemies[enemyIndex];
    if (enemy.dead || enemy.grounded) {
        // Flying enemies fall when they are dead, grounded enemies always fall unless they are on the ground.
        var touchingGround = enemy.top + hitBox.top + hitBox.height >= getGroundHeight(state);
        state = updateEnemy(state, enemyIndex, {
            vy: !touchingGround || !enemy.grounded ? enemy.vy + 1 : 0,
            // Dead bodies shouldn't slide along the ground
            vx: touchingGround && enemy.dead ? enemy.vx * .5 : enemy.vx
        });
        enemy = state.enemies[enemyIndex];
        if (!enemy.grounded) {
            var onHitGroundEffect = enemyData[enemy.type].onHitGroundEffect;
            if (onHitGroundEffect) {
                if (enemy.top + hitBox.top + hitBox.height > getGroundHeight(state)) {
                    state = onHitGroundEffect(state, enemyIndex);
                    enemy = state.enemies[enemyIndex];

                    // Add a dust cloud to signify something happened when the enemy hit the ground.
                    var dust = createEffect(EFFECT_DUST, {
                        sfx: 'sfx/hit.mp3'
                    });
                    dust.left = enemy.left + (enemy.width - dust.width) / 2;
                    // Add dust at the bottom of the enemy frame.
                    dust.top = Math.min(enemy.top + hitBox.top + hitBox.height, getGroundHeight(state)) - dust.height;
                    state = addEffectToState(state, dust);
                    enemy = state.enemies[enemyIndex];
                }
            }
        }
    }
    if (!enemy.dead && enemyData[enemy.type].accelerate) {
        state = updateEnemy(state, enemyIndex, enemyData[enemy.type].accelerate(state, enemy));
    }
    var _enemy2 = enemy,
        ttl = _enemy2.ttl,
        done = _enemy2.done,
        attackCooldownFramesLeft = _enemy2.attackCooldownFramesLeft;

    if (attackCooldownFramesLeft) {
        attackCooldownFramesLeft--;
    }
    if (ttl) {
        // Enemies that we need to cleanup before they hit the edge of the screen can be marked
        // with a TTL in milliseconds.
        ttl -= FRAME_LENGTH;
        if (ttl <= 0) {
            done = true;
        }
    } else if (!done) {
        // cleanup dead enemies or non permanent enemies when they go off the edge of the screen.
        done = (enemy.dead || !enemy.permanent) && (enemy.left + enemy.width < -OFFSCREEN_PADDING || enemy.vx > 0 && enemy.left > WIDTH + OFFSCREEN_PADDING || enemy.top + enemy.height < -OFFSCREEN_PADDING || enemy.top > GAME_HEIGHT + OFFSCREEN_PADDING);
        if (done && !enemy.dead) {
            var comboScore = Math.max(0, state.players[0].comboScore - 50);
            state = updatePlayer(state, 0, { comboScore: comboScore });
        }
    }
    return updateEnemy(state, enemyIndex, { done: done, ttl: ttl, attackCooldownFramesLeft: attackCooldownFramesLeft, pendingDamage: 0 });
};

module.exports = {
    enemyData: enemyData,
    createEnemy: createEnemy,
    addEnemyToState: addEnemyToState,
    damageEnemy: damageEnemy,
    advanceEnemy: advanceEnemy,
    renderEnemy: renderEnemy,
    getEnemyHitBox: getEnemyHitBox
};

// Move possible circular imports to after exports.

var _require5 = require('sprites'),
    getNewSpriteState = _require5.getNewSpriteState;

var _require6 = require('world'),
    getGroundHeight = _require6.getGroundHeight;

var _require7 = require('effects'),
    createEffect = _require7.createEffect,
    addEffectToState = _require7.addEffectToState;

var _require8 = require('attacks'),
    attacks = _require8.attacks,
    createAttack = _require8.createAttack,
    addEnemyAttackToState = _require8.addEnemyAttackToState,
    addPlayerAttackToState = _require8.addPlayerAttackToState,
    addNeutralAttackToState = _require8.addNeutralAttackToState;

var _require9 = require('loot'),
    createLoot = _require9.createLoot,
    getRandomPowerupType = _require9.getRandomPowerupType,
    getAdaptivePowerupType = _require9.getAdaptivePowerupType,
    gainPoints = _require9.gainPoints;

var _require10 = require('heroes'),
    updatePlayer = _require10.updatePlayer;

},{"Rectangle":1,"animations":2,"attacks":3,"draw":5,"effects":6,"gameConstants":8,"heroes":9,"keyboard":10,"loot":11,"sprites":15,"world":17}],8:[function(require,module,exports){
'use strict';

module.exports = {
    WIDTH: 800, HEIGHT: 600, GAME_HEIGHT: 564, HUD_HEIGHT: 36,
    FRAME_LENGTH: 20, OFFSCREEN_PADDING: 40,
    ACCELERATION: 1, SHOT_COOLDOWN: 8, ATTACK_OFFSET: -4,
    ENEMY_COOLDOWN: 10, DEATH_COOLDOWN: 1000, SPAWN_COOLDOWN: 1000, SPAWN_INV_TIME: 2000,
    POINTS_FOR_POWERUP: 1000,

    HERO_BEE: 'bee', HERO_DRAGONFLY: 'dragonfly', HERO_MOTH: 'moth',

    ENEMY_FLY: 'fly',
    ENEMY_HORNET: 'hornet',
    ENEMY_HORNET_SOLDIER: 'hornetSoldier',
    ENEMY_FLYING_ANT: 'flyingAnt',
    ENEMY_FLYING_ANT_SOLDIER: 'flyingAntSoldier',
    ENEMY_MONK: 'monk',
    ENEMY_CARGO_BEETLE: 'cargoBeetle',
    ENEMY_EXPLOSIVE_BEETLE: 'explosiveBeetle',
    ENEMY_LOCUST: 'locust',
    ENEMY_LOCUST_SOLDIER: 'locustSoldier',

    ATTACK_BLAST: 'blast', ATTACK_SLASH: 'slash', ATTACK_STAB: 'stab', ATTACK_BULLET: 'bullet', ATTACK_ORB: 'orb',
    ATTACK_DEFEATED_ENEMY: 'defeatedEnemy', ATTACK_EXPLOSION: 'explosion',

    EFFECT_DAMAGE: 'damage', EFFECT_EXPLOSION: 'explosion', EFFECT_DUST: 'dust',
    EFFECT_DEAD_BEE: 'deadBee', EFFECT_SWITCH_BEE: 'switchBee',
    EFFECT_DEAD_DRAGONFLY: 'deadDragonfly', EFFECT_SWITCH_DRAGONFLY: 'switchDragonfly',
    EFFECT_DEAD_MOTH: 'deadMoth', EFFECT_SWITCH_MOTH: 'switchMoth',
    EFFECT_NEEDLE_FLIP: 'needleFlip',
    EFFECT_RATE_UP: 'rateUp', EFFECT_SIZE_UP: 'sizeUp', EFFECT_SPEED_UP: 'speedUp',
    EFFECT_DEFLECT_BULLET: 'deflect',
    LOOT_COIN: 'coin',
    LOOT_LIFE: 'life',
    LOOT_LADYBUG: 'ladybug',
    LOOT_SPEED: 'speed',
    LOOT_ATTACK_POWER: 'power',
    LOOT_ATTACK_SPEED: 'attackSpeed',
    LOOT_TRIPLE_SPEED: 'tripleSpeed',
    LOOT_TRIPLE_POWER: 'triplePower',
    LOOT_TRIPLE_RATE: 'tripleRate',
    LOOT_COMBO: 'combo',
    LOOT_TRIPLE_COMBO: 'tripleCombo'
};

},{}],9:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _heroesData;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN,
    SHOT_COOLDOWN = _require.SHOT_COOLDOWN,
    ATTACK_OFFSET = _require.ATTACK_OFFSET,
    SPAWN_INV_TIME = _require.SPAWN_INV_TIME,
    ACCELERATION = _require.ACCELERATION,
    ATTACK_BLAST = _require.ATTACK_BLAST,
    ATTACK_ORB = _require.ATTACK_ORB,
    ATTACK_SLASH = _require.ATTACK_SLASH,
    ATTACK_STAB = _require.ATTACK_STAB,
    EFFECT_EXPLOSION = _require.EFFECT_EXPLOSION,
    EFFECT_DEAD_BEE = _require.EFFECT_DEAD_BEE,
    EFFECT_SWITCH_BEE = _require.EFFECT_SWITCH_BEE,
    EFFECT_DEAD_DRAGONFLY = _require.EFFECT_DEAD_DRAGONFLY,
    EFFECT_SWITCH_DRAGONFLY = _require.EFFECT_SWITCH_DRAGONFLY,
    EFFECT_DEAD_MOTH = _require.EFFECT_DEAD_MOTH,
    EFFECT_SWITCH_MOTH = _require.EFFECT_SWITCH_MOTH,
    EFFECT_NEEDLE_FLIP = _require.EFFECT_NEEDLE_FLIP,
    HERO_BEE = _require.HERO_BEE,
    HERO_DRAGONFLY = _require.HERO_DRAGONFLY,
    HERO_MOTH = _require.HERO_MOTH,
    LOOT_SPEED = _require.LOOT_SPEED,
    LOOT_ATTACK_POWER = _require.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED = _require.LOOT_TRIPLE_SPEED,
    LOOT_TRIPLE_POWER = _require.LOOT_TRIPLE_POWER,
    LOOT_TRIPLE_RATE = _require.LOOT_TRIPLE_RATE,
    LOOT_COMBO = _require.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require.LOOT_TRIPLE_COMBO;

var _require2 = require('keyboard'),
    isKeyDown = _require2.isKeyDown,
    KEY_SHIFT = _require2.KEY_SHIFT;

var Rectangle = require('Rectangle');

var _require3 = require('draw'),
    drawImage = _require3.drawImage;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var _require5 = require('animations'),
    beeAnimation = _require5.beeAnimation,
    beeEnterAnimation = _require5.beeEnterAnimation,
    beeCatchAnimation = _require5.beeCatchAnimation,
    beeMeleeAnimation = _require5.beeMeleeAnimation,
    beePortraitAnimation = _require5.beePortraitAnimation,
    dragonflyAnimation = _require5.dragonflyAnimation,
    dragonflyEnterAnimation = _require5.dragonflyEnterAnimation,
    dragonflyCatchAnimation = _require5.dragonflyCatchAnimation,
    dragonflyMeleeAnimation = _require5.dragonflyMeleeAnimation,
    dragonflyPortraitAnimation = _require5.dragonflyPortraitAnimation,
    dragonflyIdleAnimation = _require5.dragonflyIdleAnimation,
    mothAnimation = _require5.mothAnimation,
    mothEnterAnimation = _require5.mothEnterAnimation,
    mothCatchAnimation = _require5.mothCatchAnimation,
    mothMeleeAnimation = _require5.mothMeleeAnimation,
    mothPortraitAnimation = _require5.mothPortraitAnimation,
    ladybugAnimation = _require5.ladybugAnimation,
    getHitBox = _require5.getHitBox,
    getFrame = _require5.getFrame;

var heroesData = (_heroesData = {}, _defineProperty(_heroesData, HERO_BEE, {
    animation: beeAnimation,
    enterAnimation: beeEnterAnimation,
    catchAnimation: beeCatchAnimation,
    meleeAnimation: beeMeleeAnimation,
    meleeAttack: ATTACK_STAB,
    deathEffect: EFFECT_DEAD_BEE,
    deathSfx: 'sfx/exclamation.mp3',
    switchEffect: EFFECT_SWITCH_BEE,
    portraitAnimation: beePortraitAnimation,
    baseSpeed: 7,
    meleePower: 2,
    meleeScaling: 0.25
}), _defineProperty(_heroesData, HERO_DRAGONFLY, {
    animation: dragonflyAnimation,
    enterAnimation: dragonflyEnterAnimation,
    catchAnimation: dragonflyCatchAnimation,
    meleeAnimation: dragonflyMeleeAnimation,
    idleAnimation: dragonflyIdleAnimation,
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_DRAGONFLY,
    deathSfx: 'sfx/exclamation3.mp3',
    switchEffect: EFFECT_SWITCH_DRAGONFLY,
    portraitAnimation: dragonflyPortraitAnimation,
    baseSpeed: 8,
    meleePower: 1,
    meleeScaling: 0.25
}), _defineProperty(_heroesData, HERO_MOTH, {
    animation: mothAnimation,
    enterAnimation: mothEnterAnimation,
    catchAnimation: mothCatchAnimation,
    meleeAnimation: mothMeleeAnimation,
    meleeAttack: ATTACK_SLASH,
    deathEffect: EFFECT_DEAD_MOTH,
    deathSfx: 'sfx/exclamation2.mp3',
    switchEffect: EFFECT_SWITCH_MOTH,
    portraitAnimation: mothPortraitAnimation,
    baseSpeed: 6,
    meleePower: 1,
    meleeScaling: 0.5
}), _heroesData);

var getNewPlayerState = function getNewPlayerState() {
    return {
        score: 0,
        powerupPoints: 0,
        powerupIndex: 0,
        comboScore: 0,
        sprite: getNewSpriteState(_extends({}, dragonflyAnimation.frames[0], {
            left: 160, top: 377,
            targetLeft: 170, targetTop: 200,
            spawnSpeed: 7
        })),
        heroes: [HERO_DRAGONFLY, HERO_BEE, HERO_MOTH],
        missingHeroes: [],
        invulnerableFor: 0,
        spawning: true,
        shotCooldown: 0,
        ladybugShotCooldown: 0,
        powerups: [],
        ladybugs: [],
        actions: {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            start: false
        }
    };
};

var updatePlayer = function updatePlayer(state, playerIndex, props) {
    var players = [].concat(_toConsumableArray(state.players));
    players[playerIndex] = _extends({}, players[playerIndex], props);
    return _extends({}, state, { players: players });
};

var advanceHero = function advanceHero(state, playerIndex) {
    if (state.players[playerIndex].done) {
        return state;
    }
    var player = state.players[playerIndex];
    var _player = player,
        meleeAttackTime = _player.meleeAttackTime,
        meleeCooldown = _player.meleeCooldown,
        shotCooldown = _player.shotCooldown,
        invulnerableFor = _player.invulnerableFor,
        ladybugShotCooldown = _player.ladybugShotCooldown;

    var heroData = heroesData[player.heroes[0]];
    if (meleeCooldown > 0) {
        meleeCooldown--;
    } else if (player.actions.melee) {
        meleeCooldown = 3 * SHOT_COOLDOWN - player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO;
        }).length;
        var powers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO;
        }).length;
        var triplePowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var scale = 1 + heroData.meleeScaling * (powers + triplePowers / 2);
        var meleeAttack = createAttack(heroData.meleeAttack, {
            damage: heroData.meleePower + triplePowers,
            top: player.sprite.top + player.sprite.vy + player.sprite.height / 2,
            left: player.sprite.left + player.sprite.vx + player.sprite.width + ATTACK_OFFSET,
            playerIndex: playerIndex
        });
        meleeAttack.width *= scale;
        meleeAttack.height *= scale;
        meleeAttack.top -= meleeAttack.height / 2;
        state = addPlayerAttackToState(state, meleeAttack);
        meleeAttackTime = 0;

        player = state.players[playerIndex];
    } else if (shotCooldown > 0) {
        shotCooldown--;
    } else if (player.actions.shoot) {
        shotCooldown = SHOT_COOLDOWN - player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_SPEED || powerup === LOOT_COMBO;
        }).length;
        var _powers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_ATTACK_POWER || powerup === LOOT_COMBO;
        }).length;
        var _triplePowers = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_POWER || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var tripleRates = player.powerups.filter(function (powerup) {
            return powerup === LOOT_TRIPLE_RATE || powerup === LOOT_TRIPLE_COMBO;
        }).length;
        var middleShot = { x: ATTACK_OFFSET, y: 0, vx: 20, vy: 0 };
        var upperA = { x: ATTACK_OFFSET, y: -5, vx: 19, vy: -1 },
            lowerA = { x: ATTACK_OFFSET, y: 5, vx: 19, vy: 1 };
        var upperB = { x: ATTACK_OFFSET - 4, y: -10, vx: 18.5, vy: -2 },
            lowerB = { x: ATTACK_OFFSET - 4, y: 10, vx: 18.5, vy: 2 };
        var upperC = { x: ATTACK_OFFSET - 4, y: -15, vx: 17, vy: -4 },
            lowerC = { x: ATTACK_OFFSET - 4, y: 15, vx: 18, vy: 4 };
        var upperD = { x: ATTACK_OFFSET - 10, y: -20, vx: 15, vy: -6 },
            lowerD = { x: ATTACK_OFFSET - 10, y: 20, vx: 15, vy: 6 };
        var upperE = { x: ATTACK_OFFSET - 10, y: -25, vx: 15, vy: -6 },
            lowerE = { x: ATTACK_OFFSET - 10, y: 25, vx: 15, vy: 6 };
        var blastPattern = [[middleShot], [upperA, lowerA], [upperB, middleShot, lowerB], [upperC, upperA, lowerA, lowerC], [upperD, upperB, middleShot, lowerB, lowerD], [upperE, upperC, upperA, lowerA, lowerC, lowerE]][tripleRates];
        var mute = false;
        var _scale = 1 + _powers + _triplePowers / 2;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = blastPattern[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var blastOffsets = _step.value;

                var blast = createAttack(ATTACK_BLAST, {
                    damage: 1 + _triplePowers,
                    left: player.sprite.left + player.sprite.vx + player.sprite.width,
                    /*xOffset: blastOffsets.x,
                    yOffset: blastOffsets.y,
                    vx: 20,*/
                    xOffset: ATTACK_OFFSET,
                    yOffset: 0,
                    vx: blastOffsets.vx,
                    vy: blastOffsets.vy,
                    delay: 2,
                    playerIndex: playerIndex
                });
                blast.width *= _scale;
                blast.height *= _scale;
                blast.top = player.sprite.top + player.sprite.vy + Math.round((player.sprite.height - blast.height) / 2);
                // Only play 1 attack sound per frame.
                if (mute) delete blast.sfx;
                state = addPlayerAttackToState(state, blast);
                mute = true;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        player = state.players[playerIndex];
    }

    if (ladybugShotCooldown > 0) {
        ladybugShotCooldown--;
    } else if (player.actions.shoot && player.ladybugs.length) {
        ladybugShotCooldown = SHOT_COOLDOWN * 1.5;
        for (var i = 0; i < player.ladybugs.length; i++) {
            var ladybug = player.ladybugs[i];
            var orb = createAttack(ATTACK_ORB, {
                damage: 1,
                left: ladybug.left + player.sprite.vx + ladybug.width + ATTACK_OFFSET,
                vx: 15,
                playerIndex: playerIndex
            });
            orb.top = ladybug.top + player.sprite.vy + Math.round((ladybug.height - orb.height) / 2) + 6;
            state = addPlayerAttackToState(state, orb);

            player = state.players[playerIndex];
        }
    }

    var _player$sprite = player.sprite,
        top = _player$sprite.top,
        left = _player$sprite.left,
        vx = _player$sprite.vx,
        vy = _player$sprite.vy,
        width = _player$sprite.width,
        height = _player$sprite.height,
        animationTime = _player$sprite.animationTime,
        targetLeft = _player$sprite.targetLeft,
        targetTop = _player$sprite.targetTop;

    animationTime += FRAME_LENGTH;
    if (invulnerableFor > 0) {
        invulnerableFor -= FRAME_LENGTH;
    }
    if (targetLeft != false) {
        var theta = Math.atan2(targetTop - top, targetLeft - left);
        left = Math.min(left + player.sprite.spawnSpeed * Math.cos(theta), targetLeft);
        top = Math.max(top + player.sprite.spawnSpeed * Math.sin(theta), targetTop);
        if (left === targetLeft && top === targetTop) {
            targetLeft = targetTop = false;
        }
        return updatePlayer(state, playerIndex, {
            ladybugShotCooldown: 1, invulnerableFor: invulnerableFor, spawning: true,
            shotCooldown: 1, meleeCooldown: 1,
            sprite: _extends({}, player.sprite, { left: left, top: top, animationTime: animationTime, targetLeft: targetLeft, targetTop: targetTop })
        });
    }
    if (player.actions.switch) {
        return switchHeroes(state, playerIndex);
    }
    var speedPowerups = player.powerups.filter(function (powerup) {
        return powerup === LOOT_SPEED || powerup === LOOT_COMBO;
    }).length;
    var tripleSpeedPowerups = player.powerups.filter(function (powerup) {
        return powerup === LOOT_TRIPLE_SPEED || powerup === LOOT_TRIPLE_COMBO;
    }).length;
    var maxSpeed = heroData.baseSpeed + tripleSpeedPowerups * 2;
    var accleration = ACCELERATION + speedPowerups + tripleSpeedPowerups;
    // Accelerate player based on their input.
    if (player.actions.up) vy -= accleration;
    if (player.actions.down) vy += accleration;
    if (player.actions.left) vx -= accleration;
    if (player.actions.right) vx += accleration;
    vy *= .9 - tripleSpeedPowerups * .01;
    vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));
    vx *= .9 - tripleSpeedPowerups * .01;
    vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));

    // Update player position based on their
    left += vx;
    top += vy;
    var hitBox = new Rectangle(getHeroHitBox(player)).translate(-player.sprite.left, -player.sprite.top);
    if (top + hitBox.top < 0) {
        top = -hitBox.top;
        vy = 0;
    }
    var bottom = Math.min(getGroundHeight(state), GAME_HEIGHT);
    if (top + hitBox.top + hitBox.height > bottom) {
        top = bottom - (hitBox.top + hitBox.height);
        vy = 0;
    }
    if (left + hitBox.left < 0) {
        left = -hitBox.left;
        vx = 0;
    }
    if (left + hitBox.left + hitBox.width > WIDTH) {
        left = WIDTH - (hitBox.left + hitBox.width);
        vx = 0;
    }
    var sprite = _extends({}, player.sprite, { left: left, top: top, vx: vx, vy: vy, animationTime: animationTime });
    var ladybugs = updateLadyBugs(player);
    var sfx = state.sfx;
    var chasingNeedle = player.chasingNeedle,
        catchingNeedleFrames = player.catchingNeedleFrames;
    if (chasingNeedle) {
        chasingNeedle = false;
        catchingNeedleFrames = 6;
        sfx.push('sfx/needlegrab.mp3');
    } else if (catchingNeedleFrames > 0) {
        catchingNeedleFrames--;
    }
    if (meleeAttackTime >= 0) {
        meleeAttackTime += FRAME_LENGTH;
        var animation = heroData.meleeAnimation;
        var attackLength = animation.frames.length * animation.frameDuration * FRAME_LENGTH;
        if (meleeAttackTime >= attackLength) {
            meleeAttackTime = undefined;
        }
    }
    var updatedProps = {
        shotCooldown: shotCooldown, meleeCooldown: meleeCooldown, meleeAttackTime: meleeAttackTime,
        ladybugShotCooldown: ladybugShotCooldown, invulnerableFor: invulnerableFor, sprite: sprite,
        ladybugs: ladybugs, chasingNeedle: chasingNeedle, catchingNeedleFrames: catchingNeedleFrames,
        spawning: false
    };
    return updatePlayer(_extends({}, state, { sfx: sfx }), playerIndex, updatedProps);
};

var updateLadyBugs = function updateLadyBugs(player) {
    var sprite = player.sprite;
    var ladybugs = [].concat(_toConsumableArray(player.ladybugs));
    for (var i = 0; i < ladybugs.length; i++) {
        var delta = [[-5, -32], [-5, 32], [52, -16], [52, 16]][i % 4];
        var tx = sprite.left + sprite.width / 2 - ladybugAnimation.frames[0].width / 2 + delta[0];
        var ty = sprite.top + sprite.height / 2 - ladybugAnimation.frames[0].height / 2 + delta[1];
        ladybugs[i] = _extends({}, ladybugs[i], {
            left: (ladybugs[i].left + tx) / 2,
            top: (ladybugs[i].top + ty) / 2,
            animationTime: ladybugs[i].animationTime + FRAME_LENGTH
        });
    }
    return ladybugs;
};

var switchHeroes = function switchHeroes(updatedState, playerIndex) {
    var player = updatedState.players[playerIndex];
    var sprite = player.sprite;

    // Display the dying character as a single animation effect.
    var switchEffect = createEffect(heroesData[player.heroes[0]].switchEffect);
    switchEffect.left = sprite.left + (sprite.width - switchEffect.width) / 2;
    switchEffect.top = sprite.top + (sprite.height - switchEffect.height) / 2;
    updatedState = addEffectToState(updatedState, switchEffect);
    var needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    var heroes = [].concat(_toConsumableArray(player.heroes));
    heroes.push(heroes.shift());
    var targetLeft = sprite.left,
        targetTop = sprite.top;
    var left = -100,
        top = GAME_HEIGHT - 100;
    var dx = left - targetLeft,
        dy = targetTop - top;
    var spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        sprite: _extends({}, sprite, heroesData[player.heroes[0]].animation.frames[0], {
            left: left, top: top, targetLeft: targetLeft, targetTop: targetTop, spawnSpeed: spawnSpeed,
            vx: 0, vy: 0
        }),
        heroes: heroes,
        invulnerableFor: 25 * FRAME_LENGTH,
        spawning: true,
        chasingNeedle: true
    });
    player = updatedState.players[playerIndex];

    var sfx = [].concat(_toConsumableArray(updatedState.sfx), ['sfx/needledropflip.mp3']);
    return _extends({}, updatedState, { sfx: sfx });
};

var damageHero = function damageHero(updatedState, playerIndex) {
    var deathCooldown = updatedState.deathCooldown;
    var player = updatedState.players[playerIndex];
    var sprite = player.sprite;
    var ladybugs = [].concat(_toConsumableArray(player.ladybugs));
    ladybugs.shift();

    // Display the dying character as a single animation effect.
    var deadHeroData = heroesData[player.heroes[0]];
    var deathEffect = createEffect(deadHeroData.deathEffect);
    deathEffect.left = sprite.left + (sprite.width - deathEffect.width) / 2;
    deathEffect.top = sprite.top + (sprite.height - deathEffect.height) / 2;
    updatedState = addEffectToState(updatedState, deathEffect);
    var needleEffect = createEffect(EFFECT_NEEDLE_FLIP);
    needleEffect.left = sprite.left + (sprite.width - needleEffect.width) / 2;
    needleEffect.top = sprite.top + (sprite.height - needleEffect.height) / 2;
    updatedState = addEffectToState(updatedState, needleEffect);

    var heroes = [].concat(_toConsumableArray(player.heroes));
    var missingHeroes = [].concat(_toConsumableArray(player.missingHeroes), [heroes.shift()]);
    var targetLeft = sprite.left,
        targetTop = sprite.top;
    var powerups = [].concat(_toConsumableArray(player.powerups));
    powerups.pop();
    var left = -100,
        top = GAME_HEIGHT - 100;
    var dx = left - targetLeft,
        dy = targetTop - top;
    var spawnSpeed = Math.sqrt(dx * dx + dy * dy) / 25;
    updatedState = updatePlayer(updatedState, playerIndex, {
        sprite: _extends({}, sprite, heroesData[player.heroes[0]].animation.frames[0], {
            left: left, top: top, targetLeft: targetLeft, targetTop: targetTop, spawnSpeed: spawnSpeed,
            vx: 0, vy: 0
        }),
        heroes: heroes,
        missingHeroes: missingHeroes,
        dead: true,
        done: heroes.length <= 0,
        invulnerableFor: SPAWN_INV_TIME,
        spawning: true,
        chasingNeedle: true,
        powerupIndex: 0,
        powerupPoints: 0,
        comboScore: 0,
        powerups: powerups,
        ladybugs: ladybugs
    });
    player = updatedState.players[playerIndex];

    var sfx = [].concat(_toConsumableArray(updatedState.sfx), [deadHeroData.deathSfx]);
    if (player.done) {
        deathCooldown = DEATH_COOLDOWN;
        sfx.push('sfx/death.mp3');
    } else {
        sfx.push('sfx/needledropflip.mp3');
    }
    return _extends({}, updatedState, { deathCooldown: deathCooldown, sfx: sfx });
};

var getHeroHitBox = function getHeroHitBox(player) {
    var _player$sprite2 = player.sprite,
        animationTime = _player$sprite2.animationTime,
        left = _player$sprite2.left,
        top = _player$sprite2.top;

    var animation = heroesData[player.heroes[0]].animation;
    return new Rectangle(getHitBox(animation, animationTime)).translate(left, top);
};

var renderHero = function renderHero(context, player) {
    var sprite = player.sprite,
        invulnerableFor = player.invulnerableFor,
        done = player.done,
        ladybugs = player.ladybugs;

    if (done) return;
    var heroData = heroesData[player.heroes[0]];
    var animation = heroData.animation,
        animationTime = sprite.animationTime;
    if (player.chasingNeedle) {
        animation = heroData.enterAnimation;
    }
    if (player.catchingNeedleFrames > 0) {
        animation = heroData.catchAnimation;
    }
    if (player.meleeAttackTime >= 0) {
        animation = heroData.meleeAnimation;
        animationTime = player.meleeAttackTime;
    }
    context.save();
    if (invulnerableFor > 1000) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 40) * .2;
    } else if (invulnerableFor > 400) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 20) * .2;
    } else if (invulnerableFor > 0) {
        context.globalAlpha = .5 + Math.sin(invulnerableFor / 10) * .2;
    }
    var frame = getFrame(animation, animationTime);
    drawImage(context, frame.image, frame, sprite);
    context.restore();
    if (isKeyDown(KEY_SHIFT)) {
        var hitBox = getHeroHitBox(player);
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'green';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
        context.restore();
    }
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = ladybugs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var ladybug = _step2.value;

            renderLadybug(context, ladybug);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }
};

var renderLadybug = function renderLadybug(context, ladybug) {
    var frame = getFrame(ladybugAnimation, ladybug.animationTime);
    drawImage(context, frame.image, frame, ladybug);
};

module.exports = {
    getNewPlayerState: getNewPlayerState,
    advanceHero: advanceHero,
    getHeroHitBox: getHeroHitBox,
    damageHero: damageHero,
    renderHero: renderHero,
    heroesData: heroesData,
    updatePlayer: updatePlayer
};

var _require6 = require('world'),
    getGroundHeight = _require6.getGroundHeight;

var _require7 = require('attacks'),
    createAttack = _require7.createAttack,
    addPlayerAttackToState = _require7.addPlayerAttackToState;

var _require8 = require('effects'),
    createEffect = _require8.createEffect,
    addEffectToState = _require8.addEffectToState;

},{"Rectangle":1,"animations":2,"attacks":3,"draw":5,"effects":6,"gameConstants":8,"keyboard":10,"sprites":15,"world":17}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _KEY_MAPPINGS, _GAME_PAD_MAPPINGS;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var KEY_LEFT = exports.KEY_LEFT = 37;
var KEY_RIGHT = exports.KEY_RIGHT = 39;
var KEY_UP = exports.KEY_UP = 38;
var KEY_DOWN = exports.KEY_DOWN = 40;
var KEY_SPACE = exports.KEY_SPACE = 32;
var KEY_SHIFT = exports.KEY_SHIFT = 16;
var KEY_ENTER = exports.KEY_ENTER = 13;
var KEY_BACK_SPACE = exports.KEY_BACK_SPACE = 8;
var KEY_E = exports.KEY_E = 'E'.charCodeAt(0);
var KEY_G = exports.KEY_G = 'G'.charCodeAt(0);
var KEY_R = exports.KEY_R = 'R'.charCodeAt(0);
var KEY_X = exports.KEY_X = 'X'.charCodeAt(0);
var KEY_C = exports.KEY_C = 'C'.charCodeAt(0);

var KEY_MAPPINGS = (_KEY_MAPPINGS = {}, _defineProperty(_KEY_MAPPINGS, 'A'.charCodeAt(0), KEY_LEFT), _defineProperty(_KEY_MAPPINGS, 'D'.charCodeAt(0), KEY_RIGHT), _defineProperty(_KEY_MAPPINGS, 'W'.charCodeAt(0), KEY_UP), _defineProperty(_KEY_MAPPINGS, 'S'.charCodeAt(0), KEY_DOWN), _KEY_MAPPINGS);

// This mapping assumes a canonical gamepad setup as seen in:
// https://w3c.github.io/gamepad/#remapping
// Which seems to work well with my xbox 360 controller.
// I based this code on examples from:
// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
// Easy to find mappings at: http://html5gamepad.com/
var GAME_PAD_MAPPINGS = (_GAME_PAD_MAPPINGS = {}, _defineProperty(_GAME_PAD_MAPPINGS, KEY_C, 0), _defineProperty(_GAME_PAD_MAPPINGS, KEY_SPACE, 2), _defineProperty(_GAME_PAD_MAPPINGS, KEY_X, 3), _defineProperty(_GAME_PAD_MAPPINGS, KEY_ENTER, 9), _defineProperty(_GAME_PAD_MAPPINGS, KEY_UP, 12), _defineProperty(_GAME_PAD_MAPPINGS, KEY_DOWN, 13), _defineProperty(_GAME_PAD_MAPPINGS, KEY_LEFT, 14), _defineProperty(_GAME_PAD_MAPPINGS, KEY_RIGHT, 15), _defineProperty(_GAME_PAD_MAPPINGS, KEY_R, 4), _defineProperty(_GAME_PAD_MAPPINGS, KEY_SHIFT, 5), _GAME_PAD_MAPPINGS);

var physicalKeysDown = {};
var keysDown = {};

// Apparently, depending on the button type, either button.pressed or button == 1.0 indicates the button is pressed.
function buttonIsPressed(button) {
    if ((typeof button === 'undefined' ? 'undefined' : _typeof(button)) == "object") return button.pressed;
    return button == 1.0;
}

window.document.onkeydown = function (event) {
    //console.log(event);
    // Don't process this if the key is already down.
    if (physicalKeysDown[event.which]) return;
    physicalKeysDown[event.which] = true;
    var mappedKeyCode = KEY_MAPPINGS[event.which] || event.which;
    keysDown[mappedKeyCode] = (keysDown[mappedKeyCode] || 0) + 1;
    //console.log(keysDown[mappedKeyCode]);
};

window.document.onkeyup = function (event) {
    physicalKeysDown[event.which] = false;
    var mappedKeyCode = KEY_MAPPINGS[event.which] || event.which;
    keysDown[mappedKeyCode] = Math.max(0, (keysDown[mappedKeyCode] || 0) - 1);
    //console.log(keysDown[mappedKeyCode]);
};

var lastButtonsPressed = {};
// Release can be set to true to pretend the key is released after reading it.
// This only works for keyboard keys.
var isKeyDown = exports.isKeyDown = function isKeyDown(keyCode) {
    var release = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (keysDown[keyCode]) {
        if (release) {
            keysDown[keyCode] = 0;
        }
        return true;
    }
    // If a mapping exists for the current key code to a gamepad button,
    // check if that gamepad button is pressed.
    var buttonIndex = GAME_PAD_MAPPINGS[keyCode];
    if (typeof buttonIndex !== 'undefined') {
        // There can be multiple game pads connected. For now, let's just check all of them for the button.
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = gamepads[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var gamepad = _step.value;

                if (!gamepad) continue;
                if (buttonIsPressed(gamepad.buttons[buttonIndex])) {
                    var wasPressed = lastButtonsPressed[buttonIndex];
                    lastButtonsPressed[buttonIndex] = true;
                    if (!release || !wasPressed) return true;
                } else {
                    lastButtonsPressed[buttonIndex] = false;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return false;
};

},{}],11:[function(require,module,exports){
'use strict';

var _lootData;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('draw'),
    drawImage = _require.drawImage,
    drawTintedImage = _require.drawTintedImage;

var Rectangle = require('Rectangle');

var _require2 = require('gameConstants'),
    FRAME_LENGTH = _require2.FRAME_LENGTH,
    WIDTH = _require2.WIDTH,
    GAME_HEIGHT = _require2.GAME_HEIGHT,
    OFFSCREEN_PADDING = _require2.OFFSCREEN_PADDING,
    POINTS_FOR_POWERUP = _require2.POINTS_FOR_POWERUP,
    LOOT_COIN = _require2.LOOT_COIN,
    LOOT_LIFE = _require2.LOOT_LIFE,
    LOOT_LADYBUG = _require2.LOOT_LADYBUG,
    LOOT_SPEED = _require2.LOOT_SPEED,
    LOOT_ATTACK_POWER = _require2.LOOT_ATTACK_POWER,
    LOOT_ATTACK_SPEED = _require2.LOOT_ATTACK_SPEED,
    LOOT_TRIPLE_SPEED = _require2.LOOT_TRIPLE_SPEED,
    LOOT_TRIPLE_POWER = _require2.LOOT_TRIPLE_POWER,
    LOOT_TRIPLE_RATE = _require2.LOOT_TRIPLE_RATE,
    LOOT_COMBO = _require2.LOOT_COMBO,
    LOOT_TRIPLE_COMBO = _require2.LOOT_TRIPLE_COMBO,
    EFFECT_RATE_UP = _require2.EFFECT_RATE_UP,
    EFFECT_SIZE_UP = _require2.EFFECT_SIZE_UP,
    EFFECT_SPEED_UP = _require2.EFFECT_SPEED_UP,
    HERO_DRAGONFLY = _require2.HERO_DRAGONFLY,
    ENEMY_CARGO_BEETLE = _require2.ENEMY_CARGO_BEETLE;

var _require3 = require('animations'),
    getFrame = _require3.getFrame,
    coinAnimation = _require3.coinAnimation,
    powerupDiamondAnimation = _require3.powerupDiamondAnimation,
    powerupTriangleAnimation = _require3.powerupTriangleAnimation,
    powerupSquareAnimation = _require3.powerupSquareAnimation,
    powerupTripleDiamondAnimation = _require3.powerupTripleDiamondAnimation,
    powerupTripleSquareAnimation = _require3.powerupTripleSquareAnimation,
    powerupTripleTriangleAnimation = _require3.powerupTripleTriangleAnimation,
    powerupComboAnimation = _require3.powerupComboAnimation,
    powerupTripleComboAnimation = _require3.powerupTripleComboAnimation,
    powerupLadybugAnimation = _require3.powerupLadybugAnimation,
    ladybugAnimation = _require3.ladybugAnimation,
    beePortraitAnimation = _require3.beePortraitAnimation;

var _require4 = require('sounds'),
    playSound = _require4.playSound;

var _require5 = require('sprites'),
    getNewSpriteState = _require5.getNewSpriteState;

var circleAcceleration = function circleAcceleration(state, loot) {
    var vx = loot.vx,
        vy = loot.vy,
        seed = loot.seed;

    var theta = loot.animationTime / 300;
    var radius = loot.radius || 2;
    vx = radius * Math.cos(theta);
    vy = radius * Math.sin(theta);
    return _extends({}, loot, { vx: vx, vy: vy });
};

var drawNormal = function drawNormal(context, state, loot) {
    var frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawImage(context, frame.image, frame, loot);
};
var drawGlowing = function drawGlowing(context, state, loot) {
    var frame = getFrame(lootData[loot.type].animation, loot.animationTime);
    drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
};
var getCombinedType = function getCombinedType(powerups) {
    if (powerups.length < 3) return null;
    var typeA = powerups[powerups.length - 1],
        typeB = powerups[powerups.length - 2],
        typeC = powerups[powerups.length - 3];
    if (typeA === LOOT_ATTACK_POWER && typeB === LOOT_ATTACK_POWER && typeC === LOOT_ATTACK_POWER) {
        return LOOT_TRIPLE_POWER;
    }
    if (typeA === LOOT_ATTACK_SPEED && typeB === LOOT_ATTACK_SPEED && typeC === LOOT_ATTACK_SPEED) {
        return LOOT_TRIPLE_RATE;
    }
    if (typeA === LOOT_SPEED && typeB === LOOT_SPEED && typeC === LOOT_SPEED) {
        return LOOT_TRIPLE_SPEED;
    }
    if (typeA === LOOT_COMBO && typeB === LOOT_COMBO && typeC === LOOT_COMBO) {
        return LOOT_TRIPLE_COMBO;
    }
    var comboArray = [typeA, typeB, typeC];
    if (comboArray.includes(LOOT_ATTACK_SPEED) && comboArray.includes(LOOT_ATTACK_POWER) && comboArray.includes(LOOT_SPEED)) {
        return LOOT_COMBO;
    }
    if (comboArray.includes(LOOT_TRIPLE_RATE) && comboArray.includes(LOOT_TRIPLE_POWER) && comboArray.includes(LOOT_TRIPLE_SPEED)) {
        return LOOT_TRIPLE_COMBO;
    }
    return null;
};

var powerupLoot = function powerupLoot(type, animation, effectType) {
    return {
        animation: animation,
        // accelerate: circleAcceleration,
        collect: function collect(state, playerIndex, loot) {
            var powerups = [].concat(_toConsumableArray(state.players[playerIndex].powerups), [type]);
            if (powerups.length > 5) powerups.shift();
            var comboType = getCombinedType(powerups);
            if (comboType) {
                powerups.pop();
                powerups.pop();
                powerups.pop();
                powerups.push(comboType);
                // The combo can combine again for the triple combo powerup.
                comboType = getCombinedType(powerups);
                if (comboType) {
                    powerups.pop();
                    powerups.pop();
                    powerups.pop();
                    powerups.push(comboType);
                }
            }
            if (effectType) {
                var powerupText = createEffect(effectType);
                powerupText.left = loot.left + (loot.width - powerupText.width) / 2;
                powerupText.top = loot.top + (loot.height - powerupText.height) / 2;
                state = addEffectToState(state, powerupText);
            }
            return updatePlayer(state, playerIndex, { powerups: powerups });
        },
        draw: function draw(context, state, loot) {
            if (getCombinedType([].concat(_toConsumableArray(state.players[0].powerups), [type]))) {
                drawGlowing(context, state, loot);
            } else {
                drawNormal(context, state, loot);
            }
        },

        // draw: drawGlowing,
        sfx: 'sfx/powerup.mp3',
        scale: 1,
        props: {}
    };
};

var triplePowerupLoot = function triplePowerupLoot(type, animation) {
    return {
        animation: animation,
        // accelerate: circleAcceleration,
        collect: function collect(state, playerIndex, loot) {
            var powerups = [].concat(_toConsumableArray(state.players[playerIndex].powerups), [type]);
            if (powerups.length > 5) powerups.shift();
            return updatePlayer(state, playerIndex, { powerups: powerups });
        },

        sfx: 'sfx/powerup.mp3',
        scale: 1,
        props: {}
    };
};

var getNewLadyBug = function getNewLadyBug(playerSprite) {
    return getNewSpriteState(_extends({}, ladybugAnimation.frames[0], {
        left: playerSprite.left + playerSprite.width / 2 - ladybugAnimation.frames[0].width / 2,
        top: playerSprite.top + playerSprite.height / 2 - ladybugAnimation.frames[0].height / 2
    }));
};

var lootData = (_lootData = {}, _defineProperty(_lootData, LOOT_COIN, {
    animation: coinAnimation,
    collect: function collect(state, playerIndex, loot) {
        var comboScore = Math.min(1000, state.players[playerIndex].comboScore + 20);
        state = updatePlayer(state, playerIndex, { comboScore: comboScore });
        return gainPoints(state, playerIndex, 50);
    },

    sfx: 'sfx/coin.mp3',
    scale: 2
}), _defineProperty(_lootData, LOOT_LIFE, {
    animation: beePortraitAnimation, // This is just used for sizing purposes.
    accelerate: circleAcceleration,
    collect: function collect(state, playerIndex, loot) {
        var heroes = [].concat(_toConsumableArray(state.players[playerIndex].heroes));
        var missingHeroes = [].concat(_toConsumableArray(state.players[playerIndex].missingHeroes));
        if (missingHeroes.length) {
            heroes.push(missingHeroes.shift());
        } else {
            // extra life life loots become coins if the players have max lives.
            return gainPoints(state, playerIndex, 500);
        }
        return updatePlayer(state, playerIndex, { heroes: heroes, missingHeroes: missingHeroes });
    },
    draw: function draw(context, state, loot) {
        // extra life life loots become coins if the players have max lives.
        var animation = coinAnimation;
        if (state.players[0].missingHeroes.length) {
            animation = heroesData[state.players[0].missingHeroes[0]].portraitAnimation;
        }
        var frame = getFrame(animation, loot.animationTime);
        drawTintedImage(context, frame.image, 'white', .5 + .5 * Math.cos(loot.animationTime / 50), frame, loot);
    },

    sfx: 'sfx/heal.mp3',
    scale: 1
}), _defineProperty(_lootData, LOOT_LADYBUG, {
    animation: powerupLadybugAnimation,
    accelerate: circleAcceleration,
    collect: function collect(state, playerIndex, loot) {
        var ladybugs = [].concat(_toConsumableArray(state.players[playerIndex].ladybugs), [getNewLadyBug(state.players[playerIndex].sprite)]);
        if (ladybugs.length > 3) ladybugs.shift();
        return updatePlayer(state, playerIndex, { ladybugs: ladybugs });
    },

    draw: drawGlowing,
    sfx: 'sfx/powerup.mp3',
    scale: 1
}), _defineProperty(_lootData, LOOT_ATTACK_POWER, powerupLoot(LOOT_ATTACK_POWER, powerupSquareAnimation, EFFECT_SIZE_UP)), _defineProperty(_lootData, LOOT_ATTACK_SPEED, powerupLoot(LOOT_ATTACK_SPEED, powerupDiamondAnimation, EFFECT_RATE_UP)), _defineProperty(_lootData, LOOT_SPEED, powerupLoot(LOOT_SPEED, powerupTriangleAnimation, EFFECT_SPEED_UP)), _defineProperty(_lootData, LOOT_TRIPLE_SPEED, triplePowerupLoot(LOOT_TRIPLE_SPEED, powerupTripleTriangleAnimation, EFFECT_SPEED_UP)), _defineProperty(_lootData, LOOT_TRIPLE_POWER, triplePowerupLoot(LOOT_TRIPLE_POWER, powerupTripleSquareAnimation, EFFECT_SIZE_UP)), _defineProperty(_lootData, LOOT_TRIPLE_RATE, triplePowerupLoot(LOOT_TRIPLE_RATE, powerupTripleDiamondAnimation, EFFECT_RATE_UP)), _defineProperty(_lootData, LOOT_COMBO, triplePowerupLoot(LOOT_COMBO, powerupComboAnimation)), _defineProperty(_lootData, LOOT_TRIPLE_COMBO, triplePowerupLoot(LOOT_TRIPLE_COMBO, powerupTripleComboAnimation)), _lootData);

var createLoot = function createLoot(type) {
    var frame = lootData[type].animation.frames[0];
    return _extends({}, new Rectangle(frame).scale(lootData[type].scale || 1), {
        type: type
    });
};

var renderLoot = function renderLoot(context, loot) {
    if (lootData[loot.type].draw) lootData[loot.type].draw(context, state, loot);else drawNormal(context, state, loot);
    if (loot.sfx) {
        playSound(loot.sfx);
        loot.sfx = false;
    }
};

var advanceLoot = function advanceLoot(state, loot) {
    var _loot = loot,
        left = _loot.left,
        top = _loot.top,
        width = _loot.width,
        height = _loot.height,
        vx = _loot.vx,
        vy = _loot.vy,
        delay = _loot.delay,
        duration = _loot.duration,
        animationTime = _loot.animationTime,
        type = _loot.type;

    var data = lootData[type];
    var animation = data.animation;
    left += vx - state.world.vx;
    top += vy + state.world.vy;
    animationTime += FRAME_LENGTH;
    if (data.accelerate) {
        loot = data.accelerate(state, loot);
    }

    var done = left + width < 0;;

    return _extends({}, loot, { left: left, top: top, animationTime: animationTime, done: done });
};

var getRandomPowerupType = function getRandomPowerupType() {
    if (Math.random() < 1 / 3) return LOOT_ATTACK_POWER;
    if (Math.random() < 1 / 2) return LOOT_SPEED;
    return LOOT_ATTACK_SPEED;
};

/*
1: If they are missing a character, it always drops an extra character. Otherwise...
2: If they have no(or maybe only 1) powerups, drop a random of the 3 main powerups. Otherwise...
3: If they have 0 ladybugs, it drops a ladybug. Otherwise...
4: If they don't have a full powerup bar, it drops a random of the main 3 powerups. Otherwise...
5: If they only have 1 ladybug, it drops a ladybug. Otherwise...
6: Drops a random of the main 3 powerups.*/
var getAdaptivePowerupType = function getAdaptivePowerupType(state) {
    // return Math.random() < .5 ? LOOT_COMBO : LOOT_TRIPLE_COMBO;
    if (state.players[0].heroes.length < 2 && Math.random() < .25) return LOOT_LIFE;
    if (state.players[0].heroes.length < 3 && Math.random() < .25) return LOOT_LIFE;
    if (state.players[0].powerups.length < 2) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 1) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 4) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 2) return LOOT_LADYBUG;
    if (state.players[0].powerups.length < 5) return getRandomPowerupType();
    if (state.players[0].ladybugs.length < 3) return LOOT_LADYBUG;
    return getRandomPowerupType();
};

var getComboMultiplier = function getComboMultiplier(state, playerIndex) {
    var comboScore = state.players[playerIndex].comboScore;
    if (comboScore >= 1000) return 5;
    if (comboScore >= 600) return 4;
    if (comboScore >= 400) return 3;
    if (comboScore >= 200) return 2;
    if (comboScore >= 100) return 1.5;
    return 1;
};

var powerupGoals = [500, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000];

var gainPoints = function gainPoints(state, playerIndex, points) {
    points *= getComboMultiplier(state, playerIndex);
    var score = state.players[playerIndex].score + points;
    var powerupPoints = state.players[playerIndex].powerupPoints + points;
    var powerupIndex = state.players[playerIndex].powerupIndex;
    if (powerupPoints >= powerupGoals[powerupIndex]) {
        powerupPoints -= powerupGoals[powerupIndex];
        powerupIndex = Math.min(powerupIndex + 1, powerupGoals.length - 1);
        var cargoBeetle = createEnemy(ENEMY_CARGO_BEETLE, {
            left: WIDTH + 10,
            top: GAME_HEIGHT / 6 + Math.floor(Math.random() * 2 * GAME_HEIGHT / 3)
        });
        cargoBeetle.top -= cargoBeetle.height / 2;
        state = addEnemyToState(state, cargoBeetle);
    }
    state = updatePlayer(state, playerIndex, { score: score, powerupPoints: powerupPoints, powerupIndex: powerupIndex });
    return state;
};

var collectLoot = function collectLoot(state, playerIndex, lootIndex) {
    var loot = state.loot[lootIndex];
    state = lootData[loot.type].collect(state, playerIndex, loot);
    state = _extends({}, state, { loot: [].concat(_toConsumableArray(state.loot)) });
    state.loot[lootIndex] = _extends({}, loot, { done: true });
    return _extends({}, state, { sfx: [].concat(_toConsumableArray(state.sfx), [lootData[loot.type].sfx]) });
};

module.exports = {
    lootData: lootData,
    createLoot: createLoot,
    advanceLoot: advanceLoot,
    renderLoot: renderLoot,
    gainPoints: gainPoints,
    getRandomPowerupType: getRandomPowerupType,
    getAdaptivePowerupType: getAdaptivePowerupType,
    getComboMultiplier: getComboMultiplier,
    collectLoot: collectLoot,
    powerupGoals: powerupGoals
};

// Move possible circular imports to after exports.

var _require6 = require('enemies'),
    addEnemyToState = _require6.addEnemyToState,
    createEnemy = _require6.createEnemy;

var _require7 = require('heroes'),
    heroesData = _require7.heroesData,
    updatePlayer = _require7.updatePlayer;

var _require8 = require('effects'),
    createEffect = _require8.createEffect,
    addEffectToState = _require8.addEffectToState;

},{"Rectangle":1,"animations":2,"draw":5,"effects":6,"enemies":7,"gameConstants":8,"heroes":9,"sounds":14,"sprites":15}],12:[function(require,module,exports){
"use strict";

module.exports = {
    /**
     * @param {Number} min  The smallest returned value
     * @param {Number} max  The largest returned value
     */
    range: function range(A, B) {
        var min = Math.min(A, B);
        var max = Math.max(A, B);
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    },


    /**
     * @param {Array} array  The array of elements to return random element from
     */
    element: function element(collection) {
        if (collection.constructor == Object) {
            var keys = Object.keys(collection);
            return collection[this.element(keys)];
        }
        if (collection.constructor == Array) {
            return collection[this.range(0, collection.length - 1)];
        }
        console.log("Warning @ Random.element: " + collection + " is neither Array or Object");
        return null;
    },


    /**
     * @param {Array} array  The array of elements to return random element from
     */
    removeElement: function removeElement(collection) {
        if (collection.constructor == Object) {
            var keys = Object.keys(collection);
            var key = this.element(keys);
            var value = collection[key];
            delete collection[key];
            return value;
        }
        if (collection.constructor == Array) {
            var spliced = collection.splice(this.range(0, collection.length - 1), 1);
            return spliced[0];
        }
        console.log("Warning @ Random.removeElement: " + collection + " is neither Array or Object");
        return null;
    },


    /**
     * Shuffles an array.
     *
     * Knuth algorithm found at:
     * http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     *
     * @param {Array} array  The array of elements to shuffle
     */
    shuffle: function shuffle(array) {
        array = array.slice();
        var currentIndex = array.length,
            temporaryValue,
            randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
};

},{}],13:[function(require,module,exports){
'use strict';

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    HEIGHT = _require.HEIGHT,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN,
    POINTS_FOR_POWERUP = _require.POINTS_FOR_POWERUP;

var Rectangle = require('Rectangle');

var _require2 = require('draw'),
    drawImage = _require2.drawImage,
    drawTintedImage = _require2.drawTintedImage,
    embossText = _require2.embossText;

var _require3 = require('sounds'),
    playSound = _require3.playSound,
    playTrack = _require3.playTrack,
    stopTrack = _require3.stopTrack;

var _require4 = require('keyboard'),
    isKeyDown = _require4.isKeyDown,
    KEY_SHIFT = _require4.KEY_SHIFT,
    KEY_R = _require4.KEY_R;

var _require5 = require('animations'),
    blastStartAnimation = _require5.blastStartAnimation,
    blastLoopAnimation = _require5.blastLoopAnimation,
    ladybugAttackAnimation = _require5.ladybugAttackAnimation,
    bulletAnimation = _require5.bulletAnimation,
    explosionAnimation = _require5.explosionAnimation,
    selectNeedleImage = _require5.selectNeedleImage,
    startGameImage = _require5.startGameImage,
    optionsImage = _require5.optionsImage,
    startImage = _require5.startImage,
    gameOverImage = _require5.gameOverImage,
    hudImage = _require5.hudImage,
    powerupBarAnimation = _require5.powerupBarAnimation,
    comboBarAnimation = _require5.comboBarAnimation,
    getHitBox = _require5.getHitBox,
    getFrame = _require5.getFrame,
    dragonflyIdleAnimation = _require5.dragonflyIdleAnimation;

var canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
var context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
document.body.appendChild(canvas);

var HUD_PADDING = 9;

var rewindAlpha = 1;
var render = function render(state) {
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
    state.playerAttacks.map(function (attack) {
        return renderAttack(context, attack);
    });
    state.enemies.map(function (enemy) {
        return renderEnemy(context, enemy);
    });
    state.loot.map(function (loot) {
        return renderLoot(context, loot);
    });
    state.effects.map(function (effect) {
        return renderEffect(context, effect);
    });
    state.neutralAttacks.map(function (attack) {
        return renderAttack(context, attack);
    });
    // Thinking an attack shuold display on top of other effects so it can be avoided.
    state.enemyAttacks.map(function (attack) {
        return renderAttack(context, attack);
    });
    state.players.map(function (hero) {
        return renderHero(context, hero);
    });
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
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = state.sfx[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var sfx = _step.value;

            playSound(sfx);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    state.sfx = [];
};

var renderHUD = function renderHUD(context, state) {
    drawImage(context, hudImage.image, hudImage, hudImage);
    for (var i = 0; i < state.players[0].heroes.length; i++) {
        var portraitAnimation = heroesData[state.players[0].heroes[i]].portraitAnimation;

        var _frame = getFrame(portraitAnimation, state.world.time);
        drawImage(context, _frame.image, _frame, new Rectangle(_frame).moveTo(HUD_PADDING + 1 + i * 20, HUD_PADDING));
    }

    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.font = "20px sans-serif";
    embossText(context, {
        text: '' + state.players[0].score,
        left: 665,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA'
    });

    var _state$players$ = state.players[0],
        powerupPoints = _state$players$.powerupPoints,
        powerupIndex = _state$players$.powerupIndex;

    var powerupFrame = Math.floor(powerupBarAnimation.frames.length * (powerupPoints / powerupGoals[powerupIndex]));
    powerupFrame = Math.min(powerupBarAnimation.frames.length - 1, powerupFrame);
    var frame = powerupBarAnimation.frames[powerupFrame];
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(190, 8));

    var comboScore = state.players[0].comboScore;
    var nextCombo = 100;
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
    } else {
        comboScore -= 600;
        nextCombo = 400;
    }

    var comboFrame = Math.min(comboBarAnimation.frames.length - 1, Math.floor((comboBarAnimation.frames.length - 1) * comboScore / nextCombo));
    frame = comboBarAnimation.frames[comboFrame];
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(523, 8));

    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.font = "20px sans-serif";
    embossText(context, {
        text: (isKeyDown(KEY_SHIFT) ? state.players[0].comboScore + ' ' : '') + (getComboMultiplier(state, 0) + 'x'),
        left: 518,
        top: HUD_PADDING + 10,
        backgroundColor: '#AAA'
    });

    for (var _i = 0; _i < state.players[0].powerups.length; _i++) {
        var powerupType = state.players[0].powerups[_i];
        frame = getFrame(lootData[powerupType].animation, state.players[0].sprite.animationTime);
        drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(292 + 20 * _i, 8));
    }
};

var renderTitle = function renderTitle(context, state) {
    renderBackground(context, state);
    renderForeground(context, state);
    var frame = dragonflyIdleAnimation.frames[0];
    var sprite = state.players[0].sprite;
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(sprite.left, hudImage.height + sprite.top));

    var options = [startGameImage, optionsImage];
    var targets = [new Rectangle(options[0]).scale(3).moveCenterTo(WIDTH / 2, HEIGHT / 2)];
    for (var i = 1; i < options.length; i++) {
        targets.push(new Rectangle(options[i]).scale(3).moveCenterTo(WIDTH / 2, targets[i - 1].top + targets[i - 1].height + 20 + 3 * options[i].height / 2));
    }
    for (var _i2 = 0; _i2 < options.length; _i2++) {
        drawImage(context, options[_i2].image, options[_i2], targets[_i2]);
    }
    var target = targets[state.titleIndex];
    drawImage(context, selectNeedleImage.image, selectNeedleImage, new Rectangle(selectNeedleImage).scale(2).moveCenterTo(WIDTH / 2 - (3 * selectNeedleImage.width + target.width) / 2 + 5 * Math.sin(Date.now() / 150) + 10, target.top + target.height / 2));
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

var _require6 = require('world'),
    renderBackground = _require6.renderBackground,
    renderForeground = _require6.renderForeground;

var _require7 = require('heroes'),
    heroesData = _require7.heroesData,
    renderHero = _require7.renderHero;

var _require8 = require('loot'),
    lootData = _require8.lootData,
    renderLoot = _require8.renderLoot,
    getComboMultiplier = _require8.getComboMultiplier,
    powerupGoals = _require8.powerupGoals;

var _require9 = require('enemies'),
    renderEnemy = _require9.renderEnemy;

var _require10 = require('effects'),
    renderEffect = _require10.renderEffect;

var _require11 = require('attacks'),
    renderAttack = _require11.renderAttack;

},{"Rectangle":1,"animations":2,"attacks":3,"draw":5,"effects":6,"enemies":7,"gameConstants":8,"heroes":9,"keyboard":10,"loot":11,"sounds":14,"world":17}],14:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var sounds = new Map();
var numberOfSoundsLeftToLoad = 0,
    soundsMuted = false;

function ifdefor(value, defaultValue) {
    if (value !== undefined && !(typeof value === 'number' && isNaN(value))) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    return null;
}

var requireSound = function requireSound(source) {
    var offset, volume, customDuration;

    var _source$split = source.split('+');

    var _source$split2 = _slicedToArray(_source$split, 3);

    source = _source$split2[0];
    offset = _source$split2[1];
    volume = _source$split2[2];

    if (offset) {
        ;

        var _offset$split = offset.split(':');

        var _offset$split2 = _slicedToArray(_offset$split, 2);

        offset = _offset$split2[0];
        customDuration = _offset$split2[1];
    }if (sounds.has(source)) return sounds.get(source);
    var newSound = new Audio(source);
    newSound.instances = new Set();
    newSound.offset = offset || 0;
    newSound.customDuration = customDuration || 0;
    newSound.defaultVolume = volume || 1;
    sounds.set(source, newSound);
    return newSound;
};

var playingSounds = new Set();
var playSound = function playSound(source, area) {
    if (soundsMuted) return;
    var offset, volume, customDuration;

    var _source$split3 = source.split('+');

    var _source$split4 = _slicedToArray(_source$split3, 3);

    source = _source$split4[0];
    offset = _source$split4[1];
    volume = _source$split4[2];

    if (offset) {
        ;

        var _offset$split3 = offset.split(':');

        var _offset$split4 = _slicedToArray(_offset$split3, 2);

        offset = _offset$split4[0];
        customDuration = _offset$split4[1];
    }var sound = requireSound(source);
    // Custom sound objects just have a play and forget method on them.
    if (!(sound instanceof Audio)) {
        sound.play();
        return;
    }
    if (sound.instances.size >= 6) return;
    var newInstance = sound.cloneNode(false);
    newInstance.currentTime = (ifdefor(offset || sound.offset) || 0) / 1000;
    newInstance.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    newInstance.play().then(function () {
        var timeoutId;
        if (customDuration || sound.customDuration) {
            timeoutId = setTimeout(function () {
                sound.instances.delete(newInstance);
                playingSounds.delete(newInstance);
                newInstance.onended = null;
                newInstance.pause();
            }, parseInt(customDuration || sound.customDuration));
        }
        playingSounds.add(newInstance);
        sound.instances.add(newInstance);
        newInstance.onended = function () {
            sound.instances.delete(newInstance);
            playingSounds.delete(newInstance);
            newInstance.onended = null;
            clearTimeout(timeoutId);
        };
    });
};

var previousTrack = null;
var playTrack = function playTrack(source, timeOffset) {
    var offset = void 0,
        volume = void 0;

    var _source$split5 = source.split('+');

    var _source$split6 = _slicedToArray(_source$split5, 3);

    source = _source$split6[0];
    offset = _source$split6[1];
    volume = _source$split6[2];

    if (previousTrack) {
        previousTrack.pause();
    }
    var sound = requireSound(source);
    sound.currentTime = (ifdefor(offset, sound.offset) || 0) / 1000 + timeOffset / 1000;
    sound.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    if (soundsMuted) {
        sound.volume = 0;
    }
    sound.play();
    previousTrack = sound;
};

var stopTrack = function stopTrack() {
    if (previousTrack) {
        previousTrack.pause();
    }
};

// This hasn't been tested yet, not sure if it works.
var muteSounds = function muteSounds() {
    soundsMuted = true;
    if (previousTrack) {
        previousTrack.volume = 0;
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = playingSounds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var sound = _step.value;

            sound.volume = 0;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

['sfx/shoot.mp3+0+2', 'sfx/hit.mp3+200+1', 'sfx/flydeath.mp3+0+5', 'sfx/robedeath1.mp3+0+2', 'sfx/hornetdeath.mp3+0+8', 'sfx/coin.mp3', 'sfx/powerup.mp3', 'sfx/startgame.mp3', 'sfx/exclamation.mp3+0+3', 'sfx/exclamation2.mp3+0+3', 'sfx/exclamation3.mp3+0+3', 'sfx/heal.mp3+200+5', 'sfx/death.mp3+0+1', 'sfx/dodge.mp3+200+2', 'sfx/meleehit.mp3+50+6', 'sfx/throwhit.mp3+200+5', 'sfx/needledropflip.mp3+0+3', 'sfx/needlegrab.mp3+0+3',
// These custom range makes for mediocre explosion sound.
'sfx/explosion.mp3+0+1',
// See credits.html for: mobbrobb.
'bgm/river.mp3+0+1', 'bgm/area.mp3+0+2'].forEach(requireSound);

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};
var distortionCurve = makeDistortionCurve(100);

function playBeeps(frequencies, volume, duration, _ref) {
    var _ref$smooth = _ref.smooth,
        smooth = _ref$smooth === undefined ? false : _ref$smooth,
        _ref$swell = _ref.swell,
        swell = _ref$swell === undefined ? false : _ref$swell,
        _ref$taper = _ref.taper,
        taper = _ref$taper === undefined ? false : _ref$taper,
        _ref$distortion = _ref.distortion,
        distortion = _ref$distortion === undefined ? false : _ref$distortion;

    var oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    if (smooth) oscillator.frequency.setValueCurveAtTime(frequencies, audioContext.currentTime, duration);else {
        for (var i = 0; i < frequencies.length; i++) {
            oscillator.frequency.setValueAtTime(frequencies[i], audioContext.currentTime + duration * i / frequencies.length);
        }
    }
    var lastNode = oscillator;
    if (distortion) {
        distortion = audioContext.createWaveShaper();
        distortion.curve = distortionCurve;
        distortion.oversample = '4x';
        lastNode.connect(distortion);
        lastNode = distortion;
    }

    gainNode = audioContext.createGain();
    if (swell) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration * .1);
    } else {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
    if (taper) {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + duration * .9);
        // gainNode.gain.setTargetAtTime(0, audioContext.currentTime, duration / 10);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    }
    lastNode.connect(gainNode);
    lastNode = gainNode;

    lastNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

sounds.set('reflect', {
    play: function play() {
        playBeeps([2000, 8000, 4000], .01, .1, {});
    }
});
sounds.set('wand', {
    play: function play() {
        playBeeps([1200, 400], 0.01, .1, { smooth: true, taper: true, swell: true, distortion: true });
    }
});

window.playSound = playSound;

module.exports = {
    playSound: playSound,
    playTrack: playTrack,
    stopTrack: stopTrack
};

},{}],15:[function(require,module,exports){
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var getNewSpriteState = function getNewSpriteState(base) {
    return _extends({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        vx: 0,
        vy: 0,
        animation: false,
        animationTime: 0
    }, base);
};

module.exports = {
    getNewSpriteState: getNewSpriteState
};

},{}],16:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var random = require('random');

var _require = require('gameConstants'),
    WIDTH = _require.WIDTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    FRAME_LENGTH = _require.FRAME_LENGTH,
    OFFSCREEN_PADDING = _require.OFFSCREEN_PADDING,
    ENEMY_COOLDOWN = _require.ENEMY_COOLDOWN,
    DEATH_COOLDOWN = _require.DEATH_COOLDOWN,
    SPAWN_COOLDOWN = _require.SPAWN_COOLDOWN,
    SPAWN_INV_TIME = _require.SPAWN_INV_TIME,
    EFFECT_DEFLECT_BULLET = _require.EFFECT_DEFLECT_BULLET,
    ENEMY_FLY = _require.ENEMY_FLY,
    ENEMY_MONK = _require.ENEMY_MONK,
    ENEMY_HORNET = _require.ENEMY_HORNET,
    ENEMY_HORNET_SOLDIER = _require.ENEMY_HORNET_SOLDIER,
    ENEMY_FLYING_ANT = _require.ENEMY_FLYING_ANT,
    ENEMY_FLYING_ANT_SOLDIER = _require.ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_LOCUST = _require.ENEMY_LOCUST,
    ENEMY_LOCUST_SOLDIER = _require.ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE = _require.ENEMY_CARGO_BEETLE,
    ENEMY_EXPLOSIVE_BEETLE = _require.ENEMY_EXPLOSIVE_BEETLE;

var Rectangle = require('Rectangle');

var _require2 = require('sprites'),
    getNewSpriteState = _require2.getNewSpriteState;

var _require3 = require('world'),
    getNewWorld = _require3.getNewWorld,
    advanceWorld = _require3.advanceWorld,
    getGroundHeight = _require3.getGroundHeight;

var getNewState = function getNewState() {
    return advanceWorld({
        players: [getNewPlayerState()],
        deathCooldown: 0,
        enemies: [],
        loot: [],
        effects: [],
        enemyCooldown: 0,
        playerAttacks: [],
        neutralAttacks: [],
        enemyAttacks: [],
        sfx: [],
        title: true,
        titleIndex: 0,
        paused: false,
        gameover: false,
        world: getNewWorld()
    });
};

var TEST_ENEMY = false;
var TEST_TIME = 0;

var advanceState = function advanceState(state) {
    var updatedState = _extends({}, state);
    if (state.world.time < TEST_TIME) {
        state.world.time = TEST_TIME;
    }
    if (updatedState.title) {
        var titleIndex = updatedState.titleIndex;
        if (updatedState.players[0].actions.start && titleIndex === 0) {
            return _extends({}, updatedState, { title: false, world: _extends({}, updatedState.world, { bgm: 'bgm/river.mp3' }) });
        }
        if (updatedState.players[0].actions.up) {
            titleIndex = (titleIndex + 2 - 1) % 2;
        }
        if (updatedState.players[0].actions.down) {
            titleIndex = (titleIndex + 1) % 2;
        }
        //if (updatedState.players[0].actions.down)
        //return advanceWorld({...updatedState, titleIndex});
        return _extends({}, updatedState, { titleIndex: titleIndex });
    }
    if (state.gameover) {
        if (updatedState.players[0].actions.start) {
            return getNewState();
        }
        return state;
    }
    if (updatedState.deathCooldown > 0) {
        updatedState.deathCooldown -= FRAME_LENGTH;
        if (updatedState.deathCooldown <= 0) {
            return _extends({}, updatedState, { gameover: true });
        }
    }
    var _updatedState = updatedState,
        paused = _updatedState.paused;

    if (updatedState.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            updatedState = _extends({}, updatedState, { world: _extends({}, updatedState.world, { bgm: 'bgm/river.mp3' }) });
        }
    }
    if (paused) {
        return _extends({}, updatedState, { paused: paused });
    }
    updatedState.newPlayerAttacks = [];
    updatedState.newEffects = [];
    updatedState.newLoot = [];
    updatedState.newEnemies = [];
    updatedState.newEnemyAttacks = [];
    updatedState.newNeutralAttacks = [];
    for (var playerIndex = 0; playerIndex < updatedState.players.length; playerIndex++) {
        updatedState = advanceHero(updatedState, playerIndex);
    }
    updatedState = advanceWorld(updatedState);
    var world = updatedState.world;

    var currentPlayerAttacks = updatedState.playerAttacks.map(function (attack) {
        return advanceAttack(updatedState, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    for (var enemyIndex = 0; enemyIndex < updatedState.enemies.length; enemyIndex++) {
        updatedState = advanceEnemy(updatedState, enemyIndex);
    }
    for (var _enemyIndex = 0; _enemyIndex < updatedState.enemies.length; _enemyIndex++) {
        var enemy = updatedState.enemies[_enemyIndex];
        if (!enemy.dead && !enemy.done && enemyData[enemy.type].shoot && enemy.left > 0) {
            updatedState = enemyData[enemy.type].shoot(updatedState, _enemyIndex);
        }
    }
    var _updatedState2 = updatedState,
        enemyCooldown = _updatedState2.enemyCooldown;

    var formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];
    var numFormidable = updatedState.enemies.filter(function (enemy) {
        return formidableEnemies.includes(enemy.type);
    }).length;
    var spawnDuration = Math.min(2500, 100 + world.time / 20 + state.players[0].score / 10);
    if (TEST_ENEMY) {
        if (!updatedState.enemies.length) {
            var newEnemy = createEnemy(TEST_ENEMY, {
                left: WIDTH + 10,
                top: 100 + (GAME_HEIGHT - 200) * (0.5 + 0.5 * Math.sin(world.time / (1000 - spawnDuration / 5)))
            });
            newEnemy.vx = newEnemy.vx || -5;
            newEnemy.top = newEnemy.grounded ? getGroundHeight(updatedState) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
            updatedState = addEnemyToState(updatedState, newEnemy);
        }
    } else if (enemyCooldown > 0) {
        enemyCooldown--;
    } else if (world.time % 5000 < spawnDuration - 800 * numFormidable) {
        var newEnemyType = ENEMY_FLY;
        if (world.time > 15000 && Math.random() < 1 / 6) {
            newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
        } else if (world.time > 10000 && Math.random() < 1 / 3) {
            newEnemyType = ENEMY_FLYING_ANT;
        } else if (world.time > 20000 && Math.random() > Math.max(.9, 1 - .1 * updatedState.players[0].score / 3000)) {
            newEnemyType = random.element(formidableEnemies);
        } else if (getGroundHeight(updatedState) < GAME_HEIGHT && Math.random() < 1 / 10) {
            newEnemyType = ENEMY_MONK;
        }
        var _newEnemy = createEnemy(newEnemyType, {
            left: WIDTH + 10,
            top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(world.time / (1000 - spawnDuration / 5)))
        });
        _newEnemy.vx = _newEnemy.vx || -6 + 3 * (world.time % 5000) / spawnDuration;
        _newEnemy.top = _newEnemy.grounded ? getGroundHeight(updatedState) - _newEnemy.height : _newEnemy.top - _newEnemy.height / 2;
        updatedState = addEnemyToState(updatedState, _newEnemy);
        switch (_newEnemy.type) {
            case ENEMY_HORNET:
                enemyCooldown = 3 * ENEMY_COOLDOWN;
                break;
            case ENEMY_FLYING_ANT_SOLDIER:
                enemyCooldown = 2 * ENEMY_COOLDOWN;
                break;
            default:
                enemyCooldown = ENEMY_COOLDOWN;
                break;
        }
    }

    updatedState.sfx = [].concat(_toConsumableArray(updatedState.sfx));
    // Check for enemies hit by attacks.
    for (var i = 0; i < updatedState.enemies.length; i++) {
        var _enemy = updatedState.enemies[i];
        var enemyHitBox = getEnemyHitBox(_enemy);
        for (var j = 0; j < currentPlayerAttacks.length && !_enemy.dead && !_enemy.done; j++) {
            var attack = currentPlayerAttacks[j];
            if (!attack.done && !attack.hitIds[_enemy.id] && Rectangle.collision(enemyHitBox, attack)) {
                currentPlayerAttacks[j] = _extends({}, attack, {
                    damage: attack.piercing ? attack.damage : attack.damage - _enemy.life,
                    done: !attack.piercing && attack.damage - _enemy.life <= 0,
                    hitIds: _extends({}, attack.hitIds, _defineProperty({}, _enemy.id, true))
                });
                updatedState = damageEnemy(updatedState, i, attack);
                _enemy = updatedState.enemies[i];
            }
        }
        for (var _j = 0; _j < updatedState.players.length; _j++) {
            if (!updatedState.players[_j].invulnerableFor && !updatedState.players[_j].done && !_enemy.done && !_enemy.dead && Rectangle.collision(enemyHitBox, getHeroHitBox(updatedState.players[_j]))) {
                updatedState = damageHero(updatedState, _j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(function (attack) {
        return !attack.done;
    });
    updatedState.enemies = updatedState.enemies.filter(function (enemy) {
        return !enemy.done;
    });

    // Advance enemy attacks and check for hitting the player.
    var currentEnemyAttacks = updatedState.enemyAttacks.map(function (attack) {
        return advanceAttack(updatedState, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    for (var _i = 0; _i < updatedState.players.length; _i++) {
        if (updatedState.players[_i].invulnerableFor) continue;
        var playerHitBox = getHeroHitBox(updatedState.players[_i]);
        for (var _j2 = 0; _j2 < currentEnemyAttacks.length && !updatedState.players[_i].done; _j2++) {
            var _attack = currentEnemyAttacks[_j2];
            if (Rectangle.collision(playerHitBox, _attack)) {
                updatedState = damageHero(updatedState, _i);
                currentEnemyAttacks[_j2] = _extends({}, _attack, { done: true });
            }
        }
    }
    // Player melee attacks can destroy enemy projectiles.
    for (var _i2 = 0; _i2 < currentPlayerAttacks.length; _i2++) {
        var _attack2 = currentPlayerAttacks[_i2];
        if (!_attack2.melee || _attack2.done) continue;
        for (var _j3 = 0; _j3 < currentEnemyAttacks.length; _j3++) {
            var enemyAttack = currentEnemyAttacks[_j3];
            if (Rectangle.collision(_attack2, enemyAttack)) {
                currentEnemyAttacks[_j3] = _extends({}, enemyAttack, { done: true });
                var deflectEffect = createEffect(EFFECT_DEFLECT_BULLET);
                deflectEffect.left = enemyAttack.left + (enemyAttack.width - deflectEffect.width) / 2;
                deflectEffect.top = enemyAttack.top + (enemyAttack.height - deflectEffect.height) / 2;
                updatedState = addEffectToState(updatedState, deflectEffect);
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(function (attack) {
        return !attack.done;
    });

    var currentNeutralAttacks = updatedState.neutralAttacks.map(function (attack) {
        return advanceAttack(updatedState, attack);
    }).filter(function (attack) {
        return !attack.done;
    });
    for (var _i3 = 0; _i3 < currentNeutralAttacks.length; _i3++) {
        var _attack3 = currentNeutralAttacks[_i3];
        for (var _j4 = 0; _j4 < updatedState.players.length; _j4++) {
            var player = updatedState.players[_j4];
            var playerKey = 'player' + _j4;
            if (player.invulnerableFor || _attack3.hitIds[playerKey]) continue;
            var _playerHitBox = getHeroHitBox(player);
            if (Rectangle.collision(_playerHitBox, _attack3)) {
                updatedState = damageHero(updatedState, _j4);
                currentNeutralAttacks[_i3] = _extends({}, _attack3, {
                    damage: _attack3.piercing ? _attack3.damage : _attack3.damage - 1,
                    done: !_attack3.piercing && _attack3.damage - 1 <= 0,
                    hitIds: _extends({}, _attack3.hitIds, _defineProperty({}, playerKey, true))
                });
            }
        }
        for (var _j5 = 0; _j5 < updatedState.enemies.length; _j5++) {
            var _enemy2 = updatedState.enemies[_j5];
            if (_enemy2.dead || _enemy2.done || _attack3.hitIds[_enemy2.id]) continue;
            var _enemyHitBox = getEnemyHitBox(_enemy2);
            if (Rectangle.collision(_enemyHitBox, _attack3)) {
                currentNeutralAttacks[_i3] = _extends({}, _attack3, {
                    damage: _attack3.piercing ? _attack3.damage : _attack3.damage - _enemy2.life,
                    done: !_attack3.piercing && _attack3.damage - _enemy2.life <= 0,
                    hitIds: _extends({}, _attack3.hitIds, _defineProperty({}, _enemy2.id, true))
                });
                updatedState = damageEnemy(updatedState, _j5, _attack3);
            }
        }
    }

    updatedState.loot = updatedState.loot.map(function (loot) {
        return advanceLoot(updatedState, loot);
    }).filter(function (loot) {
        return !loot.done;
    });
    for (var _i4 = 0; _i4 < updatedState.loot.length; _i4++) {
        var loot = updatedState.loot[_i4];
        if (loot.done) continue;
        for (var _j6 = 0; _j6 < updatedState.players.length; _j6++) {
            if (updatedState.players[_j6].done || updatedState.players[_j6].spawning) continue;
            if (Rectangle.collision(loot, getHeroHitBox(updatedState.players[_j6]))) {
                updatedState = collectLoot(updatedState, _j6, _i4);
            }
        }
    }
    updatedState.loot = updatedState.loot.filter(function (loot) {
        return !loot.done;
    });

    // Add new enemies/attacks.
    updatedState.enemies = [].concat(_toConsumableArray(updatedState.enemies), _toConsumableArray(updatedState.newEnemies));
    updatedState.playerAttacks = [].concat(_toConsumableArray(currentPlayerAttacks), _toConsumableArray(updatedState.newPlayerAttacks));
    updatedState.enemyAttacks = [].concat(_toConsumableArray(currentEnemyAttacks), _toConsumableArray(updatedState.newEnemyAttacks));
    updatedState.neutralAttacks = [].concat(_toConsumableArray(currentNeutralAttacks), _toConsumableArray(updatedState.newNeutralAttacks));
    updatedState.effects = updatedState.effects.map(function (effect) {
        return advanceEffect(updatedState, effect);
    }).filter(function (effect) {
        return !effect.done;
    });
    updatedState.effects = [].concat(_toConsumableArray(updatedState.effects), _toConsumableArray(updatedState.newEffects));
    updatedState.loot = [].concat(_toConsumableArray(updatedState.loot), _toConsumableArray(updatedState.newLoot));

    return _extends({}, updatedState, { enemyCooldown: enemyCooldown, paused: false });
};

var applyPlayerActions = function applyPlayerActions(state, playerIndex, actions) {
    var players = [].concat(_toConsumableArray(state.players));
    players[playerIndex] = _extends({}, players[playerIndex], { actions: actions });
    return _extends({}, state, { players: players });
};

module.exports = {
    getNewState: getNewState,
    advanceState: advanceState,
    applyPlayerActions: applyPlayerActions
};

var _require4 = require('attacks'),
    advanceAttack = _require4.advanceAttack;

var _require5 = require('heroes'),
    getNewPlayerState = _require5.getNewPlayerState,
    advanceHero = _require5.advanceHero,
    getHeroHitBox = _require5.getHeroHitBox,
    damageHero = _require5.damageHero;

var _require6 = require('enemies'),
    enemyData = _require6.enemyData,
    createEnemy = _require6.createEnemy,
    addEnemyToState = _require6.addEnemyToState,
    damageEnemy = _require6.damageEnemy,
    advanceEnemy = _require6.advanceEnemy,
    getEnemyHitBox = _require6.getEnemyHitBox;

var _require7 = require('loot'),
    collectLoot = _require7.collectLoot,
    advanceLoot = _require7.advanceLoot;

var _require8 = require('effects'),
    createEffect = _require8.createEffect,
    addEffectToState = _require8.addEffectToState,
    advanceEffect = _require8.advanceEffect;

},{"Rectangle":1,"attacks":3,"effects":6,"enemies":7,"gameConstants":8,"heroes":9,"loot":11,"random":12,"sprites":15,"world":17}],17:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('gameConstants'),
    FRAME_LENGTH = _require.FRAME_LENGTH,
    GAME_HEIGHT = _require.GAME_HEIGHT,
    WIDTH = _require.WIDTH,
    HUD_HEIGHT = _require.HUD_HEIGHT;

var Rectangle = require('Rectangle');

var random = require('random');

var _require2 = require('draw'),
    drawImage = _require2.drawImage,
    drawTintedImage = _require2.drawTintedImage,
    embossText = _require2.embossText;

var _require3 = require('animations'),
    backgroundSky = _require3.backgroundSky,
    plainsBackground = _require3.plainsBackground,
    plainsMidground = _require3.plainsMidground,
    plainsNearground = _require3.plainsNearground,
    requireImage = _require3.requireImage,
    getFrame = _require3.getFrame,
    createFrames = _require3.createFrames;

var _require4 = require('sprites'),
    getNewSpriteState = _require4.getNewSpriteState;

var getNewLayer = function getNewLayer(_ref) {
    var animation = _ref.animation,
        xFactor = _ref.xFactor,
        yFactor = _ref.yFactor,
        yOffset = _ref.yOffset,
        maxY = _ref.maxY,
        spriteData = _ref.spriteData;
    return {
        sprites: [],
        animation: animation, spriteData: spriteData,
        xFactor: xFactor, yFactor: yFactor, yOffset: yOffset,
        maxY: maxY
    };
};

var getNewWorld = function getNewWorld() {
    return {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        groundHeight: 30,
        background: getNewLayer({
            xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
            animation: { frames: [plainsBg], frameDuration: 1 }
        }),
        midgroundA: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -20,
            // animation: {frames: [plainsMidground], frameDuration: 1}
            spriteData: {
                wheatBunch: { animation: wheatAnimation, scale: 4, next: ['wheatCouple'], offset: [-140, -120] },
                wheatCouple: { animation: wheatAnimation, scale: 5, next: ['wheat'], offset: [-100, -80] },
                wheat: { animation: wheatAnimation, scale: 4, next: ['wheatBunch'], offset: [-40, 400] }
            }
        }),
        midgroundB: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -20,
            spriteData: {
                darkGrass: { animation: darkGrass, scale: 1.75, next: ['darkGrass'], offset: [-40, -20] }
            }
        }),
        midgroundC: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: 0,
            spriteData: {
                thickGrass: { animation: thickGrass, scale: 1.75, next: ['thickGrass'], offset: [-40, -20] }
            }
        }),
        midgroundD: getNewLayer({
            xFactor: 0.5, yFactor: 0.5, yOffset: -20,
            spriteData: {
                clover: { animation: cloverAnimation, scale: 1, next: ['clover'], offset: [-40, -20, 200] }
            }
        }),
        nearground: _extends({}, getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: -15,
            spriteData: {
                dandyA: { animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'leaves', 'grassOrBerries'], offset: 80 },
                dandyB: { animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['leaves'], offset: -20 },
                dandyC: { animation: dandyCAnimation, onHit: onHitDandy, scale: 2, next: ['dandyA', 'leaves', 'grassOrBerries'], offset: 100 },
                leaves: { animation: [leavesAnimation, smallCloverAnimation], scale: 2, next: ['dandyA', 'dandyC', 'leaves', 'grassOrBerries'], offset: -20 },
                grassOrBerries: { animation: [grassAnimation, grass2Animation, grass3Animation, berriesAnimation], scale: 2, next: ['grassOrBerries', 'dandyB', 'leaves'], offset: 0 }
            }
        }), {
            sprites: [getNewSpriteState(_extends({}, townAnimation.frames[0], {
                top: 263,
                left: -10,
                offset: 50,
                animation: townAnimation,
                next: ['grassOrBerries']
            }))]
        }),
        foreground: getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: 25,
            spriteData: {
                grass: { animation: grassTuft, scale: 1.5, next: ['grass'], offset: [-10, 400, 550, 610] }
            }
        }),
        bgLayerNames: ['background'],
        mgLayerNames: ['midgroundA', 'midgroundB', 'midgroundC', 'midgroundD'],
        ngLayerNames: ['nearground'],
        fgLayerNames: ['foreground'],
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/area.mp3'
    };
};
/*
Add new background elements
try switching the BG file to the new static background (John may hate this)
Adjusting and adding the new midground and foreground elements to spawn at various rates
If it doesn’t look good, skip the midground assets
Adding the animated foreground elements that interact with enemys/player
Tufts of grass
Dandelions
*/
var i = function i(width, height, source) {
    return { left: 0, top: 0, width: width, height: height, image: requireImage(source) };
};
var r = function r(width, height, props) {
    return _extends({ left: 0, top: 0, width: width, height: height }, props);
};
var plainsBg = i(800, 800, 'gfx/scene/plainsbg.png');
var groundLoop = i(200, 60, 'gfx/scene/groundloop.png');

var dandyHitBox = r(36, 36, { left: 7 });
var dandyRectangle = r(80, 98, { hitBox: dandyHitBox });
var townAnimation = {
    frames: [_extends({}, r(300, 300), { image: requireImage('gfx/scene/town.png') })],
    frameDuration: 1
};
var dandyAAnimation = {
    frames: [_extends({}, dandyRectangle, { image: requireImage('gfx/scene/dandyidleabc.png') }), _extends({}, dandyRectangle, { left: 80, image: requireImage('gfx/scene/dandyidleabc.png') })],
    frameDuration: 30
};
var dandyAPoofAnimation = {
    frames: createFrames(dandyRectangle, 6, 'gfx/scene/dandya.png'), frameDuration: 8, loop: false
};
var dandyBAnimation = {
    frames: [_extends({}, dandyRectangle, { left: 160, image: requireImage('gfx/scene/dandyidleabc.png') }), _extends({}, dandyRectangle, { left: 240, image: requireImage('gfx/scene/dandyidleabc.png') })],
    frameDuration: 30
};
var dandyBPoofAnimation = {
    frames: createFrames(dandyRectangle, 6, 'gfx/scene/dandyb.png'), frameDuration: 8, loop: false
};
var dandyCAnimation = {
    frames: [_extends({}, dandyRectangle, { left: 320, image: requireImage('gfx/scene/dandyidleabc.png') }), _extends({}, dandyRectangle, { left: 400, image: requireImage('gfx/scene/dandyidleabc.png') })],
    frameDuration: 30
};
var dandyCPoofAnimation = {
    frames: createFrames(dandyRectangle, 6, 'gfx/scene/dandyc.png'), frameDuration: 8, loop: false
};
var grassTuftRectangle = r(92, 64);
var grassTuft = {
    frames: [_extends({}, grassTuftRectangle, { image: requireImage('gfx/scene/tuft.png') }), _extends({}, grassTuftRectangle, { left: 184, image: requireImage('gfx/scene/tuft.png') }), _extends({}, grassTuftRectangle, { left: 92, image: requireImage('gfx/scene/tuft.png') }), _extends({}, grassTuftRectangle, { left: 184, image: requireImage('gfx/scene/tuft.png') })],
    frameDuration: 20
};

var onHitDandy = function onHitDandy(state, layerName, spriteIndex) {
    var world = state.world;
    var layer = world[layerName];
    var sprites = [].concat(_toConsumableArray(layer.sprites));
    var sprite = sprites[spriteIndex];
    var newAnimation = dandyAPoofAnimation;
    if (sprite.animation === dandyBAnimation) {
        newAnimation = dandyBPoofAnimation;
    } else if (sprite.animation === dandyCAnimation) {
        newAnimation = dandyCPoofAnimation;
    }
    sprites[spriteIndex] = _extends({}, sprite, { animation: newAnimation, onHit: null, animationTime: FRAME_LENGTH * newAnimation.frameDuration });
    layer = _extends({}, layer, { sprites: sprites });
    world = _extends({}, world, _defineProperty({}, layerName, layer));
    return _extends({}, state, { world: world });
};

var grassAnimation = {
    frames: [r(122, 52, { 'image': requireImage('gfx/scene/plainsfg1.png') })],
    frameDuration: 30
};
var grass2Animation = {
    frames: [r(110, 51, { 'image': requireImage('gfx/scene/plainsfg4.png') })],
    frameDuration: 30
};
var grass3Animation = {
    frames: [r(122, 52, { 'image': requireImage('gfx/scene/plainsfg5.png') })],
    frameDuration: 30
};
var smallCloverAnimation = {
    frames: [r(69, 38, { 'image': requireImage('gfx/scene/plainsfg6.png') })],
    frameDuration: 30
};
var leavesAnimation = {
    frames: [r(200, 100, { 'image': requireImage('gfx/scene/plainsfg2.png') })],
    frameDuration: 30
};
var berriesAnimation = {
    frames: [r(200, 100, { 'image': requireImage('gfx/scene/plainsfg3.png') })],
    frameDuration: 30
};
var cloverAnimation = {
    frames: [r(318, 86, { 'image': requireImage('gfx/scene/plainsmg4.png') })],
    frameDuration: 30
};
var wheatAnimation = {
    frames: [r(200, 100, { 'image': requireImage('gfx/scene/plainsmg1.png') })],
    frameDuration: 30
};
var thickGrass = {
    frames: [r(300, 300, { 'image': requireImage('gfx/scene/plainsmg.png') })],
    frameDuration: 30
};
var darkGrass = {
    frames: [r(300, 300, { 'image': requireImage('gfx/scene/plainsmg2.png') })],
    frameDuration: 30
};
var lightGrass = {
    frames: [r(300, 300, { 'image': requireImage('gfx/scene/plainsmg3.png') })],
    frameDuration: 30
};

var addElementToLayer = function addElementToLayer(state, layerName) {
    var world = state.world;
    var layer = _extends({}, world[layerName]);
    if (!layer.spriteData) {
        return state;
    }
    var elementsData = layer.spriteData;
    var newSprite = null,
        lastSprite = layer.sprites[layer.sprites.length - 1];
    var safety = 0;
    while ((!lastSprite || lastSprite.left < WIDTH) && safety++ < 20) {
        var spriteData = lastSprite ? elementsData[random.element(lastSprite.next)] : random.element(elementsData);
        if (!spriteData) {
            throw new Error('missing sprite date from one of: ' + lastSprite.next);
        }
        var animation = spriteData.animation,
            scale = spriteData.scale;

        if (Array.isArray(animation)) {
            animation = random.element(animation);
        }
        var offset = lastSprite ? lastSprite.offset : 0;
        if (Array.isArray(offset)) {
            offset = random.element(offset);
        }
        if (lastSprite) {
            offset *= lastSprite.scale || 1;
            offset += lastSprite.left + lastSprite.width;
        }
        newSprite = getNewSpriteState(_extends({}, animation.frames[0], {
            top: getGroundHeight(state) + layer.yOffset,
            left: offset
        }, spriteData, {
            animation: animation
        }));
        newSprite.height *= scale;
        newSprite.width *= scale;
        newSprite.top -= newSprite.height;
        if (!lastSprite) newSprite.left -= newSprite.width / 2; // Start with the first sprite half off of the screen.
        layer.sprites = [].concat(_toConsumableArray(layer.sprites), [newSprite]);
        lastSprite = newSprite;
    }
    world = _extends({}, world, _defineProperty({}, layerName, layer));
    return _extends({}, state, { world: world });
};

var advanceLayer = function advanceLayer(state, layerName) {
    var layer = _extends({}, state.world[layerName]);
    var sprites = [].concat(_toConsumableArray(layer.sprites));
    for (var _i = 0; _i < sprites.length; _i++) {
        var sprite = sprites[_i];
        sprites[_i] = _extends({}, sprite, {
            left: sprite.left + sprite.vx - state.world.vx * layer.xFactor,
            top: sprite.top + sprite.vy + state.world.vy * layer.yFactor,
            animationTime: sprite.animationTime + FRAME_LENGTH
        });
        if (sprites[_i].onHit) {
            var frame = getFrame(sprites[_i].animation, sprites[_i].animationTime);
            var hitBox = new Rectangle(frame.hitBox || frame).scale(sprites[_i].scale).moveTo(sprites[_i].left, sprites[_i].top);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = state.playerAttacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attack = _step.value;

                    if (Rectangle.collision(hitBox, attack)) {
                        state = sprites[_i].onHit(state, layerName, _i);
                        layer = _extends({}, state.world[layerName]);
                        sprites = [].concat(_toConsumableArray(layer.sprites));
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }
    sprites = sprites.filter(function (sprite) {
        return sprite.left + sprite.width > 0;
    });
    var world = _extends({}, state.world, _defineProperty({}, layerName, _extends({}, layer, { sprites: sprites })));
    return _extends({}, state, { world: world });
};

var advanceWorld = function advanceWorld(state) {
    var world = state.world;
    var _world = world,
        x = _world.x,
        y = _world.y,
        vx = _world.vx,
        vy = _world.vy,
        targetX = _world.targetX,
        targetY = _world.targetY,
        targetFrames = _world.targetFrames,
        time = _world.time;

    x += vx;
    y += vy;
    y = Math.max(0, y);
    targetFrames--;
    var targetVx = (targetX - x) / targetFrames;
    vx = (targetVx + vx) / 2;
    var targetVy = (targetY - y) / targetFrames;
    //vy = (targetVy + vy) / 2;
    vy = Math.max((targetVy + vy) / 2, -y);
    world = _extends({}, world, { x: x, y: y, vx: vx, vy: vy });
    state = _extends({}, state, { world: world });

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = world.bgLayerNames[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var layerName = _step2.value;

            state = addElementToLayer(state, layerName);
            state = advanceLayer(state, layerName);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = world.mgLayerNames[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _layerName = _step3.value;

            state = addElementToLayer(state, _layerName);
            state = advanceLayer(state, _layerName);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = world.ngLayerNames[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _layerName2 = _step4.value;

            state = addElementToLayer(state, _layerName2);
            state = advanceLayer(state, _layerName2);
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = world.fgLayerNames[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _layerName3 = _step5.value;

            state = addElementToLayer(state, _layerName3);
            state = advanceLayer(state, _layerName3);
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    world = state.world;

    // For now just set the targetFrame and destination constantly ahead.
    // Later we can change this depending on the scenario.
    targetFrames = 50 * 5;
    targetX = x + 1000;
    if (time % 60000 > 45000) {
        targetY = y;
    } else if (time % 60000 > 30000) {
        targetY = 400;
    } else if (time % 60000 > 15000) {
        targetY = y;
    } else {
        targetY = -100;
    }
    time += FRAME_LENGTH;
    world = _extends({}, world, { targetX: targetX, targetY: targetY, targetFrames: targetFrames, time: time });
    return _extends({}, state, { world: world });
};

var getGroundHeight = function getGroundHeight(state) {
    return GAME_HEIGHT - state.world.groundHeight + state.world.y * state.world.nearground.yFactor;
};

var renderBackgroundLayer = function renderBackgroundLayer(context, _ref2) {
    var frame = _ref2.frame,
        x = _ref2.x,
        y = _ref2.y,
        maxY = _ref2.maxY;

    x = Math.round(x);
    y = Math.round(y);
    if (typeof maxY === 'number') {
        y = Math.min(maxY, y);
    }
    var left = x % frame.width;
    var right = (x + WIDTH) % frame.width;
    if (right <= left) {
        var leftWidth = frame.width - left;
        context.drawImage(frame.image, left, 0, leftWidth, frame.height, 0, y, leftWidth, frame.height);
        context.drawImage(frame.image, 0, 0, right, frame.height, leftWidth, y, right, frame.height);
    } else {
        context.drawImage(frame.image, left, 0, frame.width, frame.height, 0, y, frame.width, frame.height);
    }
};
var renderBackground = function renderBackground(context, state) {
    var world = state.world;
    var x = world.x,
        y = world.y;
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = world.bgLayerNames[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var layerName = _step6.value;

            renderLayer(context, state, layerName);
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    context.save();
    context.translate(0, HUD_HEIGHT);
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = world.mgLayerNames[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var _layerName4 = _step7.value;

            renderLayer(context, state, _layerName4);
        }
    } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
            }
        } finally {
            if (_didIteratorError7) {
                throw _iteratorError7;
            }
        }
    }

    var groundHeight = getGroundHeight(state);
    var target = new Rectangle(groundLoop).moveTo(-(x * world.nearground.xFactor % groundLoop.width), groundHeight - groundLoop.height / 2);
    if (target.top < GAME_HEIGHT) {
        var safety = 0;
        while (target.left >= -10000 && target.left < WIDTH && safety++ < 10) {
            drawImage(context, groundLoop.image, groundLoop, target);
            target = target.translate(groundLoop.width, 0);
        }
    }
    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
        for (var _iterator8 = world.ngLayerNames[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var _layerName5 = _step8.value;

            renderLayer(context, state, _layerName5);
        }
    } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
            }
        } finally {
            if (_didIteratorError8) {
                throw _iteratorError8;
            }
        }
    }

    context.restore();
};

var renderForeground = function renderForeground(context, state) {
    context.save();
    context.translate(0, HUD_HEIGHT);
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
        for (var _iterator9 = state.world.fgLayerNames[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var layerName = _step9.value;

            renderLayer(context, state, layerName);
        }
    } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                _iterator9.return();
            }
        } finally {
            if (_didIteratorError9) {
                throw _iteratorError9;
            }
        }
    }

    context.restore();
};

var renderLayer = function renderLayer(context, state, layerName) {
    var layer = state.world[layerName];
    var frame = void 0;
    if (layer.animation) {
        frame = getFrame(layer.animation, state.world.time);
        renderBackgroundLayer(context, { frame: frame,
            x: state.world.x * layer.xFactor + (layer.xOffset || 0),
            y: state.world.y * layer.yFactor + (layer.yOffset || 0)
        });
    }
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
        for (var _iterator10 = layer.sprites[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var sprite = _step10.value;

            frame = getFrame(sprite.animation, sprite.animationTime);
            drawImage(context, frame.image, frame, sprite);
        }
    } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion10 && _iterator10.return) {
                _iterator10.return();
            }
        } finally {
            if (_didIteratorError10) {
                throw _iteratorError10;
            }
        }
    }
};

module.exports = {
    getNewWorld: getNewWorld,
    advanceWorld: advanceWorld,
    getGroundHeight: getGroundHeight,
    renderBackground: renderBackground,
    renderForeground: renderForeground
};

},{"Rectangle":1,"animations":2,"draw":5,"gameConstants":8,"random":12,"sprites":15}]},{},[4]);
