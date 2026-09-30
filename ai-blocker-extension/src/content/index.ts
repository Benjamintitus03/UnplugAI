import type { BlocklistRules } from "../shared/types/blocklist";
import { observeImagesInNode } from "./imageProcessor";
// import { processTextNode } from "./textProcessor"; // Assuming you have something like this

// 1. Load your existing rules (however you currently do it)
let currentRules: BlocklistRules | null = null;

async function loadRules() {
    // Replace with your actual rule loading logic
    currentRules = await chrome.storage.local.get('rules') as BlocklistRules;
}

// 2. The Unified DOM Observer
const domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
                // Route to the new Image Processor
                observeImagesInNode(node);
                
                // Route to your existing Text/Blocklist logic
                if (currentRules) {
                    // processTextNode(node, currentRules);
                }
            }
        });
    }
});

// 3. Boot up the extension
async function init() {
    await loadRules();
    
    // Catch images already on the page before the observer starts
    document.querySelectorAll('img').forEach(img => observeImagesInNode(img));
    
    // Start watching for new elements
    domObserver.observe(document.body, { childList: true, subtree: true });
    
    console.log("[Unplug AI] Content script loaded and observing.");
}

init();