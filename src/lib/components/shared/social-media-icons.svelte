<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import { socialLinks } from '../../../config';
	import Icon from '@iconify/svelte';

	const iconifyIcons: Record<string, string> = {
		twitter: 'mdi:twitter',
		github: 'mdi:github',
		facebook: 'mdi:facebook',
		instagram: 'mdi:instagram',
		linkedin: 'mdi:linkedin',
		youtube: 'mdi:youtube',
		tiktok: 'mdi:tiktok',
		snapchat: 'mdi:snapchat',
	};
</script>

<!-- Social Icons -->
<div class="flex">
	{#each socialLinks as { title, url, icon }}
		<Button
			size="icon"
			variant="ghost"
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={title}
		>
			<Icon icon={iconifyIcons[icon]} class="size-3.5 shrink-0" />
		</Button>
	{/each}
</div>

<!-- End Social Icons -->


