import * as XLSX from 'xlsx'

export interface EmployeeData {
  employee_id: string
  name: string
  department_name: string
  role: string
}

export function parseExcelFile(file: File): Promise<EmployeeData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 첫 번째 시트 가져오기
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // 헤더 제거하고 데이터 파싱
        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as string[][]
        
        const employees: EmployeeData[] = rows
          .filter(row => row.length > 0 && row[0]) // 빈 행 제거
          .map(row => {
            const employee: Partial<EmployeeData> = {}
            headers.forEach((header, index) => {
              const value = row[index] || ''
              // 헤더명을 데이터베이스 컬럼명에 맞게 매핑
              switch (header.toLowerCase()) {
                case '사번':
                case '직원번호':
                case 'employee_id':
                  employee.employee_id = String(value)
                  break
                case '이름':
                case '성명':
                case 'name':
                  employee.name = String(value)
                  break
                case '소속':
                case '부서':
                case '부서명':
                case 'department':
                case 'department_name':
                  employee.department_name = String(value)
                  break
                case '권한레벨':
                case '권한':
                case 'role':
                case 'level':
                  // 권한 레벨을 시스템 권한으로 매핑
                  const roleValue = String(value).toUpperCase()
                  switch (roleValue) {
                    case '1':
                    case 'USER':
                    case '일반':
                    case '사용자':
                      employee.role = 'USER'
                      break
                    case '2':
                    case 'MODERATOR':
                    case '조정자':
                    case '중간관리자':
                      employee.role = 'MODERATOR'
                      break
                    case '3':
                    case 'DEPARTMENT_ADMIN':
                    case '부서관리자':
                    case '부서장':
                      employee.role = 'DEPARTMENT_ADMIN'
                      break
                    case '4':
                    case 'SUPER_ADMIN':
                    case '최고관리자':
                    case '시스템관리자':
                      employee.role = 'SUPER_ADMIN'
                      break
                    default:
                      employee.role = 'USER'
                      break
                  }
                  break
              }
            })
            return employee
          })
          .filter(emp => emp.employee_id && emp.name && emp.department_name) // 필수 필드가 있는 것만
        
        resolve(employees)
      } catch (error) {
        reject(new Error('엑셀 파일을 읽는 중 오류가 발생했습니다: ' + error))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

export function downloadExcelTemplate() {
  const templateData = [
    ['사번', '이름', '소속', '권한레벨'],
    ['EMP001', '홍길동', '5층상급', '1'],
    ['EMP002', '김간호사', '내시경센터', '2'],
    ['EMP003', '박부서장', '원무', '3'],
    ['EMP004', '최관리자', '시스템관리자', '4'],
    ['EMP005', '이약사', '약제과', '1']
  ]
  
  // 권한 레벨 설명과 부서 목록 추가
  const explanationData = [
    [],
    ['권한레벨 설명:'],
    ['1 = 일반 사용자 (USER)'],
    ['2 = 조정자 (MODERATOR)'],
    ['3 = 부서 관리자 (DEPARTMENT_ADMIN)'],
    ['4 = 최고 관리자 (SUPER_ADMIN)'],
    [],
    ['소속 부서 목록 (정확히 입력하세요):'],
    ['5층상급', '5층통합', '6층통합', 'SEROUM'],
    ['감염관리실', '건강증진센터', '내시경센터', '대외협력본부'],
    ['마케팅', '방사선실', '법인사무국', '수술실'],
    ['시설관리', '시스템관리자', '심사', '약제과'],
    ['예약,콜,고객관리', '외래', '원무', '의국'],
    ['의국지원', '임상병리실', '장애인스포츠단', '전산'],
    ['진료협력센터', '통합진료실']
  ]
  
  const ws = XLSX.utils.aoa_to_sheet([...templateData, ...explanationData])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '직원명단')
  
  XLSX.writeFile(wb, '직원명단_템플릿.xlsx')
}
