interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <span className="text-red-500 text-xl mr-3">⚠️</span>
        <div className="flex-1">
          <p className="text-red-800 font-medium">오류가 발생했습니다</p>
          <p className="text-red-600 text-sm mt-1">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  )
}

export function ErrorPage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <ErrorMessage message={message} onRetry={onRetry} />
      </div>
    </div>
  )
}
