import React from "react"
import { isDevelopment } from "@/lib/utils/env"
import { BLOCK_REGISTRY } from "./block-registry"

interface BlockData {
  id?: string
  blockType: string
  blockName?: string
  [key: string]: any
}

interface BlockRendererProps {
  blocks: BlockData[]
  className?: string
  locale?: string
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks, className = "", locale }) => {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const Component = BLOCK_REGISTRY[block.blockType]
        if (!Component) {
          if (isDevelopment()) {
            return (
              <div
                key={block.id || index}
                className="py-8 text-center text-ds-muted-foreground border border-dashed border-ds-border rounded-lg mx-4 my-4"
              >
                <p className="text-sm">Unknown block type: <code className="font-mono bg-ds-muted px-1.5 py-0.5 rounded">{block.blockType}</code></p>
              </div>
            )
          }
          return null
        }

        const { blockType, blockName, ...props } = block

        return <Component key={block.id || index} {...props} locale={locale} />
      })}
    </div>
  )
}
