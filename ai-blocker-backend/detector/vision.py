import torch
import numpy as np
from PIL import Image
from torchvision import transforms
from transformers import ViTForImageClassification, ViTImageProcessor

class SyntheticImageDetector:
    def __init__(self, threshold=0.85):
        self.threshold = threshold
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # In a real prod environment, this points to your fine-tuned local weights
        self.processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
        self.model = ViTForImageClassification.from_pretrained('google/vit-base-patch16-224')
        self.model.to(self.device)
        self.model.eval()

    def _compute_fft_score(self, image: Image.Image) -> float:
        """
        Calculates high-frequency spectral artifacts common in GANs/Diffusion models.
        """
        gray = image.convert('L')
        img_arr = np.array(gray)
        
        f_transform = np.fft.fft2(img_arr)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1)
        
        h, w = magnitude_spectrum.shape
        center_h, center_w = h // 2, w // 2
        radius = min(h, w) // 4
        
        y, x = np.ogrid[:h, :w]
        mask = (x - center_w)**2 + (y - center_h)**2 <= radius**2
        
        low_freq_energy = np.sum(magnitude_spectrum[mask])
        high_freq_energy = np.sum(magnitude_spectrum[~mask])
        
        # Synthetic images often have abnormally high high-frequency energy due to upsampling grids
        ratio = high_freq_energy / (low_freq_energy + 1e-5)
        
        # Heuristic scaling for the ensemble
        return float(np.clip(ratio * 1.5, 0.0, 1.0))

    def _compute_spatial_score(self, image: Image.Image) -> float:
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            # Assuming class 1 is fine-tuned to 'synthetic'
            prob = torch.nn.functional.softmax(logits, dim=-1)[0][1].item()
        return prob

    def analyze(self, image: Image.Image) -> dict:
        spatial_score = self._compute_spatial_score(image)
        fft_score = self._compute_fft_score(image)
        
        # Weighted ensemble: ViT is better at semantic errors, FFT catches pixel-level artifacts
        final_score = (spatial_score * 0.65) + (fft_score * 0.35)
        is_synthetic = final_score >= self.threshold
        
        return {
            "is_synthetic": is_synthetic,
            "confidence": round(final_score, 4),
            "spatial_score": round(spatial_score, 4),
            "frequency_score": round(fft_score, 4)
        }