'use client'
import { useCallback, useState, useRef } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, Handle, Position,
  type Node, type Edge, type Connection, type NodeProps, type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Workflow as WorkflowIcon, Save, Play, Loader2, Plus, Trash2, X, Download, Upload, FileText, ClipboardList, Globe, Sparkles, Key, Settings, Save as SaveIcon, Library } from 'lucide-react'
import { toast } from 'sonner'

// ━━━ Types de nœuds personnalisés ━━━

const STEP_TYPES = [
  { type: 'generate_document', label: 'Générer', color: '#27698a', icon: FileText },
  { type: 'summarize', label: 'Résumer', color: '#10b981', icon: ClipboardList },
  { type: 'translate', label: 'Traduire', color: '#0ea5e9', icon: Globe },
  { type: 'improve', label: 'Améliorer', color: '#8b5cf6', icon: Sparkles },
  { type: 'extract_keywords', label: 'Mots-clés', color: '#f59e0b', icon: Key },
  { type: 'custom', label: 'Custom', color: '#64748b', icon: Settings },
  { type: 'save_generation', label: 'Sauver', color: '#478e5e', icon: SaveIcon },
  { type: 'index_in_rag', label: 'Indexer RAG', color: '#b94659', icon: Library },
]

// ━━━ Nœud personnalisé ━━━

function WorkflowNode({ data, id }: NodeProps) {
  const stepType = STEP_TYPES.find(s => s.type === data.stepType) || STEP_TYPES[5]
  return (
    <div
      className="px-4 py-3 rounded-lg shadow-lg border-2 bg-white min-w-[180px]"
      style={{ borderColor: stepType.color }}
    >
      <Handle type="target" position={Position.Left} style={{ background: stepType.color, width: 10, height: 10 }} />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: stepType.color + '15', color: stepType.color }}>
          {(() => { const Icon = stepType.icon; return <Icon className="w-4 h-4" /> })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-900 truncate">{data.label}</div>
          <div className="text-[9px] text-slate-500">{stepType.label}</div>
        </div>
      </div>
      {data.prompt && (
        <div className="mt-1.5 text-[9px] text-slate-400 truncate italic">{data.prompt.slice(0, 40)}…</div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: stepType.color, width: 10, height: 10 }} />
    </div>
  )
}

const nodeTypes: NodeTypes = { workflowNode: WorkflowNode }

// ━━━ IDs uniques ━━━

let nodeIdCounter = 1
function getNodeId() {
  return `node_${nodeIdCounter++}`
}

// ━━━ Composant principal ━━━

export function WorkflowVisualEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflowName, setWorkflowName] = useState('')
  const [showPalette, setShowPalette] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // ━━━ Drag & Drop depuis la palette ━━━

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#27698a', strokeWidth: 2 } }, eds))
  }, [setEdges])

  const onDragStart = (event: React.DragEvent, stepType: string) => {
    event.dataTransfer.setData('application/reactflow', stepType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const stepType = event.dataTransfer.getData('application/reactflow')
    if (!stepType) return

    const position = { x: event.clientX - 300, y: event.clientY - 100 }
    const stepMeta = STEP_TYPES.find(s => s.type === stepType) || STEP_TYPES[5]
    const newNode: Node = {
      id: getNodeId(),
      type: 'workflowNode',
      position,
      data: {
        label: `${stepMeta.label} ${nodes.length + 1}`,
        stepType,
        prompt: '',
        config: { temperature: 0.7, maxTokens: 1000 },
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes, setNodes])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // ━━━ Édition du nœud sélectionné ━━━

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node)
  }, [])

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNode.id) {
        const updated = { ...n, data: { ...n.data, [key]: value } }
        setSelectedNode(updated)
        return updated
      }
      return n
    }))
  }

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    if (selectedNode?.id === id) setSelectedNode(null)
  }

  // ━━━ Export / Import ━━━

  const exportWorkflow = () => {
    const wf = {
      name: workflowName || 'Workflow sans nom',
      nodes: nodes.map(n => ({ id: n.id, type: n.data.stepType, label: n.data.label, config: n.data.config || {}, prompt: n.data.prompt || '' })),
      edges: edges.map(e => ({ from: e.source, to: e.target })),
    }
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${wf.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Workflow exporté')
  }

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wf = JSON.parse(e.target?.result as string)
        setWorkflowName(wf.name)
        const newNodes: Node[] = (wf.nodes || []).map((n: any, i: number) => ({
          id: n.id || `node_${i}`,
          type: 'workflowNode',
          position: { x: 100 + i * 250, y: 150 + (i % 3) * 100 },
          data: { label: n.label, stepType: n.type, prompt: n.prompt || '', config: n.config || {} },
        }))
        const newEdges: Edge[] = (wf.edges || []).map((e: any, i: number) => ({
          id: `edge_${i}`,
          source: e.from,
          target: e.to,
          animated: true,
          style: { stroke: '#27698a', strokeWidth: 2 },
        }))
        setNodes(newNodes)
        setEdges(newEdges)
        toast.success(`Workflow importé : ${wf.name}`)
      } catch {
        toast.error('Fichier invalide')
      }
    }
    reader.readAsText(file)
  }

  // ━━━ Sauvegarde ━━━

  const handleSave = async () => {
    if (!workflowName) { toast.error('Nom du workflow requis'); return }
    if (nodes.length === 0) { toast.error('Au moins 1 nœud requis'); return }
    setSaving(true)

    // Convertit le graphe en steps séquentielles (ordre topologique simple par position X)
    const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x)
    const steps = sortedNodes.map((n, i) => ({
      id: `step_${i}`,
      type: n.data.stepType,
      label: n.data.label,
      config: { ...n.data.config, prompt: n.data.prompt || '' },
    }))

    try {
      const r = await fetch('/api/llm/custom-workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          description: `Workflow créé avec l'éditeur visuel (${nodes.length} étapes, ${edges.length} connexions)`,
          steps,
          trigger: 'manual',
        }),
      })
      const d = await r.json()
      if (d.success) {
        toast.success(`Workflow "${workflowName}" sauvegardé`)
      } else toast.error(d.error)
    } catch { toast.error('Erreur réseau') }
    finally { setSaving(false) }
  }

  // ━━━ Exécution test ━━━

  const handleRun = async () => {
    if (nodes.length === 0 || !testInput) { toast.error('Nœuds + input requis'); return }
    setRunning(true)
    setResults([])
    setShowResults(true)

    const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x)
    const steps = sortedNodes.map((n, i) => ({
      id: `step_${i}`,
      type: n.data.stepType,
      label: n.data.label,
      config: { ...n.data.config, prompt: n.data.prompt || '' },
    }))

    try {
      // Crée un workflow temporaire et l'exécute
      const createR = await fetch('/api/llm/custom-workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `_test_${Date.now()}`, description: 'Test éditeur', steps, trigger: 'manual' }),
      })
      const createD = await createR.json()
      if (!createD.success) { toast.error('Création échouée'); return }

      const runR = await fetch(`/api/llm/custom-workflows/${createD.workflow.id}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: testInput }),
      })
      const runD = await runR.json()
      if (runD.success) {
        setResults(runD.results || [])
        toast.success(`${runD.successCount}/${runD.steps} étapes réussies`)
      } else toast.error(runD.error)

      // Supprime le workflow temporaire
      await fetch(`/api/llm/custom-workflows/${createD.workflow.id}`, { method: 'DELETE' })
    } catch { toast.error('Erreur') }
    finally { setRunning(false) }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <WorkflowIcon className="w-6 h-6 text-[#27698a]" />Éditeur visuel de workflows
          </h1>
          <p className="text-sm text-slate-500 mt-1">Canvas drag & drop — glissez les nœuds, connectez-les, exécutez</p>
        </div>
        <div className="flex gap-2">
          <input
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            placeholder="Nom du workflow"
            className="px-3 py-1.5 rounded border border-slate-300 text-sm w-48"
          />
          <Button variant="outline" size="sm" onClick={exportWorkflow} disabled={nodes.length === 0}><Download className="w-3.5 h-3.5 mr-1" />Export</Button>
          <label>
            <Button variant="outline" size="sm" asChild><span><Upload className="w-3.5 h-3.5 mr-1" />Import</span></Button>
            <input type="file" accept=".json" onChange={importWorkflow} className="hidden" />
          </label>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5670]" onClick={handleSave} disabled={saving || !workflowName}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Sauver
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Palette de nœuds */}
        {showPalette && (
          <Card className="p-3 w-48 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-700">Nœuds</h3>
              <button onClick={() => setShowPalette(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-1.5">
              {STEP_TYPES.map(st => (
                <div
                  key={st.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, st.type)}
                  className="p-2 rounded border border-slate-200 cursor-grab hover:border-[#27698a]/40 hover:bg-slate-50 transition-colors"
                  style={{ borderLeft: `3px solid ${st.color}` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm inline-flex items-center">{(() => { const Icon = st.icon; return <Icon className="w-3.5 h-3.5" style={{ color: st.color }} /> })()}</span>
                    <span className="text-xs font-medium text-slate-700">{st.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">Glissez les nœuds sur le canvas, puis connectez-les en tirant les poignées.</p>
            </div>
          </Card>
        )}

        {/* Canvas React Flow */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Barre d'outils */}
          <div className="flex items-center gap-2">
            {!showPalette && (
              <Button variant="outline" size="sm" onClick={() => setShowPalette(true)}><Plus className="w-3.5 h-3.5 mr-1" />Palette</Button>
            )}
            <input
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              placeholder="Input de test…"
              className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-sm"
            />
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleRun} disabled={running || !testInput || nodes.length === 0}>
              {running ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}Tester
            </Button>
          </div>

          {/* Canvas */}
          <Card className="p-0 overflow-hidden h-[500px] relative">
            <div ref={reactFlowWrapper} className="w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                defaultEdgeOptions={{ animated: true, style: { stroke: '#27698a', strokeWidth: 2 } }}
              >
                <Background color="#e2e8f0" gap={16} />
                <Controls />
                <MiniMap nodeColor={(n) => STEP_TYPES.find(s => s.type === n.data?.stepType)?.color || '#64748b'} nodeStrokeWidth={3} />
              </ReactFlow>
            </div>

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-slate-300">
                  <WorkflowIcon className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-sm">Glissez des nœuds ici pour commencer</p>
                </div>
              </div>
            )}
          </Card>

          {/* Panneau d'édition du nœud sélectionné */}
          {selectedNode && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Éditer : {selectedNode.data.label}</h3>
                <div className="flex gap-1">
                  <button onClick={() => deleteNode(selectedNode.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Label</label>
                  <input value={selectedNode.data.label || ''} onChange={e => updateNodeData('label', e.target.value)} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Type</label>
                  <select value={selectedNode.data.stepType} onChange={e => updateNodeData('stepType', e.target.value)} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm">
                    {STEP_TYPES.map(st => <option key={st.type} value={st.type}>{st.label}</option>)}
                  </select>
                </div>
                {['generate_document', 'custom', 'summarize', 'translate', 'extract_keywords'].includes(selectedNode.data.stepType) && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Prompt / Paramètre</label>
                    <textarea value={selectedNode.data.prompt || ''} onChange={e => updateNodeData('prompt', e.target.value)} rows={2} placeholder="Prompt ou paramètre (ex: 'anglais' pour traduire)" className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm resize-none" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Température : {selectedNode.data.config?.temperature ?? 0.7}</label>
                  <input type="range" min="0" max="2" step="0.1" value={selectedNode.data.config?.temperature ?? 0.7} onChange={e => updateNodeData('config', { ...selectedNode.data.config, temperature: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Max tokens</label>
                  <input type="number" value={selectedNode.data.config?.maxTokens ?? 1000} onChange={e => updateNodeData('config', { ...selectedNode.data.config, maxTokens: parseInt(e.target.value) || 1000 })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" />
                </div>
              </div>
            </Card>
          )}

          {/* Résultats d'exécution */}
          {showResults && results.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Résultats ({results.length} étapes)</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowResults(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className={`p-2 rounded border text-xs ${r.success ? 'border-slate-200' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${r.success ? 'bg-emerald-500' : 'bg-red-500'}`}>{i + 1}</span>
                      <span className="font-medium text-slate-900">{r.stepLabel}</span>
                      <span className="text-[9px] text-slate-400 ml-auto">{r.durationMs}ms</span>
                    </div>
                    <p className="text-[10px] text-slate-600 truncate">{r.output?.slice(0, 120) || r.error}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
