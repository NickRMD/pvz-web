import Game from "./Game";

declare global {
  interface Window {
    induce_error: () => void;
  }
}

window.induce_error = () => {
  // setTimeout(() => {
  //   throw new Error("Induced error");
  // }, 0);
  // biome-ignore lint/suspicious/noExplicitAny: It has to use any for this
  (Game.prototype as any)._game_loop = () => {
    throw new Error("Error induced in game loop");
  };
};
