<template>
  <div
    class="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex gap-2 items-center"
    style="bottom: calc(100% + 6px); left: 0"
    v-click-outside="() => $emit('cancel')"
  >
    <template v-if="mode === 'delete'">
      <span class="text-sm text-gray-600">Delete this row?</span>
      <button @click="$emit('confirm')" class="btn-danger">Delete</button>
      <button @click="$emit('cancel')" class="btn-ghost">Cancel</button>
    </template>
    <template v-else>
      <button @click="$emit('confirm')" class="btn-primary">Save</button>
      <button @click="$emit('cancel')" class="btn-ghost">Cancel</button>
    </template>
  </div>
</template>

<script setup>
defineProps({ mode: { type: String, default: 'save' } })
defineEmits(['confirm', 'cancel'])

// v-click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = e => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('mousedown', el._clickOutside) }
}
</script>

<style scoped>
.btn-primary { @apply px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700; }
.btn-danger  { @apply px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700; }
.btn-ghost   { @apply px-3 py-1 text-sm text-gray-600 hover:text-gray-900; }
</style>
