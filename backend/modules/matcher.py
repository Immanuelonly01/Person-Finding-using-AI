import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class Matcher:
    """Calculates cosine similarity between a target and reference embedding."""
    def __init__(self, threshold: float):
        self.threshold = threshold

    def match(self, target_embedding: np.ndarray, reference_embedding: np.ndarray):
        """
        Compares two embeddings.
        Returns: (similarity_score: float, is_match: bool)
        """
        if target_embedding is None or reference_embedding is None:
            return 0.0, False
            
        # Reshape for sklearn's cosine_similarity function
        target_emb = target_embedding.reshape(1, -1)
        ref_emb = reference_embedding.reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(target_emb, ref_emb)[0][0]
        
        is_match = similarity >= self.threshold
        
        return similarity, is_match