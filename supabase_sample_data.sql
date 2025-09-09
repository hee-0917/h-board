-- 샘플 데이터 삽입
-- 위의 테이블 생성 SQL 실행 후 이 스크립트를 실행하세요

-- 부서 데이터 삽입
INSERT INTO departments (id, name, code, description) VALUES
(1, '의료진', 'MED', '의사 및 간호사'),
(2, '관리부', 'ADMIN', '병원 관리 및 운영'),
(3, '약제팀', 'PHARM', '약사 및 약제 관리'),
(4, '홍보팀', 'PR', '홍보 및 마케팅');

-- 직원 데이터 삽입
INSERT INTO employees (id, employee_id, name, email, password_hash, department_id, position, role, phone, hire_date, is_active, last_login) VALUES
(1, 'EMP001', '김의사', 'kim@hospital.com', '1234', 1, '주치의', 'USER', '010-1234-5678', '2023-01-15', true, NOW()),
(2, 'EMP002', '이간호사팀장', 'lee@hospital.com', '1234', 1, '수간호사', 'DEPARTMENT_ADMIN', '010-2345-6789', '2022-03-20', true, NOW()),
(3, 'EMP003', '박관리자', 'park@hospital.com', '1234', 2, '팀장', 'SUPER_ADMIN', '010-3456-7890', '2020-05-10', true, NOW()),
(4, 'EMP004', '최약사', 'choi@hospital.com', '1234', 3, '약사', 'USER', '010-4567-8901', '2023-07-01', true, NOW()),
(5, 'EMP005', '정홍보팀', 'jung@hospital.com', '1234', 4, '담당자', 'MODERATOR', '010-5678-9012', '2023-09-15', true, NOW());

-- 샘플 게시글 삽입
INSERT INTO posts (id, title, content, author_id, department_id, post_type, is_urgent, is_pinned, view_count) VALUES
(1, '병원 전체 공지 1', '모든 직원에게 알립니다. 새로운 정책이 시행됩니다.', 3, NULL, 'announcement', true, true, 10),
(2, '간호부 공지사항', '간호부 직원들께 필독 사항을 알려드립니다.', 2, 1, 'notice', false, false, 5),
(3, '새로운 의료 장비 도입 안내', '최신 의료 장비가 도입되었습니다. 교육 일정을 확인해주세요.', 3, NULL, 'announcement', false, false, 8),
(4, '홍보팀 주간 회의록', '이번 주 회의 안건과 결과를 공유합니다.', 5, 4, 'notice', false, false, 3),
(5, '응급실 비상 대기표', '이번 달 응급실 비상 대기표입니다. 확인 필수!', 1, 1, 'urgent', true, false, 12);

-- 샘플 확인 데이터 삽입
INSERT INTO post_confirmations (post_id, employee_id) VALUES
(1, 1),
(1, 2),
(2, 1);

-- 시퀀스 재설정 (다음 ID가 올바르게 할당되도록)
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));
SELECT setval('post_confirmations_id_seq', (SELECT MAX(id) FROM post_confirmations));
