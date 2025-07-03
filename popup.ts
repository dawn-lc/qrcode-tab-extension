import QRCodeStyling, { type Options as QRCodeStylingOptions } from "qr-code-styling"
import browser from "webextension-polyfill"

async function getCurrentTab(): Promise<browser.Tabs.Tab> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) throw new Error("No active tab found");
    return tabs[0];
}

function toByteDataString(str) {
    const encoder = new TextEncoder();
    const byteArray = encoder.encode(str);
    let binaryStr = "";
    for (let i = 0; i < byteArray.length; i++) {
        binaryStr += String.fromCharCode(byteArray[i]);
    }
    return binaryStr;
}

function debounce(func: { (): void; apply?: any; }, delay: number | undefined, { immediate = false } = {}) {
    let timer: number | null;
    const debounced = function (...args: any[]) {
        const callNow = immediate && !timer;
        if (timer) {
            clearTimeout(timer);
        }
        timer = window.setTimeout(() => {
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
    const input = document.getElementById('qr-input') as HTMLInputElement;
    if (!canvasContainer || !input) throw new Error("Required elements not found");

    const tab = await getCurrentTab();
    const tabFavIcon = tab.favIconUrl;

    let QRSizeLevel = "small";
    let QRSize = SIZE_LEVELS[QRSizeLevel] * 16;

    function updateCanvas(sizeLevel: string) {
        QRSizeLevel = sizeLevel;
        QRSize = SIZE_LEVELS[QRSizeLevel] * 16;
        document.body.style.width = `${QRSize}px`;
    }

    function generateQRCode() {
        if (!canvasContainer || !input) return;

        let option: QRCodeStylingOptions = {
            width: QRSize * 3,
            height: QRSize * 3,
            margin: 8 * 3,
            type: "canvas",
            shape: "square",
            qrOptions: {
                mode: 'Byte',
                errorCorrectionLevel: 'H'
            },
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
            option.data = toByteDataString(input.value ? input.value : tab.url);
            if (tabFavIcon && !input.value) {
                option.image = tabFavIcon;
                option.imageOptions = {
                    saveAsBlob: true,
                    crossOrigin: "anonymous",
                    hideBackgroundDots: true,
                    imageSize: 0.12,
                    margin: 10
                }
            }
            new QRCodeStyling(option).append(canvasContainer);
        } catch (error) {
            console.error(error);
        }
    }
    try {
        canvasContainer.title = browser.i18n.getMessage("clickToChangeSize");
        if (tab.url) {
            input.placeholder = tab.url;
        }
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
