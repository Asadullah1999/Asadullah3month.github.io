import { useState, useCallback, useEffect } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import {
  ShoppingCart, RefreshCw, CheckSquare, Square, Trash2,
  Leaf, Beef, Wheat, Milk, Package, Coffee, MoreHorizontal, Download,
} from 'lucide-react'

type Category = 'produce' | 'proteins' | 'grains' | 'dairy' | 'pantry' | 'beverages' | 'other'

type GroceryItem = {
  name: string
  quantity: string
  category: Category
  checked: boolean
}

const CATEGORY_CONFIG: Record<Category, {
  label: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  iconBorder: string
  accentColor: string
}> = {
  produce:   { label: 'Produce',    icon: Leaf,           iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.12)',  iconBorder: 'rgba(16,185,129,0.25)',  accentColor: 'rgba(16,185,129,0.06)'  },
  proteins:  { label: 'Proteins',   icon: Beef,           iconColor: '#f87171', iconBg: 'rgba(239,68,68,0.12)',   iconBorder: 'rgba(239,68,68,0.25)',   accentColor: 'rgba(239,68,68,0.05)'   },
  grains:    { label: 'Grains',     icon: Wheat,          iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)',  iconBorder: 'rgba(245,158,11,0.25)',  accentColor: 'rgba(245,158,11,0.05)'  },
  dairy:     { label: 'Dairy',      icon: Milk,           iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)',  iconBorder: 'rgba(59,130,246,0.25)',  accentColor: 'rgba(59,130,246,0.05)'  },
  pantry:    { label: 'Pantry',     icon: Package,        iconColor: '#fb923c', iconBg: 'rgba(249,115,22,0.12)',  iconBorder: 'rgba(249,115,22,0.25)',  accentColor: 'rgba(249,115,22,0.05)'  },
  beverages: { label: 'Beverages',  icon: Coffee,         iconColor: '#c084fc', iconBg: 'rgba(192,132,252,0.12)', iconBorder: 'rgba(192,132,252,0.25)', accentColor: 'rgba(192,132,252,0.05)' },
  other:     { label: 'Other',      icon: MoreHorizontal, iconColor: '#9ca3af', iconBg: 'rgba(156,163,175,0.12)', iconBorder: 'rgba(156,163,175,0.25)', accentColor: 'rgba(156,163,175,0.05)' },
}

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [summary, setSummary] = useState('')
  const [generatedFor, setGeneratedFor] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const generateList = useCallback(async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/grocery-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()
      if (!response.ok) { toast.error(data.error || 'Failed to generate list.'); return }
      setItems(data.items as GroceryItem[])
      setSummary(data.summary as string)
      setGeneratedFor(data.generated_for as string)
      setGenerated(true)
      toast.success('Grocery list generated!')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [userId])

  const toggleItem = useCallback((index: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.checked))
    toast.success('Checked items removed.')
  }, [])

  const downloadList = useCallback(() => {
    const lines = [`FahmiFit Grocery List`, `${generatedFor}`, `${summary}`, '']
    const byCategory = groupByCategory(items.filter((i) => !i.checked))
    for (const [cat, catItems] of Object.entries(byCategory)) {
      lines.push(`== ${CATEGORY_CONFIG[cat as Category].label} ==`)
      catItems.forEach((item) => lines.push(`[ ] ${item.name} — ${item.quantity}`))
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'grocery-list.txt'; a.click()
    URL.revokeObjectURL(url)
  }, [items, summary, generatedFor])

  const groupByCategory = (list: GroceryItem[]) => {
    const groups: Partial<Record<Category, GroceryItem[]>> = {}
    for (const item of list) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category]!.push(item)
    }
    return groups
  }

  const uncheckedItems = items.filter((i) => !i.checked)
  const checkedItems = items.filter((i) => i.checked)
  const groupedUnchecked = groupByCategory(uncheckedItems)

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
  }

  return (
    <DashboardLayout title="Smart Grocery List">
      <Head><title>Smart Grocery List – FahmiFit</title></Head>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Smart Grocery List</h1>
            <p className="text-gray-500 mt-1 text-sm">AI-generated based on your meal plan and nutrition goals.</p>
          </div>
          {generated && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={downloadList}>
                <Download size={14} /> Export
              </Button>
              <Button variant="secondary" size="sm" onClick={generateList} disabled={generating}>
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} /> Regenerate
              </Button>
            </div>
          )}
        </div>

        {/* Generate CTA */}
        {!generated && (
          <div style={cardStyle} className="p-10 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 40px rgba(16,185,129,0.12)',
              }}>
              <ShoppingCart size={36} className="text-brand-400" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xl">Generate your weekly grocery list</p>
              <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                AI will create a personalized shopping list based on your diet goals, preferences, and meal history.
              </p>
            </div>
            <Button onClick={generateList} disabled={generating} size="lg">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><ShoppingCart size={16} /> Generate List</>
              )}
            </Button>
          </div>
        )}

        {/* Summary banner */}
        {generated && summary && (
          <div className="p-4 rounded-2xl flex items-start gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
            <ShoppingCart size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">{summary}</p>
              <p className="text-xs text-brand-400 mt-0.5">{generatedFor} · {items.length} items total</p>
            </div>
          </div>
        )}

        {/* Stats row */}
        {generated && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Items',  value: items.length,          color: '#e2e8f0', gradient: 'rgba(255,255,255,0.05)' },
              { label: 'Checked Off',  value: checkedItems.length,   color: '#34d399', gradient: 'rgba(16,185,129,0.08)'  },
              { label: 'Remaining',    value: uncheckedItems.length, color: '#fbbf24', gradient: 'rgba(245,158,11,0.08)'  },
            ].map(s => (
              <div key={s.label} className="p-4 text-center rounded-2xl"
                style={{ background: s.gradient, border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Items by category */}
        {generated && Object.entries(groupedUnchecked).map(([category, catItems]) => {
          const config = CATEGORY_CONFIG[category as Category]
          const Icon = config.icon
          return (
            <div key={category} style={cardStyle} className="overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: config.accentColor }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: config.iconBg, border: `1px solid ${config.iconBorder}` }}>
                  <Icon size={15} style={{ color: config.iconColor }} />
                </div>
                <span className="font-bold text-white">{config.label}</span>
                <div className="ml-auto">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: config.iconBg, border: `1px solid ${config.iconBorder}`, color: config.iconColor }}>
                    {catItems.length}
                  </span>
                </div>
              </div>
              {/* Items */}
              <div className="px-6 py-3 space-y-1">
                {catItems.map((item, idx) => {
                  const globalIdx = items.findIndex((i) => i === item)
                  return (
                    <div key={idx}
                      className="flex items-center gap-3 py-2.5 group rounded-xl px-2 -mx-2 transition-all duration-150"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <button
                        onClick={() => toggleItem(globalIdx)}
                        className="flex-shrink-0 transition-all duration-200"
                        style={{ color: item.checked ? config.iconColor : 'rgba(255,255,255,0.2)' }}
                      >
                        {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold transition-all duration-200"
                          style={{
                            color: item.checked ? '#4b5563' : '#e2e8f0',
                            textDecoration: item.checked ? 'line-through' : 'none',
                          }}>
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-600 ml-2">{item.quantity}</span>
                      </div>
                      <button
                        onClick={() => removeItem(globalIdx)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-600 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Checked items */}
        {checkedItems.length > 0 && (
          <div style={{ ...cardStyle, opacity: 0.7 }} className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-bold text-gray-500">Checked off ({checkedItems.length})</p>
              <button onClick={clearChecked}
                className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors px-3 py-1 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                Remove all
              </button>
            </div>
            <div className="px-6 py-3 space-y-1">
              {checkedItems.map((item, idx) => {
                const globalIdx = items.findIndex((i) => i === item)
                return (
                  <div key={idx} className="flex items-center gap-3 py-2">
                    <button onClick={() => toggleItem(globalIdx)} style={{ color: '#34d399' }} className="flex-shrink-0">
                      <CheckSquare size={20} />
                    </button>
                    <span className="text-sm line-through text-gray-700 flex-1">{item.name}</span>
                    <span className="text-xs text-gray-700">{item.quantity}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
