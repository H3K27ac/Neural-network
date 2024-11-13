
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
        this.biases = new Vector(new Array(outputSize).fill(0));
        this.inputNeurons = null;
        this.outputCost = null;
        this.inputCost = null;
    }

    initializeWeightMatrix(inputSize,outputSize) {
        return new Array(inputSize*outputSize).fill(0);
        // Stride = outputSize
    }

    forward(neurons) {
        this.inputNeurons = neurons;
        let layerOutput = Matrix.multiplyVector(this.weights,neurons);
        layerOutput = Vector.add(layerOutput,this.biases);
        return layerOutput;
    }

    backward(outputCost) {
        this.outputCost = outputCost;
        this.inputCost = Matrix.multiplyVector(Matrix.transpose(this.weights),outputCost);
    }

    updateWeights(learningRate) {
        for (let i = 0; i < this.inputSize; i++) {
            for (let j = 0; j < this.outputSize; j++) {
                this.weights[i * this.outputSize + j] += learningRate * this.inputs[i] * this.outputCost[j];
            }
        }
    }

    updateBiases(learningRate) {
        for (let i = 0; i < this.outputSize; i++) {
            this.biases[i] += learningRate * this.outputCost[i];
        }
    }
}

class ActivationLayer extends Layer {
    constructor(size) {
        super(size,size);
    }

    initializeActivationFunction() {}
}

class Network {
    constructor() {
        this.layers = [];
    }

    initializeNetworkArchitecture(architecture) {
        // archiecture = [["type",size],...]
        for (let i = 0; i < architecture.length; i++) {
            switch (architecture[i][0]) {
                case "dense":
                    this.layers.push(new DenseLayer(architecture[i][1],architecture[i][2]));
                break;
                case "activation":
                    //
                break;
            }
        }
    }

    feedForward(input) {
        let output = input;
        for (let layer of this.layers) {
            output = layer.forward(output);
        }
        return output;
    }
}