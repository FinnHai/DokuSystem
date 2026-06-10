import { useEffect, useRef } from "react";

/**
 * Leichtgewichtiger Rich-Text-Editor (D.3): Bold, Italic, Listen, Links,
 * Undo/Redo, Zeichenzähler – ohne externe Abhängigkeiten.
 */
export default function RichTextEditor(props: {
  value: string;
  onChange: (html: string) => void;
  maxLength?: number;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== props.value) {
      ref.current.innerHTML = props.value || "";
    }
  }, [props.value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    props.onChange(ref.current?.innerHTML ?? "");
  };

  const textLength = ref.current?.innerText.length ?? props.value.replace(/<[^>]+>/g, "").length;
  const overLimit = props.maxLength !== undefined && textLength > props.maxLength;

  const buttons: [string, string, string?][] = [
    ["B", "bold"],
    ["I", "italic"],
    ["• Liste", "insertUnorderedList"],
    ["1. Liste", "insertOrderedList"],
    ["↶", "undo"],
    ["↷", "redo"],
  ];

  return (
    <div className={`border rounded-lg bg-base-100 ${props.disabled ? "opacity-60" : ""}`}>
      {!props.disabled && (
        <div className="flex gap-1 border-b p-1 flex-wrap">
          {buttons.map(([label, cmd]) => (
            <button
              key={cmd}
              type="button"
              className="btn btn-xs btn-ghost"
              onMouseDown={(e) => {
                e.preventDefault();
                exec(cmd);
              }}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onMouseDown={(e) => {
              e.preventDefault();
              const url = window.prompt("Link-URL:");
              if (url) exec("createLink", url);
            }}
          >
            Link
          </button>
        </div>
      )}
      <div
        ref={ref}
        className="richtext-content min-h-24 p-3 prose prose-sm max-w-none"
        contentEditable={!props.disabled}
        suppressContentEditableWarning
        onInput={() => props.onChange(ref.current?.innerHTML ?? "")}
      />
      {props.maxLength !== undefined && (
        <div className={`text-right text-xs px-2 pb-1 ${overLimit ? "text-error font-bold" : "opacity-50"}`}>
          {textLength} / {props.maxLength} Zeichen
        </div>
      )}
    </div>
  );
}
