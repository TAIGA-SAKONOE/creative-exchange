import Link from 'next/link'

type MessageStateProps = {
  title: string
  message?: string
  tone?: 'default' | 'error' | 'success'
  actionLabel?: string
  actionHref?: string
}

export default function MessageState({
  title,
  message,
  tone = 'default',
  actionLabel,
  actionHref,
}: MessageStateProps) {
  const styles = {
    default: {
      icon: 'ℹ️',
      border: 'border-gray-200',
      bg: 'bg-white',
      title: 'text-gray-900',
      message: 'text-gray-500',
      button: 'bg-gray-900 hover:bg-black text-white',
    },
    error: {
      icon: '⚠️',
      border: 'border-red-100',
      bg: 'bg-red-50',
      title: 'text-red-700',
      message: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    success: {
      icon: '✅',
      border: 'border-green-100',
      bg: 'bg-green-50',
      title: 'text-green-700',
      message: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
  }[tone]

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 py-10">
      <div
        className={`${styles.bg} ${styles.border} rounded-3xl shadow-sm border px-6 py-8 md:px-10 md:py-10 text-center max-w-xl w-full`}
      >
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/80 border border-white shadow-sm flex items-center justify-center text-2xl">
          {styles.icon}
        </div>

        <h2 className={`text-xl md:text-2xl font-bold mb-3 ${styles.title}`}>
          {title}
        </h2>

        {message && (
          <p className={`leading-relaxed ${styles.message}`}>
            {message}
          </p>
        )}

        {actionLabel && actionHref && (
          <div className="mt-6">
            <Link
              href={actionHref}
              className={`inline-flex items-center justify-center px-5 py-3 rounded-2xl font-bold transition ${styles.button}`}
            >
              {actionLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
