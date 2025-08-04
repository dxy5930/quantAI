import React from "react";
import { observer } from "mobx-react-lite";
import { WorkflowLayout } from "../../components/workflow";

const AIWorkflowPage: React.FC = observer(() => {
  return (
    <WorkflowLayout />
  );
});

export default AIWorkflowPage;
