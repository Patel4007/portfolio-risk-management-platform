#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "VaR_ES_engine.hpp"

namespace py = pybind11;

PYBIND11_MODULE(var_engine, m) {
    m.doc() = "VaR / Expected Shortfall Monte Carlo Engine";

    py::class_<RiskMetrics>(m, "RiskMetrics")
        .def_readwrite("var", &RiskMetrics::var)
        .def_readwrite("es",  &RiskMetrics::es);

    py::class_<VaREngine>(m, "VaREngine")
        .def(py::init<double, int, unsigned int>(),
             py::arg("confidence_level"),
             py::arg("n_sims"),
             py::arg("seed") = 42)
        .def("compute", &VaREngine::compute);
}
