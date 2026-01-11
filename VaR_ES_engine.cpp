#include "VaR_ES_engine.hpp"
#include<random>
#include<algorithm>
#include<numeric>

VaREngine::VaREngine(double confidence_level, int n_sims, unsigned int seed) : 
    alpha(confidence_level), simulations(n_sims), rng_seed(seed) {}         

RiskMetrics VaREngine::compute(double mu, double sigma) {
    std::mt19937 generator(rng_seed);
    std::normal_distribution<> dist(mu, sigma);

    std::vector<double> pnl(simulations);

    for(int i = 0; i < simulations; ++i) {
        pnl[i] = dist(generator);
    }

    std::sort(pnl.begin(), pnl.end());

    int var_index = std::max(0, static_cast<int>(simulations * (1 - alpha)) - 1);
    double var = - pnl[var_index];

    double es = 0.0;
    for (int i = 0; i <= var_index; ++i) {
        es += pnl[i];
    }
    es = (- es) / (var_index + 1);

    return {var, es};

}