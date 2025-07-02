async function getCurrentTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]);
        });
    });
}
function debounce(func, delay, { immediate = false } = {}) {
    let timer = null;
    const debounced = function (...args) {
        const callNow = immediate && !timer;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = null;
            if (!immediate) {
                func.apply(this, args);
            }
        }, delay);
        if (callNow) {
            func.apply(this, args);
        }
    };
    debounced.cancel = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };
    return debounced;
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
    const tabFavIcon = tab.favIconUrl;

    let QRSizeLevel = "small"
    let QRSize = SIZE_LEVELS[QRSizeLevel] * 16

    function updateCanvas(sizeLevel) {
        QRSizeLevel = sizeLevel
        QRSize = SIZE_LEVELS[QRSizeLevel] * 16
        const size = `${QRSize}px`;
        canvasContainer.style.width = size;
        canvasContainer.style.height = size;
    }

    function generateQRCode() {
        let option = {
            width: QRSize * 3,
            height: QRSize * 3,
            margin: 8 * 3,
            type: "canvas",
            shape: "square",
            dotsOptions: {
                type: "extra-rounded",
                roundSize: false,
                color: "#262626"
            },
            cornersSquareOptions: {
                color: "#262626"
            },
            backgroundOptions: {
                color: "#fafafa"
            }
        }
        try {
            canvasContainer.replaceChildren();
            option.data = input.value ? input.value : tab.url;
            if (tabFavIcon) {
                option.image = tabFavIcon;
                option.imageOptions = {
                    saveAsBlob: true,
                    crossOrigin: "anonymous",
                    hideBackgroundDots: true,
                    imageSize: 0.25,
                    margin: 2
                }
            }
            new QRCodeStyling(option).append(canvasContainer);
        } catch (error) {
            console.error(error);
        }
    }
    try {
        canvasContainer.title = chrome.i18n.getMessage("clickToChangeSize");
        input.placeholder = tab.url;
        updateCanvas(QRSizeLevel);
        generateQRCode();
    } catch (error) {
        console.error(error);
    }
    const debouncedInputEvent = debounce(generateQRCode, 300);
    input.addEventListener('input', debouncedInputEvent);
    canvasContainer.addEventListener('click', () => {
        const levels = ['small', 'medium', 'large'];
        const nextIndex = (levels.indexOf(QRSizeLevel) + 1) % levels.length;
        updateCanvas(levels[nextIndex]);
        generateQRCode();
    });
});
