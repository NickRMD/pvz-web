import type Game from "./Game";
import get_position_in_ts, { map_stack_trace } from "./utils/getPositionInTS";
import Signal from "./utils/Signal";

class ErrorOverlay {
  private _errors = [] as string[];
  private _overlay: HTMLDivElement = this._create_error_overlay();
  private _changed = new Signal(false);
  private _loaded = false;
  private _game: Game;
  private _errorQueue = Promise.resolve();

  constructor(game: Game) {
    this._game = game;

    window.onerror = this._on_error.bind(this);
    window.onunhandledrejection = this._on_unhandled_rejection.bind(this);

    this._changed.subscribe(() => {
      this._show_error_overlay(this._errors);
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === ";") this._show_error_overlay(undefined, true);
    });

    this._loaded = true;
  }

  private async _on_unhandled_rejection(event: PromiseRejectionEvent) {
    if (event.reason instanceof Error && window.onerror) {
      window.onerror(
        event.reason.message,
        undefined,
        undefined,
        undefined,
        event.reason,
      );
    } else {
      this._game.error_pause();
      this._errors.push(`Unhandled Promise Rejection: ${event.reason}`);
      this._changed.value = true;
    }
  }

  private async _on_error(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ) {
    this._errorQueue = this._errorQueue.then(async () => {
      this._game.error_pause();

      if (error?.stack && !import.meta.env.DEV) {
        const stackLine = error.stack.split("\n")[1];
        const match = stackLine.match(/:(\d+):(\d+)\)?$/);
        if (match) {
          const [_, jsLine, jsColumn] = match.map(Number);
          const pos = await get_position_in_ts(
            jsLine,
            jsColumn,
            import.meta.url,
          );

          this._errors.push("Loading stack trace");
          this._changed.value = true;
          const stack_trace = (await map_stack_trace(error, import.meta.url))
            .map((frame) =>
              frame.source
                ? `at ${frame.name || "<anonymous>"} (${frame.source}:${frame.line}:${frame.column})`
                : frame.originalFrame || "<unknown>",
            )
            .join("\n");
          this._errors.pop();
          this._errors.push(
            `${message}\nFile: ${pos.source}:${pos.line}:${pos.column}, Stack:\n${stack_trace}`,
          );
        }
      } else {
        this._errors.push(
          `${message}\nFile: ${source}:${lineno}:${colno}, Stack:\n${error?.stack}`,
        );
      }
      this._changed.value = true;
    });

    return this._errorQueue;
  }

  private _show_error_overlay(errors?: Readonly<string[]>, force_open = false) {
    if (errors && errors.length === 0 && !force_open && !this._loaded) return;

    if (force_open && this._overlay.style.display === "block") {
      this._overlay.style.display = "none";
    } else if (this._overlay.style.display === "none") {
      this._overlay.style.display = "block";
    }

    if (this._changed.value && errors) {
      console.log("Rerendered");

      let errorContainer = this._overlay.querySelector(
        "#errorContainer",
      ) as HTMLDivElement | null;

      if (!errorContainer) {
        this._changed.value = false;
        return;
      }

      const scrollTopBefore = errorContainer.scrollTop;

      const maxScrollTop =
        errorContainer.scrollHeight - errorContainer.clientHeight;
      const isAtBottom = maxScrollTop - errorContainer.scrollTop <= 5;

      this._overlay.innerHTML = "";

      this._create_overlay_skeleton(this._overlay);

      errorContainer = this._overlay.querySelector(
        "#errorContainer",
      ) as HTMLDivElement | null;
      if (errorContainer) {
        for (const error of errors) {
          const errorMessage = document.createElement("div");
          errorMessage.style.borderBottom = "2px solid #eee";
          errorMessage.style.paddingBottom = "2px";
          errorMessage.textContent = error;
          errorContainer.appendChild(errorMessage);
        }
        if (isAtBottom) {
          errorContainer.scrollTop =
            errorContainer.scrollHeight - errorContainer.clientHeight;
        } else {
          errorContainer.scrollTop = scrollTopBefore;
        }
      }

      this._changed.value = false;
    }
  }

  private _create_error_overlay() {
    const overlay = document.createElement("div");
    overlay.id = "errorOverlay";
    overlay.style.display = "none";
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

    this._create_overlay_skeleton(overlay);

    document.body.appendChild(overlay);

    return overlay;
  }

  private _create_overlay_skeleton(overlay: HTMLDivElement) {
    const closeOverlayButton = document.createElement("button");
    closeOverlayButton.textContent = "Close";
    closeOverlayButton.addEventListener("click", () => {
      overlay.style.display = "none";
    });

    const clearErrorsButton = document.createElement("button");
    clearErrorsButton.textContent = "Clear";
    clearErrorsButton.addEventListener("click", () => {
      this._errors = [];
      this._changed.value = true;
    });

    const buttonHolder = document.createElement("div");
    buttonHolder.style.display = "flex";
    buttonHolder.style.flexDirection = "row";
    buttonHolder.style.gap = "10px";
    buttonHolder.appendChild(closeOverlayButton);
    buttonHolder.appendChild(clearErrorsButton);

    const header = document.createElement("header");
    header.style.display = "flex";
    header.style.flexDirection = "column";
    header.style.width = "fit-content";
    header.style.marginBottom = "10px";
    header.innerHTML = "<h1>Errors</h1>";
    header.appendChild(buttonHolder);

    overlay.appendChild(header);

    const errorContainer = document.createElement("div");
    errorContainer.id = "errorContainer";
    errorContainer.style.display = "flex";
    errorContainer.style.flexDirection = "column";
    errorContainer.style.gap = "10px";
    errorContainer.style.overflowY = "auto";
    errorContainer.style.maxHeight = "70vh";
    errorContainer.style.borderTop = "1px solid #ccc";
    errorContainer.style.paddingTop = "10px";

    overlay.appendChild(errorContainer);
  }
}

export default ErrorOverlay;
