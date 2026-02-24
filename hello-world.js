* Singleton pattern: 
  - Only one instance of the `svg` image source path is created and imported throughout the application.
  - The `svg` variable holds this single reference, which is then used to create a single corresponding `<img>` DOM element in this specific execution.

* Factory Pattern: 
  - The `createImageElement` function acts as a factory, encapsulating the complex logic for creating a structured image display element (div, h2, img).
  - It abstracts away the direct DOM manipulation (`document.createElement`, `appendChild`, `setAttribute`) from the client code.

* Creational Patterns: 
  - The `createImageElement` function provides a structured way to create new DOM elements, abstracting the instantiation process.
  - This hides the underlying object creation mechanisms from the client code, promoting cleaner and more maintainable code.

* Separation of Concerns: 
  - The `createImageElement` function is solely responsible for building and styling an individual image display block.
  - This separates the concern of rendering a single image block from the broader concern of managing the list of images to display.

* Don't Repeat Yourself (DRY Principle):
  - The `createImageElement` function centralizes the logic for creating an image display block, avoiding code duplication if multiple images were to be added.
  - `Object.assign()` is used for concisely setting multiple styles on the `container`, preventing repetitive style property assignments.

* Encapsulation: 
  - The internal structure and styling of an image display block (`div`, `h2`, `img`, `textAlign`, `width`) are bundled within the `createImageElement` function.
  - This hides the implementation details from the outside code, which only needs to provide a title and source to create an image element.