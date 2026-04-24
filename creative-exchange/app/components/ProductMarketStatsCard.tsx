'use client'

type ProductMarketStats = {
  count: number
  average: number
  median: number
  min: number
  max: number
}

type Props = {
  selectedCategoryName?: string
  stats: ProductMarketStats | null
  loading?: boolean
}

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString()}`
}

export default function ProductMarketStatsCard({
  selectedCategoryName,
  stats,
  loading = false,
}: Props) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-blue-700">
            {selectedCategoryName
              ? `この品目の相場（直近90日間）`
              : '作品相場'}
          </h3>
          <p className="text-sm text-blue-600 mt-1">
            {selectedCategoryName
              ? `${selectedCategoryName} の実売データをもとに表示しています`
              : '品目を選ぶと、このカテゴリの相場が見られます'}
          </p>
        </div>
      </div>

      {!selectedCategoryName ? (
        <div className="mt-6 text-center py-8 text-blue-700">
          品目を選ぶと相場が表示されます
        </div>
      ) : loading ? (
        <div className="mt-6 text-center py-8 text-blue-700">
          相場を読み込み中...
        </div>
      ) : !stats || stats.count === 0 ? (
        <div className="mt-6 text-center py-8">
          <div className="text-lg font-semibold text-gray-600">データ不足です</div>
          <div className="text-sm text-gray-500 mt-2">
            取引データが蓄積されると表示されます
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">件数</div>
            <div className="text-2xl font-bold text-gray-900">{stats.count}件</div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">平均</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatYen(stats.average)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">中央値</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatYen(stats.median)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">最安</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatYen(stats.min)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">最高</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatYen(stats.max)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
