<template>
  <div
    v-click-outside="() => $emit('cancel')"
    class="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex gap-2 items-center"
    style="bottom: calc(100% + 6px); left: 0"
  >
    <template v-if="mode === 'delete'">
      <span class="text-sm text-gray-600">Delete this row?</span>
      <Button label="Delete" severity="danger" size="small" @click="$emit('confirm')" />
      <Button label="Cancel" variant="text" severity="secondary" size="small" @click="$emit('cancel')" />
    </template>
    <template v-else>
      <Button label="Save" size="small" @click="$emit('confirm')" />
      <Button label="Cancel" variant="text" severity="secondary" size="small" @click="$emit('cancel')" />
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps({ mode: { type: String, default: 'save' } })
defineEmits(['confirm', 'cancel'])

interface ClickOutsideEl extends HTMLElement {
  _clickOutside?: (e: MouseEvent) => void
}

const vClickOutside = {
  mounted(el: ClickOutsideEl, binding: { value: (e: MouseEvent) => void }) {
    el._clickOutside = (e: MouseEvent) => { if (!el.contains(e.target as Node)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el: ClickOutsideEl) {
    if (el._clickOutside) document.removeEventListener('mousedown', el._clickOutside)
  },
}
</script>

