// show a message if the user's microphone is too loud
const content = document.getElementById('content');
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
var threshold = 30;
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const checkVolume = () => {
            let start = Date.now();
            audioContext.resume();
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            
            content.style.opacity = Math.pow(average / threshold, 2);

            draw(average);
            let end = Date.now();
            let elapsed = end - start;
            setTimeout(checkVolume, 1 / 30 - elapsed); // delta time at 30fps
        };
        checkVolume();
    })
    .catch(err => {
        content.textContent = 'Error: ' + err.message;
    });

function draw(vol) {
    const ctx = canvas.getContext('2d');
    const styles = document.body.computedStyleMap();
    ctx.fillStyle = styles.get('background-color').toString();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(1, 'yellow');
    gradient.addColorStop(0, 'red');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - vol, canvas.width, vol);
    ctx.fillStyle = styles.get('color').toString();
    // threshold
    ctx.fillText(Math.floor(threshold), 5, canvas.height - threshold - 5);
    ctx.fillRect(0, canvas.height - threshold, canvas.width, 2);
    ctx.fillText(Math.floor(vol), 30, 10);
}

var dragging = false;
const isInside = (x, y, rx, ry, rw, rh) => x > rx && x < rx + rw && y > ry && y < ry + rh;

canvas.addEventListener('mousedown', e => {
    if (isInside(e.offsetX, e.offsetY, 0, canvas.height - threshold, canvas.width, 5)) {
        dragging = true;
    };
});

canvas.addEventListener('mousemove', e => {
    if (dragging) {
        canvas.style.cursor = 'grabbing';
        threshold = canvas.height - e.offsetY;
    } else if (isInside(e.offsetX, e.offsetY, 0, canvas.height - threshold, canvas.width, 5)) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mouseup', e => {
    dragging = false;
    canvas.style.cursor = 'default';
});
