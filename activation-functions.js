const activationFunctions = {
    sigmoid: (z) => 1 / (1 + Math.exp(-z)),
    relu: (z) => Math.max(0, z),
    tanh: (z) => Math.tanh(z)
};

const derivativeActivationFunctions = {
    sigmoid: (_, a) => a * (1 - a),
    relu: (z, _) => (z > 0 ? 1 : 0),
    tanh: (_, a) => 1 - Math.pow(a, 2)
}