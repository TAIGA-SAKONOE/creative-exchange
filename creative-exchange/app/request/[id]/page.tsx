'use client'

import LoadingState from '../../components/LoadingState'
import MessageState from '../../components/MessageState'
import { createClient } from '../../../lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type OrderStep = {
  id: string
  order_id: string
  step_number: number
  title: string
  description: string | null
  required_category_id: number | null
  budget: number | null
  deadline: string | null
  parallel_group: number | null
  creator_id: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  categories?: { name: string } | { name: string }[] | null
  users?:
    | {
        display_name: string | null
        twitter_handle: string | null
      }
    | {
        display_name: string | null
        twitter_handle: string | null
      }[]
    | null
}

type DeliverableFile = {
  id: string
  order_id: string
  order_step_id: string | null
  file_url: string
  file_type: string | null
  version: number | null
  uploaded_at: string | null
  note: string | null
  signed_url?: string | null
}

export default function RequestDetail() {
  const params = useParams()
  const id = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [orderSteps, setOrderSteps] = useState<OrderStep[]>([])
  const [deliverables, setDeliverables] = useState<DeliverableFile[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [reviewedStepIds, setReviewedStepIds] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<any>(null)

  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [selectedStepFiles, setSelectedStepFiles] = useState<Record<string, File | null>>({})
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)
  const [completingStepId, setCompletingStepId] = useState<string | null>(null)

  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const [cancelling, setCancelling] = useState(false)

  const stepFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const generalFileInputRef = useRef<HTMLInputElement | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  const getDeliverablePath = (fileUrl: string | null) => {
    if (!fileUrl) return null

    if (fileUrl.includes('/storage/v1/object/public/deliverables/')) {
      return fileUrl.split('/storage/v1/object/public/deliverables/')[1] || null
    }

    if (fileUrl.includes('/storage/v1/object/sign/deliverables/')) {
      return fileUrl.split('/storage/v1/object/sign/deliverables/')[1]?.split('?')[0] || null
    }

    return fileUrl
  }

  const createNotification = async ({
    userId,
    type,
    title,
    body,
    linkUrl,
  }: {
    userId: string
    type: string
    title: string
    body?: string
    linkUrl?: string
  }) => {
    const supabase = createClient()

    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link_url: linkUrl || `/request/${id}`,
    })
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('auth_id', user.id)
        .single()

      if (profileError || !userProfile) {
        setError('プロフィール情報の取得に失敗しました')
        return
      }

      setProfile(userProfile)

      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single()

      if (fetchError || !orderData) {
        setError('この依頼は存在しないか、閲覧権限がありません')
        return
      }

      setRequest(orderData)

      const { data: stepRows, error: stepsError } = await supabase
        .from('order_steps')
        .select(`
          *,
          categories (name),
          users (
            display_name,
            twitter_handle
          )
        `)
        .eq('order_id', id)
        .order('step_number', { ascending: true })

      if (stepsError) {
        console.error('order_steps取得エラー', stepsError)
        setOrderSteps([])
      } else {
        setOrderSteps((stepRows ?? []) as unknown as OrderStep[])
      }

      const { data: files, error: filesError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('order_id', id)
        .order('uploaded_at', { ascending: false })

      if (filesError) {
        console.error('deliverables取得エラー', filesError)
      } else {
        const filesWithSignedUrls = await Promise.all(
          (files ?? []).map(async (file: any) => {
            const filePath = getDeliverablePath(file.file_url)

            if (!filePath) {
              return {
                ...file,
                signed_url: null,
              }
            }

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('deliverables')
              .createSignedUrl(filePath, 60 * 60)

            if (signedUrlError) {
              console.error('納品ファイル署名URL作成エラー', signedUrlError)

              return {
                ...file,
                signed_url: null,
              }
            }

            return {
              ...file,
              signed_url: signedUrlData.signedUrl,
            }
          })
        )

        setDeliverables(filesWithSignedUrls as DeliverableFile[])
      }

      const { data: messageRows, error: messagesError } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('order_messages取得エラー', messagesError)
      } else {
        setMessages(messageRows ?? [])
      }

      const { data: reviewRows, error: reviewsError } = await supabase
        .from('reviews')
        .select('order_step_id')
        .eq('order_id', id)
        .eq('reviewer_id', userProfile.id)
        .not('order_step_id', 'is', null)

      if (reviewsError) {
        console.error('reviews取得エラー', reviewsError)
        setReviewedStepIds([])
      } else {
        setReviewedStepIds(
          (reviewRows ?? [])
            .map((review: any) => review.order_step_id)
            .filter(Boolean)
        )
      }
    } catch (err: any) {
      setError(err.message || 'データの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!profile?.id || !request) return

    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({
        creator_id: profile.id,
        status: 'matched',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert('受注に失敗しました: ' + error.message)
      return
    }

    await createNotification({
      userId: request.client_id,
      type: 'order_matched',
      title: '依頼が受注されました',
      body: `「${request.title}」が受注されました。`,
      linkUrl: `/request/${id}`,
    })

    alert('依頼を受注しました！')
    loadData()
  }

  const handleDeliver = async () => {
    if (!selectedFile || !profile?.id || !request) return

    setUploading(true)
    const supabase = createClient()

    try {
      const filePath = `${id}/${Date.now()}_${selectedFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('deliverables').insert({
        order_id: id,
        order_step_id: null,
        file_url: filePath,
        file_type: selectedFile.type || null,
        version: 1,
        note: selectedFile.name,
      })

      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      await createNotification({
        userId: request.client_id,
        type: 'order_delivered',
        title: '納品が完了しました',
        body: `「${request.title}」に納品ファイルがアップロードされました。`,
        linkUrl: `/request/${id}`,
      })

      alert('納品が完了しました！')
      setSelectedFile(null)
      loadData()
    } catch (err: any) {
      alert('納品に失敗しました: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeliverStep = async (step: OrderStep) => {
    if (!profile?.id || !request) return

    const selectedStepFile = selectedStepFiles[step.id]

    if (!selectedStepFile) {
      alert('納品ファイルを選択してください')
      return
    }

    if (String(step.creator_id) !== String(profile.id)) {
      alert('この工程の担当クリエイターではありません')
      return
    }

    if (step.status !== 'matched') {
      alert('この工程は現在納品できる状態ではありません')
      return
    }

    setUploadingStepId(step.id)
    const supabase = createClient()

    try {
      const safeFileName = selectedStepFile.name.replace(/[^\w.\-ぁ-んァ-ン一-龥ー]/g, '_')
      const filePath = `${id}/steps/${step.id}/${Date.now()}_${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, selectedStepFile)

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('deliverables').insert({
        order_id: id,
        order_step_id: step.id,
        file_url: filePath,
        file_type: selectedStepFile.type || null,
        version: 1,
        note: selectedStepFile.name,
      })

      if (insertError) throw insertError

      const { error: updateStepError } = await supabase
        .from('order_steps')
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', step.id)
        .eq('status', 'matched')
        .eq('creator_id', profile.id)

      if (updateStepError) throw updateStepError

      await createNotification({
        userId: request.client_id,
        type: 'order_step_delivered',
        title: '工程が納品されました',
        body: `「${request.title}」の工程「${step.title}」に納品ファイルがアップロードされました。`,
        linkUrl: `/request/${id}`,
      })

      alert('工程の納品が完了しました！')

      setSelectedStepFiles((prev) => ({
        ...prev,
        [step.id]: null,
      }))

      loadData()
    } catch (err: any) {
      alert('工程納品に失敗しました: ' + err.message)
    } finally {
      setUploadingStepId(null)
    }
  }

  const handleCompleteStep = async (step: OrderStep) => {
    if (!profile?.id || !request) return

    if (String(request.client_id) !== String(profile.id)) {
      alert('依頼者本人のみ検収できます')
      return
    }

    if (step.status !== 'delivered') {
      alert('この工程はまだ検収できる状態ではありません')
      return
    }

    const confirmed = window.confirm(`工程「${step.title}」を検収OKにしますか？`)
    if (!confirmed) return

    setCompletingStepId(step.id)
    const supabase = createClient()

    try {
      const { error: updateStepError } = await supabase
        .from('order_steps')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', step.id)
        .eq('status', 'delivered')

      if (updateStepError) throw updateStepError

      if (step.creator_id) {
        await createNotification({
          userId: step.creator_id,
          type: 'order_step_completed',
          title: '工程が検収完了しました',
          body: `「${request.title}」の工程「${step.title}」が検収完了になりました。`,
          linkUrl: `/request/${id}`,
        })
      }

      alert('工程を検収完了にしました')
      loadData()
    } catch (err: any) {
      alert('工程の検収に失敗しました: ' + err.message)
    } finally {
      setCompletingStepId(null)
    }
  }

  const handleComplete = async () => {
    if (!request) return

    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert('検収に失敗しました: ' + error.message)
      return
    }

    if (request.creator_id) {
      await createNotification({
        userId: request.creator_id,
        type: 'order_completed',
        title: '取引が完了しました',
        body: `「${request.title}」が検収完了になりました。`,
        linkUrl: `/request/${id}`,
      })
    }

    alert('取引が完了しました！')
    loadData()
  }

  const handleSendMessage = async () => {
    if (!profile?.id || !request) return
    if (!messageText.trim()) return

    setSendingMessage(true)
    const supabase = createClient()

    try {
      const { error: insertError } = await supabase.from('order_messages').insert({
        order_id: id,
        sender_user_id: profile.id,
        sender_display_name: profile.display_name || '不明なユーザー',
        message: messageText.trim(),
      })

      if (insertError) throw insertError

      let targetUserId: string | null = null

      if (String(request.client_id) === String(profile.id)) {
        targetUserId = request.creator_id || null

        if (!targetUserId && orderSteps.length > 0) {
          const assignedCreatorIds = orderSteps
            .map((step) => step.creator_id)
            .filter(Boolean) as string[]

          targetUserId = assignedCreatorIds[0] || null
        }
      } else {
        targetUserId = request.client_id
      }

      if (targetUserId) {
        await createNotification({
          userId: targetUserId,
          type: 'order_message',
          title: '新しいメッセージがあります',
          body: `「${request.title}」に新しいメッセージが届きました。`,
          linkUrl: `/request/${id}`,
        })
      }

      setMessageText('')
      loadData()
    } catch (err: any) {
      alert('メッセージ送信に失敗しました: ' + err.message)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCancel = async () => {
    if (!profile?.id || !request || cancelling) return

    const reason = window.prompt('キャンセル理由を入力してください（必須）')
    if (reason === null) return

    if (!reason.trim()) {
      alert('キャンセル理由を入力してください')
      return
    }

    setCancelling(true)

    try {
      const supabase = createClient()

      const { error: cancelError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancel_reason: reason.trim(),
          cancelled_by_user_id: profile.id,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (cancelError) throw cancelError

      const targetUserId =
        String(request.client_id) === String(profile.id)
          ? request.creator_id
          : request.client_id

      if (targetUserId) {
        await createNotification({
          userId: targetUserId,
          type: 'order_cancelled',
          title: '依頼がキャンセルされました',
          body: `「${request.title}」がキャンセルされました。\n理由: ${reason.trim()}`,
          linkUrl: `/request/${id}`,
        })
      }

      alert('依頼をキャンセルしました')
      loadData()
    } catch (err: any) {
      alert('キャンセルに失敗しました: ' + err.message)
    } finally {
      setCancelling(false)
    }
  }

  const getDeadlineMeta = (deadline: string) => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const deadlineDate = new Date(deadline)
    const deadlineStart = new Date(
      deadlineDate.getFullYear(),
      deadlineDate.getMonth(),
      deadlineDate.getDate()
    )

    const diffMs = deadlineStart.getTime() - todayStart.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    const formattedDate = `${deadlineStart.getFullYear()}年${
      deadlineStart.getMonth() + 1
    }月${deadlineStart.getDate()}日`

    if (diffDays > 0) {
      return {
        formattedDate,
        relativeLabel: `あと${diffDays}日`,
        containerClass: 'bg-orange-50 border border-orange-100',
        dateClass: 'text-orange-600',
        labelClass: 'text-orange-700',
      }
    }

    if (diffDays === 0) {
      return {
        formattedDate,
        relativeLabel: '本日が納期です',
        containerClass: 'bg-yellow-50 border border-yellow-100',
        dateClass: 'text-yellow-700',
        labelClass: 'text-yellow-700',
      }
    }

    return {
      formattedDate,
      relativeLabel: `${Math.abs(diffDays)}日超過`,
      containerClass: 'bg-red-50 border border-red-100',
      dateClass: 'text-red-600',
      labelClass: 'text-red-700',
    }
  }

  const getStepCategoryName = (step: OrderStep) => {
    const category = step.categories

    if (!category) return '未分類'

    if (Array.isArray(category)) {
      return category[0]?.name || '未分類'
    }

    return category.name || '未分類'
  }

  const getStepCreatorName = (step: OrderStep) => {
    const creator = step.users

    if (!creator) return null

    if (Array.isArray(creator)) {
      return creator[0]?.display_name || creator[0]?.twitter_handle || null
    }

    return creator.display_name || creator.twitter_handle || null
  }

  const getStepStatusMeta = (status: string) => {
    if (status === 'open') {
      return {
        label: '募集中',
        dotClass: 'bg-blue-600 border-blue-600 text-white',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100',
      }
    }

    if (status === 'matched') {
      return {
        label: '制作中',
        dotClass: 'bg-purple-600 border-purple-600 text-white',
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-100',
      }
    }

    if (status === 'delivered') {
      return {
        label: '納品済み',
        dotClass: 'bg-orange-500 border-orange-500 text-white',
        badgeClass: 'bg-orange-50 text-orange-700 border border-orange-100',
      }
    }

    if (status === 'completed') {
      return {
        label: '完了',
        dotClass: 'bg-green-600 border-green-600 text-white',
        badgeClass: 'bg-green-50 text-green-700 border border-green-100',
      }
    }

    if (status === 'cancelled') {
      return {
        label: 'キャンセル',
        dotClass: 'bg-gray-400 border-gray-400 text-white',
        badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      }
    }

    return {
      label: status,
      dotClass: 'bg-gray-300 border-gray-300 text-white',
      badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString

    return date.toLocaleDateString('ja-JP')
  }

  const getStepDeliverables = (stepId: string) => {
    return deliverables.filter((file) => file.order_step_id === stepId)
  }

  const getGeneralDeliverables = () => {
    return deliverables.filter((file) => !file.order_step_id)
  }

  if (loading) {
    return <LoadingState message="依頼詳細を読み込み中..." />
  }

  if (error) {
    return (
      <MessageState
        title="依頼詳細を表示できません"
        message={error}
        tone="error"
      />
    )
  }

  if (!request) {
    return (
      <MessageState
        title="依頼が見つかりません"
        message="指定された依頼は存在しないか、現在は閲覧できません。"
      />
    )
  }

  const hasOrderSteps = orderSteps.length > 0

  const isClient = profile?.id && String(request.client_id) === String(profile.id)
  const isCreator = profile?.id && String(request.creator_id) === String(profile.id)
  const isStepCreator =
    profile?.id &&
    orderSteps.some((step) => String(step.creator_id) === String(profile.id))

  const completedSteps = orderSteps.filter((step) => step.status === 'completed').length
  const deliveredSteps = orderSteps.filter((step) => step.status === 'delivered').length
  const matchedSteps = orderSteps.filter((step) => step.status === 'matched').length
  const openSteps = orderSteps.filter((step) => step.status === 'open').length
  const cancelledSteps = orderSteps.filter((step) => step.status === 'cancelled').length

  const progressPercent =
    orderSteps.length > 0
      ? Math.round((completedSteps / orderSteps.length) * 100)
      : 0

  const canAccept =
    !hasOrderSteps &&
    request.status === 'open' &&
    !isClient &&
    !request.creator_id

  const canDeliver =
    !hasOrderSteps &&
    isCreator &&
    ['matched', 'in_progress', 'revision'].includes(request.status)

  const canComplete =
    !hasOrderSteps &&
    isClient &&
    request.status === 'delivered'

  const canReview = (isClient || isCreator || isStepCreator) && request.status === 'completed'

  const canMessage =
    request.status === 'open' ||
    request.status === 'draft' ||
    isClient ||
    isCreator ||
    isStepCreator

  const canEdit = isClient && ['draft', 'open'].includes(request.status)

  const canCancel =
    (isClient || isCreator || isStepCreator) &&
    ['open', 'matched', 'in_progress', 'revision'].includes(request.status)

  const statusLabel =
    request.status === 'draft'
      ? '下書き'
      : request.status === 'open'
        ? hasOrderSteps
          ? openSteps > 0
            ? '公開中'
            : completedSteps === orderSteps.length
              ? '取引完了'
              : '工程進行中'
          : '公開中'
        : request.status === 'matched'
          ? '受注済み'
          : request.status === 'in_progress'
            ? '制作中'
            : request.status === 'revision'
              ? '修正依頼中'
              : request.status === 'delivered'
                ? '納品済み'
                : request.status === 'completed'
                  ? '取引完了'
                  : request.status === 'cancelled'
                    ? 'キャンセル'
                    : request.status

  const generalDeliverables = getGeneralDeliverables()

  const groupedStepSections = (() => {
    type StepSection = {
      key: string
      label: string
      description: string
      isParallel: boolean
      sortOrder: number
      steps: OrderStep[]
    }

    const sectionMap = new Map<string, StepSection>()

    orderSteps.forEach((step) => {
      const parallelGroup = step.parallel_group

      if (parallelGroup) {
        const key = `parallel-${parallelGroup}`

        if (!sectionMap.has(key)) {
          sectionMap.set(key, {
            key,
            label: `並行グループ ${parallelGroup}`,
            description: 'このグループの工程は、同時並行で進められる工程です。',
            isParallel: true,
            sortOrder: step.step_number,
            steps: [],
          })
        }

        const section = sectionMap.get(key)!
        section.steps.push(step)
        section.sortOrder = Math.min(section.sortOrder, step.step_number)
      } else {
        const key = `single-${step.id}`

        sectionMap.set(key, {
          key,
          label: '通常工程',
          description: '単独で進行する工程です。',
          isParallel: false,
          sortOrder: step.step_number,
          steps: [step],
        })
      }
    })

    return Array.from(sectionMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => ({
        ...section,
        steps: section.steps.sort((a, b) => a.step_number - b.step_number),
      }))
  })()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.push('/mypage')}
          className="mb-8 text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          ← マイページに戻る
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
            <div className="flex justify-between items-start gap-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{request.title}</h1>
                <p className="text-xl opacity-90">{request.categories?.name}</p>

                {hasOrderSteps && (
                  <p className="mt-4 text-sm opacity-90">
                    全{orderSteps.length}工程・完了{completedSteps}工程・募集中{openSteps}工程
                  </p>
                )}
              </div>

              <div className="px-6 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm whitespace-nowrap">
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="p-10">
            <div className="mb-6 flex flex-wrap gap-3">
              {canEdit && (
                <Link
                  href={`/request/${id}/edit`}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 font-medium transition"
                >
                  依頼を編集する
                </Link>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium transition"
                >
                  {cancelling ? 'キャンセル中...' : '依頼をキャンセルする'}
                </button>
              )}
            </div>

            <div className="mb-10">
              <p className="text-sm text-gray-500 mb-2">依頼内容</p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                {request.description}
              </p>
            </div>

            {request.agreed_price !== null && Number(request.agreed_price) > 0 && (
              <div className="mb-10 p-6 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-500 mb-1">
                  {hasOrderSteps ? '合計予算' : '希望予算'}
                </p>
                <p className="text-4xl font-bold text-blue-600">
                  ¥{Number(request.agreed_price).toLocaleString()}
                </p>
              </div>
            )}

            {request.deadline &&
              (() => {
                const deadlineMeta = getDeadlineMeta(request.deadline)

                return (
                  <div className={`mb-10 p-6 rounded-2xl ${deadlineMeta.containerClass}`}>
                    <p className={`text-sm mb-1 ${deadlineMeta.labelClass}`}>
                      {hasOrderSteps ? '最終納期' : '希望納期'}
                    </p>
                    <p className={`text-2xl font-bold ${deadlineMeta.dateClass}`}>
                      {deadlineMeta.formattedDate}
                    </p>
                    <p className={`mt-2 text-sm font-medium ${deadlineMeta.labelClass}`}>
                      {deadlineMeta.relativeLabel}
                    </p>
                  </div>
                )
              })()}

            {hasOrderSteps && (
              <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">工程進捗</h2>
                    <p className="text-sm text-gray-500 mt-2">
                      各工程の募集・制作・納品・完了状況を確認できます。
                    </p>
                  </div>

                  <div className="text-sm text-gray-500">
                    進捗 {progressPercent}%
                  </div>
                </div>

                <div className="mb-6 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-xs text-blue-600 mb-1">募集中</p>
                    <p className="text-2xl font-bold text-blue-700">{openSteps}</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                    <p className="text-xs text-purple-600 mb-1">制作中</p>
                    <p className="text-2xl font-bold text-purple-700">{matchedSteps}</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                    <p className="text-xs text-orange-600 mb-1">納品済み</p>
                    <p className="text-2xl font-bold text-orange-700">{deliveredSteps}</p>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                    <p className="text-xs text-green-600 mb-1">完了</p>
                    <p className="text-2xl font-bold text-green-700">{completedSteps}</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">キャンセル</p>
                    <p className="text-2xl font-bold text-gray-600">{cancelledSteps}</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-200" />

                  <div className="space-y-8">
                    {groupedStepSections.map((section) => (
                      <div
                        key={section.key}
                        className={`rounded-3xl ${
                          section.isParallel
                            ? 'bg-purple-50/60 border border-purple-100 p-4'
                            : ''
                        }`}
                      >
                        <div className="mb-4 ml-14">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                section.isParallel
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {section.label}
                            </span>

                            {section.isParallel && (
                              <span className="text-xs text-purple-700">
                                {section.steps.length}工程
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-gray-500">
                            {section.description}
                          </p>
                        </div>

                        <div className="space-y-6">
                          {section.steps.map((step) => {
                            const statusMeta = getStepStatusMeta(step.status)
                            const creatorName = getStepCreatorName(step)
                            const deadlineLabel = formatDate(step.deadline)
                            const stepDeliverables = getStepDeliverables(step.id)

                            const canDeliverThisStep =
                              profile?.id &&
                              String(step.creator_id) === String(profile.id) &&
                              step.status === 'matched'

                            const canCompleteThisStep =
                              profile?.id &&
                              String(request.client_id) === String(profile.id) &&
                              step.status === 'delivered'

                            const hasReviewedThisStep = reviewedStepIds.includes(step.id)

                            const canReviewThisStep =
                              profile?.id &&
                              step.status === 'completed' &&
                              !hasReviewedThisStep &&
                              (String(request.client_id) === String(profile.id) ||
                                String(step.creator_id) === String(profile.id))

                            const selectedStepFile = selectedStepFiles[step.id]

                            return (
                              <div key={step.id} className="relative flex gap-5">
                                <div
                                  className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold ${statusMeta.dotClass}`}
                                >
                                  {step.status === 'completed'
                                    ? '✓'
                                    : step.status === 'cancelled'
                                      ? '×'
                                      : step.step_number}
                                </div>

                                <div className="flex-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="text-sm text-gray-500">
                                          工程{step.step_number}
                                        </span>

                                        <span
                                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusMeta.badgeClass}`}
                                        >
                                          {statusMeta.label}
                                        </span>

                                        <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                          {getStepCategoryName(step)}
                                        </span>

                                        {step.parallel_group && (
                                          <span className="inline-flex px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                                            並行G{step.parallel_group}
                                          </span>
                                        )}
                                      </div>

                                      <h3 className="text-xl font-bold text-gray-900">
                                        {step.title}
                                      </h3>
                                    </div>

                                    {step.budget !== null && Number(step.budget) > 0 && (
                                      <div className="text-left md:text-right">
                                        <p className="text-xs text-gray-500 mb-1">工程予算</p>
                                        <p className="text-lg font-bold text-blue-600">
                                          ¥{Number(step.budget).toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {step.description && (
                                    <p className="text-gray-700 leading-7 whitespace-pre-wrap mb-4">
                                      {step.description}
                                    </p>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                      <p className="text-gray-500 mb-1">担当クリエイター</p>
                                      <p className="font-semibold text-gray-900">
                                        {creatorName || '未定'}
                                      </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4">
                                      <p className="text-gray-500 mb-1">工程納期</p>
                                      <p className="font-semibold text-gray-900">
                                        {deadlineLabel || '未設定'}
                                      </p>
                                    </div>
                                  </div>

                                  {stepDeliverables.length > 0 && (
                                    <div className="mb-4">
                                      <p className="text-sm text-gray-500 mb-3">
                                        この工程の納品ファイル
                                      </p>

                                      <div className="space-y-2">
                                        {stepDeliverables.map((file) => (
                                          <a
                                            key={file.id}
                                            href={file.signed_url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition border border-orange-100"
                                            onClick={(e) => {
                                              if (!file.signed_url) {
                                                e.preventDefault()
                                                alert('納品ファイルの表示URLを作成できませんでした')
                                              }
                                            }}
                                          >
                                            <div className="text-2xl">📎</div>

                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium truncate">
                                                {file.note || '納品ファイル'}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {file.uploaded_at
                                                  ? new Date(file.uploaded_at).toLocaleString('ja-JP')
                                                  : ''}
                                              </p>
                                            </div>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {canDeliverThisStep && (
                                    <div className="mt-5 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                                      <p className="font-medium text-blue-700 mb-2">
                                        この工程を納品する
                                      </p>

                                      <p className="text-sm text-blue-700 leading-7 mb-4">
                                        完成ファイルを選択してから、納品ボタンを押してください。
                                      </p>

                                      <input
                                        ref={(el) => {
                                          stepFileInputRefs.current[step.id] = el
                                        }}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null
                                          setSelectedStepFiles((prev) => ({
                                            ...prev,
                                            [step.id]: file,
                                          }))
                                        }}
                                      />

                                      <div className="bg-white border border-blue-200 rounded-2xl p-4 mb-4">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                          <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                              選択中のファイル
                                            </p>
                                            <p className="font-semibold text-gray-900 break-all">
                                              {selectedStepFile
                                                ? selectedStepFile.name
                                                : 'まだファイルが選択されていません'}
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => stepFileInputRefs.current[step.id]?.click()}
                                            className="px-5 py-3 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition"
                                          >
                                            ファイルを選択する
                                          </button>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => handleDeliverStep(step)}
                                        disabled={!selectedStepFile || uploadingStepId === step.id}
                                        className={`w-full py-4 rounded-2xl font-medium shadow-sm transition ${
                                          selectedStepFile && uploadingStepId !== step.id
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                      >
                                        {uploadingStepId === step.id
                                          ? 'アップロード中...'
                                          : selectedStepFile
                                            ? 'この工程を納品する'
                                            : 'ファイル選択後に納品できます'}
                                      </button>
                                    </div>
                                  )}

                                  {step.status === 'open' && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700">
                                      この工程はまだ募集中です。
                                    </div>
                                  )}

                                  {step.status === 'delivered' && (
                                    <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm text-orange-700">
                                      この工程は納品済みです。依頼者の検収待ちです。
                                    </div>
                                  )}

                                  {canCompleteThisStep && (
                                    <div className="mt-5 p-5 bg-green-50 border border-green-100 rounded-2xl">
                                      <p className="font-medium text-green-700 mb-3">
                                        この工程を検収する
                                      </p>

                                      <p className="text-sm text-green-700 leading-7 mb-4">
                                        納品内容に問題がなければ、この工程を完了にできます。
                                      </p>

                                      <button
                                        onClick={() => handleCompleteStep(step)}
                                        disabled={completingStepId === step.id}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-medium shadow-sm"
                                      >
                                        {completingStepId === step.id
                                          ? '検収中...'
                                          : 'この工程を検収OKにする'}
                                      </button>
                                    </div>
                                  )}

                                  {step.status === 'completed' && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-700">
                                      この工程は完了しています。
                                    </div>
                                  )}

                                  {canReviewThisStep && (
                                    <div className="mt-5">
                                      <Link
                                        href={`/request/${id}/review?step_id=${step.id}`}
                                        className="block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-2xl font-medium shadow-sm transition"
                                      >
                                        この工程を評価する
                                      </Link>
                                    </div>
                                  )}

                                  {hasReviewedThisStep && (
                                    <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-600">
                                      この工程は評価済みです。
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {request.status === 'cancelled' && (
              <div className="mb-10 p-6 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-sm text-red-700 mb-2">キャンセル情報</p>
                <p className="text-lg font-semibold text-red-600 mb-2">
                  この依頼はキャンセルされました
                </p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  理由: {request.cancel_reason || '理由未入力'}
                </p>
                {request.cancelled_at && (
                  <p className="text-xs text-red-500 mt-2">
                    キャンセル日時: {new Date(request.cancelled_at).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            )}

            {!hasOrderSteps && (
              <div className="mb-10">
                <p className="text-sm text-gray-500 mb-4">納品ファイル</p>

                {generalDeliverables.length > 0 ? (
                  <div className="space-y-3">
                    {generalDeliverables.map((file) => (
                      <a
                        key={file.id}
                        href={file.signed_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition group"
                        onClick={(e) => {
                          if (!file.signed_url) {
                            e.preventDefault()
                            alert('納品ファイルの表示URLを作成できませんでした')
                          }
                        }}
                      >
                        <div className="text-3xl">📎</div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {file.note || '納品ファイル'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.uploaded_at
                              ? new Date(file.uploaded_at).toLocaleDateString('ja-JP')
                              : ''}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 rounded-2xl text-gray-500 text-sm">
                    まだ納品ファイルはありません
                  </div>
                )}
              </div>
            )}

            {canMessage && (
              <div className="mb-10">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">メッセージ</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {request.status === 'open'
                      ? hasOrderSteps
                        ? '工程付き依頼では、依頼者と担当クリエイターがここでやり取りできます。'
                        : '公開中の依頼では、ログイン済みユーザーが事前相談できます。'
                      : '受発注後のやり取りは当事者のみ表示されます。'}
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  {messages.length > 0 ? (
                    messages.map((msg: any) => {
                      const isMine = String(msg.sender_user_id) === String(profile?.id)

                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl ${
                            isMine
                              ? 'bg-blue-50 border border-blue-100 ml-8'
                              : 'bg-gray-50 border border-gray-100 mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="text-sm font-medium text-gray-700">
                              {msg.sender_display_name || '不明なユーザー'}
                            </p>
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleString('ja-JP')
                                : ''}
                            </p>
                          </div>

                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-5 bg-gray-50 rounded-2xl text-gray-500 text-sm">
                      まだメッセージはありません
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
                    placeholder="依頼に関するメッセージを入力してください"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white py-4 rounded-2xl font-medium shadow-sm"
                  >
                    {sendingMessage ? '送信中...' : 'メッセージを送る'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-6 border-t">
              {hasOrderSteps && (
                <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-600 leading-7">
                  工程付き依頼です。工程ごとの受注・納品・検収・評価が有効化されています。
                </div>
              )}

              {canAccept && (
                <button
                  onClick={handleAccept}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                >
                  この依頼を受注する
                </button>
              )}

              {canDeliver && (
                <div className="space-y-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="font-medium text-blue-700">納品ファイルをアップロード</p>

                  <input
                    ref={generalFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />

                  <div className="bg-white border border-blue-200 rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">選択中のファイル</p>
                        <p className="font-semibold text-gray-900 break-all">
                          {selectedFile ? selectedFile.name : 'まだファイルが選択されていません'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => generalFileInputRef.current?.click()}
                        className="px-5 py-3 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition"
                      >
                        ファイルを選択する
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleDeliver}
                    disabled={!selectedFile || uploading}
                    className={`w-full py-5 rounded-2xl font-medium text-lg shadow-sm transition ${
                      selectedFile && !uploading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {uploading
                      ? 'アップロード中...'
                      : selectedFile
                        ? '納品する'
                        : 'ファイル選択後に納品できます'}
                  </button>
                </div>
              )}

              {canComplete && (
                <button
                  onClick={handleComplete}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                >
                  検収OK（取引を完了する）
                </button>
              )}

              {canReview && !hasOrderSteps && (
                <button
                  onClick={() => router.push(`/request/${id}/review`)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-5 rounded-2xl font-medium text-lg shadow-sm"
                >
                  取引を評価する
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
