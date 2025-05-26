import Game from "../../Game";

declare global {
  interface Window {
    induce_error_in_loop: () => void;
    induce_error: () => void;
  }
}

let number_of_induced_errors = 0;

window.induce_error_in_loop = () => {
  // biome-ignore lint/suspicious/noExplicitAny: It has to use any for this
  (Game.prototype as any)._game_loop = () => {
    throw new Error("Error induced in game loop");
  };
};

window.induce_error = () => {
  setTimeout(() => {
    number_of_induced_errors++;
    throw new Error(`Induced error ${number_of_induced_errors} times`);
  }, 0);
}
