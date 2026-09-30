const API_URL = "http://localhost:8000/api/v1/analyze/image";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ANALYZE_IMAGE' && request.payload) {
        processImage(request.payload)
            .then(data => sendResponse(data))
            .catch(err => {
                console.error("[UnplugAI] API Error:", err);
                sendResponse({ error: true });
            });
        return true; // Keep message channel open for async response
    }
});

async function processImage(imageUrl: string) {
    // Fetch the image as a blob to send as multipart/form-data
    const imgRes = await fetch(imageUrl);
    const blob = await imgRes.blob();

    const formData = new FormData();
    formData.append("file", blob, "image.jpg");

    const response = await fetch(API_URL, {
        method: "POST",
        body: formData
    });

    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
}