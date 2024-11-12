
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
        layerOutput = this.vectorVectorSum(layerOutput,this.biases);
        return layerOutput;
    }

    backward() {}

    matrixVectorProduct(matrix,vector) {
        let outputVector = [];
        for (let i = 0; i < this.outputSize; i++) {
            let sum = 0;
            for (let j = 0; j < this.inputSize; j++) {
                sum += matrix[i*this.outputSize+j] * vector[j];
            }
            outputVector.push(sum);
        }
        return outputVector;
    }

    vectorVectorSum(vector1,vector2) {
        if (vector1.length !== vector2.length); // Error
        for (let i = 0; i < vector1.length; i++) {
            vector1[i] += vector2[i];
        }
        return vector1;
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