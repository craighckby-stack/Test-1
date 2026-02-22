import collections
import functools
import nltk
from typing import Dict, List, Optional, Set, Union

# Memoize NLTK stopwords download to prevent repeated downloads
@functools.lru_cache(maxsize=1)
def _download_nltk_stopwords(language: str):
    """
    Downloads NLTK stopwords for the specified language.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find(f'corpora/stopwords/{language}.zip')
    except nltk.downloader.DownloadError:
        nltk.download('stopwords', quiet=True) # Use quiet=True to suppress output

# Memoize stopwords set for performance
@functools.lru_cache(maxsize=None)
def _get_stopwords_set(language: str) -> Set[str]:
    """
    Retrieves the set of NLTK stopwords for a given language.
    Uses lru_cache to ensure the set is built only once per language.
    """
    _download_nltk_stopwords(language) # Ensure stopwords are downloaded
    return set(nltk.corpus.stopwords.words(language))

def _levenshtein_distance(word1: str, word2: str) -> int:
    """
    Calculates the Levenshtein distance between two words (edit distance).
    Time complexity: O(len(word1) * len(word2))
    Space complexity: O(len(word1) * len(word2))
    """
    m = len(word1)
    n = len(word2)
    
    # Create a DP table to store results of subproblems
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    # Initialize the first row and column
    # dp[i][0] represents the cost of deleting all characters from word1[:i] to get an empty string
    for i in range(m + 1):
        dp[i][0] = i
    # dp[0][j] represents the cost of inserting all characters from word2[:j] into an empty string
    for j in range(n + 1):
        dp[0][j] = j

    # Fill the DP table
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            # Cost is 0 if characters match, 1 if they don't (for substitution)
            cost = 0 if word1[i - 1] == word2[j - 1] else 1
            
            # dp[i][j] is the minimum of:
            # 1. Deletion: dp[i-1][j] + 1 (delete character from word1)
            # 2. Insertion: dp[i][j-1] + 1 (insert character into word1 to match word2)
            # 3. Substitution: dp[i-1][j-1] + cost (substitute character)
            dp[i][j] = min(dp[i - 1][j] + 1,      # Deletion
                           dp[i][j - 1] + 1,      # Insertion
                           dp[i - 1][j - 1] + cost) # Substitution

    return dp[m][n]

def calculate_nexus_branch_synthesis(
    sentence: str,
    *, # Enforce keyword-only arguments for clarity and future extensibility
    case_insensitive: bool = True,
    remove_stopwords: bool = False,
    stopwords_language: str = 'english',
    min_frequency: int = 0, # 0 means no minimum frequency filter
    max_frequency: Optional[int] = None, # None means no maximum frequency filter
    similarity_threshold: Optional[int] = None # None means no similarity calculation
) -> Dict[str, int]:
    """
    Consolidates various word counting and analysis functionalities into a single function.
    Focuses on high-performance algorithmic complexity where possible, while accurately
    implementing the provided extensions, including those with higher complexity like
    Levenshtein distance-based similarity.

    Args:
        sentence (str): The input text sentence.
        case_insensitive (bool, optional): If True, converts all words to lowercase before counting.
                                          Defaults to True.
        remove_stopwords (bool, optional): If True, removes common words (stopwords) based on NLTK.
                                           Defaults to False.
        stopwords_language (str, optional): The language for stopwords (e.g., 'english').
                                            Only used if `remove_stopwords` is True. Defaults to 'english'.
        min_frequency (int, optional): Only counts words that occur at least `min_frequency` times.
                                       A value of 0 (default) means no minimum frequency filter.
        max_frequency (Optional[int], optional): Only counts words that occur at most `max_frequency` times.
                                                 None (default) means no maximum frequency filter.
        similarity_threshold (Optional[int], optional): If not None, calculates "similar word" counts
                                                        using Levenshtein distance. A word's count
                                                        will be the number of other *distinct tokens*
                                                        in the sentence that are within this threshold
                                                        of similarity.
                                                        If set, this overrides basic frequency counting
                                                        and performs a more computationally intensive
                                                        similarity analysis (O(N_tokens^2 * L^2)).
                                                        None (default) means no similarity calculation.

    Returns:
        Dict[str, int]: A dictionary where keys are words and values are their corresponding counts
                        based on the applied filters and analysis.
    """
    if not sentence:
        return {}

    # Step 1: Tokenization and initial processing (case_insensitive, remove_stopwords)
    # The `processed_words` list will contain all relevant tokens for subsequent steps.
    processed_words: List[str] = []
    
    # Split the sentence into raw words. `split()` without arguments handles multiple spaces.
    raw_words = sentence.split()

    if remove_stopwords:
        stopwords_set = _get_stopwords_set(stopwords_language)
        for word in raw_words:
            current_word = word.lower() if case_insensitive else word
            if current_word not in stopwords_set:
                processed_words.append(current_word)
    else:
        for word in raw_words:
            current_word = word.lower() if case_insensitive else word
            processed_words.append(current_word)

    # If no words remain after processing (e.g., empty sentence, or all words were stopwords)
    if not processed_words:
        return {}

    # Step 2: Determine the base occurrence dictionary
    # This will either be a standard frequency count or the similarity count,
    # depending on `similarity_threshold`.
    final_occurrence_basis: collections.defaultdict[str, int]

    if similarity_threshold is not None:
        # Implementation of Extension 5: Count Similar Words
        # This logic exactly follows the provided `word_occurrence_similar_words` description:
        # It iterates over all tokens (`processed_words`) for both outer and inner loops.
        # `occurrence[word] += 1` is applied for each pair of distinct tokens (`word != other_word`)
        # that meet the Levenshtein distance threshold.
        # This results in a count per unique word, representing how many similar *other tokens* exist.
        # This specific approach has a high algorithmic complexity: O(N_tokens^2 * L^2),
        # where N_tokens is the number of tokens in `processed_words` and L is average word length.
        
        final_occurrence_basis = collections.defaultdict(int)
        
        for word_token_outer in processed_words: # Outer loop iterates over each token
            for word_token_inner in processed_words: # Inner loop iterates over each token
                
                # Check for distinct string value to match `if word != other_word` from the extension.
                # If a word string appears multiple times (e.g., "apple apple"), they are treated
                # as different tokens but `word_token_outer != word_token_inner` will be false for identical strings.
                if word_token_outer != word_token_inner and \
                   _levenshtein_distance(word_token_outer, word_token_inner) <= similarity_threshold:
                    final_occurrence_basis[word_token_outer] += 1
    else:
        # Standard word frequency count (original algorithm and extensions 1)
        # Time complexity: O(N_tokens)
        final_occurrence_basis = collections.defaultdict(int)
        for word in processed_words:
            final_occurrence_basis[word] += 1
    
    # Step 3: Apply frequency filtering (Extensions 3 & 4)
    # Time complexity: O(U), where U is the number of unique words.
    result_dict: Dict[str, int] = {}
    
    if min_frequency > 0 or max_frequency is not None:
        for word, count in final_occurrence_basis.items():
            # Apply minimum frequency filter
            if min_frequency > 0 and count < min_frequency:
                continue # Skip words that don't meet the minimum frequency

            # Apply maximum frequency filter
            if max_frequency is not None and count > max_frequency:
                continue # Skip words that exceed the maximum frequency

            result_dict[word] = count
    else:
        # No frequency filtering, simply convert the defaultdict to a regular dict
        result_dict = dict(final_occurrence_basis)

    return result_dict