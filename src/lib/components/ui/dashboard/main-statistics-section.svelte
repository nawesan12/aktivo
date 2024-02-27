<div class="bg-white border border-gray-100 shadow-md shadow-black/5 p-6 rounded-md lg:col-span-2">
	<div class="flex justify-between mb-4 items-start">
		<div class="font-medium">Order Statistics</div>
		<div class="dropdown">
			<button class="dropdown-toggle text-gray-400 hover:text-gray-600"
				><i class="ri-more-fill"></i></button
			>
			<ul
				class="dropdown-menu shadow-md shadow-black/5 z-30 hidden py-1.5 rounded-md bg-white border border-gray-100 w-full max-w-[140px]"
			>
				<li>
					<a
						href="/"
						class="flex items-center text-[13px] py-1.5 px-4 text-gray-600 hover:text-blue-500 hover:bg-gray-50"
						>Profile</a
					>
				</li>
				<li>
					<a
						href="/"
						class="flex items-center text-[13px] py-1.5 px-4 text-gray-600 hover:text-blue-500 hover:bg-gray-50"
						>Settings</a
					>
				</li>
				<li>
					<a
						href="/"
						class="flex items-center text-[13px] py-1.5 px-4 text-gray-600 hover:text-blue-500 hover:bg-gray-50"
						>Logout</a
					>
				</li>
			</ul>
		</div>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
		<div class="rounded-md border border-dashed border-gray-200 p-4">
			<div class="flex items-center mb-0.5">
				<div class="text-xl font-semibold">10</div>
				<span
					class="p-1 rounded text-[12px] font-semibold bg-blue-500/10 text-blue-500 leading-none ml-1"
					>$80</span
				>
			</div>
			<span class="text-gray-400 text-sm">Active</span>
		</div>
		<div class="rounded-md border border-dashed border-gray-200 p-4">
			<div class="flex items-center mb-0.5">
				<div class="text-xl font-semibold">50</div>
				<span
					class="p-1 rounded text-[12px] font-semibold bg-emerald-500/10 text-emerald-500 leading-none ml-1"
					>+$469</span
				>
			</div>
			<span class="text-gray-400 text-sm">Completed</span>
		</div>
		<div class="rounded-md border border-dashed border-gray-200 p-4">
			<div class="flex items-center mb-0.5">
				<div class="text-xl font-semibold">4</div>
				<span
					class="p-1 rounded text-[12px] font-semibold bg-rose-500/10 text-rose-500 leading-none ml-1"
					>-$130</span
				>
			</div>
			<span class="text-gray-400 text-sm">Canceled</span>
		</div>
	</div>
	<div>
		<canvas id="order-chart"></canvas>
	</div>
</div>
