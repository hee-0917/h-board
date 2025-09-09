// 권한 레벨 enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',      // 슈퍼관리자: 병원장, IT팀장
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN', // 부서관리자: 각 부서장
  MODERATOR = 'MODERATOR',          // 게시판관리자: 홍보팀, 교육팀
  USER = 'USER'                     // 일반직원: 기본값
}

// 권한별 설명
export const ROLE_DESCRIPTIONS = {
  [UserRole.SUPER_ADMIN]: {
    label: '슈퍼관리자',
    description: '모든 기능 접근 가능',
    color: 'red',
    icon: '👑',
    permissions: [
      '모든 게시글 관리',
      '직원 관리',
      '시스템 설정',
      '전체 통계 조회',
      '권한 부여/해제'
    ]
  },
  [UserRole.DEPARTMENT_ADMIN]: {
    label: '부서관리자',
    description: '해당 부서 관리 가능',
    color: 'blue',
    icon: '🛡️',
    permissions: [
      '부서 게시글 관리',
      '부서원 모니터링',
      '부서 통계 조회',
      '부서원 알림 발송'
    ]
  },
  [UserRole.MODERATOR]: {
    label: '게시판관리자',
    description: '게시판 관리 가능',
    color: 'green',
    icon: '📝',
    permissions: [
      '전체 공지 작성',
      '게시글 고정/해제',
      '부적절한 게시글 관리'
    ]
  },
  [UserRole.USER]: {
    label: '일반직원',
    description: '기본 사용자',
    color: 'gray',
    icon: '👤',
    permissions: [
      '게시글 읽기/확인',
      '부서 공지 작성'
    ]
  }
} as const;

// 권한 레벨 순서 (높은 순)
export const ROLE_HIERARCHY = [
  UserRole.SUPER_ADMIN,
  UserRole.DEPARTMENT_ADMIN,
  UserRole.MODERATOR,
  UserRole.USER
] as const;

// 권한 체크 유틸 함수들
export class RoleChecker {
  // 특정 권한 이상인지 확인
  static hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const userIndex = ROLE_HIERARCHY.indexOf(userRole);
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userIndex <= requiredIndex; // 배열 앞쪽이 더 높은 권한
  }

  // 관리자 권한인지 확인
  static isAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN || 
           role === UserRole.DEPARTMENT_ADMIN;
  }

  // 슈퍼 관리자인지 확인
  static isSuperAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
  }

  // 부서 관리자인지 확인
  static isDepartmentAdmin(role: UserRole): boolean {
    return role === UserRole.DEPARTMENT_ADMIN;
  }

  // 게시판 관리 권한이 있는지 확인
  static canManagePosts(role: UserRole): boolean {
    return this.hasMinimumRole(role, UserRole.MODERATOR);
  }

  // 직원 관리 권한이 있는지 확인
  static canManageEmployees(role: UserRole): boolean {
    return this.hasMinimumRole(role, UserRole.DEPARTMENT_ADMIN);
  }

  // 시스템 설정 권한이 있는지 확인
  static canManageSystem(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
  }
}

// 권한별 페이지 접근 권한
export const PAGE_PERMISSIONS = {
  // 관리자 페이지들
  '/admin': [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN],
  '/admin/dashboard': [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN],
  '/admin/employees': [UserRole.SUPER_ADMIN],
  '/admin/departments': [UserRole.SUPER_ADMIN],
  '/admin/posts': [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.MODERATOR],
  '/admin/analytics': [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN],
  '/admin/settings': [UserRole.SUPER_ADMIN],
  
  // 일반 페이지들 (모든 권한 접근 가능)
  '/dashboard': [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.MODERATOR, UserRole.USER],
  '/posts': [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.MODERATOR, UserRole.USER],
} as const;

export type RolePermissionKey = keyof typeof PAGE_PERMISSIONS;
