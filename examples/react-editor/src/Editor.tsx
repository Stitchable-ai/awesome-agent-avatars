// An example avatar editor. It only uses the common editing interface:
//   style.fields (what can be edited), style.defaults(), style.render(options),
//   randomOptions(), groupFields() and an AvatarRecipe JSON you can save anywhere.
// Copy it, restyle it, or replace it: the editor UI belongs to your app.
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentAvatar, useStyleArt } from "bot-styles/react";
import { groupFields, randomOptions, REACTIONS } from "bot-styles";
import type { AvatarRecipe, AvatarStyle, BotAvatar, Field, StyleOptions } from "bot-styles";
import "./editor.css";

const PREVIEW_STATES = ["idle", "waving", "listening", "thinking", "working", "streaming", "blocked", "finished", "celebrate", "sleeping", "turntable"];

export function Editor({ styles, storageKey = "bot-styles:recipe" }: { styles: AvatarStyle<any>[]; storageKey?: string }) {
  const saved = useMemo<AvatarRecipe | null>(() => { try { return JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { return null; } }, [storageKey]);
  const [styleId, setStyleId] = useState(saved?.style && styles.some((s) => s.id === saved.style) ? saved.style : styles[0].id);
  const style = styles.find((s) => s.id === styleId)!;
  const [options, setOptions] = useState<StyleOptions>(() => (saved?.style === styleId ? { ...style.defaults(), ...saved.options } : style.defaults()));
  const [name, setName] = useState(saved?.name || "Stitch");
  const [state, setState] = useState("waving");
  const avatar = useRef<BotAvatar | null>(null);
  const art = useStyleArt(style, options);

  const pickStyle = (id: string) => { const s = styles.find((x) => x.id === id)!; setStyleId(id); setOptions(s.defaults()); };
  const set = (key: string, value: string | boolean) => setOptions((o) => ({ ...o, [key]: value }));
  const recipe: AvatarRecipe = { v: 1, style: styleId, options, name };
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(recipe)); }, [JSON.stringify(recipe)]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bse">
      <aside className="bse-controls">
        <div className="bse-styles">
          {styles.map((s) => (
            <button key={s.id} className={s.id === styleId ? "on" : ""} onClick={() => pickStyle(s.id)}>
              {s.name}<small>{s.credit.license}</small>
            </button>
          ))}
        </div>
        <label className="bse-field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        {groupFields(style.fields).map(([group, fields]) => (
          <fieldset key={group}><legend>{group}</legend>{fields.map((f) => <FieldControl key={f.key} field={f} value={options[f.key]} onChange={(v) => set(f.key, v)} />)}</fieldset>
        ))}
        <div className="bse-actions">
          <button onClick={() => { setOptions(randomOptions(style)); avatar.current?.react("surprised"); }}>🎲 Randomise</button>
          <button onClick={() => setOptions(style.defaults())}>Reset</button>
        </div>
        <p className="bse-credit">Art: <a href={style.credit.sourceUrl || style.credit.authorUrl} target="_blank" rel="noreferrer">{style.credit.source || style.name}</a> by {style.credit.author} · <a href={style.credit.licenseUrl} target="_blank" rel="noreferrer">{style.credit.license}</a></p>
      </aside>
      <section className="bse-preview">
        <div className="bse-stage"><AgentAvatar ref={avatar} art={art} state={state} /></div>
        <h2>{name}</h2>
        <div className="bse-chips">{PREVIEW_STATES.map((s) => <button key={s} className={s === state ? "on" : ""} onClick={() => setState(s)}>{s}</button>)}</div>
        <div className="bse-chips">{Object.keys(REACTIONS).map((r) => <button key={r} onClick={() => avatar.current?.react(r)}>{r}</button>)}</div>
        <details><summary>Saved recipe (store this JSON with your user)</summary><pre>{JSON.stringify(recipe, null, 2)}</pre></details>
      </section>
    </div>
  );
}

function FieldControl({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: string | boolean) => void }) {
  if (field.type === "color") return (
    <div className="bse-field"><span>{field.label}</span><div className="bse-swatches">
      {field.swatches.map((c) => <button key={c} title={c} className={c.toLowerCase() === String(value).toLowerCase() ? "on" : ""} style={{ background: c }} onClick={() => onChange(c)} />)}
    </div></div>);
  if (field.type === "toggle") return <label className="bse-field"><span>{field.label}</span><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /></label>;
  if (field.type === "text") return <label className="bse-field"><span>{field.label}</span><input value={String(value ?? "")} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
  if (field.options.length <= 6) return (
    <div className="bse-field"><span>{field.label}</span><div className="bse-seg">
      {field.options.map((o) => <button key={o.value} className={o.value === value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div></div>);
  return <label className="bse-field"><span>{field.label}</span><select value={String(value)} onChange={(e) => onChange(e.target.value)}>{field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}
