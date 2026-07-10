'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface Msg { role: 'user' | 'bot'; content: string; time: string }

const SUGGESTIONS = [
  'Combien de demandes de congé en attente ?',
  'Quels sont mes droits de congé payé ?',
  'Comment calculer ma paie CNSS ?',
  'Quelles formations sont disponibles ?',
  'Quelle est la politique de télétravail ?',
]

export function ChatbotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', content: 'Bonjour ! Je suis l\'assistant RH DataSphere. Comment puis-je vous aider aujourd\'hui ?', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text?: string) => {
    const msg = text || input
    if (!msg.trim()) return
    const userMsg: Msg = { role: 'user', content: msg, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chatbot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', content: data.reply, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }])
      } else { toast.error('Erreur chatbot') }
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Bot className="w-6 h-6 text-[#27698a]" />Chatbot RH</h1><p className="text-sm text-slate-500 mt-1">Assistant IA conversationnel pour questions RH</p></div>

      <Card className="p-0 overflow-hidden flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${msg.role === 'user' ? 'bg-[#27698a]' : 'bg-[#478e5e]'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-[#27698a] text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-[#27698a]/50' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          {loading && <div className="flex gap-2"><div className="w-8 h-8 rounded-full bg-[#478e5e] flex items-center justify-center text-white"><Loader2 className="w-4 h-4 animate-spin" /></div><div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-400">L'assistant rédige...</div></div>}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => <button key={i} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600"><Sparkles className="w-3 h-3 inline mr-1" />{s}</button>)}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-200 flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Posez votre question RH..." className="flex-1" disabled={loading} />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-[#27698a] hover:bg-[#1f5570]"><Send className="w-4 h-4" /></Button>
        </div>
      </Card>

      <div className="p-3 rounded-lg bg-[#27698a]/5 border border-[#27698a]/20 text-xs text-slate-600">
        <Bot className="w-3.5 h-3.5 inline" /> <strong>Chatbot IA :</strong> L'assistant a accès aux données RH en temps réel (effectif, congés, notes de frais, conformité). Il peut répondre aux questions des employés et managers sur la politique RH, les congés, la paie CNSS, les formations, etc.
      </div>
    </div>
  )
}
