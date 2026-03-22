export default {
  base: './', // Crucial for hosting on CrazyGames, Itch.io, Kongregate, and GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
}