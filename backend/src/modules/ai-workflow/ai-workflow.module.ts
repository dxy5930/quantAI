import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIWorkflowController } from './ai-workflow.controller';
import { AIWorkflowService } from './ai-workflow.service';
import { NodeConfigController } from './node-config.controller';
import { NodeConfigService } from './services/node-config.service';
import { AIWorkflowHistory } from './entities/ai-workflow-history.entity';
import { AIChatHistory } from './entities/ai-chat-history.entity';
import { WorkflowDefinition } from './entities/workflow-definition.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { NodeType } from '../../shared/entities/node-type.entity';
import { NodeConfigField } from '../../shared/entities/node-config-field.entity';
import { NodeConfigOption } from '../../shared/entities/node-config-option.entity';
import { PythonApiModule } from '../../shared/modules/python-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AIWorkflowHistory, 
      AIChatHistory, 
      WorkflowDefinition, 
      WorkflowExecution,
      NodeType,
      NodeConfigField,
      NodeConfigOption,
    ]),
    PythonApiModule,
  ],
  controllers: [AIWorkflowController, NodeConfigController],
  providers: [AIWorkflowService, NodeConfigService],
  exports: [AIWorkflowService, NodeConfigService],
})
export class AIWorkflowModule {}