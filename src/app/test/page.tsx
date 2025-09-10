import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏥 병원 직원 게시판
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          배포가 성공적으로 완료되었습니다!
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">시스템 상태</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>웹사이트:</span>
              <span className="text-green-600">✅ 정상</span>
            </div>
            <div className="flex justify-between">
              <span>배포:</span>
              <span className="text-green-600">✅ 완료</span>
            </div>
            <div className="flex justify-between">
              <span>데이터베이스:</span>
              <span className="text-yellow-600">⚠️ 설정 필요</span>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link 
            href="/" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            메인 페이지로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
