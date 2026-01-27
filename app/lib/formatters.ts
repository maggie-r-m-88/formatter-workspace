export function formatJson(json: string): string {
  return JSON.stringify(JSON.parse(json), null, 2)
}

export function formatXml(xml: string): string {
  let formatted = ''
  let indent = 0
  const tab = '  ' // 2 spaces

  // Remove existing whitespace between tags
  xml = xml.replace(/>\s*</g, '><')

  // Split by tags
  xml.split(/(<[^>]+>)/).forEach(node => {
    if (!node.trim()) return

    if (node.match(/^<\/\w/)) {
      // Closing tag
      indent--
      formatted += tab.repeat(indent) + node + '\n'
    } else if (node.match(/^<\w[^>]*[^\/]>$/)) {
      // Opening tag
      formatted += tab.repeat(indent) + node + '\n'
      indent++
    } else if (node.match(/^<\w[^>]*\/>$/)) {
      // Self-closing tag
      formatted += tab.repeat(indent) + node + '\n'
    } else {
      // Text content
      const trimmedNode = node.trim()
      if (trimmedNode) {
        formatted += tab.repeat(indent) + trimmedNode + '\n'
      }
    }
  })

  return formatted.trim()
}

