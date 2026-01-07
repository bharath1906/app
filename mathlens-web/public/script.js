let mode = null;
let video, overlay, canvas, ctx;
let bubbles = [];
let expressions = [];
let values = [];

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    overlay = document.getElementById('overlay');
    canvas = overlay.getContext('2d');

    document.getElementById('low-to-high').addEventListener('click', () => setMode('low-to-high'));
    document.getElementById('high-to-low').addEventListener('click', () => setMode('high-to-low'));
    document.getElementById('back').addEventListener('click', showModeSelection);

    // Wait for OpenCV to load
    cv.onRuntimeInitialized = () => {
        console.log('OpenCV loaded');
    };
});

function setMode(selectedMode) {
    mode = selectedMode;
    localStorage.setItem('mathlens-mode', mode);
    showCamera();
}

function showModeSelection() {
    document.getElementById('mode-selection').classList.remove('hidden');
    document.getElementById('camera-screen').classList.add('hidden');
    stopCamera();
}

function showCamera() {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('camera-screen').classList.remove('hidden');
    startCamera();
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        video.play();
        processFrame();
    } catch (err) {
        console.error('Camera error:', err);
    }
}

function stopCamera() {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

async function processFrame() {
    if (!video.videoWidth) {
        requestAnimationFrame(processFrame);
        return;
    }

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    // Capture frame
    canvas.drawImage(video, 0, 0);

    // Detect bubbles
    bubbles = detectBubbles();

    // OCR and evaluate
    expressions = [];
    values = [];
    for (let bubble of bubbles.slice(0, 3)) {
        const cropped = cropBubble(bubble);
        const text = await recognizeText(cropped);
        if (text) {
            const value = evaluateExpression(text);
            if (value !== null) {
                expressions.push(text);
                values.push(value);
            }
        }
    }

    // Sort and overlay
    if (values.length === 3) {
        const sortedIndices = mode === 'low-to-high' ?
            values.map((v, i) => i).sort((a, b) => values[a] - values[b]) :
            values.map((v, i) => i).sort((a, b) => values[b] - values[a]);

        canvas.clearRect(0, 0, overlay.width, overlay.height);
        sortedIndices.forEach((index, rank) => {
            const bubble = bubbles[index];
            canvas.fillStyle = 'white';
            canvas.font = '48px Arial';
            canvas.fillText((rank + 1).toString(), bubble.centerX, bubble.centerY);
        });
    }

    requestAnimationFrame(processFrame);
}

function detectBubbles() {
    const src = cv.imread(overlay);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const thresh = new cv.Mat();
    cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const detected = [];
    for (let i = 0; i < contours.size(); ++i) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        if (area < 1000) continue;
        const rect = cv.boundingRect(cnt);
        const aspect = rect.width / rect.height;
        if (aspect < 0.5 || aspect > 2.0) continue;
        detected.push({
            x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            centerX: rect.x + rect.width / 2, centerY: rect.y + rect.height / 2
        });
    }

    src.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
    return detected.slice(0, 3);
}

function cropBubble(bubble) {
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = bubble.width;
    croppedCanvas.height = bubble.height;
    const ctx = croppedCanvas.getContext('2d');
    ctx.drawImage(overlay, bubble.x, bubble.y, bubble.width, bubble.height, 0, 0, bubble.width, bubble.height);
    return croppedCanvas;
}

async function recognizeText(canvas) {
    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng', { logger: m => console.log(m) });
        return text.trim();
    } catch (e) {
        return null;
    }
}

function evaluateExpression(expr) {
    try {
        // Preprocess
        const processed = expr.replace(/√/g, 'sqrt').replace(/\^/g, '**');
        return math.evaluate(processed);
    } catch (e) {
        return null;
    }
}