import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAIWorkflowTables1703000000000 implements MigrationInterface {
  name = 'CreateAIWorkflowTables1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建AI工作流历史表
    await queryRunner.createTable(
      new Table({
        name: 'ai_workflow_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid()',
          },
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'query',
            type: 'text',
          },
          {
            name: 'workflow_type',
            type: 'varchar',
            length: '50',
            default: "'chat_analysis'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'running'",
          },
          {
            name: 'progress',
            type: 'int',
            default: 0,
          },
          {
            name: 'current_agent',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'agents_status',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'results',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'start_time',
            type: 'datetime',
          },
          {
            name: 'end_time',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // 创建AI聊天历史表
    await queryRunner.createTable(
      new Table({
        name: 'ai_chat_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid()',
          },
          {
            name: 'message_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'conversation_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // 创建索引
    await queryRunner.createIndex(
      'ai_workflow_history',
      new TableIndex({
        name: 'IDX_ai_workflow_history_user_created',
        columnNames: ['user_id', 'created_at']
      })
    );

    await queryRunner.createIndex(
      'ai_workflow_history',
      new TableIndex({
        name: 'IDX_ai_workflow_history_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'ai_workflow_history',
      new TableIndex({
        name: 'IDX_ai_workflow_history_type',
        columnNames: ['workflow_type']
      })
    );

    await queryRunner.createIndex(
      'ai_chat_history',
      new TableIndex({
        name: 'IDX_ai_chat_history_conversation',
        columnNames: ['user_id', 'conversation_id', 'created_at']
      })
    );

    await queryRunner.createIndex(
      'ai_chat_history',
      new TableIndex({
        name: 'IDX_ai_chat_history_type',
        columnNames: ['message_type']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ai_chat_history');
    await queryRunner.dropTable('ai_workflow_history');
  }
}