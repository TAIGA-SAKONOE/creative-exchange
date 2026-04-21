const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!title || !description || !categoryId) {
    alert('タイトル、品目、依頼内容は必須です')
    return
  }

  setSaving(true)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    alert('ログインしてください')
    router.push('/login')
    return
  }

  // まず users テーブルにレコードを確実に作成/更新（これが重要）
  await supabase
    .from('users')
    .upsert({
      auth_id: user.id,
      display_name: user.user_metadata?.name || 'ユーザー',
      twitter_handle: user.user_metadata?.preferred_username || null,
      updated_at: new Date().toISOString()
    })

  // その後 orders に挿入
  const { error } = await supabase.from('orders').insert({
    client_id: user.id,
    category_id: parseInt(categoryId),
    title: title.trim(),
    description: description.trim(),
    agreed_price: budget ? parseInt(budget) : null,
    specification: { note: '基本依頼' },
    status: 'draft'
  })

  if (error) {
    console.error('Insert error:', error)
    alert('依頼作成失敗: ' + error.message)
  } else {
    alert('依頼を作成しました！')
    router.push('/mypage')
  }

  setSaving(false)
}
