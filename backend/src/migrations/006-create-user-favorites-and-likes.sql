-- 创建用户收藏策略表
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "strategyId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("strategyId") REFERENCES strategies(id) ON DELETE CASCADE,
    UNIQUE("userId", "strategyId")
);

-- 为用户收藏表添加注释
COMMENT ON TABLE user_favorites IS '用户收藏策略表';
COMMENT ON COLUMN user_favorites.id IS '收藏记录唯一标识符';
COMMENT ON COLUMN user_favorites."userId" IS '用户ID';
COMMENT ON COLUMN user_favorites."strategyId" IS '策略ID';
COMMENT ON COLUMN user_favorites."createdAt" IS '收藏时间';

-- 创建用户点赞策略表
CREATE TABLE IF NOT EXISTS user_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "strategyId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("strategyId") REFERENCES strategies(id) ON DELETE CASCADE,
    UNIQUE("userId", "strategyId")
);

-- 为用户点赞表添加注释
COMMENT ON TABLE user_likes IS '用户点赞策略表';
COMMENT ON COLUMN user_likes.id IS '点赞记录唯一标识符';
COMMENT ON COLUMN user_likes."userId" IS '用户ID';
COMMENT ON COLUMN user_likes."strategyId" IS '策略ID';
COMMENT ON COLUMN user_likes."createdAt" IS '点赞时间';

-- 为收藏表创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites("userId");
CREATE INDEX IF NOT EXISTS idx_user_favorites_strategy_id ON user_favorites("strategyId");

-- 为点赞表创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes("userId");
CREATE INDEX IF NOT EXISTS idx_user_likes_strategy_id ON user_likes("strategyId"); 