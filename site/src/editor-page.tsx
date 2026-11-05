import "./site.css";
import { createRoot } from "react-dom/client";
import { Editor } from "@examples/react-editor/src/Editor";
import { STYLES } from "./shared";

createRoot(document.getElementById("root")!).render(<Editor styles={STYLES} />);
