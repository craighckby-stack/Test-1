Here are the architectural patterns extracted from the code:

* **Model-View-Controller (MVC)**: The `doFilter` function acts as the controller, handling user input and updating the DOM (view), while the HTML elements (DOM) act as the view and implicitly hold the data (model).
* **Event-Driven Programming**: The code uses `addEventListener` to react to user events (keyup, click), executing the `doFilter` function in response.
* **Observer Pattern**: The `doFilter` function is registered as an observer to the search input and submit button elements, which act as subjects, notifying the observer when relevant events occur.
* **Iterator Pattern**: The code iterates over collections of DOM elements (e.g., `h2s`, `h3s`, `lis`) using `for...of` loops to process each element sequentially.
* **Strategy Pattern**: The filtering logic is encapsulated within a `RegExp` object, allowing the specific search strategy (e.g., case-insensitive regex) to be defined and applied, which could be swapped for a different matching algorithm if needed.