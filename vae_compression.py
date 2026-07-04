"""
vae_compression.py
--------------------
Shap-E's `transmitter` model already encodes 3D shapes into a compact
latent code (it's structurally a VAE encoder/decoder pair). This module
adds a SECOND, much smaller learned bottleneck on top of that latent —
a small linear VAE that compresses Shap-E's latent further before it's
stored/transmitted/passed to the diffusion model, and decompresses it
back before mesh decoding.

Why bother, given Shap-E already compresses:
  - Shap-E's native latent (~1024-dim per point, thousands of points) is
    still large to cache/queue between Celery stages. A trained
    bottleneck of e.g. 256 or 128 dims per point cuts queue payload size
    and downstream diffusion parameter count substantially, at some
    reconstruction cost you control via `latent_dim`.
  - This is what "VAE compression for parameter reduction" refers to in
    the project plan: compress the working representation, not just the
    final mesh.

This is a standard reparameterization-trick VAE bottleneck — train it
with a reconstruction loss (+ small KL term) against Shap-E's own
latents before relying on it in production.
"""

import logging

import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger("optiforge3d.vae_compression")


class LatentBottleneckVAE(nn.Module):
    """
    Compresses Shap-E latent vectors of dimension `input_dim` down to
    `latent_dim` and back. Operates per-point, so it's applied to the
    full (n_points, input_dim) latent tensor via broadcasting over the
    point dimension.
    """

    def __init__(self, input_dim: int = 1024, latent_dim: int = 256, hidden_dim: int = 512):
        super().__init__()
        self.input_dim = input_dim
        self.latent_dim = latent_dim

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.SiLU(),
        )
        self.fc_mu = nn.Linear(hidden_dim, latent_dim)
        self.fc_logvar = nn.Linear(hidden_dim, latent_dim)

        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, input_dim),
        )

    def encode(self, x: torch.Tensor):
        h = self.encoder(x)
        return self.fc_mu(h), self.fc_logvar(h)

    def reparameterize(self, mu: torch.Tensor, logvar: torch.Tensor) -> torch.Tensor:
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z: torch.Tensor) -> torch.Tensor:
        return self.decoder(z)

    def forward(self, x: torch.Tensor):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar) if self.training else mu
        recon = self.decode(z)
        return recon, mu, logvar

    def compress(self, shap_e_latent: torch.Tensor) -> torch.Tensor:
        """Inference-time helper: latent in, compressed code out (no sampling)."""
        self.eval()
        with torch.no_grad():
            mu, _ = self.encode(shap_e_latent)
        return mu

    def decompress(self, compressed: torch.Tensor) -> torch.Tensor:
        """Inference-time helper: compressed code in, reconstructed Shap-E latent out."""
        self.eval()
        with torch.no_grad():
            return self.decode(compressed)


def vae_loss(recon: torch.Tensor, target: torch.Tensor, mu: torch.Tensor, logvar: torch.Tensor, kl_weight: float = 1e-4):
    """
    Standard VAE loss: reconstruction (MSE, since these are continuous
    latent codes not pixels) + a lightly-weighted KL term. Keep
    kl_weight small — the goal here is compression fidelity, not a
    generative prior, so we don't want KL dominating and collapsing
    the latent.
    """
    recon_loss = F.mse_loss(recon, target)
    kl_loss = -0.5 * torch.mean(1 + logvar - mu.pow(2) - logvar.exp())
    return recon_loss + kl_weight * kl_loss, recon_loss.item(), kl_loss.item()


def compression_ratio(bottleneck: LatentBottleneckVAE) -> float:
    return bottleneck.input_dim / bottleneck.latent_dim


def save_bottleneck(bottleneck: LatentBottleneckVAE, path: str) -> None:
    torch.save(
        {
            "state_dict": bottleneck.state_dict(),
            "input_dim": bottleneck.input_dim,
            "latent_dim": bottleneck.latent_dim,
        },
        path,
    )
    logger.info(
        "Saved latent bottleneck (%d -> %d dims, %.1fx compression) to %s",
        bottleneck.input_dim, bottleneck.latent_dim, compression_ratio(bottleneck), path,
    )


def load_bottleneck(path: str, device: torch.device) -> LatentBottleneckVAE:
    checkpoint = torch.load(path, map_location=device)
    bottleneck = LatentBottleneckVAE(
        input_dim=checkpoint["input_dim"], latent_dim=checkpoint["latent_dim"]
    ).to(device)
    bottleneck.load_state_dict(checkpoint["state_dict"])
    bottleneck.eval()
    return bottleneck
