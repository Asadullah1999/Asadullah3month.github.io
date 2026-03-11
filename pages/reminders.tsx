import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
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

  return (
    <DashboardLayout pageTitle="Reminders" title="Reminders">
      <div className="max-w-2xl mx-auto space-y-6">

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
          <Card padding="md">
            <CardTitle className="mb-4">{editing ? 'Edit reminder' : 'New reminder'}</CardTitle>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat days</label>
                <div className="flex gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                        form.days.includes(day)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
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
          </Card>
        )}

        {/* Reminder list */}
        {reminders.length === 0 && !showForm ? (
          <Card padding="lg" className="text-center">
            <Bell size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-medium text-gray-700 mb-1">No reminders yet</p>
            <p className="text-sm text-gray-400 mb-4">Add reminders to stay consistent with your nutrition goals.</p>
            <div className="flex justify-center gap-3">
              <Button size="sm" onClick={addDefaults}>Add default reminders</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Custom
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {reminders.map(reminder => (
              <Card key={reminder.id} padding="md" className={!reminder.is_active ? 'opacity-60' : ''}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    reminder.type === 'meal' ? 'bg-green-100' :
                    reminder.type === 'water' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    <Bell size={16} className={
                      reminder.type === 'meal' ? 'text-green-600' :
                      reminder.type === 'water' ? 'text-blue-600' :
                      'text-purple-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-900 text-sm">{reminder.title}</span>
                      <Badge variant={typeColors[reminder.type] || 'gray'}>
                        {reminder.type.replace('_', ' ')}
                      </Badge>
                      {!reminder.is_active && <Badge variant="gray">Paused</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{reminder.time}</span>
                      <span>{reminder.days.join(', ')}</span>
                      <span className="flex items-center gap-1">
                        {reminder.channel === 'whatsapp' ? <MessageCircle size={11} /> : <Smartphone size={11} />}
                        {reminder.channel}
                      </span>
                    </div>
                    {reminder.message && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{reminder.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(reminder.id, reminder.is_active)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        reminder.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {reminder.is_active ? 'On' : 'Off'}
                    </button>
                    <button
                      onClick={() => editReminder(reminder)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
