import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'サーバー環境変数が不足しています' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'ログイン情報を確認できませんでした' },
        { status: 401 }
      )
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ログインユーザーを確認できませんでした' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: publicUser, error: publicUserError } = await supabaseAdmin
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', user.id)
      .single()

    if (publicUserError || !publicUser) {
      return NextResponse.json(
        { error: 'ユーザー情報を取得できませんでした' },
        { status: 404 }
      )
    }

    const userId = publicUser.id

    const { data: activeOrders, error: activeOrdersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .or(`client_id.eq.${userId},creator_id.eq.${userId}`)
      .in('status', [
        'draft',
        'open',
        'matched',
        'in_progress',
        'revision',
        'delivered',
      ])

    if (activeOrdersError) {
      return NextResponse.json(
        { error: activeOrdersError.message },
        { status: 500 }
      )
    }

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json(
        { error: '進行中の取引があるため退会できません' },
        { status: 400 }
      )
    }

    const { data: activeSteps, error: activeStepsError } = await supabaseAdmin
      .from('order_steps')
      .select('id')
      .eq('creator_id', userId)
      .in('status', ['open', 'matched', 'delivered'])

    if (activeStepsError) {
      return NextResponse.json(
        { error: activeStepsError.message },
        { status: 500 }
      )
    }

    if (activeSteps && activeSteps.length > 0) {
      return NextResponse.json(
        { error: '進行中の工程があるため退会できません' },
        { status: 400 }
      )
    }

    const { error: anonymizeError } = await supabaseAdmin
      .from('users')
      .update({
        display_name: '退会済みユーザー',
        twitter_handle: null,
        bio: null,
        avatar_url: null,
        skills: null,
        portfolio_urls: null,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (anonymizeError) {
      return NextResponse.json(
        { error: anonymizeError.message },
        { status: 500 }
      )
    }

    const { error: portfolioDeleteError } = await supabaseAdmin
      .from('portfolio_works')
      .delete()
      .eq('user_id', userId)

    if (portfolioDeleteError) {
      return NextResponse.json(
        { error: portfolioDeleteError.message },
        { status: 500 }
      )
    }

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteAuthError) {
      return NextResponse.json(
        { error: deleteAuthError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || '退会処理に失敗しました' },
      { status: 500 }
    )
  }
}
