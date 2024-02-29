// If user in local storage
<section class="bg-white dark:bg-gray-900">
	<div class="container flex flex-col items-center justify-center min-h-screen px-6 mx-auto">
		<div class="flex justify-center mx-auto">
			<img class="w-auto h-7 sm:h-8" src="https://merakiui.com/images/logo.svg" alt="" />
		</div>

		<h1
			class="mt-4 text-2xl font-semibold tracking-wide text-center text-gray-800 capitalize md:text-3xl dark:text-white"
		>
			Bienvenido de vuelta
		</h1>

		<div class="flex items-center mt-6">
			<p class="text-gray-500 dark:text-gray-400">entrar como</p>

			<div class="flex items-center mx-2">
				<img
					class="object-cover w-8 h-8 mx-1 rounded-full"
					src="https://images.unsplash.com/photo-1628890923662-2cb23c2e0cfe?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
					alt=""
				/>
				<span class="mx-1 text-gray-800 dark:text-white">Tomas Gorosito</span>
			</div>

			<button class="text-blue-500 dark:text-blue-400 focus:outline-none hover:underline"
				>cambiar</button
			>
		</div>

		<div class="w-full max-w-md mx-auto mt-6">
			<form>
				<div>
					<label for="" class="block mb-2 text-sm text-gray-600 dark:text-gray-200"
						>Contraseña</label
					>
					<input
						type="password"
						placeholder="Ingresa tu contraseña"
						class="block w-full px-5 py-3 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:placeholder-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-blue-400 focus:outline-none focus:ring focus:ring-opacity-40"
					/>
				</div>

				<a href="/" class="inline-block mt-4 text-blue-500 hover:underline dark:text-blue-400">
					Olvidaste tu contraseña?
				</a>

				<button
					class="w-full px-6 py-3 mt-4 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50"
				>
					Continuar
				</button>

				<div class="mt-6 text-center">
					<a
						href="/create-account"
						class="text-sm text-blue-500 hover:underline dark:text-blue-400"
					>
						No tenes cuenta aun? Registrate
					</a>
				</div>

				<p class="mt-6 text-gray-500 dark:text-gray-400">
					By clicking “Continue” above, you acknowledge that you have read and understood, and agree
					to Our <a href="/terms-and-conditions" class="text-gray-700 dark:text-white"
						>Term & Conditions</a
					>
					and<a href="/" class="text-gray-700 dark:text-white"> Privacy Policy.</a>
				</p>
			</form>
		</div>
	</div>
</section>

// !

<section class="bg-white dark:bg-gray-900">
	<div class="container flex items-center justify-center min-h-screen px-6 mx-auto">
		<form class="w-full max-w-md">
			<img class="w-auto h-7 sm:h-8" src="https://merakiui.com/images/logo.svg" alt="" />

			<h1 class="mt-3 text-2xl font-semibold text-gray-800 capitalize sm:text-3xl dark:text-white">
				Acceder
			</h1>

			<div class="relative flex items-center mt-8">
				<span class="absolute">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</span>

				<input
					type="email"
					class="block w-full py-3 text-gray-700 bg-white border rounded-lg px-11 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
					placeholder="Email"
				/>
			</div>

			<div class="relative flex items-center mt-4">
				<span class="absolute">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				</span>

				<input
					type="password"
					class="block w-full px-10 py-3 text-gray-700 bg-white border rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
					placeholder="Ingresa tu contraseña"
				/>
			</div>

			<div class="mt-6">
				<button
					class="w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50"
				>
					Acceder
				</button>

				<p class="mt-4 text-center text-gray-600 dark:text-gray-400">o inicia sesion con</p>

				<a
					href="/"
					class="flex items-center justify-center px-6 py-3 mt-4 text-gray-600 transition-colors duration-300 transform border rounded-lg dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
				>
					<svg class="w-6 h-6 mx-2" viewBox="0 0 40 40">
						<path
							d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
							fill="#FFC107"
						/>
						<path
							d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z"
							fill="#FF3D00"
						/>
						<path
							d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z"
							fill="#4CAF50"
						/>
						<path
							d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z"
							fill="#1976D2"
						/>
					</svg>

					<span class="mx-2">Iniciar sesion con Google</span>
				</a>

				<div class="mt-6 text-center">
					<a
						href="/create-account"
						class="text-sm text-blue-500 hover:underline dark:text-blue-400"
					>
						Aun no tenes cuenta? Registrate
					</a>
				</div>
			</div>
		</form>
	</div>
</section>
