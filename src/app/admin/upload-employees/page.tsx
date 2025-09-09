'use client'

import { useState } from 'react'
import { parseExcelFile, downloadExcelTemplate, EmployeeData } from '@/lib/excel-utils'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UploadEmployeesPage() {
  const { employee } = useAuthStore()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<EmployeeData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')

  // 관리자 권한 확인
  if (!employee || (employee.role !== 'SUPER_ADMIN' && employee.role !== 'DEPARTMENT_ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-lg text-gray-600">접근 권한이 없습니다.</div>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setUploadStatus('')

    try {
      const data = await parseExcelFile(selectedFile)
      setParsedData(data)
      setUploadStatus(`파일을 성공적으로 읽었습니다. ${data.length}명의 직원 정보를 발견했습니다.`)
    } catch (error) {
      setUploadStatus(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      setParsedData([])
    }
  }

  const handleUpload = async () => {
    if (!parsedData.length) return

    setIsUploading(true)
    setUploadStatus('')

    try {
      // 부서 정보 먼저 가져오기
      const departmentsResponse = await fetch('/api/departments')
      if (!departmentsResponse.ok) {
        throw new Error('부서 정보를 가져올 수 없습니다.')
      }
      const departments = await departmentsResponse.json()
      
      // departments가 배열인지 확인
      if (!Array.isArray(departments)) {
        throw new Error('부서 데이터 형식이 올바르지 않습니다.')
      }

      // 직원 데이터 업로드
      const uploadPromises = parsedData.map(async (emp) => {
        // 부서 ID 찾기
        const department = departments.find((d: { id: number; name: string }) => d.name === emp.department_name)
        const departmentId = department ? department.id : null
        
        if (!departmentId) {
          console.warn(`부서 '${emp.department_name}'을 찾을 수 없습니다. 부서 없이 등록합니다.`)
        }

        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: emp.employee_id,
            name: emp.name,
            email: `${emp.employee_id}@hospital.com`, // 기본 이메일 형식
            position: '직원', // 기본 직급
            phone: '', // 전화번호 비어있음
            hire_date: new Date().toISOString().split('T')[0], // 오늘 날짜
            department_id: departmentId,
            password_hash: '1234', // 기본 비밀번호
            role: emp.role || 'USER'
          }),
        })

        if (!response.ok) {
          throw new Error(`직원 ${emp.name} 업로드 실패: ${response.statusText}`)
        }

        return response.json()
      })

      await Promise.all(uploadPromises)
      setUploadStatus(`성공적으로 ${parsedData.length}명의 직원을 업로드했습니다!`)
      setParsedData([])
      setFile(null)
      
      // 파일 입력 초기화
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error) {
      setUploadStatus(`업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl mr-2">🏥</Link>
              <h1 className="text-xl font-semibold text-gray-900">
                직원 명단 업로드
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{employee?.name}</span>
                <span className="ml-2 text-gray-500">| {employee?.role}</span>
              </div>
              <Link 
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                대시보드로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              📋 엑셀 파일로 직원 명단 업로드
            </h3>
            <p className="text-blue-700 text-sm">
              엑셀 파일을 업로드하여 여러 직원을 한 번에 등록할 수 있습니다.
            </p>
          </div>

          {/* 템플릿 다운로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📥 엑셀 템플릿 다운로드
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              아래 버튼을 클릭하여 엑셀 템플릿을 다운로드하고, 사번/이름/소속/권한레벨 정보를 입력한 후 업로드하세요.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
              <h4 className="font-medium text-blue-900 mb-2">📋 입력 형식 안내</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• <strong>사번:</strong> 직원 고유번호 (예: EMP001)</li>
                <li>• <strong>이름:</strong> 직원 성명</li>
                <li>• <strong>소속:</strong> 부서명 (5층상급, 내시경센터, 원무, 약제과 등 - 템플릿 참조)</li>
                <li>• <strong>권한레벨:</strong> 1(일반) / 2(조정자) / 3(부서관리자) / 4(최고관리자)</li>
              </ul>
              <p className="text-blue-600 mt-2 text-xs">
                💡 기본 정보: 이메일(사번@hospital.com), 비밀번호(1234), 입사일(오늘)로 자동 설정됩니다.
              </p>
            </div>
            <button
              onClick={downloadExcelTemplate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              📄 템플릿 다운로드
            </button>
          </div>

          {/* 파일 업로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📤 엑셀 파일 업로드
            </h3>
            <div className="space-y-4">
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {uploadStatus && (
                <div className={`p-3 rounded-lg text-sm ${
                  uploadStatus.includes('성공') || uploadStatus.includes('읽었습니다') 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {uploadStatus}
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    미리보기 ({parsedData.length}명)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">사번</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">소속</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">권한레벨</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedData.slice(0, 10).map((emp, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{emp.employee_id}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{emp.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{emp.department_name}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                emp.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                                emp.role === 'DEPARTMENT_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                emp.role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {emp.role === 'SUPER_ADMIN' ? '최고관리자' :
                                 emp.role === 'DEPARTMENT_ADMIN' ? '부서관리자' :
                                 emp.role === 'MODERATOR' ? '조정자' : '일반사용자'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... 및 {parsedData.length - 10}명 더
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? '업로드 중...' : '직원 등록하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
