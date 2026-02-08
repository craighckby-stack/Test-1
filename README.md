## IDDFS Implementation
### Overview
This implementation provides an iterative deepening depth-first search (IDDFS) algorithm, which is used to find a path between two nodes in a graph. The algorithm is optimized to handle cycles in the graph and provides an efficient solution by keeping track of visited nodes.
### Usage
To use the `iddfs` function, simply call it with the `root` node, `goal` node, and optional `depth` limit. The function will return the goal node if found, or `null` otherwise.

## Gemini Research
The Iterative Deepening Depth-First Search (IDDFS) algorithm is a powerful uninformed search technique that combines the benefits of Breadth-First Search (BFS) and Depth-First Search (DFS). It achieves this by performing a series of depth-limited DFS searches, with the depth limit increasing by one in each iteration until the goal state is found.

Deep research on IDDFS reveals critical characteristics regarding its optimality, efficiency, and the trade-offs associated with cycle handling in graphs.

---

## Optimality

**IDDFS is complete and optimal** under specific conditions, making it a highly desirable uninformed search algorithm.

*   **Completeness:** IDDFS is **complete**, meaning that if a solution exists, the algorithm is guaranteed to find it. This is due to the iterative nature of the depth-limit increase, which systematically explores all nodes at a given depth before moving to the next level, similar to BFS.
*   **Optimality:** IDDFS is **optimal** when the problem involves finding the shortest path in terms of the number of edges.
    *   In **unweighted graphs** (where the cost of every edge is the same, typically 1), optimality is guaranteed because IDDFS, like BFS, finds the shallowest goal state first.
    *   If edge costs are non-uniform, IDDFS is *not* guaranteed to find the minimum-cost path, as a goal state at a shallower depth might have a higher cumulative cost than a goal state at a deeper level. For minimum-cost path finding in weighted graphs, algorithms like Uniform Cost Search or A* are typically preferred.

---

## Efficiency (Time and Space Complexity)

IDDFS achieves an optimal balance between the exponential time complexity of BFS and the linear space complexity of DFS.

### Time Complexity ($O(b^d)$)

The time complexity of IDDFS is $O(b^d)$, where $b$ is the **branching factor** (the number of successors for a state) and $d$ is the **depth of the shallowest goal state**.

*   **Redundant Expansions:** The algorithm repeatedly re-expands nodes at shallower depths in each new iteration. However, this re-expansion is shown to have minimal impact on the overall asymptotic complexity.
*   **Asymptotic Optimality:** In a search tree with a constant branching factor, the number of nodes at the deepest level ($d$) is significantly greater than the sum of all nodes at all shallower levels ($0$ to $d-1$). For example, with a branching factor of 10 and a depth of 5, the nodes at depth 5 account for over 90% of all generated nodes. Therefore, the repeated work done at shallower levels does not change the exponential nature of the time complexity, which remains asymptotically the same as BFS: **$O(b^d)$**. IDDFS is considered **asymptotically optimal** among uninformed search methods.

### Space Complexity ($O(bd)$)

The space complexity of IDDFS is its greatest strength, as it only requires space proportional to the depth of the current search path, which is $O(bd)$.

*   **Linear Space:** Since each iteration is a depth-first search, it only needs to store the nodes on the current path from the root to the deepest node being explored. This results in space complexity of **$O(d)$** in terms of depth, or **$O(bd)$** where $b$ is included to account for storing the children of each node on the stack.
*   **Advantage over BFS:** This linear space complexity is a massive advantage over BFS, which requires storing the entire fringe (all nodes at the current level) and therefore has a space complexity of $O(b^d)$, potentially exhausting memory for deep searches.

---

## Cycle Handling

While IDDFS is complete and optimal for trees and unweighted graphs, **cycle handling is necessary when searching arbitrary graphs** and introduces a critical trade-off with its hallmark space efficiency.

### Necessity of Cycle Detection

*   In a graph containing cycles, the underlying Depth-Limited DFS (DLS) in IDDFS can enter an infinite loop if not stopped.
*   Even if the individual DLS iterations are guaranteed to terminate due to the depth limit, a cycle can cause **repeated exploration of the same subgraph** in different iterations, leading to massive performance degradation or an inability to find the goal efficiently.

### The Space Complexity Trade-Off

To properly handle cycles and prevent redundant work in a general graph, one must employ a **visited set** (or hash table) to keep track of all nodes expanded across all iterations.

*   **Local Cycle Detection:** If the algorithm only checks for a cycle *in the current path* (i.e., whether the current node is an ancestor), the space complexity remains **$O(bd)$**. This prevents the DLS from entering a trivial infinite loop but **does not prevent re-exploring entire subgraphs** in the same iteration or in subsequent iterations.
*   **Global Cycle Detection (Full Graph Search):** To prevent *all* redundant expansions, a global visited set must be maintained. However, the space required for a global visited set is proportional to the number of states visited, which can be **$O(V)$** (where $V$ is the number of vertices) or **$O(b^d)$** in the worst-case, sacrificing the primary benefit of IDDFS.

Therefore, the use of IDDFS for graph search involves a fundamental trade-off: maintain the **linear space efficiency ($O(bd)$)** and tolerate the possibility of redundant subgraph exploration (or require a global memory set, thus making the space complexity comparable to BFS). In practice, IDDFS is most effective in problems where the search space is a tree or an implicitly defined graph that is too large to store in memory, making its linear space complexity invaluable.