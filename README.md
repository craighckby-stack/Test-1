Update the documentation to reflect the changes in the search algorithm and data structures used. This should include explanations of the hybrid approach, the use of a set for visited nodes, and the priority queue for node selection.

## Gemini Research
The optimal combination of Iterative Deepening Depth-First Search (IDDFS) and a heuristic function for node exploration in a weighted graph with a large number of nodes and edges is the **Iterative Deepening A\* (IDA\*)** algorithm.

IDA\* is specifically designed to balance the search efficiency of informed search methods (like A\*) with the minimal memory footprint of IDDFS, making it the superior choice when the search space is too large for standard memory-intensive algorithms like A\*.

---

## 1. The Optimal Combination: Iterative Deepening A\* (IDA\*)

The IDA\* algorithm is a variant of IDDFS that uses the evaluation function of the A\* search algorithm to guide its depth-first exploration.

### Core Mechanics

1.  **Evaluation Function (A\* Heuristic):** Like A\*, IDA\* evaluates each node $n$ using the function $f(n) = g(n) + h(n)$.
    *   **$g(n)$:** The actual cost (sum of edge weights) from the start node to the current node $n$.
    *   **$h(n)$:** The heuristic estimate of the cost from node $n$ to the goal node.
2.  **Iterative Deepening (IDDFS Framework):** Instead of using a simple depth limit (like standard IDDFS), IDA\* uses a **cost threshold** based on the $f(n)$ value.
3.  **Search Process:**
    *   The first iteration performs a Depth-First Search (DFS) but prunes any branch where the $f(n)$ value exceeds a minimal initial cost threshold.
    *   If the goal is not found, the threshold is updated to the minimum $f(n)$ value encountered that exceeded the previous threshold.
    *   This process repeats, iteratively deepening the search space based on total estimated path cost, not simply path length.

### Why IDA\* is Optimal for Large Graphs

| Feature | IDA\* (IDDFS + A\*) | A\* (Best-First Search) | Greedy Best-First Search (GBFS) |
| :--- | :--- | :--- | :--- |
| **Path Optimality** | **Guaranteed** (finds the shortest path) | Guaranteed | **Not Guaranteed** (suboptimal) |
| **Space Complexity** | **$O(d)$ (Minimal)** | $O(b^d)$ (Exponential) | $O(b^d)$ (Exponential) |
| **Time Complexity** | $O(b^d)$ (Asymptotically similar to A\*) | $O(b^d)$ | Depends on Heuristic Quality |
| **Applicability to Large Graphs**| **Excellent** (Memory-efficient) | Poor (Memory-intensive) | Poor (Memory-intensive) |
| **Core Heuristic** | **Admissible** $h(n)$ (Required for optimality) | Admissible $h(n)$ | Any $h(n)$ |

In a weighted graph with a large number of nodes and edges, A\* fails due to its exponential memory usage $O(b^d)$, where $b$ is the branching factor and $d$ is the depth of the solution. IDA\* overcomes this by employing the depth-first nature of IDDFS, maintaining a space complexity that is only linear with the search depth ($O(d)$), while retaining the optimality guarantee of A\*.

## 2. The Essential Heuristic: Admissibility

For IDA\* to guarantee an **optimal** path (the shortest path in a weighted graph), the heuristic function, $h(n)$, must be **admissible**.

### The Admissibility Condition

An admissible heuristic is one that **never overestimates** the actual cost to reach the goal. That is:

$$h(n) \le h^*(n)$$

where $h^*(n)$ is the true cost from node $n$ to the nearest goal node.

### Impact on Performance

The *quality* of an admissible heuristic is crucial for IDA\*'s efficiency.

*   **Weak Heuristics:** A heuristic that greatly *underestimates* the true cost (e.g., $h(n) = 0$) is admissible but results in many iterations and excessive node re-expansions, making the search much slower.
*   **Strong Heuristics:** The best admissible heuristic is one that is **consistent** (or monotonic) and is as close as possible to the true cost $h^*(n)$ without exceeding it. A stronger heuristic means the $f(n)$ threshold grows more rapidly toward the optimal solution cost, leading to fewer iterations and less wasted exploration.

## 3. Alternative for Suboptimal, Faster Solutions

If finding a path *quickly* is more important than guaranteeing the *absolute shortest* path (i.e., trading optimality for speed), a variant called **Weighted IDA\*** may be used.

### Weighted IDA\*

This technique uses a non-admissible evaluation function by introducing a weight $w > 1$ to the heuristic:

$$f_w(n) = g(n) + w \cdot h(n)$$

*   **Mechanism:** This weight exaggerates the heuristic estimate, making the search more "greedy" and directional, similar to Greedy Best-First Search. It focuses the search more intently toward the goal.
*   **Trade-off:** This significantly reduces the total number of nodes expanded and makes the algorithm faster, but it forfeits optimality. However, the solution path found is guaranteed to have a cost no more than $w$ times the optimal cost.

## Conclusion

For optimal node exploration in a large weighted graph, the **Iterative Deepening A\* (IDA\*)** algorithm is the optimal combination. Its reliance on the **admissible heuristic** from A\* ensures an optimal path is found, while its IDDFS framework ensures the search is manageable within tight memory constraints. The biggest practical challenge is designing a powerful, yet admissible, heuristic to minimize the time penalty of repeated node expansion.