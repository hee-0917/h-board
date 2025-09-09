-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 부서 테이블
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 직원 테이블
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    position VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 부서장 외래키 추가
ALTER TABLE departments 
ADD CONSTRAINT departments_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES employees(id);

-- 게시글 테이블
CREATE TYPE post_type AS ENUM ('ALL', 'DEPARTMENT');

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES employees(id),
    post_type post_type NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_urgent BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TYPE notification_type AS ENUM ('POST', 'URGENT', 'MENTION');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES employees(id),
    post_id UUID NOT NULL REFERENCES posts(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    notification_type notification_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 푸시 토큰 테이블
CREATE TYPE device_type AS ENUM ('WEB', 'ANDROID', 'IOS');

CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES employees(id),
    token VARCHAR(255) NOT NULL,
    device_type device_type NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_department_id ON posts(department_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_urgent ON posts(is_urgent);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 직원은 자신의 정보만 조회 가능
CREATE POLICY "Users can view their own employee data" ON employees
    FOR SELECT USING (auth.uid()::text = id::text);

-- 부서 정보는 모든 직원이 조회 가능
CREATE POLICY "Users can view all departments" ON departments
    FOR SELECT USING (true);

-- 게시글 정책
CREATE POLICY "Users can view posts" ON posts
    FOR SELECT USING (
        post_type = 'ALL' OR 
        (post_type = 'DEPARTMENT' AND department_id = (
            SELECT department_id FROM employees WHERE auth.uid()::text = id::text
        ))
    );

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid()::text = author_id::text);

-- 알림 정책
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 푸시 토큰 정책
CREATE POLICY "Users can manage their own push tokens" ON push_tokens
    FOR ALL USING (auth.uid()::text = user_id::text);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
-- 부서 데이터
INSERT INTO departments (id, name, code, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '의료진', 'MED', '의사 및 간호사'),
    ('550e8400-e29b-41d4-a716-446655440001', '행정팀', 'ADM', '병원 행정 업무'),
    ('550e8400-e29b-41d4-a716-446655440002', '약제팀', 'PHM', '약품 관리'),
    ('550e8400-e29b-41d4-a716-446655440003', '인사팀', 'HR', '인사 관리');

-- 직원 데이터 (비밀번호는 'password123'으로 해시됨)
INSERT INTO employees (id, employee_id, name, email, password_hash, department_id, position) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', 'EMP001', '김의사', 'doctor.kim@hospital.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440000', '주치의'),
    ('550e8400-e29b-41d4-a716-446655440011', 'EMP002', '이간호사', 'nurse.lee@hospital.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440000', '수간호사'),
    ('550e8400-e29b-41d4-a716-446655440012', 'EMP003', '박관리자', 'admin.park@hospital.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440001', '팀장'),
    ('550e8400-e29b-41d4-a716-446655440013', 'EMP004', '최약사', 'pharmacist.choi@hospital.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '550e8400-e29b-41d4-a716-446655440002', '약사');

-- 부서장 업데이트
UPDATE departments SET manager_id = '550e8400-e29b-41d4-a716-446655440011' WHERE code = 'MED';
UPDATE departments SET manager_id = '550e8400-e29b-41d4-a716-446655440012' WHERE code = 'ADM';
UPDATE departments SET manager_id = '550e8400-e29b-41d4-a716-446655440013' WHERE code = 'PHM';

-- 샘플 게시글
INSERT INTO posts (title, content, author_id, post_type, is_urgent, is_pinned) VALUES
    ('병원 내 마스크 착용 의무화', '코로나19 재확산에 따라 병원 내 모든 구역에서 마스크 착용이 의무화됩니다.', '550e8400-e29b-41d4-a716-446655440012', 'ALL', false, true),
    ('응급실 운영 시간 변경 안내', '12월 1일부터 응급실 운영 시간이 변경됩니다. 자세한 내용은 본문을 확인해주세요.', '550e8400-e29b-41d4-a716-446655440011', 'ALL', true, false),
    ('연말 휴가 신청 기간 안내', '연말 휴가 신청 기간은 12월 15일부터 12월 20일까지입니다.', '550e8400-e29b-41d4-a716-446655440012', 'ALL', false, false);

INSERT INTO posts (title, content, author_id, post_type, department_id) VALUES
    ('신약 입고 현황 공유', '이번 주 신약 입고 현황을 공유드립니다.', '550e8400-e29b-41d4-a716-446655440013', 'DEPARTMENT', '550e8400-e29b-41d4-a716-446655440002'),
    ('의료진 회의 일정 변경', '정기 의료진 회의 일정이 변경되었습니다.', '550e8400-e29b-41d4-a716-446655440011', 'DEPARTMENT', '550e8400-e29b-41d4-a716-446655440000');
