cmake_minimum_required(VERSION 3.10)
project(VaREngineBinding)

find_package(Python3 REQUIRED COMPONENTS Interpreter Development)
find_package(pybind11 REQUIRED)

pybind11_add_module(var_engine bindings.cpp VaR_ES_engine.cpp)

target_include_directories(var_engine PRIVATE ${Python3_INCLUDE_DIRS})
