import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/metrics — métriques au format Prometheus
// Utilisable par Grafana / Prometheus pour le monitoring
export async function GET() {
  const metrics: string[] = []

  try {
    // 1. Compteurs DB
    const [
      companies, employees, contracts, leaveRequests, expenseReports,
      documents, auditLogs, notifications, webhooks,
      llmUsages, llmGenerations, documentChunks, customWorkflows, apiKeys,
    ] = await Promise.all([
      db.company.count(),
      db.employee.count(),
      db.contract.count(),
      db.leaveRequest.count(),
      db.expenseReport.count(),
      db.document.count(),
      db.auditLog.count(),
      db.notification.count(),
      db.webhookConfig.count(),
      db.llmUsage.count(),
      db.aiGeneration.count(),
      db.documentChunk.count(),
      db.customWorkflow.count(),
      db.apiKey.count(),
    ])

    metrics.push('# HELP datasphere_companies_total Total number of companies')
    metrics.push('# TYPE datasphere_companies_total gauge')
    metrics.push(`datasphere_companies_total ${companies}`)

    metrics.push('# HELP datasphere_employees_total Total number of employees')
    metrics.push('# TYPE datasphere_employees_total gauge')
    metrics.push(`datasphere_employees_total ${employees}`)

    metrics.push('# HELP datasphere_contracts_total Total number of contracts')
    metrics.push('# TYPE datasphere_contracts_total gauge')
    metrics.push(`datasphere_contracts_total ${contracts}`)

    metrics.push('# HELP datasphere_leave_requests_total Total leave requests')
    metrics.push('# TYPE datasphere_leave_requests_total gauge')
    metrics.push(`datasphere_leave_requests_total ${leaveRequests}`)

    metrics.push('# HELP datasphere_expense_reports_total Total expense reports')
    metrics.push('# TYPE datasphere_expense_reports_total gauge')
    metrics.push(`datasphere_expense_reports_total ${expenseReports}`)

    metrics.push('# HELP datasphere_documents_total Total documents')
    metrics.push('# TYPE datasphere_documents_total gauge')
    metrics.push(`datasphere_documents_total ${documents}`)

    metrics.push('# HELP datasphere_audit_logs_total Total audit log entries')
    metrics.push('# TYPE datasphere_audit_logs_total gauge')
    metrics.push(`datasphere_audit_logs_total ${auditLogs}`)

    metrics.push('# HELP datasphere_notifications_total Total notifications')
    metrics.push('# TYPE datasphere_notifications_total gauge')
    metrics.push(`datasphere_notifications_total ${notifications}`)

    metrics.push('# HELP datasphere_webhooks_total Total webhook configs')
    metrics.push('# TYPE datasphere_webhooks_total gauge')
    metrics.push(`datasphere_webhooks_total ${webhooks}`)

    // 2. Métriques LLM
    metrics.push('# HELP datasphere_llm_usages_total Total LLM API calls')
    metrics.push('# TYPE datasphere_llm_usages_total gauge')
    metrics.push(`datasphere_llm_usages_total ${llmUsages}`)

    metrics.push('# HELP datasphere_llm_generations_total Total saved AI generations')
    metrics.push('# TYPE datasphere_llm_generations_total gauge')
    metrics.push(`datasphere_llm_generations_total ${llmGenerations}`)

    metrics.push('# HELP datasphere_rag_chunks_total Total RAG document chunks indexed')
    metrics.push('# TYPE datasphere_rag_chunks_total gauge')
    metrics.push(`datasphere_rag_chunks_total ${documentChunks}`)

    metrics.push('# HELP datasphere_custom_workflows_total Total custom workflows')
    metrics.push('# TYPE datasphere_custom_workflows_total gauge')
    metrics.push(`datasphere_custom_workflows_total ${customWorkflows}`)

    metrics.push('# HELP datasphere_api_keys_total Total API keys')
    metrics.push('# TYPE datasphere_api_keys_total gauge')
    metrics.push(`datasphere_api_keys_total ${apiKeys}`)

    // 3. Tokens LLM agrégés
    const tokenAgg = await db.llmUsage.aggregate({
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _avg: { durationMs: true },
    })

    metrics.push('# HELP datasphere_llm_tokens_total Total tokens consumed')
    metrics.push('# TYPE datasphere_llm_tokens_total counter')
    metrics.push(`datasphere_llm_tokens_total ${tokenAgg._sum.totalTokens || 0}`)

    metrics.push('# HELP datasphere_llm_prompt_tokens_total Total prompt tokens')
    metrics.push('# TYPE datasphere_llm_prompt_tokens_total counter')
    metrics.push(`datasphere_llm_prompt_tokens_total ${tokenAgg._sum.promptTokens || 0}`)

    metrics.push('# HELP datasphere_llm_completion_tokens_total Total completion tokens')
    metrics.push('# TYPE datasphere_llm_completion_tokens_total counter')
    metrics.push(`datasphere_llm_completion_tokens_total ${tokenAgg._sum.completionTokens || 0}`)

    metrics.push('# HELP datasphere_llm_avg_duration_ms Average LLM call duration in ms')
    metrics.push('# TYPE datasphere_llm_avg_duration_ms gauge')
    metrics.push(`datasphere_llm_avg_duration_ms ${Math.round(tokenAgg._avg.durationMs || 0)}`)

    // 4. Process info
    metrics.push('# HELP datasphere_process_uptime_seconds Process uptime in seconds')
    metrics.push('# TYPE datasphere_process_uptime_seconds gauge')
    metrics.push(`datasphere_process_uptime_seconds ${process.uptime().toFixed(0)}`)

    const memUsage = process.memoryUsage()
    metrics.push('# HELP datasphere_process_memory_rss_bytes Process RSS memory in bytes')
    metrics.push('# TYPE datasphere_process_memory_rss_bytes gauge')
    metrics.push(`datasphere_process_memory_rss_bytes ${memUsage.rss}`)

    metrics.push('# HELP datasphere_process_memory_heap_bytes Process heap memory in bytes')
    metrics.push('# TYPE datasphere_process_memory_heap_bytes gauge')
    metrics.push(`datasphere_process_memory_heap_used_bytes ${memUsage.heapUsed}`)
    metrics.push(`datasphere_process_memory_heap_total_bytes ${memUsage.heapTotal}`)
  } catch (error) {
    metrics.push('# ERROR collecting metrics')
    metrics.push(`# ${error}`)
  }

  return new Response(metrics.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
