/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	serverExternalPackages: ['jspdf', 'fflate', 'soap', 'node-forge'],
	turbopack: {}, // Configuración vacía para evitar problemas
	webpack: (config, { isServer }) => {
		// Ignorar módulos problemáticos en el cliente
		if (!isServer) {
			config.resolve.alias = {
				...config.resolve.alias,
				jspdf: false,
				fflate: false,
				soap: false,
				'node-forge': false,
			};

			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
				crypto: false,
			};
		}

		return config;
	},
};

export default nextConfig;
