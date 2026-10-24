// The seated avatar: three.js scene, GLB loading with progress, head follows the cursor,
// and a camera that main.js drives between "hero" and "about" with a 0..1 scroll value.
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

  // camera poses: [position, look-at target]; mobile gets its own so the desk fits a tall screen
  const POSES = {
    wide: {
      hero: [new THREE.Vector3(0, 1.42, 3.9), new THREE.Vector3(0, 1.0, -0.3)],
      about: [new THREE.Vector3(1.45, 1.5, 3.7), new THREE.Vector3(0.78, 1.08, -0.3)]
    },
    tall: {
      hero: [new THREE.Vector3(0, 1.55, 5.4), new THREE.Vector3(0, 1.5, -0.3)],
      about: [new THREE.Vector3(0, 1.75, 4.6), new THREE.Vector3(0, 1.45, -0.3)]
    }
  };
  let pose = POSES.wide, progress = 0, intro = 1;
  const pTmp = new THREE.Vector3(), tTmp = new THREE.Vector3();

  function size() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    pose = cam.aspect < 0.9 ? POSES.tall : POSES.wide;
    cam.fov = cam.aspect < 0.9 ? 26 : 22;
    cam.updateProjectionMatrix();
  }
  addEventListener("resize", size);
  size();

  function placeCamera() {
    const e = progress * progress * (3 - 2 * progress);
    pTmp.lerpVectors(pose.hero[0], pose.about[0], e);
    tTmp.lerpVectors(pose.hero[1], pose.about[1], e);
    // intro: start a little further back and higher, then settle in
    pTmp.z += intro * 1.2; pTmp.y += intro * 0.35;
    cam.position.copy(pTmp);
    cam.lookAt(tTmp);
  }

  const key = new THREE.DirectionalLight(0xfff6f0, 1.25); key.position.set(-0.5, 2.5, 2); scene.add(key);
  const rim = new THREE.PointLight(0xc2a0ff, 3, 6, 2); rim.position.set(0.9, 1.7, -0.6); scene.add(rim);
  const rim2 = new THREE.PointLight(0xc2a0ff, 2, 6, 2); rim2.position.set(-0.9, 1.5, -0.5); scene.add(rim2);
  const scr = new THREE.PointLight(0xc8bfff, 1.4, 2, 2); scr.position.set(0, 0.95, -0.75); scene.add(scr);

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
      new THREE.GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), "", (g) => {
        g.scene.traverse((o) => { if (o.material) o.material.envMapIntensity = 0.3; o.frustumCulled = false; });
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
      look.x += (look.tx + progress * 0.35 - look.x) * k;
      look.y += (look.ty - look.y) * k;
      const yaw = look.x * 0.6, pitch = look.y * 0.28 - 0.04;
      if (neck) turn(neck, yaw * 0.4, pitch * 0.4);
      if (head) turn(head, yaw * 0.6, pitch * 0.6);
    }
    placeCamera();
    renderer.render(scene, cam);
  }
  renderer.setAnimationLoop(tick);

  window.Avatar = {
    load,
    play,
    setProgress(p) { progress = Math.max(0, Math.min(1, p)); },
    setIntro(v) { intro = v; },
    setRunning(on) { if (on && !running) clock.getDelta(); running = on; },
    canvas
  };
})();
