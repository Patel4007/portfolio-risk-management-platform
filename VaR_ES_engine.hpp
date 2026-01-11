#pragma once

#include<vector>

struct RiskMetrics {
    double var;
    double es;
};

class VaREngine {
    public:
    
    VaREngine(double confidence_level, int n_sims, unsigned int seed = 42);

    RiskMetrics compute(double mu, double sigma);

    private:

    double alpha;
    int simulations;
    unsigned int rng_seed;

};