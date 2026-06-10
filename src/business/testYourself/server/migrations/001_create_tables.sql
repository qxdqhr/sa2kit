-- TestYourself 配置表数据库迁移脚本
-- Database Migration Script for TestYourself Config Tables
-- 版本: 1.0.0
-- 数据库: PostgreSQL 12+

-- ========================================
-- 1. 主配置表 (test_yourself_configs)
-- ========================================

CREATE TABLE IF NOT EXISTS test_yourself_configs (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 基本信息
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]',
    
    -- 配置数据
    config JSONB NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    
    -- 状态字段
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 权限和所有权
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    organization_id VARCHAR(255),
    
    -- 统计信息
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP,
    view_count INTEGER NOT NULL DEFAULT 0,
    
    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,
    parent_id UUID,
    
    -- 自定义字段
    metadata JSONB,
    source VARCHAR(50),
    
    -- 时间戳
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS test_configs_name_idx ON test_yourself_configs(name);
CREATE INDEX IF NOT EXISTS test_configs_created_by_idx ON test_yourself_configs(created_by);
CREATE INDEX IF NOT EXISTS test_configs_organization_idx ON test_yourself_configs(organization_id);
CREATE INDEX IF NOT EXISTS test_configs_is_default_idx ON test_yourself_configs(is_default);
CREATE INDEX IF NOT EXISTS test_configs_is_published_idx ON test_yourself_configs(is_published);
CREATE INDEX IF NOT EXISTS test_configs_is_deleted_idx ON test_yourself_configs(is_deleted);
CREATE INDEX IF NOT EXISTS test_configs_created_at_idx ON test_yourself_configs(created_at);
CREATE INDEX IF NOT EXISTS test_configs_last_used_at_idx ON test_yourself_configs(last_used_at);

-- 组合索引
CREATE INDEX IF NOT EXISTS test_configs_org_deleted_published_idx 
ON test_yourself_configs(organization_id, is_deleted, is_published);

CREATE INDEX IF NOT EXISTS test_configs_created_by_deleted_idx 
ON test_yourself_configs(created_by, is_deleted);

-- 添加注释
COMMENT ON TABLE test_yourself_configs IS '测测你是什么 - 配置表';
COMMENT ON COLUMN test_yourself_configs.id IS '配置唯一ID';
COMMENT ON COLUMN test_yourself_configs.name IS '配置名称';
COMMENT ON COLUMN test_yourself_configs.config IS '测试配置（JSON格式）';
COMMENT ON COLUMN test_yourself_configs.is_default IS '是否为默认配置';
COMMENT ON COLUMN test_yourself_configs.usage_count IS '使用次数';

-- ========================================
-- 2. 使用记录表 (test_yourself_config_usage)
-- ========================================

CREATE TABLE IF NOT EXISTS test_yourself_config_usage (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 外键
    config_id UUID NOT NULL REFERENCES test_yourself_configs(id) ON DELETE CASCADE,
    
    -- 用户信息
    user_id VARCHAR(255),
    fingerprint TEXT,
    result_id VARCHAR(255),
    
    -- 请求信息
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    
    -- 时间信息
    used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completion_time INTEGER,
    
    -- 额外数据
    metadata JSONB
);

-- 创建索引
CREATE INDEX IF NOT EXISTS test_usage_config_idx ON test_yourself_config_usage(config_id);
CREATE INDEX IF NOT EXISTS test_usage_user_idx ON test_yourself_config_usage(user_id);
CREATE INDEX IF NOT EXISTS test_usage_used_at_idx ON test_yourself_config_usage(used_at);
CREATE INDEX IF NOT EXISTS test_usage_fingerprint_idx ON test_yourself_config_usage(fingerprint);

-- 添加注释
COMMENT ON TABLE test_yourself_config_usage IS '配置使用记录表';
COMMENT ON COLUMN test_yourself_config_usage.config_id IS '关联的配置ID';
COMMENT ON COLUMN test_yourself_config_usage.fingerprint IS '设备指纹';
COMMENT ON COLUMN test_yourself_config_usage.completion_time IS '完成时间（毫秒）';

-- ========================================
-- 3. 配置分享表 (test_yourself_config_shares)
-- ========================================

CREATE TABLE IF NOT EXISTS test_yourself_config_shares (
    -- 主键
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 分享信息
    share_code VARCHAR(20) NOT NULL UNIQUE,
    config_id UUID NOT NULL REFERENCES test_yourself_configs(id) ON DELETE CASCADE,
    
    -- 基本信息
    title VARCHAR(255),
    description TEXT,
    
    -- 访问控制
    password VARCHAR(100),
    max_access INTEGER,
    access_count INTEGER NOT NULL DEFAULT 0,
    
    -- 状态
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP,
    
    -- 所有权
    created_by VARCHAR(255) NOT NULL,
    
    -- 时间戳
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS test_shares_share_code_idx ON test_yourself_config_shares(share_code);
CREATE INDEX IF NOT EXISTS test_shares_config_idx ON test_yourself_config_shares(config_id);
CREATE INDEX IF NOT EXISTS test_shares_created_by_idx ON test_yourself_config_shares(created_by);
CREATE INDEX IF NOT EXISTS test_shares_is_active_idx ON test_yourself_config_shares(is_active);

-- 添加注释
COMMENT ON TABLE test_yourself_config_shares IS '配置分享表';
COMMENT ON COLUMN test_yourself_config_shares.share_code IS '分享代码（短链接标识）';
COMMENT ON COLUMN test_yourself_config_shares.password IS '访问密码';
COMMENT ON COLUMN test_yourself_config_shares.max_access IS '最大访问次数';

-- ========================================
-- 4. 创建触发器（自动更新 updated_at）
-- ========================================

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 test_yourself_configs 表创建触发器
DROP TRIGGER IF EXISTS update_test_configs_updated_at ON test_yourself_configs;
CREATE TRIGGER update_test_configs_updated_at
    BEFORE UPDATE ON test_yourself_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 test_yourself_config_shares 表创建触发器
DROP TRIGGER IF EXISTS update_test_shares_updated_at ON test_yourself_config_shares;
CREATE TRIGGER update_test_shares_updated_at
    BEFORE UPDATE ON test_yourself_config_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. 插入示例数据（可选）
-- ========================================

-- 示例配置 1: 性格测试
INSERT INTO test_yourself_configs (
    name,
    description,
    config,
    result_count,
    created_by,
    organization_id
) VALUES (
    '性格测试',
    '测测你是什么性格类型',
    '{
        "gameTitle": "你是什么性格？",
        "gameDescription": "长按按钮，测测你的性格类型",
        "buttonText": "长按这里",
        "longPressDuration": 3000,
        "results": [
            {
                "id": "1",
                "title": "外向型",
                "description": "你是一个外向开朗的人",
                "image": "😊",
                "imageType": "emoji"
            },
            {
                "id": "2",
                "title": "内向型",
                "description": "你是一个内向安静的人",
                "image": "😌",
                "imageType": "emoji"
            }
        ]
    }'::jsonb,
    2,
    'system',
    NULL
) ON CONFLICT DO NOTHING;

-- 示例配置 2: 动物测试
INSERT INTO test_yourself_configs (
    name,
    description,
    config,
    result_count,
    is_default,
    created_by,
    organization_id
) VALUES (
    '动物测试',
    '测测你是什么动物',
    '{
        "gameTitle": "你是什么动物？",
        "gameDescription": "长按按钮，发现你的动物属性",
        "buttonText": "开始测试",
        "longPressDuration": 3000,
        "results": [
            {
                "id": "1",
                "title": "猫咪",
                "description": "优雅、独立、神秘",
                "image": "🐱",
                "imageType": "emoji"
            },
            {
                "id": "2",
                "title": "小狗",
                "description": "忠诚、活泼、友好",
                "image": "🐶",
                "imageType": "emoji"
            },
            {
                "id": "3",
                "title": "熊猫",
                "description": "可爱、温和、慵懒",
                "image": "🐼",
                "imageType": "emoji"
            }
        ]
    }'::jsonb,
    3,
    TRUE,
    'system',
    NULL
) ON CONFLICT DO NOTHING;

-- ========================================
-- 6. 授权（根据需要调整）
-- ========================================

-- 示例：为应用用户授予权限
-- GRANT SELECT, INSERT, UPDATE, DELETE ON test_yourself_configs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON test_yourself_config_usage TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON test_yourself_config_shares TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ========================================
-- 验证
-- ========================================

-- 查看表结构
-- \d test_yourself_configs
-- \d test_yourself_config_usage
-- \d test_yourself_config_shares

-- 查看数据
-- SELECT * FROM test_yourself_configs;

-- 查看索引
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'test_yourself%';

-- ========================================
-- 完成
-- ========================================

-- 打印成功信息
DO $$
BEGIN
    RAISE NOTICE '✅ TestYourself 数据库表创建完成！';
    RAISE NOTICE '   - test_yourself_configs (配置表)';
    RAISE NOTICE '   - test_yourself_config_usage (使用记录表)';
    RAISE NOTICE '   - test_yourself_config_shares (分享表)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 可以运行以下命令查看数据：';
    RAISE NOTICE '   SELECT COUNT(*) FROM test_yourself_configs;';
END $$;
