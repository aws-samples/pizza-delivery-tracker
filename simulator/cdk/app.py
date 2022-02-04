#!/usr/bin/env python3

from aws_cdk import App, Environment

from stacks.simulator_stack import SimulatorStack


env = Environment(region="eu-west-1")
app = App()
simulator_stack = SimulatorStack(app, "SimulatorStack", env=env)
app.synth()
