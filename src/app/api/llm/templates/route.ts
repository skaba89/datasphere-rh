import { NextResponse } from 'next/server'
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, getTemplateById, fillTemplate } from '@/lib/llm/templates'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cat = searchParams.get('category')
  const templates = cat ? PROMPT_TEMPLATES.filter(t => t.category === cat) : PROMPT_TEMPLATES
  return NextResponse.json({ templates, categories: TEMPLATE_CATEGORIES, total: templates.length })
}
