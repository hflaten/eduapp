from typing import List

class AIProvider:
    """Abstract AI interface to enable swapping providers without touching routes."""
    def key_concepts(self, text: str, k: int = 5) -> List[str]:
        raise NotImplementedError
