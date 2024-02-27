<script>
	import MainActivitySection from '@/components/ui/dashboard/main-activity-section.svelte';
	import MainEarningsSection from '@/components/ui/dashboard/main-earnings-section.svelte';
	import MainEmployeesSection from '@/components/ui/dashboard/main-employees-section.svelte';
	import MainNavbar from '@/components/ui/dashboard/main-navbar.svelte';
	import MainSidebar from '@/components/ui/dashboard/main-sidebar.svelte';
	import MainStatisticsSection from '@/components/ui/dashboard/main-statistics-section.svelte';
	import MainTrackingSection from '@/components/ui/dashboard/main-tracking-section.svelte';
</script>

<MainSidebar />

<main class="w-full md:w-[calc(100%-256px)] md:ml-64 min-h-screen transition-all main">
	<MainNavbar />

	<div class="p-6">
		<MainTrackingSection />
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<MainEmployeesSection />
			<MainActivitySection />
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
			<MainStatisticsSection />
			<MainEarningsSection />
		</div>
	</div>
</main>
