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
      const filePath = ${id}/${Date.now()}_${selectedFile.name}

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
      const filePath = ${id}/steps/${step.id}/${Date.now()}_${safeFileName}

      const { error: uploadError } = await supabase.storage
        .from('
