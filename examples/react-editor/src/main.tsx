import { createRoot } from "react-dom/client";
import { micah } from "awesome-agent-avatars/styles/micah";
import { avataaars } from "awesome-agent-avatars/styles/avataaars";
import { gaze } from "awesome-agent-avatars/styles/gaze";
import { nice } from "awesome-agent-avatars/styles/nice";
import { fluent } from "awesome-agent-avatars/styles/fluent";
import { Editor } from "./Editor";

createRoot(document.getElementById("root")!).render(<Editor styles={[micah, avataaars, nice, gaze, fluent]} />);
