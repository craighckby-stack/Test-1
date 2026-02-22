import collections
import functools
import nltk
from typing import Dict, List, Optional, Set, Union

# --- NLTK Resource Downloads & Caching ---

@functools.lru_cache(maxsize=1)
def _download_nltk_stopwords(language: str):
    """
    Downloads NLTK stopwords for the specified language.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find(f'corpora/stopwords/{language}.zip')
    except nltk.downloader.DownloadError:
        nltk.download('stopwords', quiet=True)

@functools.lru_cache(maxsize=1)
def _download_nltk_punkt():
    """
    Downloads NLTK 'punkt' tokenizer.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find('tokenizers/punkt')
    except nltk.downloader.DownloadError:
        nltk.download('punkt', quiet=True)

@functools.lru_cache(maxsize=None)
def _get_stopwords_set(language: str) -> Set[str]:
    """
    Retrieves the set of NLTK stopwords for a given language.
    Uses lru_cache to ensure the set is built only once per language.
    """
    _download_nltk_stopwords(language)
    return set(nltk.corpus.stopwords.words(language))

# --- String Processing & Similarity Helpers ---

def _levenshtein_distance(word1: str, word2: str) -> int:
    """
    Calculates the Levenshtein distance between two words (edit distance).
    Time complexity: O(len(word1) * len(word2))
    Space complexity: O(len(word1) * len(word2))
    """
    m = len(word1)
    n = len(word2)
    
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if word1[i - 1] == word2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1,      # Deletion
                           dp[i][j - 1] + 1,      # Insertion
                           dp[i - 1][j - 1] + cost) # Substitution

    return dp[m][n]

def _levenshtein_distance_matrix(words: List[str]) -> List[List[int]]:
    """
    Returns a matrix of Levenshtein distances between each pair of words in the input list.
    (Extension 2 - as described in source)
    """
    matrix = [[0] * len(words) for _ in range(len(words))]
    for i, word1 in enumerate(words):
        for j, word2 in enumerate(words):
            if i == j:
                matrix[i][j] = 0
            else:
                matrix[i][j] = _levenshtein_distance(word1, word2)
    return matrix

def longest_common_substring(text1: str, text2: str) -> str:
    """
    Finds the longest common substring between two input strings.
    (Extension 5 - as described in source)
    """
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    max_length = 0
    end_index_text1 = 0

    for i in range(m):
        for j in range(n):
            if text1[i] == text2[j]:
                dp[i + 1][j + 1] = dp[i][j] + 1
                if dp[i + 1][j + 1] > max_length:
                    max_length = dp[i + 1][j + 1]
                    end_index_text1 = i + 1

    return text1[end_index_text1 - max_length : end_index_text1]

# --- Bitwise Operation Helpers ---

def get_index_of_rightmost_set_bit(number: int) -> int:
    """
    Take in a positive integer 'number'.
    Returns the zero-based index of first set bit in that 'number' from right.
    Returns -1, If no set bit found.
    """
    if not isinstance(number, int) or number < 0:
        raise ValueError("Input must be a non-negative integer")

    if number == 0:
        return -1
    
    intermediate = number & ~(number - 1)
    
    index = 0
    while intermediate > 1:
        intermediate >>= 1
        index += 1
    return index

def get_index_of_first_set_bit(number: int) -> int:
    """
    Takes in a positive integer 'number'.
    Returns the zero-based index of first set bit in that 'number' from left (Most Significant Bit).
    Returns -1, If no set bit found.
    (Extension 3 - as described in source, corrected for "from left")
    """
    if not isinstance(number, int) or number < 0:
        raise ValueError("Input must be a non-negative integer")
    if number == 0:
        return -1
    
    return number.bit_length() - 1

# --- Numerical List Processing Helper ---

def find_missing_number(numbers: List[int]) -> int:
    """
    Finds the missing number in a sorted list of positive integers.
    Assumes the list represents a consecutive sequence with exactly one number missing
    within the range defined by `min(numbers)` and `max(numbers)`.
    (Extension 4 - as described in source)
    """
    if not numbers:
        raise ValueError("Input list cannot be empty")
    if len(numbers) == 1:
        raise ValueError("Cannot determine a missing number from a single-element list without broader context.")

    min_val = min(numbers)
    max_val = max(numbers)
    n_expected = max_val - min_val + 1 
    
    expected_sum = (n_expected * (min_val + max_val)) // 2
    actual_sum = sum(numbers)
    
    return expected_sum - actual_sum

# --- Main Consolidated Function ---

def calculate_nexus_branch_synthesis(
    sentence: str,
    *, 
    case_insensitive: bool = True,
    remove_stopwords: bool = False,
    stopwords_language: str = 'english',
    min_frequency: int = 0, 
    max_frequency: Optional[int] = None, 
    similarity_threshold: Optional[int] = None 
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
                                                        similarity analysis (O(N_unique_tokens^2 * L^2)).
                                                        None (default) means no similarity calculation.

    Returns:
        Dict[str, int]: A dictionary where keys are words and values are their corresponding counts
                        based on the applied filters and analysis.
    """
    if not sentence:
        return {}

    # Step 1: Tokenization and initial processing (case_insensitive, remove_stopwords)
    _download_nltk_punkt() # Ensure Punkt tokenizer is available
    
    raw_tokens = nltk.word_tokenize(sentence, language=stopwords_language)

    processed_words: List[str] = []
    
    if remove_stopwords:
        stopwords_set = _get_stopwords_set(stopwords_language)
        for token in raw_tokens:
            current_token = token.lower() if case_insensitive else token
            if current_token.isalpha() and current_token not in stopwords_set:
                processed_words.append(current_token)
    else:
        for token in raw_tokens:
            current_token = token.lower() if case_insensitive else token
            if current_token.isalpha():
                processed_words.append(current_token)

    if not processed_words:
        return {}

    # Step 2: Determine the base occurrence dictionary (standard frequency or similarity-based)
    final_occurrence_basis: collections.defaultdict[str, int]

    if similarity_threshold is not None:
        # Calculate similarity counts based on Levenshtein distance.
        # This part has O(U^2 * L^2) complexity where U is unique tokens, L is avg word length.
        final_occurrence_basis = collections.defaultdict(int)
        
        unique_processed_words = list(set(processed_words)) 

        for word_token_outer in unique_processed_words:
            for word_token_inner in unique_processed_words:
                if word_token_outer != word_token_inner and \
                   _levenshtein_distance(word_token_outer, word_token_inner) <= similarity_threshold:
                    final_occurrence_basis[word_token_outer] += 1
    else:
        # Standard word frequency count. Time complexity: O(N_tokens).
        final_occurrence_basis = collections.defaultdict(int)
        for word in processed_words:
            final_occurrence_basis[word] += 1
    
    # Step 3: Apply frequency filtering (min_frequency and max_frequency)
    # Time complexity: O(U), where U is the number of unique words.
    result_dict: Dict[str, int] = {}
    
    if min_frequency > 0 or max_frequency is not None:
        for word, count in final_occurrence_basis.items():
            if (min_frequency == 0 or count >= min_frequency) and \
               (max_frequency is None or count <= max_frequency):
                result_dict[word] = count
    else:
        result_dict = dict(final_occurrence_basis)

    return result_dict