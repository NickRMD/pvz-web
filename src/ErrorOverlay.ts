import type Game from "./Game";
import Signal from "./utils/Signal";

class ErrorOverlay {
  private _errors = new Signal([] as string[]);

  constructor(game: Game) {
    window.onerror = (message, source, lineno, colno, _error) => {
      game.error_pause();
      this._errors.mutate((e) =>
        e.push(`Error: ${message}\nFile: ${source}:${lineno}:${colno}`),
      );
    };

    window.onunhandledrejection = (event) => {
      game.error_pause();
      this._errors.mutate((e) =>
        e.push(`Unhandled Promise Rejection: ${event.reason}`),
      );
    };

    this._errors.subscribe((errors) => {
      if (errors.length === 0) return;
      let overlay = document.getElementById("errorOverlay");
      if (!overlay) {
        overlay = ErrorOverlay.showErrorOverlay();
      }

      overlay.innerHTML = "";

      const closeErrorButton = document.createElement("button");

      closeErrorButton.textContent = "Close";

      closeErrorButton.addEventListener("click", () => overlay.remove());

      overlay.appendChild(closeErrorButton);

      for (const error of errors) {
        const errorMessage = document.createElement("div");
        errorMessage.textContent = error;
        overlay.appendChild(errorMessage);
      }

      // overlay.textContent = message;
    });
  }

  public static showErrorOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "errorOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    overlay.style.color = "white";
    overlay.style.fontFamily = "monospace";
    overlay.style.padding = "20px";
    overlay.style.zIndex = "10000";
    overlay.style.whiteSpace = "pre-wrap";

    document.body.appendChild(overlay);

    return overlay;
  }
}

export default ErrorOverlay;
