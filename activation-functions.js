const activationFunctions = {
    sigmoid: (z) => 1 / (1 + Math.exp(-z)),
    relu: (z) => Math.max(0, z),
    tanh: (z) => Math.tanh(z),
    softmax: (z) => {
        const maxZ = Math.max(...z);   // Numerical stability
        const expZ = z.map(value => Math.exp(value - maxZ));
        const sumExpZ = expZ.reduce((acc, value) => acc + value, 0);
        return ezpZ.map(value => value / sumExpZ);
    }
};

const derivativeActivationFunctions = {
    sigmoid: (_, a) => a * (1 - a),
    relu: (z, _) => (z > 0 ? 1 : 0),
    tanh: (_, a) => 1 - Math.pow(a, 2),
    softmax: (z, a) => {
        return a.map((a_i, i) => {
            return a.map((a_j, j) => {
                if (i === j) {
                    return a_i * (1 - a_i);
                } else {
                    return -a_i * a_j;
                }
            });
        });
    }
}