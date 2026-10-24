// Content that renders into the Work track and the techstack bubbles.
// Only link repos that are known to exist; everything else points at the GitHub profile.
const GH = "https://github.com/talhashafi-04";

window.PROJECTS = [
  {
    name: "KLT Tracker on GPUs", cat: "HPC · Oct 2025", hue: 270,
    stat: "18×", statNote: "faster with CUDA",
    code: "__global__ void track(...) {\n  __shared__ float tile[BS][BS];\n  // coalesced, pinned, streamed",
    tools: "CUDA, OpenACC, OpenMP, Nsight",
    blurb: "Took a CPU feature tracker to 18× with coalesced access, shared-memory tiling, warp-level work and streams; 7× with fewer than ten OpenACC pragmas.",
    link: GH + "/KLT-Feature-Tracker-Acceleration-on-GPUs"
  },
  {
    name: "Urdu Story Generator", cat: "NLP · 2026", hue: 160,
    stat: "1.87M", statNote: "words of training text",
    code: "bpe.train(vocab=4000)  # 3,920 merges\nlm = Trigram(smoothing='deleted')\nstream(sse=True)",
    tools: "Python, FastAPI, SSE, Docker, GitHub Actions",
    blurb: "My own BPE tokenizer and a smoothed trigram model over 2,143 Urdu stories, streamed token by token to a right-to-left web front end.",
    link: GH
  },
  {
    name: "Identiti", cat: "GenAI SaaS · 2026", hue: 300,
    stat: "async", statNote: "brand-aware generation",
    code: "await asyncio.gather(*[\n  gemini.image(prompt, brand)\n  for prompt in batch])",
    tools: "FastAPI, Next.js, Gemini, Supabase, PostgreSQL, Docker",
    blurb: "A brand-intelligence engine that conditions every post, caption and visual on who the brand is. I'm co-founder and CTO.",
    link: GH
  },
  {
    name: "Portfolio Tracker API", cat: "Backend · 2026", hue: 200,
    stat: "5 min", statNote: "price refresh, live over WS",
    code: "queue.add('refresh', {}, {\n  repeat: { every: 300_000 } })\nws.broadcast(pnl)",
    tools: "Node, TypeScript, PostgreSQL, Redis, Bull, WebSockets",
    blurb: "Stock and crypto tracking with P&L and CAGR analytics, background refresh jobs, alerts, RBAC, rate limiting and idempotent writes.",
    link: GH
  },
  {
    name: "Super Tic-Tac-Toe", cat: "Realtime · 2025", hue: 20,
    stat: "∞", statNote: "spectators per room",
    code: "@app.websocket('/room/{code}')\nasync def play(ws, code):\n  await hub.join(code, ws)",
    tools: "FastAPI, WebSockets, JavaScript",
    blurb: "Online multiplayer ultimate tic-tac-toe with room codes, live chat and as many spectators as want to watch.",
    link: GH
  },
  {
    name: "AirControlX", cat: "Systems · 2025", hue: 220,
    stat: "P0", statNote: "emergencies jump the queue",
    code: "pthread_mutex_lock(&runway);\nsem_wait(&slots);\nif (emergency) preempt(q);",
    tools: "C++, threads, mutexes, semaphores",
    blurb: "Automated air traffic control: runway allocation, queuing and emergency pre-emption built on real concurrency primitives.",
    link: GH + "/-AirControlX---Automated-Air-Traffic-Control-System"
  },
  {
    name: "AI-Automation Hub", cat: "Agents · 2024", hue: 120,
    stat: "n8n", statNote: "custom nodes + LLM routing",
    code: "webhook → groq.classify()\n  → route(slack | discord)\n  → log()",
    tools: "n8n, Docker, Groq API, VPS",
    blurb: "Agentic webhook workflows with custom n8n nodes that route requests to Slack or Discord, self-hosted on a VPS.",
    link: GH
  },
  {
    name: "Git Lite", cat: "Data structures · 2024", hue: 30,
    stat: "B-tree", statNote: "+ AVL, Red-Black, Merkle",
    code: "commit -m \"init\"\nbranch feature\nmerkle.verify(root)  # ok",
    tools: "C++",
    blurb: "A small version control system on hand-written trees, with Merkle-tree integrity checks, branching and diffs.",
    link: GH
  },
  {
    name: "Plants vs Zombies", cat: "Game · 2024", hue: 95,
    stat: "100K+", statNote: "impressions on LinkedIn",
    code: "class Peashooter : public Plant\n  , public Observer<Wave> {...};",
    tools: "C++, SFML",
    blurb: "A Game of the Year style remake with Factory, Observer and Strategy patterns. The post about it went viral.",
    link: GH
  },
  {
    name: "Delivery System", cat: "Full stack · 2025", hue: 340,
    stat: "RBAC", statNote: "multi-user, audited",
    code: "SELECT * FROM orders\n WHERE status = 'in_transit'\n ORDER BY eta;",
    tools: "Java, JavaFX, MySQL",
    blurb: "End-to-end delivery management with roles, live tracking, payments and audit trails.",
    link: GH + "/End-To-End-Dilivery-System"
  }
];

window.STACK = [
  "Python", "C++", "TypeScript", "FastAPI", "Node.js", "PostgreSQL", "Redis", "Docker",
  "CUDA", "OpenMP", "MPI", "LangGraph", "Gemini", "YOLO", "Next.js", "React",
  "Flutter", "Azure", "n8n", "Supabase", "Java", "C#", "MongoDB", "Linux"
];
