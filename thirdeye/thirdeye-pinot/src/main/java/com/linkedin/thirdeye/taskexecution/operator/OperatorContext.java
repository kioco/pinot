package com.linkedin.thirdeye.taskexecution.operator;

import com.linkedin.thirdeye.taskexecution.dag.NodeIdentifier;
import com.linkedin.thirdeye.taskexecution.dataflow.ExecutionContext;
import com.linkedin.thirdeye.taskexecution.dataflow.ExecutionResults;
import java.util.HashMap;
import java.util.Map;

public class OperatorContext implements ExecutionContext<ExecutionResults> {
  private NodeIdentifier nodeIdentifier;
  private Map<NodeIdentifier, ExecutionResults> inputs = new HashMap<>();

  @Override
  public NodeIdentifier getNodeIdentifier() {
    return nodeIdentifier;
  }

  @Override
  public void setNodeIdentifier(NodeIdentifier nodeIdentifier) {
    this.nodeIdentifier = nodeIdentifier;
  }

  @Override
  public Map<NodeIdentifier, ExecutionResults> getInputs() {
    return inputs;
  }

  @Override
  public void addResults(NodeIdentifier identifier, ExecutionResults operatorResult) {
    inputs.put(identifier, operatorResult);
  }
}