
class Layer {
    constructor(inputSize, outputSize) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
    }
}

class DenseLayer extends Layer {
    constructor(inputSize, outputSize) {
        super(inputSize, outputSize);
        this.weights = new Array(inputSize * outputSize).fill(0);
        this.biases = new Array(outputSize).fill(0);
        this.layerInput = null;
        this.outputCost = null;
    }

    xavierInitalization() {
        const limit = Math.sqrt(6 / (this.inputSize + this.outputSize));
        this.weights = new Matrix(this.weights.map(() => Math.random() * 2 * limit - limit), this.inputSize);
    }

    forward(layerInput) {
        this.layerInput = layerInput;
        let layerOutput = Matrix.multiplyVector(this.weights, layerInput);
        layerOutput = addVectors(layerOutput, this.biases);
        return layerOutput;
    }

    backward(outputCost) {
        this.outputCost = outputCost;
        return Matrix.multiplyVector(Matrix.transpose(this.weights), outputCost);
    }

    updateWeights(learningRate) {
        this.weights = Matrix.elementWiseSum(outerProduct(scalarMultiplyVector(this.outputCost, learningRate), this.layerInput), this.weights);
    }

    updateBiases(learningRate) {
        this.biases = addVectors(this.biases,scalarMultiplyVector(this.outputCost,learningRate));
    }
}

class ActivationLayer extends Layer {
    constructor(size) {
        super(size, size);
        this.layerInput = null;
        this.layerOutput = null;
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
        this.layerOutput = layerInput.map(this.activationFunction);
        return this.layerOutput;
    }

    backward(outputCost) {
        this.outputCost = outputCost;
        // f'(z)
        return elementWiseVectorProduct(outputCost, this.layerInput.map((value, index) => this.derivativeFunction(value, this.layerOutput[index])));
    }

    updateWeights() {} // Unused
    updateBiases() {} // Unused
}

class Network {
    constructor() {
        this.layers = [];
        this.outputNeurons = null;
        this.learningRate = 0.01;
    }

    initializeNetworkArchitecture(architecture) {
        // archiecture = [["type",size],...]
        for (let i = 0; i < architecture.length; i++) {
            const [type, ...params] = architecture[i];
            switch (type) {
                case "dense":
                    this.layers.push(new DenseLayer(...params));
                    break;
                case "activation":
                    this.layers.push(new ActivationLayer(...params));
                    break;
                default:
                    // Error
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

    updateParameters() {
        for (let layer of this.layers) {
            layer.updateWeights(this.learningRate);
            layer.updateBiases(this.learningRate);
        }
    }

    meanSquaredError(targets) {
        return targets.map((value, index) => Math.pow(value - this.outputNeurons[index], 2)).reduce((sum, value) => sum + value, 0) / targets.length;
    }
}