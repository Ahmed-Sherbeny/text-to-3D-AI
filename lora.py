"""
lora.py
-------
Generic LoRA (Low-Rank Adaptation) injection for OptiForge3D's Shap-E
diffusion transformer. Shap-E isn't a HuggingFace `transformers` model,
so we can't just call `peft.get_peft_model()` — this implements the
same idea (freeze the base weights, learn a small low-rank delta)
directly against Shap-E's `nn.Linear` layers.

Usage:
    model, _ = load_shap_e("text300M")
    lora_layers = inject_lora(model, target_substrings=["attn", "mlp"], r=8, alpha=16)
    # ... train only the LoRA params ...
    save_lora_weights(lora_layers, "lora_text300M.pt")

    # later, on a fresh base model:
    model, _ = load_shap_e("text300M")
    lora_layers = inject_lora(model, target_substrings=["attn", "mlp"], r=8, alpha=16)
    load_lora_weights(lora_layers, "lora_text300M.pt")
"""

import logging
from typing import Iterable

import torch
import torch.nn as nn

logger = logging.getLogger("optiforge3d.lora")


class LoRALinear(nn.Module):
    """
    Wraps an existing nn.Linear, freezes it, and adds a trainable
    low-rank delta: output = base(x) + (alpha / r) * B(A(x))

    A: (in_features -> r), B: (r -> out_features). Only A and B are
    trainable, which is where the "parameter reduction" comes from —
    for a linear layer of shape (in, out), full fine-tuning updates
    in*out parameters; LoRA updates r*(in+out), which is tiny when
    r << min(in, out).
    """

    def __init__(self, base_linear: nn.Linear, r: int = 8, alpha: int = 16, dropout: float = 0.0):
        super().__init__()
        self.base = base_linear
        self.base.weight.requires_grad_(False)
        if self.base.bias is not None:
            self.base.bias.requires_grad_(False)

        in_features = base_linear.in_features
        out_features = base_linear.out_features

        self.r = r
        self.scaling = alpha / r
        self.lora_A = nn.Linear(in_features, r, bias=False)
        self.lora_B = nn.Linear(r, out_features, bias=False)
        self.dropout = nn.Dropout(dropout) if dropout > 0 else nn.Identity()

        # Standard LoRA init: A ~ Kaiming, B = zeros, so the adapter
        # starts as a no-op and training only perturbs from the
        # pretrained behavior.
        nn.init.kaiming_uniform_(self.lora_A.weight, a=5 ** 0.5)
        nn.init.zeros_(self.lora_B.weight)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        base_out = self.base(x)
        lora_out = self.lora_B(self.lora_A(self.dropout(x))) * self.scaling
        return base_out + lora_out

    def merged_weight(self) -> torch.Tensor:
        """Returns base weight + LoRA delta merged into a single dense
        matrix — useful for exporting a fine-tuned model with zero
        inference overhead (no extra matmuls at serving time)."""
        delta = (self.lora_B.weight @ self.lora_A.weight) * self.scaling
        return self.base.weight + delta


def inject_lora(
    model: nn.Module,
    target_substrings: Iterable[str] = ("attn", "mlp", "linear"),
    r: int = 8,
    alpha: int = 16,
    dropout: float = 0.0,
) -> dict:
    """
    Walks `model`, replaces every nn.Linear whose fully-qualified name
    contains one of `target_substrings` with a LoRALinear wrapper.
    Returns {layer_name: LoRALinear} for saving/loading adapter weights.

    Freezes every other parameter in the model so only the LoRA deltas
    (and, if you choose, the final projection head) are trainable.
    """
    for p in model.parameters():
        p.requires_grad_(False)

    lora_layers = {}
    for name, module in list(model.named_modules()):
        if not isinstance(module, nn.Linear):
            continue
        if not any(s in name for s in target_substrings):
            continue

        parent_name, _, child_name = name.rpartition(".")
        parent = model.get_submodule(parent_name) if parent_name else model
        wrapped = LoRALinear(module, r=r, alpha=alpha, dropout=dropout)
        setattr(parent, child_name, wrapped)
        lora_layers[name] = wrapped

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(
        "Injected LoRA into %d layer(s). Trainable params: %s / %s (%.3f%%)",
        len(lora_layers), f"{trainable_params:,}", f"{total_params:,}",
        100 * trainable_params / max(total_params, 1),
    )
    return lora_layers


def save_lora_weights(lora_layers: dict, path: str) -> None:
    """Saves ONLY the small A/B matrices — this is the file you actually
    want to check into the ml branch, not the multi-GB base checkpoint."""
    state = {
        name: {"lora_A": layer.lora_A.state_dict(), "lora_B": layer.lora_B.state_dict()}
        for name, layer in lora_layers.items()
    }
    torch.save(state, path)
    logger.info("Saved LoRA adapter weights to %s", path)


def load_lora_weights(lora_layers: dict, path: str) -> None:
    state = torch.load(path, map_location="cpu")
    for name, layer in lora_layers.items():
        if name not in state:
            logger.warning("No saved weights for layer %s, skipping.", name)
            continue
        layer.lora_A.load_state_dict(state[name]["lora_A"])
        layer.lora_B.load_state_dict(state[name]["lora_B"])
    logger.info("Loaded LoRA adapter weights from %s", path)


def count_trainable_parameters(model: nn.Module) -> tuple[int, int]:
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    return trainable, total
