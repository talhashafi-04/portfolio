// The seated avatar: three.js scene, GLB loading with progress, head follows the cursor,
// and a camera that main.js drives along hero -> about -> wide desk shot with a 0..2 scroll value.
(function () {
  const canvas = document.getElementById("stage");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;

  const cam = new THREE.PerspectiveCamera(22, 1, 0.05, 50);

  // camera path: hero close-up -> about (same close-up, he slides left) -> wide 3/4 shot at the desk.
  // each pose is [position, look-at target, fov]; phones get their own path so the desk fits a tall screen
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const PATHS = {
    wide: [
      [V(0, 1.42, 2.35), V(0, 1.3, -0.3), 22],
      [V(0.5, 1.42, 2.6), V(0.48, 1.3, -0.3), 22],
      [V(-3.5, 2.15, 3.7), V(0.15, 0.82, 0.95), 24]
    ],
    tall: [
      [V(0, 1.55, 5.4), V(0, 1.5, -0.3), 26],
      [V(0, 1.75, 4.6), V(0, 1.45, -0.3), 26],
      [V(-3.6, 2.2, 3.6), V(0, 1.15, 0.25), 30]
    ]
  };
  let path = PATHS.wide, progress = 0, goal = 0, intro = 1, wideness = 0;
  const pTmp = new THREE.Vector3(), tTmp = new THREE.Vector3();

  function size() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    path = cam.aspect < 0.9 ? PATHS.tall : PATHS.wide;
  }
  addEventListener("resize", size);
  size();

  const ease = (x) => x * x * (3 - 2 * x);
  function placeCamera() {
    const seg = Math.min(Math.floor(progress), path.length - 2);
    const e = ease(Math.min(1, progress - seg));
    const A = path[seg], B = path[seg + 1];
    // orbit around him (cylindrical lerp) instead of cutting straight across, so he never leaves frame
    const a0 = Math.atan2(A[0].x, A[0].z), a1 = Math.atan2(B[0].x, B[0].z);
    const r0 = Math.hypot(A[0].x, A[0].z), r1 = Math.hypot(B[0].x, B[0].z);
    const ang = a0 + (a1 - a0) * e, rad = r0 + (r1 - r0) * e;
    pTmp.set(Math.sin(ang) * rad, A[0].y + (B[0].y - A[0].y) * e, Math.cos(ang) * rad);
    tTmp.lerpVectors(A[1], B[1], e);
    cam.fov = A[2] + (B[2] - A[2]) * e;
    wideness = seg === 1 ? e : 0;
    // intro: start pulled back and higher, then dolly in to the close-up
    pTmp.z += intro * 1.6; pTmp.y += intro * 0.3;
    cam.position.copy(pTmp);
    cam.lookAt(tTmp);
    cam.updateProjectionMatrix();
  }

  const key = new THREE.DirectionalLight(0xfff6f0, 1.25); key.position.set(-0.5, 2.5, 2); scene.add(key);
  const rim = new THREE.PointLight(0xc2a0ff, 3, 6, 2); rim.position.set(0.9, 1.7, -0.6); scene.add(rim);
  const rim2 = new THREE.PointLight(0xc2a0ff, 2, 6, 2); rim2.position.set(-0.9, 1.5, -0.5); scene.add(rim2);
  const scr = new THREE.PointLight(0xc8bfff, 1.4, 2, 2); scr.position.set(0, 0.95, -0.75); scene.add(scr);
  // back light behind his head and shoulders for the lilac outline
  const back = new THREE.SpotLight(0xb98cff, 22, 7, 0.7, 0.6, 2); back.position.set(0, 2.3, -1.6); back.target.position.set(0, 1.2, 0); scene.add(back, back.target);

  let mixer, actions = {}, current, neck, head;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  const qTmp = new THREE.Quaternion(), qParent = new THREE.Quaternion(), qDelta = new THREE.Quaternion();
  const eTmp = new THREE.Euler();

  function play(name) {
    const next = actions[name];
    if (!next || next === current && name === "typing") return;
    next.reset().setEffectiveWeight(1);
    if (name === "typing") next.setLoop(THREE.LoopRepeat, Infinity);
    else { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
    if (current && current !== next) next.crossFadeFrom(current, 0.35, false);
    next.play();
    current = next;
  }

  addEventListener("pointermove", (e) => {
    look.tx = (e.clientX / innerWidth) * 2 - 1;
    look.ty = (e.clientY / innerHeight) * 2 - 1;
  });
  document.addEventListener("pointerleave", () => { look.tx = 0; look.ty = 0; });

  // rotate a bone about world axes, around its own pivot, on top of whatever the clip set this frame
  function turn(bone, yaw, pitch) {
    bone.parent.getWorldQuaternion(qParent);
    qDelta.setFromEuler(eTmp.set(pitch, yaw, 0, "YXZ"));
    qTmp.copy(qParent).invert().multiply(qDelta).multiply(qParent);
    bone.quaternion.premultiply(qTmp);
  }

  // read the GLB with byte progress; static hosts serve avatar.glb, the preview host only serves text,
  // so fall back to a base64 copy when the binary isn't there
  async function fetchBytes(url, onProgress) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + " " + res.status);
    const total = +res.headers.get("content-length") || 0;
    if (!res.body || !total) return new Uint8Array(await res.arrayBuffer());
    const reader = res.body.getReader();
    const out = new Uint8Array(total);
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (got + value.length > out.length) return null; // compressed transfer; size unknown
      out.set(value, got); got += value.length;
      onProgress(got / total);
    }
    return out.subarray(0, got);
  }
  async function loadBytes(onProgress) {
    try {
      const b = await fetchBytes("assets/avatar.glb", onProgress);
      if (b && b[0] === 0x67 && b[1] === 0x6c && b[2] === 0x54 && b[3] === 0x46) return b;
    } catch (_) { /* fall through */ }
    const res = await fetch("assets/avatar.glb.b64.txt");
    if (!res.ok) throw new Error("avatar missing");
    onProgress(0.9);
    const txt = (await res.text()).trim();
    return Uint8Array.from(atob(txt), (c) => c.charCodeAt(0));
  }

  function load(onProgress) {
    return loadBytes(onProgress).then((bin) => new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      if (window.MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
      loader.parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), "", (g) => {
        const aniso = renderer.capabilities.getMaxAnisotropy();
        g.scene.traverse((o) => {
          o.frustumCulled = false;
          if (!o.material) return;
          o.material.envMapIntensity = 0.3;
          // full-res textures stay crisp at grazing angles in the close-up
          for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap"]) if (o.material[k]) o.material[k].anisotropy = aniso;
        });
        scene.add(g.scene);
        neck = g.scene.getObjectByName("mixamorigNeck");
        head = g.scene.getObjectByName("mixamorigHead");
        for (const bone of [neck, head]) if (bone) bone.userData.rest = bone.quaternion.clone();
        mixer = new THREE.AnimationMixer(g.scene);
        for (const c of g.animations) actions[c.name === "introAnimation" ? "intro" : c.name] = mixer.clipAction(c);
        mixer.addEventListener("finished", () => play("typing"));
        play("typing");
        resolve();
      }, reject);
    }));
  }

  let running = true;
  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!running) return;
    if (mixer) {
      // clips may not key the neck/head, so start each frame from rest or the cursor turn would pile up
      for (const bone of [neck, head]) if (bone) bone.quaternion.copy(bone.userData.rest);
      mixer.update(dt);
      const k = 1 - Math.exp(-dt * 6);
      // in the about pose the camera sits to his right, so bias the gaze toward the reader
      // cursor-follow only in the untouched hero; once the page scrolls he locks onto the text on the
      // right (About, then What I do's cards), and in the wide shot he drops his eyes to the laptop
      const lock = Math.min(1, progress / 0.15);
      const follow = 1 - lock;
      const gx = look.tx * follow + lock * 0.75 * (1 - wideness);
      const gy = look.ty * follow + lock * (0.05 + wideness * 0.45);
      look.x += (gx - look.x) * k;
      look.y += (gy - look.y) * k;
      // close-up: lift his chin off the keyboard so he meets the viewer
      const yaw = look.x * 0.6, pitch = look.y * 0.28 - 0.04 - 0.2 * (1 - wideness);
      if (neck) turn(neck, yaw * 0.4, pitch * 0.4);
      if (head) turn(head, yaw * 0.6, pitch * 0.6);
    }
    // ease toward the scroll value so wheel steps don't jolt the camera
    progress += (goal - progress) * (1 - Math.exp(-dt * 7));
    placeCamera();
    renderer.render(scene, cam);
  }
  renderer.setAnimationLoop(tick);

  window.Avatar = {
    load,
    play,
    setProgress(p) { goal = Math.max(0, Math.min(2, p)); },
    setIntro(v) { intro = v; },
    setRunning(on) { if (on && !running) clock.getDelta(); running = on; },
    canvas
  };
})();
