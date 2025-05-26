declare global {
  interface Window {
    watch: (watching: () => unknown, every_ms: number) => void
  }
}

window.watch = (watching, every) => {
  setTimeout(() => {
    watching();
    window.watch(watching, every);
  }, every)
}
