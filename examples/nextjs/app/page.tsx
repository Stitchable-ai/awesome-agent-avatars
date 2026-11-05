// A server component can render the client component directly.
import Bot from "./components/bot";

export default function Page() {
  return (
    <main style={{ padding: 32 }}>
      <h1>My agent</h1>
      <Bot state="waving" />
    </main>
  );
}
