Added a note to the README file explaining the optimization made to the IDDFS algorithm and its benefits.

## Gemini Research
The Iterative Deepening Depth-First Search (IDDFS) algorithm is a highly regarded search strategy in Artificial Intelligence and computer science, and its optimality is a foundational theoretical guarantee.

The deep research confirms that IDDFS is indeed an **optimal** search algorithm, provided the problem space meets specific conditions.

---

### IDDFS Optimality Analysis

The optimality of IDDFS stems from its unique design, which combines the desirable features of Breadth-First Search (BFS) and Depth-First Search (DFS).

#### 1. Condition for Optimality: Shortest Path

IDDFS is optimal in the sense that it is guaranteed to find the **shallowest goal node**.

*   **Unweighted Graphs:** In a graph where all edges have the same cost (i.e., an unweighted graph), finding the shallowest goal node is equivalent to finding the **shortest path** from the start state to the goal state. This is the primary context in which IDDFS is strictly optimal.
*   **Weighted Graphs:** In a weighted graph (where edges have different costs), IDDFS is generally *not* optimal. For weighted graphs, an algorithm like Uniform Cost Search (UCS) or A\* Search must be used to ensure the lowest-cost path is found. IDDFS can be adapted (e.g., Iterative Deepening A\*, or IDA\*) but in its standard form, it only guarantees finding the goal at the minimum *depth*.

#### 2. The Mechanism of Optimality

IDDFS achieves its optimality by systematically increasing a **depth limit** in an iterative manner.

*   **Mimicking BFS:** In each iteration, a standard Depth-Limited Search (DLS) is performed down to the current depth limit ($d$). Because the depth limit is *incrementally* increased ($0, 1, 2, 3, \dots$), the algorithm effectively explores all nodes at depth $d$ before it explores any nodes at depth $d+1$. This is the exact mechanism that guarantees BFS optimality. Since IDDFS finds the shortest path by depth, it is essentially replicating the completeness and optimality of BFS.
*   **Guaranteed Shortest Path:** When a goal node is found at depth $d$, the algorithm is guaranteed that no goal node exists at a depth less than $d$ (i.e., $d-1, d-2, \dots$), because the previous iterations would have already found it if it existed. Therefore, the first goal found is the one with the shortest path length.

#### 3. Theoretical Proof and Guarantees

The theoretical guarantees of IDDFS were formally analyzed and proven in detail by Richard Korf in his seminal 1985 paper, "Depth-First Iterative-Deepening: An Optimal Admissible Tree Search".

The key properties discussed in the analysis include:

*   **Completeness:** IDDFS is **complete**, meaning that if a solution exists in the search space, the algorithm is guaranteed to find it (as long as the graph is not infinitely branched).
*   **Time Complexity:** The time complexity is $O(b^d)$, where $b$ is the branching factor and $d$ is the depth of the shallowest goal. This is asymptotically the same as BFS, making it time-optimal among the uninformed search algorithms.
*   **Space Complexity:** The space complexity is $O(d)$, which is characteristic of DFS. This is the primary advantage of IDDFS—it is **space-optimal** because it only needs to store the current path from the root to the current node, unlike BFS which can require $O(b^d)$ space to store the frontier of all nodes at the current depth.

In summary, IDDFS combines the **optimality and completeness of BFS** with the **space-efficiency of DFS**, which is why it is often the preferred uninformed search algorithm when the search space is large or has a high branching factor.