// src/stores/gridStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Block {
  id: number
  x: number
  y: number
  width: number
  height: number
  image: string
  link: string
  owner: string
  backgroundColor?: string
}

// Interface para a seleção por ARRASTE
interface Selection {
  startX: number
  startY: number
  endX: number
  endY: number
}

export const useGridStore = defineStore('grid', () => {
  // === STATE (LÓGICA DE 'ARRASTAR') ===
  const blocks = ref<Block[]>([])
  const isLoading = ref(false)
  const isSelecting = ref(false) // Controla se o mouse está pressionado
  const selection = ref<Selection | null>(null) // Guarda as coordenadas inicial e final
  const nextBlockId = ref(1)

  // === GETTERS ===
  // Getter que calcula o retângulo da seleção para o CSS
  const selectionRect = computed(() => {
    if (!selection.value) return null

    const { startX, startY, endX, endY } = selection.value
    const x = Math.min(startX, endX)
    const y = Math.min(startY, endY)
    const width = Math.abs(endX - startX) + 1
    const height = Math.abs(endY - startY) + 1

    const CELL_SIZE = 12 // Deve ser o mesmo valor do componente TheGrid

    return {
      left: x * CELL_SIZE,
      top: y * CELL_SIZE,
      width: width * CELL_SIZE,
      height: height * CELL_SIZE,
      blockX: x,
      blockY: y,
      blockWidth: width,
      blockHeight: height,
    }
  })

  // === ACTIONS ===
  // Esta função de verificação de área é usada pela interface da grade (TheGrid.vue)
  function isAreaOccupied(rect: { x: number; y: number; width: number; height: number }): boolean {
    const r1_x1 = rect.x,
      r1_x2 = rect.x + rect.width
    const r1_y1 = rect.y,
      r1_y2 = rect.y + rect.height

    for (const block of blocks.value) {
      const r2_x1 = block.x,
        r2_x2 = block.x + block.width
      const r2_y1 = block.y,
        r2_y2 = block.y + block.height
      if (r1_x1 < r2_x2 && r1_x2 > r2_x1 && r1_y1 < r2_y2 && r1_y2 > r2_y1) {
        return true // Sobreposição encontrada
      }
    }
    return false // Área livre
  }

  // Ações específicas para o modo "ARRASTAR"
  function startSelection(x: number, y: number) {
    isSelecting.value = true
    selection.value = { startX: x, startY: y, endX: x, endY: y }
  }

  function updateSelection(x: number, y: number) {
    if (!isSelecting.value || !selection.value) return
    selection.value.endX = x
    selection.value.endY = y
  }

  function endSelection() {
    isSelecting.value = false
  }

  function clearSelection() {
    selection.value = null
    isSelecting.value = false
  }

  // Ação de compra usa o 'selectionRect'
  function purchaseBlock(payload: { image: string; link: string; backgroundColor: string }) {
    const rect = selectionRect.value
    if (!rect) return

    const newBlock: Block = {
      id: nextBlockId.value++,
      x: rect.blockX,
      y: rect.blockY,
      width: rect.blockWidth,
      height: rect.blockHeight,
      image: payload.image,
      link: payload.link,
      backgroundColor: payload.backgroundColor,
      owner: 'Usuário Atual',
    }
    blocks.value.push(newBlock)
    clearSelection()
  }

  async function fetchBlocks() {
    isLoading.value = true
    await new Promise((resolve) => setTimeout(resolve, 300))
    blocks.value = [
      {
        id: 0,
        x: 2,
        y: 2,
        width: 4,
        height: 3,
        image: 'https://placehold.co/80x60/f03/fff?text=Vue.js',
        link: 'https://vuejs.org',
        owner: 'Vue',
        backgroundColor: '#9d021d',
      },
    ]
    isLoading.value = false
  }

  return {
    blocks,
    isLoading,
    isSelecting,
    selection,
    selectionRect, // <-- Exportando as propriedades corretas
    isAreaOccupied,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    purchaseBlock,
    fetchBlocks,
  }
})
