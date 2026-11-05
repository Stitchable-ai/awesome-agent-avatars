import { createRoot } from "react-dom/client";
import { micah } from "bot-styles/styles/micah";
import { avataaars } from "bot-styles/styles/avataaars";
import { gaze } from "bot-styles/styles/gaze";
import { nice } from "bot-styles/styles/nice";
import { fluent } from "bot-styles/styles/fluent";
import { Editor } from "./Editor";

createRoot(document.getElementById("root")!).render(<Editor styles={[micah, avataaars, nice, gaze, fluent]} />);
