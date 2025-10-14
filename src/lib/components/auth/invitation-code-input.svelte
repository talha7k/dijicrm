<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { tick } from 'svelte';

  let { code = $bindable(''), error = null, loading = false, placeholder = 'Enter invitation code' } = $props();

  const dispatch = createEventDispatcher<{
    validate: { code: string };
    codeChange: { code: string };
  }>();

  let inputElement: HTMLInputElement;

  async function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    code = target.value.toUpperCase(); // Normalize to uppercase
    dispatch('codeChange', { code });

    // Auto-validate when code reaches expected length
    if (code.length === 8) { // Assuming 8-character codes
      await tick();
      dispatch('validate', { code });
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (code.trim()) {
      dispatch('validate', { code });
    }
  }

  export function focus() {
    inputElement?.focus();
  }
</script>

<form on:submit={handleSubmit} class="invitation-code-input">
  <label for="invitation-code" class="block text-sm font-medium text-gray-700 mb-2">
    Invitation Code
  </label>

  <div class="relative">
    <input
      bind:this={inputElement}
      id="invitation-code"
      type="text"
      {placeholder}
      value={code}
      on:input={handleInput}
      disabled={loading}
      maxlength="12"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase tracking-wider font-mono text-center text-lg {error ? 'border-red-300' : ''}"
      style="letter-spacing: 0.5em;"
    />

    {#if loading}
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    {/if}
  </div>

  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {:else}
    <p class="mt-1 text-sm text-gray-500">
      Enter the invitation code provided by your company administrator.
    </p>
  {/if}

  <button
    type="submit"
    disabled={!code.trim() || loading}
    class="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {#if loading}
      Validating...
    {:else}
      Validate Code
    {/if}
  </button>
</form>

<style>
  .invitation-code-input input::placeholder {
    letter-spacing: normal;
    font-family: inherit;
  }
</style>