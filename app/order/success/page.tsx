import Link from 'next/link'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let orderNumber: string | null = null
  let fetchError = false

  if (token) {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .eq('dealer_token', token)
      .single()

    if (error || !data) {
      fetchError = true
    } else {
      orderNumber = data.order_number
    }
  }

  if (!token || fetchError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="size-16 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">找不到订单</h1>
          <p className="text-zinc-400 text-sm mb-8">无效的订单链接，请重新下单。</p>
          <Link
            href="/"
            className="inline-block w-full bg-white text-zinc-950 font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
          >
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="size-16 text-green-400" />
        </div>

        <h1 className="text-2xl font-bold mb-2">订单已提交！</h1>

        {orderNumber && (
          <div className="bg-zinc-900 rounded-xl px-4 py-3 mb-8 inline-block">
            <p className="text-xs text-zinc-500 mb-1">订单号</p>
            <p className="text-white font-mono font-semibold">{orderNumber}</p>
          </div>
        )}

        <p className="text-zinc-400 text-sm mb-8">
          我们将尽快安排生产，发货后会更新快递信息。
          <br />
          请保存好您的订单链接以便查询进度。
        </p>

        <div className="space-y-3">
          <Link
            href={`/track?token=${token}`}
            className="block w-full bg-white text-zinc-950 font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-colors text-sm"
          >
            查看订单状态
          </Link>
          <Link
            href="/"
            className="block w-full border border-zinc-700 text-zinc-300 font-medium py-3.5 rounded-xl hover:border-zinc-500 hover:text-white transition-colors text-sm"
          >
            继续购买
          </Link>
        </div>
      </div>
    </div>
  )
}
