
class Layer {
    constructor(inputSize, outputSize) {
        this.inputSize = inputSize;
        this.outputSize = outputSize;
    }
}

class DenseLayer extends Layer {
    constructor(inputSize,outputSize) {
        super(inputSize,outputSize);
        this.weights = this.initializeWeightMatrix(inputSize,outputSize);
        this.biases = new Array(outputSize).fill(0);
        this.neurons = null;
    }

    initializeWeightMatrix(inputSize,outputSize) {
        return new Array(inputSize*outputSize).fill(0);
        // Stride = outputSize
    }

    forward(neurons) {
        this.neurons = neurons;
        let layerOutput = this.matrixVectorProduct(this.weights,neurons);
    }

    matrixVectorProduct(matrix,vector) {
        let outputVector = [];
        for (let i = 0; i < matrix.length; i++) {
            let sum = 0;
            for (let j = 0; j < matrix[i].length; j++) {
                sum += matrix[i*this.outputSize+j] * vector[j];
            }
            outputVector.push(sum);
        }
        return outputVector;
    }
}

class ActivationLayer extends Layer {
    constructor(size) {
        super(size,size);
    }

    initializeActivationFunction() {}
}

class Network {
    constructor() {}
}