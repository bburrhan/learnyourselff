import React from 'react'

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2] !== undefined) parts.push(<strong key={match.index}>{match[2]}</strong>)
    else if (match[3] !== undefined) parts.push(<em key={match.index}>{match[3]}</em>)
    else if (match[4] !== undefined)
      parts.push(
        <code key={match.index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
          {match[4]}
        </code>
      )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function renderMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  const flushList = () => {
    if (!listItems.length) return
    if (listType === 'ul') {
      nodes.push(
        <ul key={key++} className="list-disc list-inside space-y-1 text-gray-700 my-3 ml-2">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      )
    } else {
      nodes.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 text-gray-700 my-3 ml-2">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      )
    }
    listItems = []
    listType = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (/^#{1,6}\s/.test(line)) {
      flushList()
      const level = line.match(/^(#+)/)?.[1].length ?? 2
      const text = line.replace(/^#+\s/, '')
      const Tag = level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
      const cls =
        level <= 2
          ? 'text-xl font-bold text-gray-900 mt-6 mb-2'
          : level === 3
          ? 'text-lg font-semibold text-gray-900 mt-5 mb-1.5'
          : 'text-base font-semibold text-gray-900 mt-4 mb-1'
      nodes.push(
        <Tag key={key++} className={cls}>
          {renderInline(text)}
        </Tag>
      )
      continue
    }

    if (/^---+$/.test(line)) {
      flushList()
      nodes.push(<hr key={key++} className="border-gray-200 my-4" />)
      continue
    }

    const ulMatch = line.match(/^[-*]\s+(.*)/)
    if (ulMatch) {
      if (listType === 'ol') flushList()
      listType = 'ul'
      listItems.push(ulMatch[1])
      continue
    }

    const olMatch = line.match(/^\d+\.\s+(.*)/)
    if (olMatch) {
      if (listType === 'ul') flushList()
      listType = 'ol'
      listItems.push(olMatch[1])
      continue
    }

    flushList()

    if (line === '') {
      nodes.push(<div key={key++} className="h-3" />)
      continue
    }

    nodes.push(
      <p key={key++} className="text-gray-700 leading-relaxed">
        {renderInline(line)}
      </p>
    )
  }

  flushList()
  return <>{nodes}</>
}
