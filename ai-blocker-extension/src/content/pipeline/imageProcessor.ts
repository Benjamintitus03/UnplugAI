const processedNodes = new WeakSet<HTMLElement>();

const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (!processedNodes.has(img)) {
                processedNodes.add(img);
                evaluateImage(img);
            }
        }
    });
}, { rootMargin: '400px' });

export function observeImagesInNode(node: HTMLElement) {
    if (node.tagName === 'IMG') {
        intersectionObserver.observe(node as HTMLImageElement);
    }
    const childImgs = node.querySelectorAll('img');
    childImgs.forEach(img => intersectionObserver.observe(img));
}

function evaluateImage(img: HTMLImageElement) {
    if (!img.src || img.src.startsWith('data:') || img.width < 100 || img.height < 100) return;

    chrome.runtime.sendMessage({ type: 'ANALYZE_IMAGE', payload: img.src }, (response) => {
        if (response && response.is_synthetic) {
            applyOverlay(img, response.confidence);
        }
    });
}

function applyOverlay(img: HTMLImageElement, confidence: number) {
    // ... (Keep the exact same overlay DOM manipulation code from before) ...
}