/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The warm-editorial page (flipcheck-landing.vercel.app) is the ONE public landing.
  // This app now serves only the product: /scan, /account, /auth, /api/*.
  // Temporary (307) so it's reversible; query strings (e.g. ?ref=) pass through.
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://flipcheck-landing.vercel.app',
        permanent: false,
      },
    ];
  },
};
