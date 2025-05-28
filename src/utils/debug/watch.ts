declare global {
  interface Window {
    watch: (watching: () => unknown, every_ms: number) => void;
    watch_for: (watching: () => unknown, every_ms: number, turns: number) => void;
  }
}

window.watch = (watching, every) => {
  setTimeout(() => {
    watching();
    window.watch(watching, every);
  }, every);
};

window.watch_for = (watching, every, turns) => {
  setTimeout(() => {
    if(turns === 0) return;
    watching();
    window.watch_for(watching, every, turns - 1);
  }, every)
}
