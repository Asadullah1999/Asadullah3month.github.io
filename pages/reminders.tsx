import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { Reminder } from '@/lib/database.types'
import { Bell, Plus, Trash2, Edit2, MessageCircle, Smartphone, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' }

const TYPE_OPTIONS = [
  { value: 'meal',     label: 'Meal reminder' },
  { value: 'water',    label: 'Water reminder' },
  { value: 'weigh_in', label: 'Weigh-in' },
  { value: 'custom',   label: 'Custom' },
]

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'push',     label: 'Push notification' },
  { value: 'both',     label: 'Both' },
]

const DEFAULT_REMINDERS = [
  { type: 'meal',  title: 'Breakfast reminder',  message: 'Time to log your breakfast! 🌅',    time: '08:00', days: DAYS, channel: 'whatsapp' },
  { type: 'meal',  title: 'Lunch reminder',       message: 'Log your lunch to stay on track ☀️', time: '12:30', days: DAYS, channel: 'whatsapp' },
  { type: 'water', title: 'Water reminder',        message: 'Stay hydrated! Drink a glass 💧',    time: '10:00', days: DAYS, channel: 'whatsapp' },
  { type: 'meal',  title: 'Dinner reminder',       message: 'Don\'t forget to log dinner 🌙',      time: '19:00', days: DAYS, channel: 'whatsapp' },
]

const TYPE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  meal:     { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  color: '#34d399' },
  water:    { bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)',   color: '#22d3ee' },
  weigh_in: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#a78bfa' },
  custom:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  color: '#fbbf24' },
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'meal', title: '', message: '', time: '08:00',
    days: DAYS, channel: 'whatsapp', is_active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadReminders() }, [])

  async function loadReminders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('reminders').select('*').eq('user_id', session.user.id).order('time')
    if (data) setReminders(data)
  }

  function updateForm(field: string, value: string | boolean | string[]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleDay(day: string) {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }))
  }

  async function saveReminder() {
    if (!form.title || !form.time) { toast.error('Title and time are required'); return }
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const payload = {
      user_id: session.user.id,
      type: form.type as 'meal' | 'water' | 'weigh_in' | 'custom',
      title: form.title,
      message: form.message,
      time: form.time,
      days: form.days,
      channel: form.channel as 'whatsapp' | 'push' | 'both',
      is_active: form.is_active,
    }

    if (editing) {
      await supabase.from('reminders').update(payload).eq('id', editing)
      toast.success('Reminder updated!')
    } else {
      await supabase.from('reminders').insert(payload)
      toast.success('Reminder created!')
    }

    resetForm()
    loadReminders()
    setSaving(false)
  }

  async function deleteReminder(id: string) {
    await supabase.from('reminders').delete().eq('id', id)
    toast.success('Reminder deleted')
    loadReminders()
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('reminders').update({ is_active: !current }).eq('id', id)
    loadReminders()
  }

  function editReminder(r: Reminder) {
    setForm({
      type: r.type,
      title: r.title,
      message: r.message || '',
      time: r.time,
      days: r.days,
      channel: r.channel,
      is_active: r.is_active,
    })
    setEditing(r.id)
    setShowForm(true)
  }

  function resetForm() {
    setForm({ type: 'meal', title: '', message: '', time: '08:00', days: DAYS, channel: 'whatsapp', is_active: true })
    setEditing(null)
    setShowForm(false)
  }

  async function addDefaults() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const rows = DEFAULT_REMINDERS.map(r => ({ ...r, user_id: session.user.id, is_active: true }))
    await supabase.from('reminders').insert(rows as Reminder[])
    toast.success('Default reminders added!')
    loadReminders()
  }

  const typeColors: Record<string, 'green' | 'blue' | 'orange' | 'purple'> = {
    meal: 'green', water: 'blue', weigh_in: 'purple', custom: 'orange',
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
  }

  return (
    <DashboardLayout pageTitle="Reminders" title="Reminders">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">Manage your meal, water, and check-in reminders.</p>
          <div className="flex gap-2">
            {reminders.length === 0 && (
              <Button variant="secondary" size="sm" onClick={addDefaults}>
                Add defaults
              </Button>
            )}
            <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm) }}>
              <Plus size={14} /> New reminder
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={cardStyle}>
            <p className="font-bold text-white mb-5">{editing ? 'Edit reminder' : 'New reminder'}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  value={form.type}
                  onChange={e => updateForm('type', e.target.value)}
                  options={TYPE_OPTIONS}
                />
                <Input
                  label="Time"
                  type="time"
                  value={form.time}
                  onChange={e => updateForm('time', e.target.value)}
                />
              </div>
              <Input
                label="Title"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
                placeholder="e.g. Breakfast reminder"
              />
              <Input
                label="Message (optional)"
                value={form.message}
                onChange={e => updateForm('message', e.target.value)}
                placeholder="Custom message to send..."
              />

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Repeat days</label>
                <div className="flex gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className="w-9 h-9 rounded-full text-xs font-bold transition-all duration-200"
                      style={form.days.includes(day) ? {
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#6b7280',
                      }}
                    >
                      {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                    </button>
                  ))}
                </div>
              </div>

              <Select
                label="Send via"
                value={form.channel}
                onChange={e => updateForm('channel', e.target.value)}
                options={CHANNEL_OPTIONS}
              />

              <div className="flex gap-3">
                <Button onClick={saveReminder} loading={saving}>
                  <Check size={14} /> {editing ? 'Update' : 'Save reminder'}
                </Button>
                <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Reminder list */}
        {reminders.length === 0 && !showForm ? (
          <div className="text-center py-16" style={cardStyle}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Bell size={24} className="text-gray-600" />
            </div>
            <p className="font-bold text-white mb-1">No reminders yet</p>
            <p className="text-sm text-gray-500 mb-5">Add reminders to stay consistent with your nutrition goals.</p>
            <div className="flex justify-center gap-3">
              <Button size="sm" onClick={addDefaults}>Add default reminders</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Custom
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(reminder => {
              const ts = TYPE_STYLES[reminder.type] || TYPE_STYLES.custom
              return (
                <div
                  key={reminder.id}
                  className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    opacity: reminder.is_active ? 1 : 0.5,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: ts.bg, border: `1px solid ${ts.border}` }}
                  >
                    <Bell size={16} style={{ color: ts.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-white text-sm">{reminder.title}</span>
                      <Badge variant={typeColors[reminder.type] || 'gray'}>
                        {reminder.type.replace('_', ' ')}
                      </Badge>
                      {!reminder.is_active && <Badge variant="gray">Paused</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-bold text-gray-400">{reminder.time}</span>
                      <span>{reminder.days.join(', ')}</span>
                      <span className="flex items-center gap-1">
                        {reminder.channel === 'whatsapp' ? <MessageCircle size={11} /> : <Smartphone size={11} />}
                        {reminder.channel}
                      </span>
                    </div>
                    {reminder.message && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{reminder.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(reminder.id, reminder.is_active)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200"
                      style={reminder.is_active ? {
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        color: '#34d399',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#6b7280',
                      }}
                    >
                      {reminder.is_active ? 'On' : 'Off'}
                    </button>
                    <button
                      onClick={() => editReminder(reminder)}
                      className="p-1.5 rounded-lg transition-colors text-gray-600 hover:text-gray-300"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-1.5 rounded-lg transition-colors text-gray-600 hover:text-red-400"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
