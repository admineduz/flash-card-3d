// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- INJECT TAILWIND, THREE.JS & CUSTOM STYLES ---
const injectSetup = (onThreeLoaded) => {
  // 1. Inject Tailwind
  if (!document.getElementById('tailwind-cdn')) {
    const script = document.createElement('script');
    script.id = 'tailwind-cdn';
    script.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(script);
  }

  // 2. Inject Three.js
  if (!document.getElementById('three-cdn')) {
    const script = document.createElement('script');
    script.id = 'three-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => onThreeLoaded(true);
    document.head.appendChild(script);
  } else {
    if (window.THREE) onThreeLoaded(true);
  }

  // 3. Inject Custom Styles
  if (!document.getElementById('custom-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-styles';
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@600;800&display=swap');
      body {
        font-family: 'Nunito', sans-serif; margin: 0; overflow: hidden;
        background: radial-gradient(circle at center, #2d3748 0%, #1a202c 100%);
      }
      .title-font { font-family: 'Fredoka One', cursive; }
      .scanner-frame {
        position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%);
        width: 80vw; height: 80vw; max-width: 350px; max-height: 350px;
        pointer-events: none; transition: opacity 0.5s;
      }
      .scanner-corner {
        position: absolute; width: 40px; height: 40px;
        border-color: #4ade80; border-style: solid; border-width: 0;
      }
      .tl { top: 0; left: 0; border-top-width: 4px; border-left-width: 4px; border-top-left-radius: 12px; }
      .tr { top: 0; right: 0; border-top-width: 4px; border-right-width: 4px; border-top-right-radius: 12px; }
      .bl { bottom: 0; left: 0; border-bottom-width: 4px; border-left-width: 4px; border-bottom-left-radius: 12px; }
      .br { bottom: 0; right: 0; border-bottom-width: 4px; border-right-width: 4px; border-bottom-right-radius: 12px; }
      .scan-line {
        position: absolute; top: 0; left: 0; width: 100%; height: 2px;
        background: rgba(74, 222, 128, 0.8); box-shadow: 0 0 15px rgba(74, 222, 128, 0.9);
        animation: scan 2s linear infinite;
      }
      @keyframes scan {
        0% { top: 0%; opacity: 0; } 10% { opacity: 1; }
        90% { opacity: 1; } 100% { top: 100%; opacity: 0; }
      }
      @keyframes popIn {
        0% { transform: scale(0.5) translateY(50px); opacity: 0; }
        60% { transform: scale(1.2) translateY(-10px); opacity: 1; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      .animate-pop { animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      .nav-btn { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
      .nav-btn:active { transform: scale(0.9); }
      .loader {
        border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #34d399;
        border-radius: 50%; width: 40px; height: 40px;
        animation: spin 1s linear infinite; position: absolute;
        top: calc(50% - 20px); left: calc(50% - 20px); z-index: 5;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }
};

// --- DATA: VOCABULARY & SVGs ---
const knightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#cbd5e1"/><stop offset="50%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#475569"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><rect width="400" height="400" fill="url(#bg)"/><path d="M 200 40 Q 250 20 280 90 Q 200 80 200 40" fill="#ef4444"/><path d="M 120 120 C 120 40, 280 40, 280 120 L 280 280 C 280 340, 120 340, 120 280 Z" fill="url(#metal)"/><path d="M 100 160 C 200 200, 200 200, 300 160 L 290 260 C 200 300, 200 300, 110 260 Z" fill="#e2e8f0"/><path d="M 130 190 L 270 190" stroke="#1e293b" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M 140 220 L 260 220" stroke="#1e293b" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M 150 250 L 250 250" stroke="#1e293b" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="110" cy="160" r="12" fill="url(#gold)"/><circle cx="290" cy="160" r="12" fill="url(#gold)"/></svg>`;
const cupSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient><linearGradient id="gold2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#eab308"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs><rect width="400" height="400" fill="url(#bg2)"/><path d="M 120 340 L 280 340 L 280 370 L 120 370 Z" fill="#475569"/><path d="M 150 300 L 250 300 L 250 340 L 150 340 Z" fill="#94a3b8"/><path d="M 180 200 L 220 200 L 220 300 L 180 300 Z" fill="url(#gold2)"/><path d="M 100 120 C 20 120, 20 200, 100 200" fill="none" stroke="url(#gold2)" stroke-width="20" stroke-linecap="round"/><path d="M 300 120 C 380 120, 380 200, 300 200" fill="none" stroke="url(#gold2)" stroke-width="20" stroke-linecap="round"/><path d="M 100 80 C 100 200, 300 200, 300 80 Z" fill="url(#gold2)"/><rect x="80" y="60" width="240" height="20" rx="10" fill="#fef08a"/><path d="M 200 110 L 210 135 L 240 135 L 215 150 L 225 180 L 200 160 L 175 180 L 185 150 L 160 135 L 190 135 Z" fill="#fef08a"/></svg>`;

const vocabData = [
  { id: 'knight', word: 'Knight', phonetic: '/naɪt/', vi: 'Hiệp sĩ', img: 'data:image/svg+xml;utf8,' + encodeURIComponent(knightSvg) },
  { id: 'horse', word: 'Horse', phonetic: '/hɔːrs/', vi: 'Con ngựa', img: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400&q=60' },
  { id: 'castle', word: 'Castle', phonetic: '/ˈkæsl/', vi: 'Lâu đài', img: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=400&q=60' },
  { id: 'cup', word: 'Cup', phonetic: '/kʌp/', vi: 'Chiếc cúp', img: 'data:image/svg+xml;utf8,' + encodeURIComponent(cupSvg) },
  { id: 'tent', word: 'Tent', phonetic: '/tent/', vi: 'Cái lều', img: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=400&q=60' },
  { id: 'sun', word: 'Sun', phonetic: '/sʌn/', vi: 'Mặt trời', img: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=400&q=60' }
];

export default function App() {
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewState, setViewState] = useState('2d'); // '2d' | 'scanning' | '3d'
  const [imgLoading, setImgLoading] = useState(true);
  const [currentImgSrc, setCurrentImgSrc] = useState('');
  const [webglSupported, setWebglSupported] = useState(true);

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const groupRef = useRef(null);
  const reqAnimRef = useRef(null);
  const scaleIntervalRef = useRef(null);
  const scanTimeout1 = useRef(null);
  const scanTimeout2 = useRef(null);

  const currentItem = vocabData[currentIndex];

  // --- AUDIO LOGIC ---
  const playAudio = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      (v.lang.includes('en') && v.name.includes('Samantha')) || 
      (v.lang.includes('en') && v.name.includes('Zira')) ||
      (v.lang.includes('en') && v.name.includes('Google') && v.name.includes('Female')) ||
      (v.lang.includes('en') && v.gender === 'female')
    );
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  // --- IMAGE LOADER ---
  useEffect(() => {
    setImgLoading(true);
    const img = new Image();
    img.onload = () => {
      setCurrentImgSrc(item.img);
      setImgLoading(false);
    };
    img.onerror = () => {
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#334155"/><text x="50%" y="50%" font-family="sans-serif" font-size="64" font-weight="bold" fill="#34d399" text-anchor="middle" dominant-baseline="middle">${currentItem.word}</text></svg>`;
      setCurrentImgSrc('data:image/svg+xml;utf8,' + encodeURIComponent(fallbackSvg));
      setImgLoading(false);
    };
    const item = vocabData[currentIndex];
    img.src = item.img;
    
    // Đảm bảo load giọng nói
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
  }, [currentIndex]);

  // --- INITIALIZE SETUP & THREE.JS ---
  useEffect(() => {
    injectSetup(setThreeLoaded);
  }, []);

  useEffect(() => {
    if (!threeLoaded || !mountRef.current) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.5, 8);
    sceneRef.current = scene;
    cameraRef.current = camera;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.error("WebGL Error:", e);
      setWebglSupported(false);
      return;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffd700, 0.6, 10);
    pointLight.position.set(-2, 3, 2);
    scene.add(pointLight);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.01;
        groupRef.current.position.y = -1 + Math.sin(Date.now() * 0.003) * 0.1;
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [threeLoaded]);

  // --- BUILD 3D MODEL ---
  const buildModel = useCallback((id) => {
    if (!window.THREE) return null;
    const THREE = window.THREE;
    const group = new THREE.Group();
    const materialGold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.2 });
    const materialSilver = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.8, roughness: 0.3 });
    const materialBrown = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const materialDarkBrown = new THREE.MeshStandardMaterial({ color: 0x5c2e0e, roughness: 0.9 });
    const materialRed = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 });
    const materialStone = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9 });
    const materialBlack = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const materialWhiteFabric = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 1.0 });

    switch(id) {
      case 'knight':
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 1.2, 16), materialSilver);
        body.position.y = 0.6; body.castShadow = true; group.add(body);
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16), materialSilver);
        head.position.y = 1.6; head.castShadow = true; group.add(head);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.5), materialGold);
        visor.position.set(0, 1.6, 0.2); group.add(visor);
        const plume = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.6), materialRed);
        plume.position.set(0, 2.1, -0.1); group.add(plume);
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8), materialSilver);
        armL.position.set(-0.8, 0.8, 0); armL.rotation.z = Math.PI / 4; group.add(armL);
        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8), materialSilver);
        armR.position.set(0.8, 0.8, 0); armR.rotation.z = -Math.PI / 4; group.add(armR);
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), materialSilver);
        sword.position.set(1.1, 0.8, 0.2); sword.rotation.x = Math.PI / 2; group.add(sword);
        const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.12), materialGold);
        crossguard.position.set(1.1, 0.8, -0.1); crossguard.rotation.x = Math.PI / 2; group.add(crossguard);
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), materialRed);
        shield.position.set(-1.0, 0.8, 0.2); shield.rotation.x = Math.PI / 2; shield.rotation.y = -Math.PI / 6; group.add(shield);
        break;
      case 'horse':
        const hBody = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.8, 16), materialBrown);
        hBody.rotation.x = Math.PI / 2; hBody.position.y = 1.2; hBody.castShadow = true; group.add(hBody);
        const hNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.0, 16), materialBrown);
        hNeck.position.set(0, 1.8, 0.8); hNeck.rotation.x = Math.PI / 6; group.add(hNeck);
        const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.8), materialBrown);
        hHead.position.set(0, 2.2, 1.1); hHead.rotation.x = Math.PI / 12; group.add(hHead);
        const mane = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.3), materialDarkBrown);
        mane.position.set(0, 2.0, 0.6); mane.rotation.x = Math.PI / 6; group.add(mane);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.2), materialDarkBrown);
        tail.position.set(0, 1.2, -0.9); tail.rotation.x = -Math.PI / 8; group.add(tail);
        for(let i=0; i<4; i++) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 1.0), materialBrown);
          leg.position.set(i%2 === 0 ? 0.3 : -0.3, 0.5, i<2 ? 0.6 : -0.6); group.add(leg);
        }
        break;
      case 'castle':
        const base = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), materialStone);
        base.position.y = 0.75; base.castShadow = true; group.add(base);
        const gate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.1), materialDarkBrown);
        gate.position.set(0, 0.4, 1.01); group.add(gate);
        for(let i=0; i<4; i++) {
          const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), materialStone);
          tooth1.position.set(-0.85 + i*0.56, 1.65, 0.85); group.add(tooth1);
          const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), materialStone);
          tooth2.position.set(-0.85 + i*0.56, 1.65, -0.85); group.add(tooth2);
        }
        [[1.2,1.2], [1.2,-1.2], [-1.2,1.2], [-1.2,-1.2]].forEach(pos => {
          const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.5, 16), materialStone);
          tower.position.set(pos[0], 1.25, pos[1]); tower.castShadow = true; group.add(tower);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1, 16), materialRed);
          roof.position.set(pos[0], 3.0, pos[1]); group.add(roof);
        });
        break;
      case 'cup':
        const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.3, 1.2, 32), materialGold);
        cupBody.position.y = 1.5; cupBody.castShadow = true; group.add(cupBody);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16), materialGold);
        stem.position.y = 0.6; group.add(stem);
        const baseCup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32), materialGold);
        baseCup.position.y = 0.15; group.add(baseCup);
        const hGeo = new THREE.TorusGeometry(0.35, 0.08, 16, 50);
        const h1 = new THREE.Mesh(hGeo, materialGold); h1.position.set(0.65, 1.4, 0); group.add(h1);
        const h2 = new THREE.Mesh(hGeo, materialGold); h2.position.set(-0.65, 1.4, 0); group.add(h2);
        break;
      case 'tent':
        const tentBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.5, 8), materialWhiteFabric);
        tentBase.position.y = 0.75; tentBase.castShadow = true; group.add(tentBase);
        const tentRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.5, 8), materialRed);
        tentRoof.position.y = 2.25; tentRoof.castShadow = true; group.add(tentRoof);
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.1), materialBlack);
        door.position.set(0, 0.6, 1.46); group.add(door);
        const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), materialDarkBrown);
        flagPole.position.y = 3.4; group.add(flagPole);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.05), materialGold);
        flag.position.set(0.3, 3.6, 0); group.add(flag);
        break;
      case 'sun':
        const matSun = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 0.6 });
        const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), matSun);
        sun.position.y = 1.5; group.add(sun);
        const rayGeo = new THREE.ConeGeometry(0.15, 0.8, 8);
        const createRay = (x, y, z) => {
          const ray = new THREE.Mesh(rayGeo, matSun);
          const dir = new THREE.Vector3(x, y, z).normalize();
          ray.position.copy(dir).multiplyScalar(1.2); 
          ray.position.y += 1.5; 
          ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          group.add(ray);
        };
        for(let i=0; i<12; i++) { const a = (i/12)*Math.PI*2; createRay(Math.cos(a), 0, Math.sin(a)); }
        for(let i=0; i<8; i++) { const a = (i/8)*Math.PI*2; createRay(Math.cos(a), 0.8, Math.sin(a)); }
        for(let i=0; i<8; i++) { const a = (i/8)*Math.PI*2; createRay(Math.cos(a), -0.8, Math.sin(a)); }
        createRay(0, 1, 0); createRay(0, -1, 0);
        break;
    }
    group.scale.set(1.4, 1.4, 1.4);
    group.position.y = -1;
    return group;
  }, []);

  // --- ACTIONS ---
  const resetState = () => {
    clearTimeout(scanTimeout1.current);
    clearTimeout(scanTimeout2.current);
    clearInterval(scaleIntervalRef.current);
    window.speechSynthesis?.cancel();
    
    if (groupRef.current && sceneRef.current && webglSupported) {
      sceneRef.current.remove(groupRef.current);
      groupRef.current = null;
    }
    setViewState('2d');
  };

  const handleNext = () => {
    resetState();
    setCurrentIndex((prev) => (prev + 1) % vocabData.length);
  };

  const handlePrev = () => {
    resetState();
    setCurrentIndex((prev) => (prev - 1 + vocabData.length) % vocabData.length);
  };

  const startAR = () => {
    setViewState('scanning');
    
    if (webglSupported && sceneRef.current) {
      groupRef.current = buildModel(currentItem.id);
      groupRef.current.scale.set(0, 0, 0);
      sceneRef.current.add(groupRef.current);
    }

    scanTimeout1.current = setTimeout(() => {
      setViewState('3d');
      
      if (webglSupported && groupRef.current) {
        let currentScale = 0;
        scaleIntervalRef.current = setInterval(() => {
          currentScale += 0.1;
          if (currentScale >= 1.4) {
            currentScale = 1.4;
            clearInterval(scaleIntervalRef.current);
          }
          groupRef.current.scale.set(currentScale, currentScale, currentScale);
        }, 20);
      }

      scanTimeout2.current = setTimeout(() => {
        // Play Audio after popup
        playAudio(currentItem.word);
      }, 300);

    }, 1200);
  };

  return (
    <div className="text-slate-800 flex flex-col h-screen select-none relative">
      
      {/* CANVAS CONTAINER */}
      <div 
        ref={mountRef} 
        className="absolute top-0 left-0 w-full h-full z-0"
      >
        {!webglSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white font-bold bg-[#1a202c]">
            <span className="text-4xl mb-4">⚠️</span>
            <p className="text-xl text-red-400">Thiết bị không hỗ trợ 3D (WebGL).</p>
          </div>
        )}
      </div>
      
      {/* OVERLAY UI */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* HEADER */}
        <div className="w-full p-4 md:p-6 flex justify-between items-center pointer-events-auto">
          <h1 className="title-font text-xl md:text-2xl text-emerald-400 drop-shadow-md">
            Flashcard <span className="text-amber-400">3D</span>
          </h1>
          <div className="bg-white/20 text-white font-bold px-4 py-2 rounded-full backdrop-blur-md border border-white/30 text-sm md:text-base">
            {currentIndex + 1} / {vocabData.length}
          </div>
        </div>

        {/* MIDDLE: Image / Scanner */}
        <div className="flex-grow relative flex items-center justify-between px-2 md:px-12 pointer-events-none">
          <button onClick={handlePrev} className="nav-btn pointer-events-auto bg-white/10 hover:bg-white/30 border border-white/20 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-3xl shadow-lg transition-all z-20">
            ❮
          </button>

          {/* 2D Image View */}
          {viewState === '2d' && (
            <div 
              className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 w-full z-10" 
              onClick={startAR}
            >
              <div className="w-[55vw] h-[55vw] max-w-[280px] max-h-[280px] md:max-w-[350px] md:max-h-[350px] rounded-3xl overflow-hidden border-[6px] border-white shadow-2xl relative bg-slate-800 flex items-center justify-center group">
                {imgLoading && <div className="loader"></div>}
                <img 
                  src={currentImgSrc} 
                  alt={currentItem.word} 
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 relative z-10 ${imgLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`} 
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <div className="bg-emerald-500 text-white font-bold px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg flex items-center gap-2 text-sm md:text-lg">
                    <span>🪄</span> Quét 3D
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-6 bg-white/10 backdrop-blur-md px-4 md:px-6 py-2 rounded-full border border-white/20 animate-pulse shadow-lg">
                <p className="text-emerald-300 font-bold text-xs md:text-base tracking-wide">👆 Chạm vào hình để xem 3D</p>
              </div>
            </div>
          )}

          {/* Scanner View */}
          {(viewState === 'scanning' || viewState === '3d') && (
            <div className={`scanner-frame z-10 ${viewState === '3d' ? 'opacity-30' : 'opacity-100 block'}`}>
              <div className="scanner-corner tl"></div>
              <div className="scanner-corner tr"></div>
              <div className="scanner-corner bl"></div>
              <div className="scanner-corner br"></div>
              {viewState === 'scanning' && <div className="scan-line"></div>}
            </div>
          )}

          <button onClick={handleNext} className="nav-btn pointer-events-auto bg-white/10 hover:bg-white/30 border border-white/20 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-3xl shadow-lg transition-all z-20">
            ❯
          </button>
        </div>

        {/* FOOTER */}
        <div className="pointer-events-auto text-center pb-8 md:pb-10 flex flex-col items-center">
          <h2 
            className={`title-font text-5xl md:text-8xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mb-1 md:mb-2 uppercase tracking-wider transition-opacity duration-300 ${viewState === 'scanning' ? 'opacity-0' : viewState === '3d' ? 'animate-pop opacity-100' : 'opacity-100'}`} 
            style={{ WebkitTextStroke: '2px #222' }}
          >
            {currentItem.word}
          </h2>
          
          <p className={`text-xl md:text-2xl text-emerald-300 font-mono mb-1 transition-opacity duration-300 drop-shadow-md tracking-widest ${viewState === '3d' || viewState === '2d' ? 'opacity-100' : 'opacity-0'}`}>
            {currentItem.phonetic}
          </p>
          
          <p className={`text-xl md:text-3xl text-amber-300 font-bold transition-opacity duration-300 drop-shadow-md ${viewState === '3d' || viewState === '2d' ? 'opacity-100' : 'opacity-0'}`}>
            {currentItem.vi}
          </p>
          
          <button 
            onClick={() => playAudio(currentItem.word)} 
            className={`mt-4 md:mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-[0_5px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-[5px] transition-all flex items-center gap-2 text-sm md:text-base ${viewState === '3d' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
          >
            <span className="text-lg md:text-xl">🔊</span> Nghe Lại
          </button>
        </div>

      </div>
    </div>
  );
}