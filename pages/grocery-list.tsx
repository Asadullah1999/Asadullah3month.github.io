import { useState, useCallback, useEffect } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
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

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  produce:   { label: 'Produce',    icon: Leaf,          color: 'text-green-700',  bg: 'bg-green-50'  },
  proteins:  { label: 'Proteins',   icon: Beef,          color: 'text-red-700',    bg: 'bg-red-50'    },
  grains:    { label: 'Grains',     icon: Wheat,         color: 'text-yellow-700', bg: 'bg-yellow-50' },
  dairy:     { label: 'Dairy',      icon: Milk,          color: 'text-blue-700',   bg: 'bg-blue-50'   },
  pantry:    { label: 'Pantry',     icon: Package,       color: 'text-orange-700', bg: 'bg-orange-50' },
  beverages: { label: 'Beverages',  icon: Coffee,        color: 'text-purple-700', bg: 'bg-purple-50' },
  other:     { label: 'Other',      icon: MoreHorizontal,color: 'text-gray-700',   bg: 'bg-gray-50'   },
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
      if (!response.ok) {
        toast.error(data.error || 'Failed to generate list.')
        return
      }

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
  }, [])

  const toggleItem = useCallback((index: number) => {
    setItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    ))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.checked))
    toast.success('Checked items removed.')
  }, [])

  const downloadList = useCallback(() => {
    const lines = [`NutriCoach Grocery List`, `${generatedFor}`, `${summary}`, '']
    const byCategory = groupByCategory(items.filter((i) => !i.checked))
    for (const [cat, catItems] of Object.entries(byCategory)) {
      lines.push(`== ${CATEGORY_CONFIG[cat as Category].label} ==`)
      catItems.forEach((item) => lines.push(`[ ] ${item.name} — ${item.quantity}`))
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grocery-list.txt'
    a.click()
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

  return (
    <DashboardLayout title="Smart Grocery List">
      <Head><title>Smart Grocery List – NutriCoach</title></Head>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Grocery List</h1>
            <p className="text-gray-500 mt-1 text-sm">Auto-generated based on your meal plan and nutrition goals.</p>
          </div>
          {generated && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={downloadList} className="flex items-center gap-1.5 text-sm">
                <Download size={15} /> Export
              </Button>
              <Button variant="secondary" onClick={generateList} disabled={generating} className="flex items-center gap-1.5 text-sm">
                <RefreshCw size={15} className={generating ? 'animate-spin' : ''} /> Regenerate
              </Button>
            </div>
          )}
        </div>

        {/* Generate */}
        {!generated && (
          <Card>
            <div className="p-10 flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center">
                <ShoppingCart size={36} className="text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-lg">Generate your weekly grocery list</p>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">
                  AI will create a personalized shopping list based on your diet goals, preferences, and meal history.
                </p>
              </div>
              <Button onClick={generateList} disabled={generating} className="flex items-center gap-2 px-6">
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} /> Generate List
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Summary */}
        {generated && summary && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ShoppingCart size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">{summary}</p>
                <p className="text-xs text-green-600 mt-0.5">{generatedFor} · {items.length} items total</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        {generated && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                <p className="text-xs text-gray-500">Total Items</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{checkedItems.length}</p>
                <p className="text-xs text-gray-500">Checked Off</p>
              </div>
            </Card>
            <Card>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{uncheckedItems.length}</p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </Card>
          </div>
        )}

        {/* Items by category */}
        {generated && Object.entries(groupedUnchecked).map(([category, catItems]) => {
          const config = CATEGORY_CONFIG[category as Category]
          const Icon = config.icon
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon size={14} className={config.color} />
                  </span>
                  {config.label}
                  <Badge variant="gray" className="ml-auto text-xs">{catItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-4 space-y-2">
                {catItems.map((item, idx) => {
                  const globalIdx = items.findIndex((i) => i === item)
                  return (
                    <div key={idx} className="flex items-center gap-3 py-1 group">
                      <button
                        onClick={() => toggleItem(globalIdx)}
                        className={`flex-shrink-0 transition-colors ${item.checked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                      >
                        {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{item.quantity}</span>
                      </div>
                      <button
                        onClick={() => removeItem(globalIdx)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {/* Checked items */}
        {checkedItems.length > 0 && (
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">Checked off ({checkedItems.length})</p>
                <button onClick={clearChecked} className="text-xs text-red-500 hover:text-red-600 font-medium">
                  Remove all
                </button>
              </div>
              <div className="space-y-2">
                {checkedItems.map((item, idx) => {
                  const globalIdx = items.findIndex((i) => i === item)
                  return (
                    <div key={idx} className="flex items-center gap-3 opacity-50">
                      <button onClick={() => toggleItem(globalIdx)} className="text-green-500 flex-shrink-0">
                        <CheckSquare size={20} />
                      </button>
                      <span className="text-sm line-through text-gray-400 flex-1">{item.name}</span>
                      <span className="text-xs text-gray-400">{item.quantity}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
