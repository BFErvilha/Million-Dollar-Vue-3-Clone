<template>
  <div class="grid-wrapper">
    <div class="header">
      <h1>Million Dollar Vue 3 Clone</h1>
      <div class="checkout-area">
        <span>
          {{
            gridStore.selectionRect
              ? `${gridStore.selectionRect.blockWidth} x ${gridStore.selectionRect.blockHeight}`
              : 'Nenhuma área'
          }}
          selecionada
        </span>
        <button @click="openCheckout" :disabled="!gridStore.selectionRect || isSelectionTooSmall">
          Fechar Compra
        </button>
      </div>
    </div>
    <p class="instructions">Clique e arraste na grade para selecionar uma área.</p>

    <div v-if="gridStore.isLoading" class="loading">Carregando...</div>

    <div
      v-else
      ref="scrollElement"
      class="grid-container"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div
        :style="{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }"
      >
        <template v-for="virtualRow in rowVirtualizer.getVirtualItems()" :key="virtualRow.key">
          <template
            v-for="virtualColumn in columnVirtualizer.getVirtualItems()"
            :key="virtualColumn.key"
          >
            <div
              class="cell"
              :style="{
                position: 'absolute',
                top: `${virtualRow.start}px`,
                left: `${virtualColumn.start}px`,
                width: `${virtualColumn.size}px`,
                height: `${virtualRow.size}px`,
              }"
            ></div>
          </template>
        </template>

        <a
          v-for="block in gridStore.blocks"
          :key="block.id"
          :href="block.link"
          target="_blank"
          rel="noopener noreferrer"
          class="purchased-block"
          :style="{
            position: 'absolute',
            left: `${block.x * CELL_SIZE}px`,
            top: `${block.y * CELL_SIZE}px`,
            width: `${block.width * CELL_SIZE}px`,
            height: `${block.height * CELL_SIZE}px`,
            '--block-bg-color': block.backgroundColor || '#f0f0f0',
            backgroundImage: `url(${block.image})`,
          }"
        ></a>

        <div
          v-if="gridStore.selectionRect"
          class="selection-box"
          :style="{
            position: 'absolute',
            left: `${gridStore.selectionRect.left}px`,
            top: `${gridStore.selectionRect.top}px`,
            width: `${gridStore.selectionRect.width}px`,
            height: `${gridStore.selectionRect.height}px`,
          }"
        ></div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <PurchaseForm v-if="showPurchaseForm" @close="showPurchaseForm = false" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue' // Adicionado 'computed'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useGridStore } from '@/stores/gridStore'
import PurchaseForm from '@/components/purchase-form/PurchaseForm.vue'

const CELL_SIZE = 12
const GRID_ROWS = 100
const GRID_COLS = 100

const gridStore = useGridStore()
const scrollElement = ref<HTMLElement | null>(null)
const showPurchaseForm = ref(false)

// NOVA PROPRIEDADE COMPUTADA: para simplificar a lógica do botão 'disabled'
const isSelectionTooSmall = computed(() => {
  const selection = gridStore.selectionRect
  if (!selection) return true
  return selection.blockWidth <= 1 && selection.blockHeight <= 1
})

const rowVirtualizer = useVirtualizer({
  count: GRID_ROWS,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => CELL_SIZE,
  overscan: 5,
})
const columnVirtualizer = useVirtualizer({
  horizontal: true,
  count: GRID_COLS,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => CELL_SIZE,
  overscan: 5,
})

function getCoordsFromEvent(e: MouseEvent): { x: number; y: number } | null {
  if (!scrollElement.value) return null
  const rect = scrollElement.value.getBoundingClientRect()
  const scrollLeft = scrollElement.value.scrollLeft
  const scrollTop = scrollElement.value.scrollTop
  const mouseX = e.clientX - rect.left + scrollLeft
  const mouseY = e.clientY - rect.top + scrollTop
  const col = Math.floor(mouseX / CELL_SIZE)
  const row = Math.floor(mouseY / CELL_SIZE)
  return { x: col, y: row }
}

// Lógica de arrastar
function handleMouseDown(e: MouseEvent) {
  const coords = getCoordsFromEvent(e)
  if (coords) {
    gridStore.startSelection(coords.x, coords.y)
  }
}

function handleMouseMove(e: MouseEvent) {
  if (gridStore.isSelecting) {
    const coords = getCoordsFromEvent(e)
    if (coords) {
      gridStore.updateSelection(coords.x, coords.y)
    }
  }
}

// A função handleMouseUp agora só precisa se preocupar em parar a seleção.
// A validação de sobreposição foi movida para a função que abre o modal.
function handleMouseUp() {
  if (!gridStore.isSelecting) return
  gridStore.endSelection()
}

// NOVA FUNÇÃO para o botão, que agora contém a lógica de validação.
function openCheckout() {
  const selection = gridStore.selectionRect

  // 1. Verifica se existe uma seleção e se não é muito pequena
  if (!selection || (selection.blockWidth <= 1 && selection.blockHeight <= 1)) {
    alert('Por favor, selecione uma área maior que 1x1 pixel.')
    gridStore.clearSelection()
    return
  }

  // 2. Faz a verificação de sobreposição AQUI.
  const areaIsOccupied = gridStore.isAreaOccupied({
    x: selection.blockX,
    y: selection.blockY,
    width: selection.blockWidth,
    height: selection.blockHeight,
  })

  if (areaIsOccupied) {
    alert(
      'Erro: A área selecionada se sobrepõe a um bloco já existente. Por favor, selecione outra área.',
    )
    gridStore.clearSelection()
  } else {
    // 3. Se tudo estiver ok, abre o formulário
    showPurchaseForm.value = true
  }
}

onMounted(() => {
  gridStore.fetchBlocks()
})
</script>

<style scoped>
.grid-wrapper {
  font-family: sans-serif;
  text-align: center;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
/* Estilos para o novo cabeçalho */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 70vw;
  margin: 0 auto 1rem auto;
}
.header h1 {
  margin: 0;
  font-size: 1.5rem;
}
.checkout-area {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}
.checkout-area span {
  font-weight: 500;
  color: #333;
  min-width: 150px; /* Garante que o layout não quebre */
  text-align: center;
}
.checkout-area button {
  padding: 0.75rem 1.5rem;
  background-color: #28a745; /* Cor verde para 'comprar' */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.checkout-area button:hover:not(:disabled) {
  background-color: #218838;
}
.checkout-area button:disabled {
  background-color: #a3d9b1;
  cursor: not-allowed;
}
.instructions {
  margin-bottom: 1rem;
  color: #555;
  width: 70vw;
  margin: 0 auto 1rem auto;
  text-align: left;
}
.grid-container {
  height: 70vh;
  width: 70vw;
  overflow: auto;
  border: 2px solid #ccc;
  position: relative;
  cursor: crosshair;
}
.cell {
  background-color: #f0f0f0;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  box-sizing: border-box;
}
.selection-box {
  background-color: rgba(44, 123, 229, 0.4);
  border: 1px dashed #2c7be5;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 10;
}
.purchased-block {
  background-color: var(--block-bg-color, '#f0f0f0');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 5;
  display: block;
  position: relative;
  overflow: hidden;
}
.purchased-block::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s ease;
}
.purchased-block:hover::after {
  background-color: rgba(0, 0, 0, 0);
}
</style>
