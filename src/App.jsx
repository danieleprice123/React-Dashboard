import "./App.css";
import React, { useState, useEffect, useMemo, useCallback } from "react";

export default function App() {
  // single source of truth for speed (always a number)
  const [speed, setSpeed] = useState(30);
  // value from CST (shown in Energy Summary)
  const [totalFuelLoad, setTotalFuelLoad] = useState(null);

  // clamp helper 0..30
  const clamp = (n) => Math.max(0, Math.min(30, n));

  // event handlers (unchanged)
  const onSliderChange = (e) => setSpeed(clamp(Number(e.target.value)));
  const onInputChange = (e) => {
    const v = e.target.value;
    if (v === "") {
      setSpeed(0);
      return;
    }
    setSpeed(clamp(Number(v)));
  };

  // === CST INTEGRATION HOOKS ===
  // 1) Send desiredSpeed to CST whenever it changes
  useEffect(() => {
    window.cst?.setValue("desiredSpeed", speed);
  }, [speed]);

  // 2) Subscribe to CST → React updates for desiredSpeed and totalFuelLoad
  useEffect(() => {
    // when CST drives desiredSpeed, reflect in UI
    const offDesired =
      window.cst?.onValue("desiredSpeed", (v) => {
        if (typeof v === "number" && !Number.isNaN(v)) {
          setSpeed(clamp(v));
        }
      }) || null;

    // live updates for totalFuelLoad
    const offFuel =
      window.cst?.onValue("totalFuelLoad", (v) => {
        if (v == null || Number.isNaN(Number(v))) {
          setTotalFuelLoad(null);
        } else {
          setTotalFuelLoad(Number(v));
        }
      }) || null;

    return () => {
      offDesired && offDesired();
      offFuel && offFuel();
    };
  }, []);

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <header className="mb-6 ml-12">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">DDG 115</h1>
        <p className="opacity-70 ml-4">Real-time platform status</p>
      </header>

      <main className="container mx-auto max-w-7xl p-4 lg:p-6">
        {/* Mission Profile */}
        <section className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h2 className="card-title">Mission Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="stat">
                <div className="stat-title">Speed</div>
                <div className="stat-value">
                  {speed} <span className="text-2xl">knts</span>
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Propulsion</div>
                <div className="stat-value text-sm">Trail Shaft</div>
              </div>
              <div className="stat">
                <div className="stat-title">Fuel</div>
                <div className="stat-value">100%</div>
              </div>
              <div className="stat">
                <div className="stat-title">Range</div>
                <div className="stat-value">
                  200 <span className="text-2xl">nmi</span>
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Endurance</div>
                <div className="stat-value">
                  300 <span className="text-2xl">hrs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Systems + Plots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Aux Systems</h2>
                <div className="flex items-end justify-between">
                  <span className="opacity-70">Total Power</span>
                  <span className="text-2xl font-semibold tabular-nums">420 kW</span>
                </div>
                <progress className="progress progress-primary" value={65} max="100"></progress>
                <div className="text-xs opacity-70">Load 65%</div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Armament Systems</h2>
                <div className="flex items-end justify-between">
                  <span className="opacity-70">Total Power</span>
                  <span className="text-2xl font-semibold tabular-nums">310 kW</span>
                </div>
                <progress className="progress progress-secondary" value={42} max="100"></progress>
                <div className="text-xs opacity-70">Load 42%</div>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Energy Summary</h2>
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Fuel Load</div>
                    <div className="stat-value text-primary">
                      {totalFuelLoad ?? "—"} <span className="text-2xl">kg</span>
                    </div>
                    <div className="stat-desc">Live from CST</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total Power</div>
                    <div className="stat-value">
                      1.21 <span className="text-2xl">kW</span>
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Energy Consumed</div>
                    <div className="stat-value">
                      88 <span className="text-2xl">kWh</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle column — Rails + Telegraph */}
          <TelegraphWithRails speed={speed} setSpeed={(v) => setSpeed(clamp(v))} />

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Elect Plot</h3>
                  <span className="badge">kW</span>
                </div>
                <svg viewBox="0 0 300 120" className="w-full h-40 text-primary mt-2">
                  <g className="chart-grid" strokeWidth="1">
                    <line x1="0" y1="20" x2="300" y2="20" />
                    <line x1="0" y1="60" x2="300" y2="60" />
                    <line x1="0" y1="100" x2="300" y2="100" />
                  </g>
                  <path className="chart-path" d="M0,90 C40,80 60,70 90,75 S150,55 180,60 240,40 300,50" />
                </svg>
              </div>
            </div>

            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Fuel Plot</h3>
                  <span className="badge">%</span>
                </div>
                <svg viewBox="0 0 300 120" className="w-full h-40 text-secondary mt-2">
                  <g className="chart-grid" strokeWidth="1">
                    <line x1="0" y1="20" x2="300" y2="20" />
                    <line x1="0" y1="60" x2="300" y2="60" />
                    <line x1="0" y1="100" x2="300" y2="100" />
                  </g>
                  <path className="chart-path" d="M0,30 L60,35 120,40 180,55 240,80 300,95" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <section className="card bg-base-100 shadow mt-6">
          <div className="card-body">
            <h2 className="card-title">Commanded Speed</h2>
            <div className="flex flex-col gap-3 items-start">
              {/* Manual text input */}
              <div className="flex items-center gap-2">
                <label htmlFor="speedInput" className="opacity-70 text-sm">Enter Speed:</label>
                <input
                  id="speedInput"
                  type="number"
                  min="0"
                  max="30"
                  value={speed}
                  onChange={onInputChange}
                  className="input input-bordered input-sm w-24"
                />
              </div>

              {/* Slider */}
              <div className="w-full max-w-sm">
                <input
                  id="speedRange"
                  type="range"
                  min="0"
                  max="30"
                  value={speed}
                  onChange={onSliderChange}
                  className="range range-primary w-full"
                />
                <div className="flex justify-between text-sm opacity-70 px-1">
                  <span>0</span><span>10</span><span>20</span><span>30</span>
                </div>
              </div>

              {/* Operation call */}
              <button
                className="btn btn-primary"
                onClick={() => window.cst?.callOperation("SetCondition1")}
              >
                Set Condition 1
              </button>

              <div className="flex items-center gap-3">
                <span className="opacity-70">Value</span>
                <div className="kbd kbd-sm"><span>{speed}</span> knts</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer footer-center p-6 bg-base-100 text-base-content/70">
        <aside>
          <p>© {new Date().getFullYear()} Systems Dashboard — Built with Tailwind CSS & DaisyUI</p>
        </aside>
      </footer>
    </div>
  );
}

/* ===================== Telegraph + Rails (unchanged except props) ===================== */

function TelegraphWithRails({ speed, setSpeed }) {
  // Order top -> bottom. Flank smaller than Full.
  const ORDER = [
    { id: "flank", label: "Flank", speed: 28, hVar: "--h-tele-xl" }, // smaller
    { id: "full", labelTop: "Ahead", labelBottom: "Full", speed: 25, hVar: "--h-tele-xxl" },
    { id: "standard", label: "Std", speed: 20, hVar: "--h-tele-lg" },
    { id: "ahead23", labelTop: "Ahead", labelBottom: "2/3", speed: 18, hVar: "--h-tele-md" },
    { id: "ahead13", labelTop: "Ahead", labelBottom: "1/3", speed: 10, hVar: "--h-tele-sm" },
    { id: "stop", label: "Stop", speed: 0, hVar: "--h-tele-stop" }
  ];

  const cssVarPx = useCallback((name) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return 0;
    const probe = document.createElement("div");
    probe.style.height = `calc(${raw})`;
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().height;
    document.body.removeChild(probe);
    return px;
  }, []);

  const [heights, setHeights] = useState([]);
  const [stackPx, setStackPx] = useState(0);
  const [baselinePx, setBase] = useState(0);
  const [fillPx, setFill] = useState(0);

  useEffect(() => {
    const hs = ORDER.map((o) => cssVarPx(o.hVar));
    const tot = hs.reduce((a, b) => a + b, 0);
    const stopH = hs[hs.length - 1];
    setHeights(hs);
    setStackPx(tot);
    setBase(stopH * 0.5);

    const onResize = () => {
      const nhs = ORDER.map((o) => cssVarPx(o.hVar));
      setHeights(nhs);
      setStackPx(nhs.reduce((a, b) => a + b, 0));
      setBase(nhs[nhs.length - 1] * 0.5);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssVarPx]);

  useEffect(() => {
    if (!heights.length) return;
    // closest active order
    const idx = ORDER.reduce(
      (best, o, i) => (Math.abs(speed - o.speed) < Math.abs(speed - ORDER[best].speed) ? i : best),
      0
    );
    // sum rows below active + half of active
    let sum = 0;
    for (let i = ORDER.length - 1; i > idx; i--) sum += heights[i];
    sum += heights[idx] * 0.5;
    setFill(sum);
  }, [speed, heights]);

  const majorTicks = useMemo(() => {
    if (!heights.length) return [];
    const flankH = heights[0];            // actual flank height
    const topHeadroom = flankH * 0.25;    // ~25% down from top of Flank
    const usable = (stackPx - topHeadroom) - baselinePx;
    return Array.from({ length: 11 }, (_, i) => ({
      value: i,
      y: baselinePx + (usable * i) / 10
    }));
  }, [heights, stackPx, baselinePx]);

  const isActive = (target, lower, upper) =>
    Math.abs(speed - target) < Math.abs(speed - lower) &&
    Math.abs(speed - target) <= Math.abs(speed - upper);

  return (
    <div className="tele-rails self-start h-fit">
      {/* Left rail (ticks outboard = left) */}
      <Rail side="left" stackPx={stackPx} fillPx={fillPx} ticks={majorTicks} />

      {/* Telegraph bezel + stack */}
      <div className="telegraph w-[12rem]">
        <div className="tele-stack">
          {/* Flank */}
          <button
            type="button"
            onClick={() => setSpeed(28)}
            className={["tele-item tele-ahead h-tele-xl", Math.abs(speed - 28) <= Math.abs(speed - 25) ? "tele-active" : ""].join(" ")}
            title="Flank (28 kts)"
          >
            Flank
          </button>

          {/* Ahead Full */}
          <button
            type="button"
            onClick={() => setSpeed(25)}
            className={[
              "tele-item tele-ahead flex flex-col items-center leading-[1.05] h-tele-xxl",
              isActive(25, 28, 20) ? "tele-active" : ""
            ].join(" ")}
            title="Ahead Full (25 kts)"
          >
            <span>Ahead</span><span>Full</span>
          </button>

          {/* Std */}
          <button
            type="button"
            onClick={() => setSpeed(20)}
            className={["tele-item tele-ahead h-tele-lg", isActive(20, 25, 18) ? "tele-active" : ""].join(" ")}
            title="Std (20 kts)"
          >
            Std
          </button>

          {/* Ahead 2/3 */}
          <button
            type="button"
            onClick={() => setSpeed(18)}
            className={[
              "tele-item tele-ahead flex flex-col items-center leading-[1.05] h-tele-md",
              isActive(18, 20, 10) ? "tele-active" : ""
            ].join(" ")}
            title="Ahead 2/3 (18 kts)"
          >
            <span>Ahead</span><span>2/3</span>
          </button>

          {/* Ahead 1/3 */}
          <button
            type="button"
            onClick={() => setSpeed(10)}
            className={[
              "tele-item tele-ahead flex flex-col items-center leading-[1.05] h-tele-sm",
              isActive(10, 18, 0) ? "tele-active" : ""
            ].join(" ")}
            title="Ahead 1/3 (10 kts)"
          >
            <span>Ahead</span><span>1/3</span>
          </button>

          {/* STOP */}
          <button
            type="button"
            onClick={() => setSpeed(0)}
            className={["tele-item tele-stop h-tele-stop", Math.abs(speed - 0) < Math.abs(speed - 10) ? "tele-active" : ""].join(" ")}
            title="Stop (0 kts)"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Right rail (ticks outboard = right) */}
      <Rail side="right" stackPx={stackPx} fillPx={fillPx} ticks={majorTicks} />
    </div>
  );
}

function Rail({ side, stackPx, fillPx, ticks }) {
  return (
    <div className={`rail rail--${side}`} style={{ height: stackPx ? `${stackPx}px` : undefined }}>
      <div className="rail-track" />
      <div className="rail-fill" style={{ height: `${fillPx}px` }} />
      <div className="rail-scale">
        {ticks.map((t, i) => {
          const style = { bottom: `${t.y}px` };
          const strong = i % 5 === 0;
          return (
            <React.Fragment key={i}>
              <div className={`rail-tick ${strong ? "strong" : ""}`} style={style} />
              <div className="rail-label" style={style}>{t.value}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
