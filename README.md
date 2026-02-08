Added documentation on the hybrid search algorithm framework, including examples and guidelines for selecting the optimal search algorithm and heuristic function for specific problems.

## Grounded Research
The application of machine learning (ML) techniques to optimize heuristic function selection represents a powerful approach to improving the efficiency and robustness of search algorithms, especially in complex and **dynamic environments**.

Unlike traditional static approaches, where a single heuristic is chosen before the search begins, ML enables the algorithm to **dynamically select, tune, or construct** a heuristic function at runtime based on the current state of the environment or the search process itself.

## Key ML Techniques and Applications

The primary ML techniques used for dynamic heuristic optimization fall into three main categories:

| ML Technique | Application/Mechanism | Search Domain |
| :--- | :--- | :--- |
| **Reinforcement Learning (RL) / Dynamic Algorithm Configuration (DAC)** | An RL agent learns a policy to select the best-performing heuristic from a portfolio of options at various points during the search process. The state space for the agent is defined by the internal search dynamics. | AI Planning, General Heuristic Search (e.g., A* variants), Constraint Programming. |
| **Deep Heuristic Learning (DHL) / Neural Networks** | A deep neural network is trained to directly predict the most accurate or effective heuristic value ($h(n)$) for a given state $n$. In dynamic environments, this network can incorporate real-time features to adjust its output. | Real-Time Pathfinding, Robotics. |
| **Supervised Learning (Classification/Regression)** | A model is trained offline on a large dataset of past problems to map problem features (or search-state features) to the best-performing heuristic for that scenario. The model then serves as a rapid "selector" at runtime. | Constraint Programming (for variable/value ordering), Optimization problems. |

## Optimization in Dynamic Environments

In dynamic environments, the state space or the cost of actions can change over time (e.g., a path becoming blocked, traffic increasing). ML-based optimization addresses this by leveraging **dynamic features** to inform its selection.

### 1. External/Environmental Features

In applications like real-time urban pathfinding, ML models are trained to adjust the search algorithm's heuristic function based on live, external data.

*   **Features:** Real-time metrics such as current traffic congestion, road closures, or even weather conditions are fed into the model.
*   **Mechanism:** A Deep Heuristic Learning model (often a neural network) learns to associate these external features with an effective heuristic adjustment, allowing the search algorithm (e.g., an enhanced A*) to **dynamically re-prioritize routes** that are currently slower due to congestion.

### 2. Internal Search Dynamics Features

For general heuristic search and planning problems, the ML model monitors the search's progress to select the most efficient heuristic for the *current phase* of the search.

*   **Features:** **Domain-independent metrics** include the number of nodes expanded, the depth of the current search frontier, or the quality of the current incumbent solution.
*   **Mechanism:** An RL agent observes these features and decides which heuristic from a set (the "action space") should be applied next to minimize the total search cost. This allows the algorithm to switch from a "quick and dirty" heuristic early on to an "accurate but expensive" one later in the search.

## Improvement in Search Algorithm Performance

The primary goal of this ML application is to **improve overall search algorithm performance** by enhancing efficiency and solution quality.

*   **Increased Search Efficiency:** Dynamic heuristic selection, particularly using RL/DAC, has been shown to significantly improve search performance compared to a static selection.
    *   **Metric:** A key performance metric is the reduction in the **number of expanded nodes**, which directly translates to reduced search time and computational cost.
    *   **Case Study:** In AI planning domains, an RL-based DAC approach can learn to switch between heuristics based on internal statistics, leading to substantial gains in efficiency.

*   **Optimized Solution Quality/Cost:** In dynamic pathfinding, the use of Deep Heuristic Learning ensures that the resulting path is optimized for real-world dynamic costs (e.g., time, not just distance).
    *   **Metric:** The ML-adjusted algorithm aims for higher route **accuracy** and better overall **pathfinding efficiency** in congested or changing urban environments.

*   **Reduced Runtime in Constraint Solvers:** In Constraint Programming, ML models are used to select the best variable/value ordering heuristics at runtime, leading to a demonstrable reduction in the solver's total execution time.