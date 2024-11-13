
class Layer {
    constructor(inputSize, outputSize) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
    }
}

class DenseLayer extends Layer {
    constructor(inputSize,outputSize) {
        super(inputSize,outputSize);
        this.weights = new Matrix(new Array(inputSize*outputSize).fill(0));
        // this.initializeWeightMatrix(inputSize,outputSize);
        this.biases = new Array(outputSize).fill(0);
        this.layerInput = null;
        this.outputCost = null;
    }

    initializeWeightMatrix(inputSize,outputSize) {
        return new Array(inputSize*outputSize).fill(0);
        // Stride = outputSize
    }

    forward(neurons) {
        this.layerInput = neurons;
        let layerOutput = Matrix.multiplyVector(this.weights,neurons);
        layerOutput = addVectors(layerOutput,this.biases);
        return layerOutput;
    }

    backward(outputCost) {
        this.outputCost = outputCost;
        return Matrix.multiplyVector(Matrix.transpose(this.weights),outputCost);
    }

    updateWeights(learningRate) {
        for (let i = 0; i < this.outputSize; i++) {
            for (let j = 0; j < this.inputSize; j++) {
                this.weights[i * this.inputSize + j] += learningRate * this.inputs[j] * this.outputCost[i];
                // This is an outer product, include this as a function
            }
        }
    }

    updateBiases(learningRate) {
        this.biases = addVectors(this.biases,scalarMultiplyVector(this.outputCost,learningRate));
    }
}

class ActivationLayer extends Layer {
    constructor(size) {
        super(size,size);
        this.layerInput = null;
        this.outputCost = null;
        this.activationFunction = null;
        this.derivativeFunction = null;
    }

    initializeActivationFunction(activationType) {
        this.activationFunction = activationFunctions[activationType];
        this.derivativeFunction = derivativeActivationFunctions[activationType];

        if (!this.activationFunction || !this.derivativeFunction) {} // Error
    }

    forward(layerInput) {
        this.layerInput = layerInput;
        // Apply activation function
        return layerInput.map(this.activationFunction);
    }

    backward(outputCost) {
        this.outputCost = outputCost;
        // f'(z)
        return elementWiseVectorProduct(outputCost,this.layerInput.map(this.derivativeFunction));
    }
}

class Network {
    constructor() {
        this.layers = [];
        this.outputNeurons = null;
    }

    initializeNetworkArchitecture(architecture) {
        // archiecture = [["type",size],...]
        for (let i = 0; i < architecture.length; i++) {
            switch (architecture[i][0]) {
                case "dense":
                    this.layers.push(new DenseLayer(architecture[i][1],architecture[i][2]));
                break;
                case "activation":
                    this.layers.push(new ActivationLayer(architecture[i][1]));
                break;
            }
        }
    }

    feedForward(inputNeurons) {
        let output = inputNeurons;
        for (let layer of this.layers) {
            output = layer.forward(output);
        }
        this.outputNeurons = output;
    }

    backpropagate(targets) {
        let outputCost = subtractVectors(targets, this.outputNeurons);
        for (let i = this.layers.length - 1; i >= 0; i--) {
            outputCost = this.layers[i].backward(outputCost);
        }
    }
}