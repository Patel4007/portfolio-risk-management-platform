import os
from llama_cpp import Llama
import yaml
from pathlib import Path


class ChatEngine:
    def __init__(
        self,
        registry_path: str = "backend/config/model_registry.yaml",
        model_name: str | None = None,
        model_path: str | None = None,  
        n_threads: int = 4,
    ):
        self.ci_mode = os.getenv("CI", "false").lower() == "true"

        if self.ci_mode:
            self.model_name = "ci-model"
            self.system_prompt = "CI mode. You are a finance expert. Answer the question concisely."
            self.model = None
            return

        if model_path:
            self.model_path = model_path
            self.model_name = model_name or "default-env-model"
            self.n_ctx = 1024
        else:
            
            registry = self._load_registry(registry_path)
            if model_name is None:
                model_name = registry["default_model"]

            model_cfg = registry["models"][model_name]
            self.model_name = model_name
            self.model_path = model_cfg["path"]
            self.n_ctx = model_cfg.get("context_size", 1024)

        self.model = Llama(
            model_path=self.model_path,
            n_threads=n_threads,
            n_ctx=self.n_ctx,
            seed=42,
        )

        self.system_prompt = "You are a finance expert. Answer the question concisely."

    def _load_registry(self, path: str):
        with open(Path(path), "r") as f:
            return yaml.safe_load(f)

    def stream_response(self, user_message: str, max_tokens: int = 512):
        if self.ci_mode:
            yield "CI response"
            return

        prompt = f"{self.system_prompt}\n\nQuestion: {user_message}\nAnswer:"
        for token in self.model.stream(prompt, max_tokens=max_tokens):
            yield token["text"]
