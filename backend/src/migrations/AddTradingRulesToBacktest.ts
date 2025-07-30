import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTradingRulesToBacktest1703000000000 implements MigrationInterface {
    name = 'AddTradingRulesToBacktest1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 为回测历史表添加交易规则相关字段
        await queryRunner.query(`
            ALTER TABLE \`backtest_history\` 
            ADD COLUMN \`trading_rules\` JSON NULL COMMENT '交易规则配置（JSON格式）',
            ADD COLUMN \`slippage\` DECIMAL(10,6) DEFAULT 0.001 COMMENT '滑点设置',
            ADD COLUMN \`min_trade_amount\` DECIMAL(15,2) DEFAULT 1000.00 COMMENT '最小交易金额'
        `);

        // 为策略表添加默认交易规则字段
        await queryRunner.query(`
            ALTER TABLE \`strategies\` 
            ADD COLUMN \`default_trading_rules\` JSON NULL COMMENT '默认交易规则配置（JSON格式）'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚操作
        await queryRunner.query(`
            ALTER TABLE \`backtest_history\` 
            DROP COLUMN \`trading_rules\`,
            DROP COLUMN \`slippage\`,
            DROP COLUMN \`min_trade_amount\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`strategies\` 
            DROP COLUMN \`default_trading_rules\`
        `);
    }
}