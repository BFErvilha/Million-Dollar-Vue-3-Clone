<template>
  <div class="modal-overlay" @click.self="cancel">
    <div class="modal-content" v-if="rect">
      <h2>Comprar Bloco</h2>
      <p class="dimensions">
        Dimensões da Seleção: <strong>{{ rect.blockWidth }} x {{ rect.blockHeight }}</strong> pixels
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="link">Link de Redirecionamento:</label>
          <input id="link" v-model="link" type="url" placeholder="https://exemplo.com" required />
        </div>
        <div class="form-group">
          <label for="image">Imagem (será ajustada ao espaço):</label>
          <input id="image" type="file" @change="handleImageUpload" accept="image/*" required />
        </div>

        <div v-if="imagePreview" class="image-preview-wrapper">
          <p>Prévia:</p>
          <div class="image-preview" :style="{ backgroundColor: detectedColor }">
            <img :src="imagePreview" alt="Prévia da imagem" />
          </div>
        </div>

        <div class="actions">
          <button type="button" @click="cancel" class="btn-cancel">Cancelar</button>
          <button type="submit" class="btn-submit" :disabled="!isFormValid">
            Confirmar Compra
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGridStore } from '@/stores/gridStore'
import { computed, ref } from 'vue'
import ColorThief from 'color-thief-ts'

const emit = defineEmits(['close'])
const gridStore = useGridStore()

// --- CORREÇÃO PRINCIPAL AQUI ---
// Trocamos 'selectionBoundingBox' por 'selectionRect', que é o getter correto agora.
const { selectionRect: rect } = gridStore

// O resto do script permanece exatamente o mesmo.
const link = ref('')
const imagePreview = ref<string | null>(null)
const imageData = ref<string | null>(null)
const detectedColor = ref<string>('#f0f0f0')

const isFormValid = computed(() => link.value && imageData.value)

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  imagePreview.value = URL.createObjectURL(file)
  const reader = new FileReader()
  reader.onload = (e) => {
    imageData.value = e.target?.result as string
    const image = new Image()
    image.onload = async () => {
      const colorThief = new ColorThief()
      const dominantColor = await colorThief.getColor(image)
      detectedColor.value = `rgb(${dominantColor.join(',')})`
    }
    image.src = imageData.value
  }
  reader.readAsDataURL(file)
}

function handleSubmit() {
  if (!isFormValid.value) return
  gridStore.purchaseBlock({
    link: link.value,
    image: imageData.value!,
    backgroundColor: detectedColor.value,
  })
  emit('close')
}

// A função cancel já estava correta, chamando clearSelection.
function cancel() {
  gridStore.clearSelection()
  emit('close')
}
</script>

<style scoped>
/* Os estilos podem ser mantidos, a classe .warning não será mais usada mas não prejudica */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
.dimensions {
  margin-top: 0;
  font-weight: 500;
  margin-bottom: 1.5rem;
}
.form-group {
  margin: 1.5rem 0;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.image-preview-wrapper {
  margin-top: 1rem;
}
.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ddd;
  min-height: 150px;
  transition: background-color 0.3s;
  padding: 0.5rem;
  border-radius: 4px;
}
.image-preview img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
}
.actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-cancel {
  background-color: #eee;
  color: #333;
}
.btn-submit {
  background-color: #2c7be5;
  color: white;
}
.btn-submit:disabled {
  background-color: #a3c1ea;
  cursor: not-allowed;
}
</style>
