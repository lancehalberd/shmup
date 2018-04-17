const sounds = new Map();
let numberOfSoundsLeftToLoad = 0, soundsMuted = false;

function ifdefor(value, defaultValue) {
    if (value !== undefined && !(typeof value === 'number' && isNaN(value))) {
        return value;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    return null;
}

const requireSound = source => {
    var offset, volume, customDuration;
    [source, offset, volume] = source.split('+');
    if (offset) [offset, customDuration] = offset.split(':');
    if (sounds.has(source)) return sounds.get(source);
    var newSound = new Audio(source);
    newSound.instances = new Set();
    newSound.offset = offset || 0;
    newSound.customDuration = customDuration || 0;
    newSound.defaultVolume = volume || 1;
    sounds.set(source, newSound);
    return newSound;
};

const playingSounds = new Set();
const playSound = (source, area) => {
    if (soundsMuted) return;
    var offset,volume, customDuration;
    [source, offset, volume] = source.split('+');
    if (offset) [offset, customDuration] = offset.split(':');
    var sound = requireSound(source);
    // Custom sound objects just have a play and forget method on them.
    if (!(sound instanceof Audio)) {
        sound.play();
        return;
    }
    if (sound.instances.size >= 5) return;
    var newInstance = sound.cloneNode(false);
    newInstance.currentTime = (ifdefor(offset || sound.offset) || 0) / 1000;
    newInstance.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    newInstance.play().then(() => {
        var timeoutId;
        if (customDuration || sound.customDuration) {
            stimeoutId = setTimeout(() => {
                sound.instances.delete(newInstance);
                playingSounds.delete(newInstance);
                newInstance.onended = null;
                newInstance.pause();
            }, parseInt(customDuration || sound.customDuration));
        }
        playingSounds.add(newInstance);
        sound.instances.add(newInstance);
        newInstance.onended = () => {
            sound.instances.delete(newInstance);
            playingSounds.delete(newInstance);
            newInstance.onended = null;
            clearTimeout(timeoutId);
        }
    });
};

let previousTrack = null;
const playTrack = (source, timeOffset) => {
    let offset, volume;
    [source, offset, volume] = source.split('+');
    if (previousTrack) {
        previousTrack.pause();
    }
    const sound = requireSound(source);
    sound.currentTime = (ifdefor(offset, sound.offset) || 0) / 1000 + timeOffset / 1000;
    sound.volume = Math.min(1, (ifdefor(volume, sound.defaultVolume) || 1) / 50);
    if (soundsMuted) {
        sound.volume = 0;
    }
    sound.play();
    previousTrack = sound;
};

const stopTrack = () => {
    if (previousTrack) {
        previousTrack.pause();
    }
};

// This hasn't been tested yet, not sure if it works.
const muteSounds = () => {
    soundsMuted = true;
    if (previousTrack) {
        previousTrack.volume = 0;
    }
    for (const sound of playingSounds) {
        sound.volume = 0;
    }
};

[
    'sfx/shoot.mp3+0+2',
    'sfx/hit.mp3+200+1',
    'sfx/flydeath.mp3+0+5',
    'sfx/coin.mp3',
    'sfx/startgame.mp3',
    'sfx/exclamation.mp3+0+3',
    'sfx/heal.mp3+200+5',
    'sfx/death.mp3+0+1',
    // See credits.html for: mobbrobb.
    'bgm/river.mp3+0+1',
    'bgm/area.mp3+0+2',
].forEach(requireSound);

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};
const distortionCurve = makeDistortionCurve(100);

function playBeeps(frequencies, volume, duration, {smooth=false, swell=false, taper=false, distortion=false}) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    if (smooth) oscillator.frequency.setValueCurveAtTime(frequencies, audioContext.currentTime, duration);
    else {
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
    play() {
        playBeeps([2000, 8000, 4000], .01, .1, {});
    }
});
sounds.set('wand', {
    play() {
        playBeeps([1200, 400], 0.01, .1, {smooth: true, taper: true, swell: true, distortion: true});
    }
});

module.exports = {
    playSound,
    playTrack,
    stopTrack,
};
