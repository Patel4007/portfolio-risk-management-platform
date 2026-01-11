#include "VaR_ES_engine.hpp"
#include <iostream>
#include "nlohmann/json.hpp"
using json = nlohmann::json;

int main() {
    double mu, sigma;
    std::cin >> mu >> sigma;

    VaREngine engine(0.99, 50000, 42);
    RiskMetrics m = engine.compute(mu, sigma);

    json out;
    out["var"] = m.var;
    out["es"]  = m.es;

    std::cout << out.dump();
}