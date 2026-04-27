type LoadingStateProps = {
  message?: string
}

export default function LoadingState({
  message = '読み込み中...',
}: LoadingStateProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 px-8 py-8 text-center max-w-sm w-full">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        <div className="text-gray-800 font-bold">{message}</div>
        <div className="text-sm text-gray-400 mt-2">
          少しだけお待ちください
        </div>
      </div>
    </div>
  )
}
