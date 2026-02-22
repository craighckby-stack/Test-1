from __future__ import annotations
import collections
import functools
import nltk
import math
import itertools
from typing import Dict, List, Optional, Set, Union, Literal, Any, Callable, Tuple

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

@functools.lru_cache(maxsize=1)
def _download_nltk_wordnet():
    """
    Downloads NLTK WordNet lexical database.
    Uses lru_cache to ensure it's downloaded only once per session.
    """
    try:
        nltk.data.find('corpora/wordnet')
    except nltk.downloader.DownloadError:
        nltk.download('wordnet', quiet=True)

@functools.lru_cache(maxsize=None)
def _get_stopwords_set(language: str) -> Set[str]:
    """
    Retrieves the set of NLTK stopwords for a given language.
    Uses lru_cache to ensure the set is built only once per language.
    """
    _download_nltk_stopwords(language)
    return set(nltk.corpus.stopwords.words(language))

@functools.lru_cache(maxsize=None)
def _get_wordnet_synonyms(word: str, language: str) -> Set[str]:
    """
    Retrieves the set of WordNet synonyms for a given word and language.
    Uses lru_cache to ensure the set is built only once per (word, language) pair.
    """
    _download_nltk_wordnet()
    from nltk.corpus import wordnet as wn
    # NLTK WordNet expects language codes like 'eng'
    # Defaulting to 'eng' if the provided language is not directly supported by WordNet lemmas
    # or requires a specific conversion.
    # For simplicity, we assume NLTK's stopwords_language is compatible or default.
    wordnet_lang = language[:3].lower() if len(language) >= 3 else 'eng' 

    synsets = list(wn.synsets(word))
    synonyms = set()
    for synset in synsets:
        for lemma in synset.lemmas(lang=wordnet_lang):
            synonyms.add(lemma.name())
    return synonyms

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
    """
    matrix = [[0] * len(words) for _ in range(len(words))]
    for i, word1 in enumerate(words):
        for j, word2 in enumerate(words):
            if i == j:
                matrix[i][j] = 0
            elif i < j: # Calculate only upper triangle to avoid redundant calculations
                matrix[i][j] = _levenshtein_distance(word1, word2)
                matrix[j][i] = matrix[i][j] # Mirror for symmetry
    return matrix

def longest_common_substring(text1: str, text2: str) -> str:
    """
    Finds the longest common substring between two input strings.
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

def _cosine_similarity(vector1: List[float], vector2: List[float]) -> float:
    """
    Calculates the cosine similarity between two vectors.
    """
    if not vector1 or not vector2 or len(vector1) != len(vector2):
        raise ValueError("Vectors must be non-empty and of equal length.")

    dot_product = sum(a * b for a, b in zip(vector1, vector2))
    magnitude1 = math.sqrt(sum(a ** 2 for a in vector1))
    magnitude2 = math.sqrt(sum(a ** 2 for a in vector2))
    return dot_product / (magnitude1 * magnitude2) if magnitude1 * magnitude2 != 0 else 0

def _jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    """
    Calculates the Jaccard similarity between two sets.
    """
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return len(intersection) / len(union) if union else 1 # If union is empty (both sets empty), similarity is 1.0

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
    """
    if not isinstance(number, int) or number < 0:
        raise ValueError("Input must be a non-negative integer")
    if number == 0:
        return -1
    
    return number.bit_length() - 1

# --- Numerical List Processing Helper ---

def find_missing_number(numbers: List[int]) -> int:
    """
    Finds the missing number in a list of positive integers.
    Assumes the list represents a consecutive sequence with exactly one number missing
    within the range defined by `min(numbers)` and `max(numbers)`.
    """
    if not numbers:
        raise ValueError("Input list cannot be empty")
    if len(numbers) == 1:
        raise ValueError("Cannot determine a missing number from a single-element list without broader context.")

    min_val = min(numbers)
    max_val = max(numbers)
    
    # If the list itself is complete, and no number is missing.
    if len(numbers) == (max_val - min_val + 1):
        # This case implicitly contradicts "exactly one number missing",
        # but is a good robustness check.
        raise ValueError("No number is missing in the provided sequence within its min-max range.")

    expected_sum = (max_val - min_val + 1) * (min_val + max_val) // 2
    actual_sum = sum(numbers)
    
    return expected_sum - actual_sum

# --- Combination Generation Helpers ---

def _create_all_state(
    increment: int,
    total_number: int,
    level: int,
    current_list: list[int],
    total_list: list[list[int]],
) -> None:
    """
    Helper function to recursively build all combinations using backtracking.
    """
    if level == 0:
        total_list.append(current_list[:])
        return

    for i in range(increment, total_number - level + 2):
        current_list.append(i)
        _create_all_state(i + 1, total_number, level - 1, current_list, total_list)
        current_list.pop()

def _generate_all_combinations_backtracking(n: int, k: int) -> list[list[int]]:
    """
    Generates all possible combinations of k numbers out of 1 ... n using backtracking.
    """
    if k < 0:
        raise ValueError("k must not be negative")
    if n < 0:
        raise ValueError("n must not be negative")
    if k > n:
        return []

    result: list[list[int]] = []
    _create_all_state(1, n, k, [], result)
    return result

def _combination_lists_itertools(n: int, k: int) -> list[list[int]]:
    """
    Generates all possible combinations of k numbers out of 1 ... n using itertools.
    """
    if k < 0:
        raise ValueError("k must not be negative")
    if n < 0:
        raise ValueError("n must not be negative")
    if k > n:
        return []
        
    return [list(x) for x in itertools.combinations(range(1, n + 1), k)]

# --- Subsequence Generation Helpers ---

def _generate_subsequences_recursive(
    sequence: List[Any],
    index: int,
    current_subsequence: List[Any],
    results: List[List[Any]],
    selector: Optional[Callable[[int, Any, List[Any]], Tuple[bool, bool]]]
) -> None:
    """
    Recursive helper function to generate all possible subsequences using backtracking.
    This function collects the subsequences into the 'results' list.
    """
    # Base case: Reached the end of the sequence
    if index == len(sequence):
        results.append(current_subsequence[:])
        return

    element = sequence[index]
    can_exclude, can_include = (True, True)

    if selector:
        try:
            selector_result = selector(index, element, current_subsequence)
            if not isinstance(selector_result, tuple) or len(selector_result) != 2 or \
               not isinstance(selector_result[0], bool) or not isinstance(selector_result[1], bool):
                raise TypeError("Subsequence selector must return a tuple of two booleans (can_exclude, can_include).")
            can_exclude, can_include = selector_result
        except Exception as e:
            raise ValueError(f"Error executing subsequence_selector at index {index} with element {element}: {e}")

    # Path 1: Exclude the current element
    if can_exclude:
        _generate_subsequences_recursive(sequence, index + 1, current_subsequence, results, selector)
    
    # Path 2: Include the current element
    if can_include:
        current_subsequence.append(element)
        _generate_subsequences_recursive(sequence, index + 1, current_subsequence, results, selector)
        current_subsequence.pop()

def calculate_nexus_branch_synthesis(
    mode: Literal['text_analysis', 'combination_generation', 'subsequence_generation'] = 'text_analysis',
    
    # Text Analysis Parameters
    sentence: Optional[str] = None,
    case_insensitive: bool = True,
    remove_stopwords: bool = False,
    stopwords_language: str = 'english',
    min_frequency: int = 0,
    max_frequency: Optional[int] = None,
    similarity_threshold: Optional[int] = None,

    # Combination Generation Parameters
    n_combinations: Optional[int] = None,
    k_combinations: Optional[int] = None,
    use_backtracking_for_combinations: bool = False,
    generate_all_k_combinations: bool = False,
    
    # Subsequence Generation Parameters
    input_sequence: Optional[List[Any]] = None,
    subsequence_selector: Optional[Callable[[int, Any, List[Any]], Tuple[bool, bool]]] = None,
    subsequence_min_length: Optional[int] = None,
    subsequence_max_length: Optional[int] = None,
    subsequence_filter_func: Optional[Callable[[List[Any]], bool]] = None,
    subsequence_sort_key: Optional[Callable[[List[Any]], Any]] = None,
    subsequence_reverse_sort: bool = False,

) -> Union[Dict[str, int], List[List[int]], Dict[int, List[List[int]]], List[List[Any]]]:
    """
    Consolidates various functionalities for text analysis, combination generation,
    and subsequence generation into a single high-performance function.

    Args:
        mode (Literal['text_analysis', 'combination_generation', 'subsequence_generation']):
            Determines the operation mode.
            - 'text_analysis': Performs word counting, stopword removal, and optionally
              Levenshtein distance-based similarity counting on a given sentence.
            - 'combination_generation': Generates all possible combinations of k numbers
              out of 1...n.
            - 'subsequence_generation': Generates all possible subsequences of a given sequence,
              with optional dynamic generation, filtering, and sorting.

        # --- Text Analysis Parameters (used when mode='text_analysis') ---
        sentence (Optional[str]): The input text sentence for 'text_analysis' mode.
                                  Required for 'text_analysis'.
        case_insensitive (bool): If True, converts all words to lowercase before counting.
                                 Defaults to True.
        remove_stopwords (bool): If True, removes common words (stopwords) based on NLTK.
                                 Defaults to False.
        stopwords_language (str): The language for stopwords (e.g., 'english').
                                  Only used if `remove_stopwords` is True. Defaults to 'english'.
        min_frequency (int): Only counts words that occur at least `min_frequency` times.
                             A value of 0 (default) means no minimum frequency filter.
        max_frequency (Optional[int]): Only counts words that occur at most `max_frequency` times.
                                       None (default) means no maximum frequency filter.
        similarity_threshold (Optional[int]): If not None, calculates "similar word" counts
                                                using Levenshtein distance. A word's count
                                                will be the number of other *distinct tokens*
                                                in the sentence that are within this threshold
                                                of similarity. Overrides basic frequency counting.
                                                None (default) means no similarity calculation.

        # --- Combination Generation Parameters (used when mode='combination_generation') ---
        n_combinations (Optional[int]): The upper limit number 'n' for combination generation (1...n).
                                        Required for 'combination_generation'.
        k_combinations (Optional[int]): The size 'k' of combinations to generate.
                                        Required for 'combination_generation' unless
                                        `generate_all_k_combinations` is True.
        use_backtracking_for_combinations (bool): If True, uses the backtracking algorithm.
                                                  If False (default), uses `itertools.combinations`
                                                  which is generally faster.
        generate_all_k_combinations (bool): If True, generates combinations for all `k` from 0 to `n_combinations`.
                                            Overrides `k_combinations`.

        # --- Subsequence Generation Parameters (used when mode='subsequence_generation') ---
        input_sequence (Optional[List[Any]]): The input sequence for which to generate subsequences.
                                              Required for 'subsequence_generation'.
        subsequence_selector (Optional[Callable[[int, Any, List[Any]], Tuple[bool, bool]]]):
            A function taking `(index, element_at_index, current_subsequence_built_so_far)`
            and returning `(can_exclude_current_element: bool, can_include_current_element: bool)`.
            Allows dynamic control over subsequence generation paths. Defaults to `(True, True)`
            for all elements if not provided.
        subsequence_min_length (Optional[int]): Filters subsequences to include only those
                                                with at least this length. None for no minimum.
        subsequence_max_length (Optional[int]): Filters subsequences to include only those
                                                with at most this length. None for no maximum.
        subsequence_filter_func (Optional[Callable[[List[Any]], bool]]):
            A custom function taking a generated subsequence (`List[Any]`) and returning `True`
            if it should be included in the results, `False` otherwise. Applied after length filters.
        subsequence_sort_key (Optional[Callable[[List[Any]], Any]]):
            A key function for sorting the final list of subsequences (e.g., `len` for sorting by length).
        subsequence_reverse_sort (bool): If True, sorts the subsequences in descending order.
                                         Defaults to False.


    Returns:
        Union[Dict[str, int], List[List[int]], Dict[int, List[List[int]]], List[List[Any]]]:
        - If `mode` is 'text_analysis': A dictionary where keys are words and values are their counts.
        - If `mode` is 'combination_generation' and `generate_all_k_combinations` is False:
          A list of lists, where each inner list is a combination of `k_combinations` numbers.
        - If `mode` is 'combination_generation' and `generate_all_k_combinations` is True:
          A dictionary mapping `k` (int) to a list of lists of combinations for that `k`.
        - If `mode` is 'subsequence_generation': A list of lists, where each inner list is a subsequence.

    Raises:
        ValueError: If required parameters for a given mode are missing or invalid.
        TypeError: If a provided selector or filter function returns an unexpected type.
    """

    if mode == 'text_analysis':
        if sentence is None:
            raise ValueError("Parameter 'sentence' is required for 'text_analysis' mode.")
        if not sentence.strip():
            return {}

        # Step 1: Tokenization and initial processing (case_insensitive, remove_stopwords)
        _download_nltk_punkt()
        
        raw_tokens = nltk.word_tokenize(sentence, language=stopwords_language)

        processed_words: List[str] = []
        
        stopwords_set = _get_stopwords_set(stopwords_language) if remove_stopwords else set()

        for token in raw_tokens:
            current_token = token.lower() if case_insensitive else token
            if current_token.isalpha() and current_token not in stopwords_set:
                processed_words.append(current_token)

        if not processed_words:
            return {}

        # Step 2: Determine the base occurrence dictionary (standard frequency or similarity-based)
        final_occurrence_basis: collections.defaultdict[str, int]

        if similarity_threshold is not None:
            # Calculate similarity counts based on Levenshtein distance.
            # O(U^2 * L^2) where U is unique tokens, L is avg word length.
            final_occurrence_basis = collections.defaultdict(int)
            
            unique_processed_words = list(set(processed_words)) 

            for i, word_token_outer in enumerate(unique_processed_words):
                for j, word_token_inner in enumerate(unique_processed_words):
                    if i != j and \
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
        
        for word, count in final_occurrence_basis.items():
            if (min_frequency == 0 or count >= min_frequency) and \
               (max_frequency is None or count <= max_frequency):
                result_dict[word] = count

        return result_dict

    elif mode == 'combination_generation':
        if n_combinations is None:
            raise ValueError("Parameter 'n_combinations' is required for 'combination_generation' mode.")
        if n_combinations < 0:
            raise ValueError("Parameter 'n_combinations' must not be negative.")

        combination_func = _generate_all_combinations_backtracking if use_backtracking_for_combinations else _combination_lists_itertools

        if generate_all_k_combinations:
            if n_combinations == 0:
                return {0: [[]]} 
            
            all_combinations_by_k: Dict[int, List[List[int]]] = {}
            for k_val in range(n_combinations + 1):
                all_combinations_by_k[k_val] = combination_func(n_combinations, k_val)
            return all_combinations_by_k
        else:
            if k_combinations is None:
                raise ValueError("Parameter 'k_combinations' is required for 'combination_generation' mode "
                                 "unless 'generate_all_k_combinations' is True.")
            if k_combinations < 0:
                raise ValueError("Parameter 'k_combinations' must not be negative.")
            return combination_func(n_combinations, k_combinations)

    elif mode == 'subsequence_generation':
        if input_sequence is None:
            raise ValueError("Parameter 'input_sequence' is required for 'subsequence_generation' mode.")
        if not isinstance(input_sequence, list):
            raise ValueError("Parameter 'input_sequence' must be a list.")
        
        all_subsequences: List[List[Any]] = []
        _generate_subsequences_recursive(
            sequence=input_sequence,
            index=0,
            current_subsequence=[],
            results=all_subsequences,
            selector=subsequence_selector
        )

        # Apply filtering
        filtered_subsequences: List[List[Any]] = []
        for subseq in all_subsequences:
            length_ok = (subsequence_min_length is None or len(subseq) >= subsequence_min_length) and \
                        (subsequence_max_length is None or len(subseq) <= subsequence_max_length)
            
            filter_func_ok = True
            if subsequence_filter_func:
                try:
                    filter_func_ok = subsequence_filter_func(subseq)
                except Exception as e:
                    raise ValueError(f"Error executing subsequence_filter_func for subsequence {subseq}: {e}")

            if length_ok and filter_func_ok:
                filtered_subsequences.append(subseq)

        # Apply sorting
        if subsequence_sort_key is not None:
            filtered_subsequences.sort(key=subsequence_sort_key, reverse=subsequence_reverse_sort)
        elif subsequence_reverse_sort: # Apply default lexicographical sort if only reverse is specified
             filtered_subsequences.sort(reverse=True) 

        return filtered_subsequences

    else:
        raise ValueError(f"Invalid mode: '{mode}'. Must be 'text_analysis', 'combination_generation', or 'subsequence_generation'.")