import { match } from "ts-pattern";
import type Game from "./Game";
import get_position_in_ts, { map_stack_trace } from "./utils/getPositionInTS";
import Signal from "./utils/Signal";

enum MessageKind {
  CommandOutput = "c",
  Debug = "d",
  Info = "i",
  Warning = "w",
  Error = "e",
  FatalError = "f"
}

interface Message {
  kind: MessageKind;
  content: string;
}

class CommandOverlay {
  private _messages = [] as Message[];
  private _overlay: HTMLDivElement = this._create_overlay();
  private _changed = new Signal(false);
  private _loaded = false;
  private _game: Game;
  private _messageQueue = Promise.resolve();

  constructor(game: Game) {
    this._game = game;

    window.onerror = this._on_error.bind(this);
    window.onunhandledrejection = this._on_unhandled_rejection.bind(this);

    this._changed.subscribe(() => {
      this._show_overlay(this._messages);
    });

    document.addEventListener("keyup", (e) => {
      const command_input = document.getElementById("commandInput");
      if(command_input === document.activeElement) return;
      if (e.key === ";") this._show_overlay(undefined, true);
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
      this._messages.push({ kind: MessageKind.Error, content: `Unhandled Promise Rejection: ${event.reason}`});
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
    this._messageQueue = this._messageQueue.then(async () => {
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

          this._messages.push({ kind: MessageKind.Info, content: "Loading stack trace"});
          this._changed.value = true;
          const stack_trace = (await map_stack_trace(error, import.meta.url))
            .map((frame) =>
              frame.source
                ? `at ${frame.name || "<anonymous>"} (${frame.source}:${frame.line}:${frame.column})`
                : frame.originalFrame || "<unknown>",
            )
            .join("\n");
          this._messages.pop();
          this._messages.push({
            kind: MessageKind.Error,
            content: `${message}\nFile: ${pos.source}:${pos.line}:${pos.column}, Stack:\n${stack_trace}`,
          });
        }
      } else {
        this._messages.push({
          kind: MessageKind.Error,
          content: `${message}\nFile: ${source}:${lineno}:${colno}, Stack:\n${error?.stack}`,
        });
      }
      this._changed.value = true;
    });

    return this._messageQueue;
  }

  private _show_overlay(messages?: Readonly<typeof this._messages>, force_open = false) {
    if (messages && messages.length === 0 && !force_open && !this._loaded) return;

    if (force_open && this._overlay.style.display === "block") {
      this._overlay.style.display = "none";
    } else if (this._overlay.style.display === "none") {
      this._overlay.style.display = "block";
    }

    if (this._changed.value && messages) {

      let messages_container = this._overlay.querySelector(
        "#messageContainer",
      ) as HTMLDivElement | null;

      if (!messages_container) {
        this._changed.value = false;
        return;
      }

      const scroll_top_before = messages_container.scrollTop;

      const max_scroll_top =
        messages_container.scrollHeight - messages_container.clientHeight;
      const is_at_bottom = max_scroll_top - messages_container.scrollTop <= 5;

      // const old_command_input = document.getElementById("commandInput") as HTMLInputElement;
      // const command_input_text = old_command_input.value;
      // const was_command_input_focused = old_command_input === document.activeElement;

      this._create_overlay_skeleton(this._overlay, true);

      messages_container = this._overlay.querySelector(
        "#messageContainer",
      ) as HTMLDivElement | null;
      if (messages_container) {
        for (const message of messages) {
          const message_container = document.createElement("div");
          message_container.style.color = match(message.kind)
          .with(MessageKind.CommandOutput, () => "white")
          .with(MessageKind.Debug, () => "blue")
          .with(MessageKind.Info, () => "blueviolet")
          .with(MessageKind.Warning, () => "yellow")
          .with(MessageKind.Error, () => "red")
          .with(MessageKind.FatalError, () => "maroon")
          .exhaustive();
          message_container.style.borderBottom = "2px solid #eee";
          message_container.style.paddingBottom = "2px";
          message_container.textContent = message.content;
          messages_container.appendChild(message_container);
        }
        if (is_at_bottom) {
          messages_container.scrollTop =
            messages_container.scrollHeight - messages_container.clientHeight;
        } else {
          messages_container.scrollTop = scroll_top_before;
        }
      }

      // const new_command_input = this._overlay.querySelector("#commandInput") as HTMLInputElement;
      // new_command_input.value = command_input_text;
      // if(was_command_input_focused) new_command_input.focus();

      this._changed.value = false;
    }
  }

  private _create_overlay() {
    const overlay = document.createElement("div");
    overlay.id = "commandOverlay";
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

  private _create_overlay_skeleton(overlay: HTMLDivElement, already_rendered = false) {
    if(already_rendered) {
      const message_container = document.getElementById("messageContainer") as HTMLDivElement;
      message_container.innerHTML = "";
      return;
    }
    const close_overlay_button = document.createElement("button");
    close_overlay_button.textContent = "Close";
    close_overlay_button.addEventListener("click", () => {
      overlay.style.display = "none";
    });

    const clear_messages_button = document.createElement("button");
    clear_messages_button.textContent = "Clear";
    clear_messages_button.addEventListener("click", () => {
      this._messages = [];
      this._changed.value = true;
    });

    const button_holder = document.createElement("div");
    button_holder.style.display = "flex";
    button_holder.style.flexDirection = "row";
    button_holder.style.gap = "10px";
    button_holder.appendChild(close_overlay_button);
    button_holder.appendChild(clear_messages_button);

    const header = document.createElement("header");
    header.style.display = "flex";
    header.style.flexDirection = "column";
    header.style.width = "fit-content";
    header.style.marginBottom = "10px";
    header.innerHTML = "<h1>Command</h1>";
    header.appendChild(button_holder);

    overlay.appendChild(header);

    const message_container = document.createElement("div");
    message_container.id = "messageContainer";
    message_container.style.display = "flex";
    message_container.style.flexDirection = "column";
    message_container.style.gap = "10px";
    message_container.style.overflowY = "auto";
    message_container.style.height = "70vh";
    message_container.style.maxHeight = "70vh";
    message_container.style.borderTop = "1px solid #ccc";
    message_container.style.paddingTop = "10px";

    overlay.appendChild(message_container);

    const command_input = document.createElement("input");
    command_input.id = "commandInput";
    command_input.setAttribute("type", "text")
    command_input.style.marginTop = "10px";
    command_input.onkeyup = (ev) => {
      if(ev.key !== "Enter") return;
      try {
        const output = this._no_context_eval(command_input.value);
        command_input.value = "";
        if(output?.toString()) this._messages.push({ kind: MessageKind.CommandOutput, content: output.toString()});
        this._changed.value = true;
      } catch(e) {
        if(e instanceof Error) {
          this._messages.push({kind: MessageKind.Error, content: e.message});
          this._changed.value = true;
        }
      }
    }

    overlay.appendChild(command_input);
  }

  private _no_context_eval(i: string) {
    const clear = () => {
      this._messages = [];
      this._changed.value = true; 
    }
    
    const nce = new NoContextEval([
      { name: "clear", fn: clear }
    ])

    return nce.evaluate(i);
  }
}


type AllowedFunction = {
  name: string;
  fn: (...args: unknown[]) => unknown;
};

export class NoContextEval {
  private allowedFns: Record<string, (...args: unknown[]) => unknown>;

  constructor(functions: AllowedFunction[]) {
    this.allowedFns = {};
    for (const { name, fn } of functions) {
      if (!/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name)) {
        throw new Error(`Invalid function name: ${name}`);
      }
      this.allowedFns[name] = fn;
    }
  }

  evaluate(expression: string): unknown {
    const argNames = Object.keys(this.allowedFns);
    const argValues = Object.values(this.allowedFns);

    const evaluator = new Function(...argNames, `return (${expression});`);
    return evaluator(...argValues);
  }
}


export default CommandOverlay;
