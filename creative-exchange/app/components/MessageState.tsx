type MessageStateProps = {
  title: string
  message?: string
  tone?: 'default' | 'error'
}

export default function MessageState({
  title,
  message,
  tone = 'default',
}: MessageStateProps) {
  const titleColor =
    tone === 'error' ? 'text-red-600' : 'text-gray-900'
  const messageColor =
    tone === 'error' ? 'text-red-500' : 'text-gray-500'

  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8 text-center max-w-lg w-full">
        <h2 className={`text-xl font-bold mb-3 ${titleColor}`}>{title}</h2>
        {message && <p className={`leading-relaxed ${messageColor}`}>{message}</p>}
      </div>
    </div>
  )
}
