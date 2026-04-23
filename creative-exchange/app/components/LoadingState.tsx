type LoadingStateProps = {
  message?: string
}

export default function LoadingState({
  message = '読み込み中...',
}: LoadingStateProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-6 text-center">
        <div className="text-gray-700 font-medium">{message}</div>
      </div>
    </div>
  )
}
