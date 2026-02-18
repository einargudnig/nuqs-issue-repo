import { redirect, useLocation } from "react-router";
import {
  createLoader,
  createParser,
  createSerializer,
  useQueryStates,
} from "nuqs";

// --- Parser ---

const parseAsItems = createParser({
  parse: (value: string) => value || null,
  serialize: (value: string) => value,
});

const searchParams = {
  mode: parseAsItems.withDefault(""),
  items: parseAsItems.withDefault(""),
};

const loadSp = createLoader(searchParams);
const serializeSp = createSerializer(searchParams);

// --- Client Loader ---

export async function clientLoader({ request }: { request: Request }) {
  const sp = loadSp(request);

  // If mode is set but items is empty, "fetch" items and redirect
  if (sp.mode !== "" && sp.items === "") {
    const fetchedItems = "apple,banana,cherry"; // pretend this came from an API
    const redirectUrl = `/` + serializeSp({ ...sp, items: fetchedItems });
    return redirect(redirectUrl);
  }

  return { items: sp.items, mode: sp.mode };
}

// --- Component ---

export default function Index() {
  const [params, setParams] = useQueryStates(searchParams);
  const location = useLocation();

  const triggerNavigation = () => {
    // This clears items and sets mode, triggering a loader re-run.
    // The loader will redirect with items populated.
    setParams({ mode: "active", items: "" }, { shallow: false });
  };

  const reset = () => {
    // Reset to clean state so you can reproduce the bug again
    setParams({ mode: "", items: "" }, { shallow: false });
  };

  const hasBug = params.items === "" && location.search.includes("items=apple");

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>nuqs redirect repro</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          onClick={triggerNavigation}
          style={{
            padding: "12px 24px",
            fontSize: 18,
            fontWeight: "bold",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          1. Set mode (triggers loader redirect)
        </button>

        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            fontSize: 18,
            fontWeight: "bold",
            backgroundColor: "#374151",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {hasBug && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#fee2e2",
            border: "2px solid #ef4444",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 16,
          }}
        >
          BUG REPRODUCED: nuqs state has items="" but the URL has
          items=apple,banana,cherry
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: 16,
            backgroundColor: "#f3f4f6",
            borderRadius: 8,
          }}
        >
          <strong>nuqs state:</strong>
          <pre>{JSON.stringify(params, null, 2)}</pre>
        </div>
        <div
          style={{
            padding: 16,
            backgroundColor: "#f3f4f6",
            borderRadius: 8,
          }}
        >
          <strong>browser URL (from useLocation):</strong>
          <pre>{location.search || "(empty)"}</pre>
        </div>
      </div>

      <p>
        After clicking the button, the browser URL should have{" "}
        <code>items=apple,banana,cherry</code>, and nuqs state should match. If
        nuqs shows <code>items: ""</code> while the URL has the items, the bug
        is reproduced.
      </p>
    </div>
  );
}
