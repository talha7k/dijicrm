<!--
	ProgressDialog Component - Modal with progress bar and live log viewer

	Features:
		- Progress bar showing completion percentage
		- Live log viewer with auto-scrolling
		- Status icons for different log levels
		- Auto-close behavior with completion message
		- Uses theme colors for consistency

	Usage:
		<ProgressDialog
			open={showProgress}
			title="Sending Documents"
			progress={progressValue}
			logs={logEntries}
			onClose={() => showProgress = false}
		/>
-->
<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import XCircleIcon from "@lucide/svelte/icons/x-circle";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
	import InfoIcon from "@lucide/svelte/icons/info";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";

	interface LogEntry {
		id: string;
		message: string;
		level: 'info' | 'success' | 'warning' | 'error';
		timestamp: Date;
	}

	interface Props {
		open: boolean;
		title: string;
		progress?: number;
		logs: LogEntry[];
		isComplete?: boolean;
		completionMessage?: string;
		onClose?: () => void;
		class?: string;
	}

	let {
		open,
		title,
		progress = 0,
		logs,
		isComplete = false,
		completionMessage = "Process completed successfully!",
		onClose,
		class: className
	}: Props = $props();

 	// Auto-scroll to bottom when new logs are added
	let logContainer: HTMLElement;
	$effect(() => {
		if (logContainer && logs.length > 0) {
			logContainer.scrollTop = logContainer.scrollHeight;
		}
	});

	const getLogIcon = (level: LogEntry['level']) => {
		switch (level) {
			case 'success':
				return CheckCircleIcon;
			case 'error':
				return XCircleIcon;
			case 'warning':
				return AlertCircleIcon;
			default:
				return InfoIcon;
		}
	};

	const getLogColor = (level: LogEntry['level']) => {
		switch (level) {
			case 'success':
				return 'text-green-600';
			case 'error':
				return 'text-destructive';
			case 'warning':
				return 'text-yellow-600';
			default:
				return 'text-primary';
		}
	};
</script>

<Dialog.Root {open} onOpenChange={onClose}>
	<Dialog.Content class={cn("max-w-2xl max-h-[80vh]", className)}>
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if isComplete}
					<CheckCircleIcon class="h-5 w-5 text-green-600" />
				{:else}
					<Loader2Icon class="h-5 w-5 animate-spin text-primary" />
				{/if}
				{title}
			</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4">
			{#if !isComplete}
				<div class="space-y-2">
					<div class="flex justify-between text-sm text-muted-foreground">
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<Progress value={progress} max={100} />
				</div>
			{/if}

			<div class="space-y-2">
				<h4 class="text-sm font-medium">Activity Log</h4>
				<div class="h-64 w-full rounded-md border p-4 overflow-y-auto overflow-x-hidden">
					<div bind:this={logContainer} class="space-y-2">
						{#each logs as log (log.id)}
							<div class="flex items-start gap-2 text-sm">
								{#if log.level === 'success'}
									<CheckCircleIcon class={cn("h-4 w-4 mt-0.5 flex-shrink-0", getLogColor(log.level))} />
								{:else if log.level === 'error'}
									<XCircleIcon class={cn("h-4 w-4 mt-0.5 flex-shrink-0", getLogColor(log.level))} />
								{:else if log.level === 'warning'}
									<AlertCircleIcon class={cn("h-4 w-4 mt-0.5 flex-shrink-0", getLogColor(log.level))} />
								{:else}
									<InfoIcon class={cn("h-4 w-4 mt-0.5 flex-shrink-0", getLogColor(log.level))} />
								{/if}
								<div class="flex-1">
									<span class="text-muted-foreground">
										{log.timestamp.toLocaleTimeString()}
									</span>
									<span class="ml-2">{log.message}</span>
								</div>
							</div>
						{/each}
						{#if logs.length === 0}
							<div class="text-sm text-muted-foreground italic">
								Waiting for activity...
							</div>
						{/if}
					</div>
				</div>
			</div>

			{#if isComplete}
				<div class="rounded-md bg-muted/50 p-4">
					<div class="flex items-center gap-2">
						<CheckCircleIcon class="h-5 w-5 text-green-600" />
						<div class="flex-1">
							<span class="text-sm font-medium text-foreground">
								{completionMessage}
							</span>
							<p class="text-xs text-muted-foreground mt-1">
								Keep this dialog open to monitor delivery status updates (up to 5 minutes).
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			{#if isComplete}
				<Button onclick={onClose}>
					Close
				</Button>
			{:else}
				<Button variant="outline" onclick={onClose}>
					Cancel
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>