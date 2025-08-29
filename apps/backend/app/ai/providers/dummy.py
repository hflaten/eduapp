import re
from collections import Counter
from typing import List
from ..base import AIProvider

# Lightweight English stopwords for a rough heuristic
_STOP = {
    "the","a","an","in","on","at","to","for","from","by","and","or","of","is","are","was","were",
    "it","this","that","these","those","with","as","be","been","being","but","if","than","then",
    "so","such","can","could","should","would","may","might","do","does","did","have","has","had",
    "you","your","we","our","they","their","he","she","his","her","i","me","my","mine","us","them"
}

class DummyLocalProvider(AIProvider):
    """
    Very simple heuristic:
    - tokenize words
    - drop stopwords/short tokens
    - count frequency
    - return top-k as "concepts"
    """
    def key_concepts(self, text: str, k: int = 5) -> List[str]:
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9\-]+", text.lower())
        tokens = [t for t in tokens if len(t) > 2 and t not in _STOP]
        if not tokens:
            return []
        counts = Counter(tokens)
        top = [w for (w, _) in counts.most_common(k*2)]
        # make them look like "concept phrases" (single words for now)
        dedup = []
        for w in top:
            if w not in dedup:
                dedup.append(w)
            if len(dedup) >= k:
                break
        return dedup
