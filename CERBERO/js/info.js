// info.js - Effetti speciali per la pagina info.html

document.addEventListener('DOMContentLoaded', () => {
    // Ora il canvas viene selezionato all'interno di DOMContentLoaded
    const canvas = document.getElementById('matrixCanvas');
    
    // Controllo più esplicito prima di chiamare getContext
    if (!canvas) {
        console.error('Canvas element with ID "matrixCanvas" not found.');
        return; 
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('2D rendering context not supported for canvas.');
        return;
    }

    const backgroundContainer = document.querySelector('.info-special-background');

    let animationFrameId;
    let lastFrameTime = 0;
    const desiredFrameRate = 10; // Desidero circa 10 frame al secondo
    const frameInterval = 1000 / desiredFrameRate; // Intervallo in ms tra i frame

    const fontSize = 26; // Dimensione del font ingrandita
    let columns; // Dichiarata qui, assegnata in resizeCanvas

    const drops = [];

    function resizeCanvas() {
        canvas.width = backgroundContainer.clientWidth;
        canvas.height = backgroundContainer.clientHeight;
        columns = Math.floor(canvas.width / fontSize);

        if (drops.length < columns) {
            for (let i = drops.length; i < columns; i++) {
                drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
            }
        } else if (drops.length > columns) {
            drops.length = columns;
        }
    }

    // Chiamata a resizeCanvas dopo che fontSize e columns sono dichiarati
    resizeCanvas(); 
    window.addEventListener('resize', resizeCanvas);

    const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*()_+-=[]{};:,.<>/?';

    function drawMatrixEffect(currentTime) {
        animationFrameId = requestAnimationFrame(drawMatrixEffect);

        const elapsed = currentTime - lastFrameTime;

        if (elapsed > frameInterval) {
            lastFrameTime = currentTime - (elapsed % frameInterval);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Nero semi-trasparente
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#345DF2'; // COLORE BLU CERBERO
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.9) { 
                    drops[i] = 0;
                } else {
                    drops[i]++;
                }
            }
        }
    }

    if (document.visibilityState === 'visible') {
        drawMatrixEffect(0);
    } else {
        document.addEventListener('visibilitychange', function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                drawMatrixEffect(0);
            } else {
                cancelAnimationFrame(animationFrameId);
            }
        });
    }

    window.addEventListener('beforeunload', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });
});