Update the README file to include a section on the IDDFS algorithm, its advantages, and its applications. Provide examples and use cases to illustrate the algorithm's effectiveness.

## Gemini Research
This deep research addresses the optimality of the specific graph traversal algorithm that combines Iterative Deepening Depth-First Search (IDDFS) with a heuristic function: the **Iterative Deepening A\* (IDA\*)** algorithm.

The core finding is that **IDA\* is optimal and complete, provided the heuristic function used is admissible.**

---

## 1. The Algorithm: Iterative Deepening A\* (IDA\*)

The Iterative Deepening A\* (IDA\*) algorithm is a variant of IDDFS that integrates the principles of the best-first search algorithm, $A^*$, to guide its search.

In standard IDDFS, the iterative limit is the **depth** of the search tree. In IDA\*, this is replaced by a **cost limit**, or **f-limit**, based on the evaluation function of $A^*$.

### Mechanism

1.  **Evaluation Function:** Like $A^*$, IDA\* uses the evaluation function $f(n) = g(n) + h(n)$ for any node $n$:
    *   $g(n)$: The actual cost from the starting node to node $n$.
    *   $h(n)$: The estimated cost from node $n$ to the goal state (the heuristic function).
    *   $f(n)$: The estimated total cost of the path through node $n$ to the goal.
2.  **Iterative Deepening:** IDA\* performs a series of depth-first searches, where each iteration has a cutoff value, $L$.
3.  **Pruning:** In any given iteration with limit $L$, the depth-first search **prunes** any path whose $f(n)$ value exceeds $L$.
4.  **Limit Update:** If the goal node is not found, the limit $L$ for the next iteration is set to the **minimum $f$-value** of all nodes that were pruned in the current iteration. This ensures the next search expands the most promising frontier nodes that were just beyond the previous limit.

## 2. Optimality Condition: Admissibility

The optimality of IDA\*—meaning it guarantees finding the **least-cost path** to the goal—is strictly dependent on the properties of the heuristic function, $h(n)$.

The crucial condition is **admissibility**:

*   **Admissible Heuristic:** A heuristic function $h(n)$ is admissible if it **never overestimates** the true cost to reach the goal from node $n$. That is, for every node $n$, $h(n) \le h^*(n)$, where $h^*(n)$ is the true minimum cost.

### Why Admissibility Guarantees Optimality

If the heuristic is admissible:

1.  The $f$-value of the optimal path to the goal, $f(Goal)^*$, is equal to its true cost, as $g(Goal)^* = f(Goal)^*$ and $h(Goal)=0$.
2.  Since $h(n)$ is admissible, any path's estimated cost $f(n)$ will never be greater than its true cost.
3.  IDA\* will only terminate an iteration when it finds a goal node whose $f(Goal)$ value is exactly the current limit $L$.
4.  Because the limits $L$ are set based on the minimum $f$-value of the pruned nodes and are strictly increasing, the very first time the algorithm finds a goal node, that node's cost must be the minimum possible cost in the entire state space. A cheaper path to the goal could not have been overlooked, as its $f$-value would be lower and thus would have been found in a previous (or the current) iteration.

### Note on Consistency/Monotonicity

While the $A^*$ algorithm often requires a more restrictive property called **consistency** (or **monotonicity**) for certain implementations (like graph search without re-expanding nodes), **IDA\* does not require monotonicity for its optimality**. Admissibility is sufficient.

## 3. Completeness

IDA\* is a **complete** algorithm. This means that if a solution exists, IDA\* is guaranteed to find it, provided the branch factor of the graph is finite and the costs of edges are positive (or the optimal path cost is finite).

## 4. Performance Trade-offs

The integration of the heuristic function transforms IDDFS into a powerful, informed search algorithm with distinct performance characteristics compared to $A^*$:

| Characteristic | IDA\* (Iterative Deepening A\*) | $A^*$ (Standard Best-First) |
| :--- | :--- | :--- |
| **Space Complexity** | $O(d)$, where $d$ is the depth of the optimal path. **Highly memory efficient** due to depth-first search nature. | $O(b^d)$, where $b$ is the branch factor. Can run out of memory quickly. |
| **Time Complexity** | $O(b^d)$. Can be competitive with $A^*$. | $O(b^d)$. |
| **Node Expansion** | Since it repeats the search in each iteration, nodes are expanded multiple times. However, in trees with a large branch factor, the overhead is relatively small, as the overwhelming majority of nodes are at the deepest level. | Each node is expanded at most once (under standard implementations). |
| **Optimality** | Optimal with an **admissible** heuristic. | Optimal with an **admissible** heuristic (and consistent for certain graph implementations). |

In summary, IDA\* retains the **linear space complexity** of IDDFS, which makes it suitable for problems with extremely large search spaces (e.g., the 15-Puzzle or 8-Puzzle). The addition of the admissible heuristic function allows it to maintain the **optimality** property, ensuring the first solution found is the least-cost path.