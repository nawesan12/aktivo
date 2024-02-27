<script>
	import Logo from '@/components/ui/dashboard/logo.svelte';
	import MainActivitySection from '@/components/ui/dashboard/main-activity-section.svelte';
	import MainEarningsSection from '@/components/ui/dashboard/main-earnings-section.svelte';
	import MainEmployeesSection from '@/components/ui/dashboard/main-employees-section.svelte';
	import MainStatisticsSection from '@/components/ui/dashboard/main-statistics-section.svelte';
	import MainTrackingSection from '@/components/ui/dashboard/main-tracking-section.svelte';
</script>

<div class="fixed left-0 top-0 w-64 h-full bg-[/f8f4f3] p-4 z-50 sidebar-menu transition-transform">
	<Logo />
	<ul class="mt-4">
		<span class="text-gray-400 font-bold">ADMIN</span>
		<li class="mb-1 group">
			<a
				href="/dashboard"
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
			>
				<i class="ri-home-2-line mr-3 text-lg"></i>
				<span class="text-sm">Inicio</span>
			</a>
		</li>
		<li class="mb-1 group">
			<a
				href="/dashboard/clients"
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100 sidebar-dropdown-toggle"
			>
				<i class="bx bx-user mr-3 text-lg"></i>
				<span class="text-sm">Clientes</span>
				<i class="ri-arrow-right-s-line ml-auto group-[.selected]:rotate-90"></i>
			</a>
			<ul class="pl-7 mt-2 hidden group-[.selected]:block">
				<li class="mb-4">
					<a
						href=""
						class="text-gray-900 text-sm flex items-center hover:text-[/f84525] before:contents-[''] before:w-1 before:h-1 before:rounded-full before:bg-gray-300 before:mr-3"
						>All</a
					>
				</li>
				<li class="mb-4">
					<a
						href=""
						class="text-gray-900 text-sm flex items-center hover:text-[/f84525] before:contents-[''] before:w-1 before:h-1 before:rounded-full before:bg-gray-300 before:mr-3"
						>Roles</a
					>
				</li>
			</ul>
		</li>
		<li class="mb-1 group">
			<a
				href=""
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
			>
				<i class="bx bx-list-ul mr-3 text-lg"></i>
				<span class="text-sm">Actividad</span>
			</a>
		</li>
		<span class="text-gray-400 font-bold">BLOG</span>
		<li class="mb-1 group">
			<a
				href=""
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100 sidebar-dropdown-toggle"
			>
				<i class="bx bxl-blogger mr-3 text-lg"></i>
				<span class="text-sm">Post</span>
				<i class="ri-arrow-right-s-line ml-auto group-[.selected]:rotate-90"></i>
			</a>
			<ul class="pl-7 mt-2 hidden group-[.selected]:block">
				<li class="mb-4">
					<a
						href=""
						class="text-gray-900 text-sm flex items-center hover:text-[/f84525] before:contents-[''] before:w-1 before:h-1 before:rounded-full before:bg-gray-300 before:mr-3"
						>All</a
					>
				</li>
				<li class="mb-4">
					<a
						href=""
						class="text-gray-900 text-sm flex items-center hover:text-[/f84525] before:contents-[''] before:w-1 before:h-1 before:rounded-full before:bg-gray-300 before:mr-3"
						>Categories</a
					>
				</li>
			</ul>
		</li>
		<li class="mb-1 group">
			<a
				href=""
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
			>
				<i class="bx bx-archive mr-3 text-lg"></i>
				<span class="text-sm">Archive</span>
			</a>
		</li>
		<span class="text-gray-400 font-bold">PERSONAL</span>
		<li class="mb-1 group">
			<a
				href=""
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
			>
				<i class="bx bx-bell mr-3 text-lg"></i>
				<span class="text-sm">Notifications</span>
				<span
					class=" md:block px-2 py-0.5 ml-auto text-xs font-medium tracking-wide text-red-600 bg-red-200 rounded-full"
					>5</span
				>
			</a>
		</li>
		<li class="mb-1 group">
			<a
				href=""
				class="flex font-semibold items-center py-2 px-4 text-gray-900 hover:bg-gray-950 hover:text-gray-100 rounded-md group-[.active]:bg-gray-800 group-[.active]:text-white group-[.selected]:bg-gray-950 group-[.selected]:text-gray-100"
			>
				<i class="bx bx-envelope mr-3 text-lg"></i>
				<span class="text-sm">Messages</span>
				<span
					class=" md:block px-2 py-0.5 ml-auto text-xs font-medium tracking-wide text-green-600 bg-green-200 rounded-full"
					>2 New</span
				>
			</a>
		</li>
	</ul>
</div>
<div class="fixed top-0 left-0 w-full h-full bg-black/50 z-40 md:hidden sidebar-overlay"></div>
<!-- end sidenav -->

<main class="w-full md:w-[calc(100%-256px)] md:ml-64 min-h-screen transition-all main">
	<!-- navbar -->
	<div
		class="py-2 px-6 bg-[/f8f4f3] flex items-center shadow-md shadow-black/5 sticky top-0 left-0 z-30"
	>
		<ul class="ml-auto flex items-center">
			<li class="dropdown ml-3">
				<button class="dropdown-toggle flex items-center">
					<div class="flex-shrink-0 w-10 h-10 relative">
						<div class="p-1 bg-white rounded-full focus:outline-none focus:ring">
							<img
								class="w-8 h-8 rounded-full"
								src="https://laravelui.spruko.com/tailwind/ynex/build/assets/images/faces/9.jpg"
								alt=""
							/>
							<div
								class="top-0 left-7 absolute w-3 h-3 bg-lime-400 border-2 border-white rounded-full animate-ping"
							></div>
							<div
								class="top-0 left-7 absolute w-3 h-3 bg-lime-500 border-2 border-white rounded-full"
							></div>
						</div>
					</div>
					<div class="p-2 md:block text-left">
						<h2 class="text-sm font-semibold text-gray-800">John Doe</h2>
						<p class="text-xs text-gray-500">Administrator</p>
					</div>
				</button>
				<ul
					class="dropdown-menu shadow-md shadow-black/5 z-30 hidden py-1.5 rounded-md bg-white border border-gray-100 w-full max-w-[140px]"
				>
					<li>
						<a
							href="/"
							class="flex items-center text-[13px] py-1.5 px-4 text-gray-600 hover:text-[/f84525] hover:bg-gray-50"
							>Profile</a
						>
					</li>
					<li>
						<a
							href="/"
							class="flex items-center text-[13px] py-1.5 px-4 text-gray-600 hover:text-[/f84525] hover:bg-gray-50"
							>Settings</a
						>
					</li>
					<li>
						<form method="POST" action="">
							<a
								role="menuitem"
								class="flex items-center text-[13px] py-1.5 px-4 text-gray-600 hover:text-[/f84525] hover:bg-gray-50 cursor-pointer"
							>
								Log Out
							</a>
						</form>
					</li>
				</ul>
			</li>
		</ul>
	</div>
	<!-- end navbar -->

	<!-- Content -->
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
