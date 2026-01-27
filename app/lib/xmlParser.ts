export interface XmlNode {
  tagName: string
  attributes: Record<string, string>
  children: XmlNode[]
  textContent: string
}

export function parseXmlToTree(xmlString: string): XmlNode {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Invalid XML: ' + parserError.textContent)
  }

  return elementToNode(doc.documentElement)
}

function elementToNode(element: Element): XmlNode {
  const node: XmlNode = {
    tagName: element.tagName,
    attributes: {},
    children: [],
    textContent: ''
  }

  // Extract attributes
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    node.attributes[attr.name] = attr.value
  }

  // Extract children and text content
  let textContent = ''

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]

    if (child.nodeType === Node.ELEMENT_NODE) {
      node.children.push(elementToNode(child as Element))
    } else if (child.nodeType === Node.TEXT_NODE) {
      textContent += child.textContent || ''
    }
  }

  node.textContent = textContent.trim()

  return node
}

export function nodeToXml(node: XmlNode, indent: number = 0): string {
  const tab = '  '
  const indentation = tab.repeat(indent)

  // Build opening tag with attributes
  let xml = `${indentation}<${node.tagName}`

  // Add attributes
  for (const [name, value] of Object.entries(node.attributes)) {
    xml += ` ${name}="${value}"`
  }

  // Check if it's a self-closing tag (no children and no text content)
  if (node.children.length === 0 && !node.textContent) {
    xml += ' />'
    return xml
  }

  xml += '>'

  // Add text content or children
  if (node.textContent && node.children.length === 0) {
    // Inline text content
    xml += node.textContent
  } else {
    // Add newline and children
    xml += '\n'

    // Add text content if present
    if (node.textContent) {
      xml += `${tab.repeat(indent + 1)}${node.textContent}\n`
    }

    // Add child nodes
    for (const child of node.children) {
      xml += nodeToXml(child, indent + 1) + '\n'
    }

    xml += indentation
  }

  // Closing tag
  xml += `</${node.tagName}>`

  return xml
}

export function countXmlNodes(node: XmlNode): number {
  let count = 1 // Count this node

  // Count all children recursively
  for (const child of node.children) {
    count += countXmlNodes(child)
  }

  return count
}

