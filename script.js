// show a message if the user's microphone is too loud
const content = document.getElementById('content');
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
var threshold = 60;
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    content.textContent = 'This browser does not support the MediaDevices API';
    throw new Error('This browser does not support the MediaDevices API');
}
if (!audioContext) {
    content.textContent = 'This browser does not support the AudioContext API';
    throw new Error('This browser does not support the AudioContext API');
}
if (localStorage.getItem('threshold')) {
    threshold = localStorage.getItem('threshold') * 1;
}
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let start = Date.now();
        const checkVolume = () => {
            audioContext.resume();
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            
            content.style.opacity = Math.pow(average / threshold, 3);

            draw(average);
            let elapsed = (Date.now() - start)/1000; // in seconds
            document.getElementById('fps').textContent = Math.round(1/elapsed)+' fps';
            setTimeout(checkVolume, Math.max(0, 1/30 - elapsed)*1000);
            start = Date.now();
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
    gradient.addColorStop((canvas.height - threshold)/canvas.height, 'red');
    ctx.fillStyle = gradient;
    ctx.fillRect(5, canvas.height - vol, canvas.width-10, vol);
    ctx.fillStyle = styles.get('color').toString();
    // threshold
    ctx.fillText(Math.floor(threshold), 5, canvas.height - threshold - (canvas.height - threshold<17?-12:5));
    ctx.fillRect(0, canvas.height - threshold, canvas.width, 2);
    ctx.fillText(Math.floor(vol), 30, canvas.height - vol - 5);
}

var dragging = false;
const isInside = (x, y, rx, ry, rw, rh) => x > rx && x < rx + rw && y > ry && y < ry + rh;

canvas.addEventListener('mousedown', e => {
    if (isInside(e.offsetX, e.offsetY, 0, canvas.height - threshold, canvas.width, 10)) {
        dragging = true;
    };
});

document.addEventListener('mousemove', e => {
    if (dragging) {
        canvas.style.cursor = 'grabbing';
        threshold = canvas.height - e.offsetY;
        localStorage.setItem('threshold', threshold);
    } else if (isInside(e.offsetX, e.offsetY, 0, canvas.height - threshold, canvas.width, 10)) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
});

document.addEventListener('mouseup', e => {
    dragging = false;
    canvas.style.cursor = 'default';
});
