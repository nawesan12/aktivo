import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    // Only these hosts may be optimised. An image from anywhere else makes
    // `next/image` throw, which takes the whole page down with it — so the list
    // has to cover every source the product actually stores:
    //   *.public.blob…      uploads from the panel, via Vercel Blob
    //   res.cloudinary.com   uploads from before the move to Blob
    //   lh3 / avatars        profile pictures from Google and GitHub sign-in
    //
    // `images.unsplash.com` used to be here for the demo seed. It is gone: it
    // never appears in a real business's data, and leaving it open meant paying
    // to optimise arbitrary images from someone else's CDN.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    // Every distinct (source, width, quality) triple is a billed transformation
    // and a cache write. The defaults offer eight widths and any quality, so a
    // single logo could turn into dozens of them. These are the sizes the
    // interface actually asks for.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256],
    qualities: [75],
    // A month. The default is short, so the same image is re-optimised over and
    // over for no reason: an uploaded photo does not change behind its URL.
    minimumCacheTTL: 2678400,
  },
  /**
   * `www` va al ápex, que es el host sobre el que está construida la app:
   * `NEXT_PUBLIC_APP_URL` es el ápex, y de ahí salen los links de los emails, el
   * canonical y los `back_url` de MercadoPago. Con los dos hosts sirviendo lo
   * mismo, Google lo lee como contenido duplicado.
   *
   * Vive acá y no en el panel de Vercel porque así queda versionado y se revisa
   * como cualquier otro cambio. La redirección la resuelve la capa de ruteo, no
   * una función: no cuesta una invocación.
   */
  async redirects() {
    const apex = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://jikuapp.com").host;

    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: `www.${apex}` }],
        destination: `https://${apex}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/((?!widget/|embed/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
