async function getCurrentTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]);
        });
    });
}
document.addEventListener('DOMContentLoaded', async () => {
    const SIZE_LEVELS = {
        small: 16,
        medium: 22,
        large: 28
    };
    const canvasContainer = document.getElementById('qrcode-canvas');
    const input = document.getElementById('qr-input');
    const tab = await getCurrentTab();

    function updateCanvas(sizeLevel = "small") {
        const size = `${SIZE_LEVELS[sizeLevel] * 16}px`;
        canvasContainer.style.width = size;
        canvasContainer.style.height = size;
        canvasContainer.dataset.sizeLevel = sizeLevel
    }

    function generateQRCode() {
        try {
            while (canvasContainer.lastChild) {
                canvasContainer.lastChild.remove()
            }
            const text = input.value || tab.url;
            new QRCodeStyling({ data: text, margin: 8 }).append(canvasContainer);
        } catch (error) {
            console.error(error);
        }
    }
    try {
        canvasContainer.title = chrome.i18n.getMessage("clickToChangeSize");
        input.placeholder = tab.url;
        updateCanvas();
        generateQRCode(tab.url);
    } catch (error) {
        console.error(error);
    }

    input.addEventListener('input', (e) => {
        const text = e.target.value;
        if (text) {
            generateQRCode(text);
        } else {
            getCurrentTab().then((tab) => {
                generateQRCode(tab.url);
            });
        }
    });

    canvasContainer.addEventListener('click', () => {
        const currentLevel = canvasContainer.dataset.sizeLevel || 'small';
        const levels = ['small', 'medium', 'large'];
        const nextIndex = (levels.indexOf(currentLevel) + 1) % levels.length;
        updateCanvas(levels[nextIndex]);
    });
});
