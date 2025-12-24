"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import "./globals.css";

const DEFAULTS = {
  ageGroup: "adult",
  relationship: "friend",
  budget: "under25",
  personality: "practical",
  interests: "tech, cooking, travel",
  notes: ""
};

export default function Page() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const canSubmit = useMemo(() => {
    return form.ageGroup && form.relationship && form.budget && form.personality;
  }, [form]);

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Request failed");
      }

      setData(json);
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(DEFAULTS);
    setData(null);
    setError("");
  }

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1 className="title">Christmas Gift Recommender</h1>
          <p className="subtitle">
            Pick demographics and interests. The app fetches gift ideas (books) from a free API
            and ranks them to fit the person.
          </p>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <form onSubmit={onSubmit}>
            <div className="row">
              <div>
                <label className="label">Age group</label>
                <select
                  className="select"
                  value={form.ageGroup}
                  onChange={(e) => update("ageGroup", e.target.value)}
                >
                  <option value="kid">Kid</option>
                  <option value="teen">Teen</option>
                  <option value="adult">Adult</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="label">Relationship</label>
                <select
                  className="select"
                  value={form.relationship}
                  onChange={(e) => update("relationship", e.target.value)}
                >
                  <option value="partner">Partner</option>
                  <option value="mom">Mom</option>
                  <option value="dad">Dad</option>
                  <option value="friend">Friend</option>
                  <option value="coworker">Coworker</option>
                  <option value="child">Child</option>
                </select>
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label className="label">Budget</label>
                <select
                  className="select"
                  value={form.budget}
                  onChange={(e) => update("budget", e.target.value)}
                >
                  <option value="under25">Under $25</option>
                  <option value="25to50">$25–$50</option>
                  <option value="over50">$50+</option>
                </select>
              </div>

              <div>
                <label className="label">Personality</label>
                <select
                  className="select"
                  value={form.personality}
                  onChange={(e) => update("personality", e.target.value)}
                >
                  <option value="practical">Practical</option>
                  <option value="sentimental">Sentimental</option>
                  <option value="trendy">Trendy</option>
                  <option value="funny">Funny</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="label">Interests (comma-separated)</label>
              <input
                className="input"
                value={form.interests}
                onChange={(e) => update("interests", e.target.value)}
                placeholder="e.g., cooking, sports, photography, skincare"
              />
              <p className="small" style={{ marginTop: 8 }}>
                Tip: 2–5 interests works best.
              </p>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="label">Extra notes (optional)</label>
              <textarea
                className="textarea"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="e.g., loves mystery, hates clutter, prefers quick reads"
              />
            </div>

            <div className="buttonRow">
              <button className="btn btnPrimary" type="submit" disabled={!canSubmit || loading}>
                {loading ? "Finding gifts…" : "Recommend gifts"}
              </button>
              <button className="btn" type="button" onClick={reset} disabled={loading}>
                Reset
              </button>
            </div>

            {error ? <div className="error">{error}</div> : null}
          </form>
        </section>

        <section className="card">
          <h2 style={{ margin: 0, fontSize: 16 }}>Results</h2>
          <div className="hr" />

          {!data && !loading ? (
            <p className="small">
              Submit the form to see recommendations. These are real items pulled from Open Library
              and ranked to match the person.
            </p>
          ) : null}

          {loading ? <p className="small">Searching…</p> : null}

          {data?.recommendations?.length ? (
            <>
              <p className="small" style={{ marginTop: 0 }}>
                Search queries used: <b>{data.queries.join(" • ")}</b>
              </p>

              <div className="results">
                {data.recommendations.map((r) => (
                  <div className="resultCard" key={r.key}>
                    <div className="cover">
                      {r.coverUrl ? (
                        <Image
                          src={r.coverUrl}
                          alt={r.title}
                          width={64}
                          height={96}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      ) : (
                        <span>No cover</span>
                      )}
                    </div>

                    <div>
                      <p className="h3">
                        {r.openLibraryUrl ? (
                          <a href={r.openLibraryUrl} target="_blank" rel="noreferrer">
                            {r.title}
                          </a>
                        ) : (
                          r.title
                        )}
                      </p>
                      <p className="meta">
                        {r.author}
                        {r.year ? ` • First published ${r.year}` : ""}
                      </p>

                      {r.subjects?.length ? (
                        <div className="pillRow">
                          {r.subjects.map((s) => (
                            <span className="pill" key={s}>{s}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {data && !data?.recommendations?.length && !loading ? (
            <p className="small">No matches found. Try different interests.</p>
          ) : null}
        </section>
      </div>

      <div style={{ marginTop: 18 }} className="small">
        Free API used: Open Library Search (no API key).
      </div>
    </main>
  );
}
