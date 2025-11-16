# Neural Network Visualization

## Overview
This is a pure JavaScript neural network implementation with visualization capabilities. It's a static HTML/CSS/JS application that demonstrates neural network concepts including layers, activation functions, and linear algebra operations.

## Project Structure
- `index.html` - Main HTML entry point
- `calculation.js` - Neural network implementation (Layer, DenseLayer, ActivationLayer, Network classes)
- `linear-algebra.js` - Matrix operations and vector math utilities
- `activation-functions.js` - Activation functions (sigmoid, relu, tanh) and their derivatives
- `layout.js` - UI layout creation and manipulation
- `styles.css` - Application styling

## Tech Stack
- Pure JavaScript (no framework)
- HTML5
- CSS3
- Python HTTP server for serving static files

## Running the Project
The project is served using Python's built-in HTTP server on port 5000. The workflow automatically starts the server bound to 0.0.0.0 to work with Replit's preview system.

## Recent Changes
- **2025-11-16**: Initial import from GitHub
  - Installed Python 3.11 for serving static files
  - Configured workflow to serve on port 5000
  - Project ready to run in Replit environment

## Architecture
The neural network implementation includes:
- **Layer classes**: Base Layer, DenseLayer (fully connected), ActivationLayer
- **Network class**: Manages layers, forward propagation, backpropagation, and parameter updates
- **Linear algebra utilities**: Vector operations, matrix multiplication, transpose
- **Activation functions**: Sigmoid, ReLU, Tanh with derivatives for backpropagation
- **Xavier initialization**: For proper weight initialization

## Development
This is a static site with no build process. Changes to HTML, CSS, or JS files are immediately reflected when the page is refreshed.
