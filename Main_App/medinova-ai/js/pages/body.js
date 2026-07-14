import { currentLang } from "../app.js";

export function render(root) {
  root.innerHTML = `
    <div class="body-picker-container fade-in">
      <div class="guide-header" style="margin-bottom: 0; padding: 20px;">
        <button id="body-back-btn" class="hdr-btn" title="Back / العودة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 dir="rtl" style="margin: 0; font-size: 24px;">أين تشعر بالألم؟ | Where is the pain?</h1>
      </div>
      
      <div class="body-viewer-wrapper" style="position: relative; width: 100%; height: calc(100vh - 120px); background: var(--surface-2); border-radius: var(--radius-xl); overflow: hidden; box-shadow: inset 0 0 50px rgba(0,0,0,0.05);">
        <div id="loading-overlay" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(5px); color: #fff;">
          <div class="spinner" style="width: 40px; height: 40px; margin-bottom: 20px; border-width: 4px;"></div>
          <h3 style="color: #06b6d4; margin-bottom: 8px;">جاري تحميل المجسم...</h3>
          <p style="margin: 0;">Loading 3D Model...</p>
        </div>
        <div id="selection-name-overlay" style="position: absolute; top: 50%; right: 40px; transform: translateY(-50%); text-align: right; display: none; z-index: 5; pointer-events: none; text-shadow: 0 4px 15px rgba(0,0,0,1); background: rgba(15,23,42,0.6); padding: 20px 30px; border-radius: 16px; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1);">
          <h2 id="selection-name-ar" style="margin: 0; color: #06b6d4; font-size: 32px; font-weight: bold;"></h2>
          <p id="selection-name-en" style="margin: 5px 0 0 0; font-size: 18px; opacity: 0.9; color: #fff;"></p>
        </div>

        <button id="confirm-selection-btn" class="premium-cta-btn" style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 12px 40px; font-size: 18px; border-radius: 999px; display: none; z-index: 5; box-shadow: 0 5px 25px rgba(6,182,212,0.5);">
          تأكيد | Confirm
        </button>

        <div id="body-3d-container" style="width: 100%; height: 100%; cursor: pointer;"></div>
        
        <div id="hint-overlay" style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 999px; color: white; text-align: center; pointer-events: none; width: max-content; transition: opacity 0.3s ease;">
          <span style="font-weight: bold; color: #06b6d4;">تلميح:</span> اضغط على مكان الألم ثم تأكيد<br>
          <span style="font-size: 13px; opacity: 0.8;">Hint: Click on the pain location then confirm</span>
        </div>
      </div>
    </div>
  `;

  const backBtn = root.querySelector("#body-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/home";
    });
  }

  // Dynamically load Three.js to keep index.html clean and avoid blocking
  init3DScene(root);
}

async function init3DScene(root) {
  try {
    // Import Three.js and loaders using import map
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

    const container = root.querySelector("#body-3d-container");
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Check if dark mode is active to set appropriate background
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    scene.background = new THREE.Color(isDark ? 0x0d1825 : 0xf7fafc); // var(--surface) or var(--surface-2)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5); // Assuming the model is around origin and human-sized

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.target.set(0, 1, 0); // Point camera slightly up (center of body)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xaabbff, 0.8);
    dirLight2.position.set(-5, 5, -5);
    scene.add(dirLight2);

    // Load Model
    const loader = new GLTFLoader();
    const loadingOverlay = root.querySelector("#loading-overlay");

    loader.load('3D/Fady.glb', (gltf) => {
      const model = gltf.scene;
      
      // Center and scale model if needed
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim; // Normalize size to about 3 units tall
      model.scale.setScalar(scale);
      
      model.position.sub(center.multiplyScalar(scale)); // Center it
      model.position.y += 1.5; // Lift up
      
      scene.add(model);
      
      // Build mesh-to-bodypart map dynamically at runtime
      buildMeshMap(model);
      
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);
      }
    }, undefined, (error) => {
      console.error('An error happened loading the 3D model:', error);
      if (loadingOverlay) {
        loadingOverlay.innerHTML = '<div style="color:var(--danger)">Error loading 3D model. Please try again.</div>';
      }
    });

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedMesh = null;
    let pendingPrompt = "";

    const selectionNameOverlay = root.querySelector("#selection-name-overlay");
    const hintOverlay = root.querySelector("#hint-overlay");
    const nameAr = root.querySelector("#selection-name-ar");
    const nameEn = root.querySelector("#selection-name-en");
    const confirmBtn = root.querySelector("#confirm-selection-btn");

    // ============================================================
    // Body-part name translations
    // Keys are LOWERCASE base names (without side suffix)
    // ============================================================
    const bodyPartLabels = {
      "belly":  { ar: "البطن",   en: "Belly" },
      "chest":  { ar: "الصدر",   en: "Chest" },
      "neck":   { ar: "الرقبة",  en: "Neck" },
      "head":   { ar: "الرأس",   en: "Head" },
      "arm":    { ar: "الذراع",  en: "Arm" },
      "thigh":  { ar: "الفخذ",   en: "Thigh" },
      "leg":    { ar: "الساق",   en: "Leg" },
      "back":   { ar: "الظهر",   en: "Back" },
      "pelvis": { ar: "الحوض",   en: "Pelvis" }
    };

    // This map is populated at runtime: mesh.uuid → { ar, en }
    const meshToLabel = {};

    function buildMeshMap(model) {
      // Three.js GLTFLoader removes dots from names:
      // "Belly.r" → "Bellyr", "Back.l" → "Backl", etc.
      // We need to extract the base part name and side from these.
      
      model.traverse((obj) => {
        const name = obj.name || "";
        
        // Try to extract a body-part base name from this node's name
        // e.g. "Bellyr" → base="belly", side="r"
        // e.g. "Neck" → base="neck", side=null
        // e.g. "pelvis" → base="pelvis", side=null
        let matchedBase = null;
        let side = null;
        const lower = name.toLowerCase();
        
        for (const key of Object.keys(bodyPartLabels)) {
          if (lower === key) {
            // Exact match: "pelvis", "neck", "head"
            matchedBase = key;
            side = null;
            break;
          }
          if (lower === key + "l") {
            // Left side: "bellyl", "backl", "chestl"
            matchedBase = key;
            side = "l";
            break;
          }
          if (lower === key + "r") {
            // Right side: "bellyr", "backr", "chestr"
            matchedBase = key;
            side = "r";
            break;
          }
        }
        
        if (matchedBase) {
          // Found a body-part node! Now map ALL child meshes to it
          const labels = bodyPartLabels[matchedBase];
          let arName = labels.ar;
          let enName = labels.en;
          
          if (side === "l") {
            arName += " (الأيسر)";
            enName = "Left " + enName;
          } else if (side === "r") {
            arName += " (الأيمن)";
            enName = "Right " + enName;
          }
          
          const label = { ar: arName, en: enName };
          
          // Map this node itself (if it's a mesh)
          if (obj.isMesh) {
            meshToLabel[obj.uuid] = label;
          }
          
          // Map all child meshes under this node
          obj.traverse((child) => {
            if (child.isMesh) {
              meshToLabel[child.uuid] = label;
            }
          });
        }
      });
      
      console.log("Mesh map built:", Object.keys(meshToLabel).length, "meshes mapped");
    }

    // Resolve the display name for any clicked mesh
    function resolvePartName(clickedMesh) {
      // Look up by UUID (built at model load time)
      if (meshToLabel[clickedMesh.uuid]) {
        return meshToLabel[clickedMesh.uuid];
      }
      
      // Fallback: return the raw mesh name
      const name = clickedMesh.name || "Unknown";
      return { ar: name, en: name };
    }

    function onMouseClick(event) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const firstHit = intersects.find(hit => hit.object.isMesh);
        if (firstHit) {
          // Stop auto rotation when user interacts
          controls.autoRotate = false;

          if (selectedMesh) {
            // Reset previous mesh emissive
            if (selectedMesh.material && selectedMesh.material.emissive) {
              selectedMesh.material.emissive.setHex(0x000000);
            }
          }
          
          selectedMesh = firstHit.object;
          
          // Highlight new mesh
          if (selectedMesh.material && selectedMesh.material.emissive) {
            if (!selectedMesh.userData.materialCloned) {
              selectedMesh.material = selectedMesh.material.clone();
              selectedMesh.userData.materialCloned = true;
            }
            selectedMesh.material.emissive.setHex(0x06b6d4);
            selectedMesh.material.emissiveIntensity = 0.6;
          }

          // Find the correct body part name by walking up hierarchy
          const resolved = resolvePartName(selectedMesh);

          nameAr.textContent = resolved.ar;
          nameEn.textContent = resolved.en;
          
          pendingPrompt = (currentLang === "ar")
            ? ("أشعر بألم في الـ " + resolved.ar + "، ما الذي يجب علي فعله؟")
            : ("I feel pain in the " + resolved.en + ", what should I do?");
            
          selectionNameOverlay.style.display = "block";
          confirmBtn.style.display = "block";
          if (hintOverlay) hintOverlay.style.opacity = "0";
        }
      }
    }

    container.addEventListener('click', onMouseClick);

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (pendingPrompt) {
          sessionStorage.setItem("initial_prompt", pendingPrompt);
          window.location.hash = "#/chatbot";
        }
      });
    }

    // Animation Loop
    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle Resize
    function onWindowResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onWindowResize);

    // Cleanup on route change
    const cleanup = () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onWindowResize);
      container.removeEventListener('click', onMouseClick);
      renderer.dispose();
      document.removeEventListener("routechange", cleanup);
    };
    document.addEventListener("routechange", cleanup);

  } catch (err) {
    console.error("Failed to initialize 3D scene:", err);
    const loadingOverlay = root.querySelector("#loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.innerHTML = '<div style="color:var(--danger)">Failed to initialize 3D viewer. Check internet connection for Three.js import.</div>';
    }
  }
}
