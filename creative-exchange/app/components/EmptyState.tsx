import Link from 'next/link'

type EmptyStateProps = {
  icon?: string
  title: string
  message?: string
  actionLabel?: string
  actionHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export default function EmptyState({
  icon = '🌱',
  title,
  message,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-10 md:px-10 md:py-12 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-3xl">
        {icon}
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {message && (
        <p className="mx-auto max-w-xl text-gray-500 leading-7">
          {message}
        </p>
      )}

      {(actionLabel && actionHref) || (secondaryLabel && secondaryHref) ? (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 transition"
            >
              {actionLabel}
            </Link>
          )}

          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  )
}
