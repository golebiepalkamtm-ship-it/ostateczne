'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { YearAchievements } from '@/lib/achievements-parser';

type Timeline3DProps = {
  data: YearAchievements[];
  onYearSelect?: (year: number) => void;
};

type YearMesh = THREE.Mesh & {
  userData: {
    year?: number;
  };
};

type CardEntry = {
  group: THREE.Group;
  core: THREE.Mesh;
  glow: THREE.Mesh;
  sprite: THREE.Sprite;
  year: number;
  t: number;
  basePosition: THREE.Vector3;
  hover: number;
};

mapboxgl.accessToken =
  'pk.eyJ1IjoibWFudGF4IiwiYSI6ImNtZmk5em1peDBnM3gyanFxcHpnZmtlZHgifQ.W2AbB_7HQqqBBJ72AGIxXg';

type LngLatTuple = [number, number];

const ROUTE_ANCHORS: LngLatTuple[] = [
  [15.293, 51.118], // Lubań
  [16.165, 51.108], // Legnica
  [17.034, 51.110], // Wrocław
  [18.400, 51.400], // Opole region
  [19.455, 51.759], // Łódź
  [20.985, 52.230], // Warszawa
  [21.850, 52.675], // Siedlce area
  [22.985, 53.135], // Białystok
  [23.750, 52.400], // Grodno area
];

function densifyRoute(anchors: LngLatTuple[], segmentsPerLeg = 28): LngLatTuple[] {
  const samples: LngLatTuple[] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const start = anchors[i];
    const end = anchors[i + 1];
    for (let j = 0; j < segmentsPerLeg; j++) {
      const t = j / segmentsPerLeg;
      samples.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }
  samples.push(anchors[anchors.length - 1]);
  return samples;
}

export function Timeline3D({ data, onYearSelect }: Timeline3DProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const threeContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox-map-design/ckhqrf2tz0dt119ny6azh975y',
      center: [19.94, 50.06],
      zoom: 8.5,
      bearing: -25,
      pitch: 70,
      attributionControl: false,
      antialias: true,
    });

    map.on('load', () => {
      try {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });

        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      } catch (err) {
        console.error('Error configuring map layers:', err);
      }
      
      // Set ready immediately after load, don't wait for idle
      setMapReady(true);
    });

    map.on('error', (e) => {
      console.error('Mapbox error:', e);
      // Force ready on error to show at least the 3D content
      setMapReady(true);
    });

    // Fallback timeout to ensure 3D always loads
    const timer = setTimeout(() => {
      setMapReady((prev) => {
        if (!prev) {
          console.warn('Mapbox initialization timed out, forcing 3D render');
          return true;
        }
        return prev;
      });
    }, 2000);

    mapRef.current = map;
    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, []);


  useEffect(() => {
    const container = threeContainerRef.current;
    const map = mapRef.current;
    
    // Proceed if container exists. Map is optional now (handled by fallbacks).
    // Only block if mapReady is false AND we haven't timed out yet, 
    // but since we force mapReady=true on timeout/error, simply checking mapReady is enough?
    // Actually, we should allow rendering even if map is null, as long as mapReady signal was given.
    if (!container) {
      console.warn('Timeline3D: No container ref');
      return;
    }

    if (!mapReady) {
      console.warn('Timeline3D: Map not ready, but proceeding with fallback rendering');
    }

    console.log('Initializing Timeline3D scene...', { hasMap: !!map, dataLength: data.length });

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    if (width === 0 || height === 0) {
      console.error('Timeline3D: Container has 0 dimensions');
      return;
    }

    const scene = new THREE.Scene();


    scene.fog = new THREE.FogExp2(0x01030b, 0.008);

    const gradientTexture = new THREE.CanvasTexture(
      (() => {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, 0, 2);
          gradient.addColorStop(0, '#020617');
          gradient.addColorStop(0.5, '#040b1f');
          gradient.addColorStop(1, '#000000');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 2, 2);
        }
        return canvas;
      })()
    );
    gradientTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = gradientTexture;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 800);
    camera.position.set(0, 18, 45);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Set clear color to something visible for debugging if texture fails
    renderer.setClearColor(0x000033, 1);
    container.appendChild(renderer.domElement);

    // Add a simple cube to verify basic rendering if everything else fails
    const debugCube = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    );
    debugCube.position.set(0, 10, 0);
    // scene.add(debugCube); // Uncomment to debug basic rendering

    const composer = new EffectComposer(renderer);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.2,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.1;
    bloomPass.radius = 0.8;
    composer.addPass(bloomPass);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(30, 40, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 120;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    rimLight.position.set(-25, 25, -30);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(0x2563eb, 1.4, 300, 2);
    underGlow.position.set(0, -15, -40);
    scene.add(underGlow);

    // Background layers
    const parallaxGroup = new THREE.Group();
    scene.add(parallaxGroup);

    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    for (let i = 0; i < 4; i++) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 40, 40), gridMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(0, -12 - i * 8, -i * 40);
      parallaxGroup.add(plane);
    }

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 400;
      starPositions[i + 1] = Math.random() * 120 - 20;
      starPositions[i + 2] = -Math.random() * 400;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Road curve from Mapbox terrain or fallback
    let routePoints: THREE.Vector3[] = [];

    if (mapReady && map) {
      try {
        const routeSamples = densifyRoute(ROUTE_ANCHORS, 32);

        const getMercator = (lng: number, lat: number) =>
          mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, 0);

        const originCoord = getMercator(routeSamples[0][0], routeSamples[0][1]);
        const meterScale = 420000;
        const altitudeScale = 0.12;

        let lastElevation = 0;
        routeSamples.forEach(([lng, lat]) => {
          const merc = getMercator(lng, lat);
          const elevation =
            map.queryTerrainElevation
              ? map.queryTerrainElevation({ lng, lat }, { exaggerated: true }) ?? lastElevation
              : 0;
          lastElevation = elevation;

          routePoints.push(
            new THREE.Vector3(
              (merc.x - originCoord.x) * meterScale,
              elevation * altitudeScale,
              -(merc.y - originCoord.y) * meterScale
            )
          );
        });
      } catch (e) {
        console.error('Error creating map route points:', e);
      }
    }

    if (routePoints.length < 2) {
      // Pure Three.js fallback – create a synthetic zig-zag path along Z axis
      routePoints = data.map((_, index) => {
        const isLeft = index % 2 === 0;
        const x = isLeft ? -14 : 14;
        const y = Math.sin(index * 0.45) * 4 + 2;
        const z = -index * 28;
        return new THREE.Vector3(x, y, z);
      });

      if (routePoints.length < 2) {
        routePoints = [new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, -35)];
      }
    }

    const curve = new THREE.CatmullRomCurve3(routePoints, false, 'centripetal');
    const roadGeometry = new THREE.TubeGeometry(curve, routePoints.length * 4, 1.5, 64, false);
    const roadMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#1d4ed8') },
        uColorB: { value: new THREE.Color('#a855f7') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec2 vUv;

        void main() {
          float glow = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          float pulse = sin((vUv.x + uTime * 0.8) * 18.0) * 0.5 + 0.5;
          vec3 color = mix(uColorA, uColorB, vUv.x + pulse * 0.15);
          color += glow * 0.6;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false,
    });

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.receiveShadow = true;
    scene.add(road);

    const laneGeometry = new THREE.TubeGeometry(curve, routePoints.length * 2, 0.05, 12, false);
    const laneMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
    });
    const lane = new THREE.Mesh(laneGeometry, laneMaterial);
    scene.add(lane);

    // Card creation helpers
    const spriteCache: Record<number, THREE.SpriteMaterial> = {};
    const createYearSprite = (year: number) => {
      if (spriteCache[year]) return spriteCache[year];
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 20;
        ctx.strokeRect(40, 40, size - 80, size - 80);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 200px "Space Grotesk", system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(year), size / 2, size / 2 - 40);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '52px "Space Grotesk", system-ui';
        ctx.fillText('PAŁKA MTM', size / 2, size / 2 + 120);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      spriteCache[year] = mat;
      return mat;
    };

    const cardEntries: CardEntry[] = [];
    const interactiveMeshes: YearMesh[] = [];
    const yearLookup = new Map<number, YearAchievements>();
    data.forEach((yearData) => yearLookup.set(yearData.year, yearData));

    data.forEach((yearData, index) => {
      const normalized = data.length > 1 ? index / (data.length - 1) : 0.5;
      const tOnCurve = THREE.MathUtils.lerp(0.04, 0.97, normalized);

      const centerPoint = curve.getPoint(tOnCurve);
      const tangent = curve.getTangent(tOnCurve).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const sideways = new THREE.Vector3().crossVectors(up, tangent).normalize();

      const direction = index % 2 === 0 ? 1 : -1;
      const lateralDistance = 14 + Math.sin(tOnCurve * Math.PI * 1.5) * 2.5;
      const cardOffset = sideways.clone().multiplyScalar(lateralDistance * direction);
      const heightOffset = up.clone().multiplyScalar(Math.sin(tOnCurve * Math.PI * 2) * 3.5 + 1.5);
      const depthOffset = tangent.clone().multiplyScalar(direction * 3.5);
      const cardPosition = centerPoint.clone().add(cardOffset).add(heightOffset).add(depthOffset);

      const group = new THREE.Group();
      group.position.copy(cardPosition);
      const lookTarget = centerPoint.clone().add(tangent.clone().multiplyScalar(15));
      group.lookAt(lookTarget);

      const baseColor = new THREE.Color(
        yearData.achievements.length >= 3 ? '#facc15' : '#38bdf8'
      );

      const cardGeometry = new RoundedBoxGeometry(6.5, 4.2, 0.8, 12, 0.6);
      const cardMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.05,
        roughness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.01,
        transmission: 0.95,
        thickness: 1.4,
        envMapIntensity: 1.6,
        iridescence: 1,
        iridescenceIOR: 1.2,
        iridescenceThicknessRange: [180, 420],
        emissive: baseColor.clone().multiplyScalar(0.2),
        emissiveIntensity: 0.55,
      });
      const cardCore = new THREE.Mesh(cardGeometry, cardMaterial);
      cardCore.castShadow = true;
      cardCore.receiveShadow = true;
      group.add(cardCore);

      const glowFrame = new THREE.Mesh(
        new RoundedBoxGeometry(7.2, 4.8, 0.2, 8, 0.7),
        new THREE.MeshBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        })
      );
      glowFrame.position.z = -0.3;
      group.add(glowFrame);

      const sprite = new THREE.Sprite(createYearSprite(yearData.year));
      sprite.scale.set(6.8, 3.6, 1);
      sprite.position.set(0, 0, 0.7);
      const spriteMaterial = sprite.material as THREE.SpriteMaterial;
      spriteMaterial.opacity = 0.92;
      spriteMaterial.blending = THREE.AdditiveBlending;
      group.add(sprite);

      const rimLight = new THREE.PointLight(baseColor, 2.2, 40, 2);
      rimLight.position.set(0, 0, 2);
      group.add(rimLight);

      const coreWithYear = cardCore as YearMesh;
      coreWithYear.userData.year = yearData.year;
      scene.add(group);

      cardEntries.push({
        group,
        core: cardCore,
        glow: glowFrame,
        sprite,
        year: yearData.year,
        t: tOnCurve,
        basePosition: cardPosition.clone(),
        hover: 0,
      });

      interactiveMeshes.push(cardCore);
    });

    const detailCanvas = document.createElement('canvas');
    detailCanvas.width = 1024;
    detailCanvas.height = 768;
    const detailCtx = detailCanvas.getContext('2d');
    const detailTexture = new THREE.CanvasTexture(detailCanvas);
    detailTexture.colorSpace = THREE.SRGBColorSpace;
    const detailPanelMaterial = new THREE.MeshBasicMaterial({
      map: detailTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const detailPanelGeometry = new THREE.PlaneGeometry(20, 12);
    const detailPanel = new THREE.Mesh(detailPanelGeometry, detailPanelMaterial);

    const detailFrame = new THREE.Mesh(
      new THREE.PlaneGeometry(21.5, 13.5),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    detailFrame.position.z = -0.05;

    const detailGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 4),
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    detailGlow.position.y = -7.5;
    detailGlow.rotation.x = -0.3;

    const detailGroup = new THREE.Group();
    const detailWrapper = new THREE.Group();
    detailGroup.add(detailWrapper);
    detailWrapper.add(detailPanel);
    detailWrapper.add(detailFrame);
    detailWrapper.add(detailGlow);
    detailGroup.position.set(0, 6, -20);
    detailGroup.visible = false;
    detailGroup.scale.setScalar(0.001);
    camera.add(detailGroup);
    scene.add(camera);

    const drawDetailPanel = (yearData: YearAchievements) => {
      if (!detailCtx) return;
      detailCtx.clearRect(0, 0, detailCanvas.width, detailCanvas.height);

      const gradient = detailCtx.createLinearGradient(0, 0, detailCanvas.width, detailCanvas.height);
      gradient.addColorStop(0, 'rgba(8,18,36,0.95)');
      gradient.addColorStop(1, 'rgba(2,6,23,0.85)');
      detailCtx.fillStyle = gradient;
      detailCtx.fillRect(0, 0, detailCanvas.width, detailCanvas.height);

      detailCtx.strokeStyle = 'rgba(56,189,248,0.6)';
      detailCtx.lineWidth = 12;
      detailCtx.strokeRect(40, 40, detailCanvas.width - 80, detailCanvas.height - 80);

      detailCtx.fillStyle = '#bae6fd';
      detailCtx.font = 'bold 90px "Space Grotesk", system-ui, sans-serif';
      detailCtx.textAlign = 'left';
      detailCtx.fillText(`Rok ${yearData.year}`, 80, 150);

      detailCtx.fillStyle = '#f8fafc';
      detailCtx.font = '50px "Space Grotesk", system-ui, sans-serif';
      detailCtx.fillText('Najważniejsze osiągnięcia:', 80, 230);

      const list = yearData.achievements.slice(0, 6);
      detailCtx.font = '42px "Space Grotesk", system-ui, sans-serif';
      detailCtx.fillStyle = '#e0f2fe';
      list.forEach((achievement, idx) => {
        const y = 320 + idx * 80;
        detailCtx.fillStyle = '#60a5fa';
        detailCtx.fillText(`${achievement.category}`, 80, y);
        detailCtx.fillStyle = '#f1f5f9';
        detailCtx.fillText(`${achievement.title}`, 360, y);

        detailCtx.fillStyle = '#94a3b8';
        const meta = [
          achievement.place && `Miejsce: ${achievement.place}`,
          achievement.coeff && `Coeff: ${achievement.coeff}`,
          achievement.kon && `Konk.: ${achievement.kon}`,
        ]
          .filter(Boolean)
          .join('   ');
        detailCtx.fillText(meta, 360, y + 42);
      });

      detailCtx.fillStyle = 'rgba(56,189,248,0.2)';
      detailCtx.fillRect(60, 580, detailCanvas.width - 120, 6);

      detailTexture.needsUpdate = true;
    };

    const detailTargetVisibility = { current: 0 };
    const detailVisibility = { current: 0 };

    const setDetailYear = (year: number | null) => {
      if (!year) {
        detailTargetVisibility.current = 0;
        return;
      }
      const yearData = yearLookup.get(year);
      if (!yearData) return;
      detailTargetVisibility.current = 1;
      drawDetailPanel(yearData);
      detailGroup.visible = true;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const selectedYearRef = { current: null as number | null };
    const hoveredYearRef = { current: null as number | null };

    function updatePointerFromEvent(event: PointerEvent | MouseEvent) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    }

    const handlePointerMove = (event: PointerEvent) => {
      updatePointerFromEvent(event);
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(interactiveMeshes, false) as THREE.Intersection<YearMesh>[];
      hoveredYearRef.current = hit?.object.userData.year ?? null;
    };

    const handlePointerLeave = () => {
      hoveredYearRef.current = null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      updatePointerFromEvent(event);
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(interactiveMeshes, false) as THREE.Intersection<YearMesh>[];
      const year = hit?.object.userData.year;
      if (year) {
        selectedYearRef.current = year;
        onYearSelect?.(year);
        setDetailYear(year);
      } else {
        selectedYearRef.current = null;
        setDetailYear(null);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Scroll management (virtual + keyboard)
    const curveLength = curve.getLength();
    const SCROLL_LIMIT = Math.max(2600, curveLength * 30);
    const scrollValue = { current: 0 };
    const scrollTarget = { current: 0 };
    const clampScroll = (value: number) =>
      THREE.MathUtils.clamp(value, 0, SCROLL_LIMIT);

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY;
      scrollTarget.current = clampScroll(scrollTarget.current + delta);
    };
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    const handleKeyDown = (event: KeyboardEvent) => {
      const nextKeys = new Set(['ArrowDown', 'ArrowRight', 'PageDown', 's', 'S', ' ']);
      const prevKeys = new Set(['ArrowUp', 'ArrowLeft', 'PageUp', 'w', 'W']);

      const step = Math.min(window.innerHeight * 0.6, 450);

      if (nextKeys.has(event.key)) {
        event.preventDefault();
        scrollTarget.current = clampScroll(scrollTarget.current + step);
      } else if (prevKeys.has(event.key)) {
        event.preventDefault();
        scrollTarget.current = clampScroll(scrollTarget.current - step);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      scrollValue.current = THREE.MathUtils.lerp(scrollValue.current, scrollTarget.current, 0.12);
      const scrollProgress = scrollValue.current / SCROLL_LIMIT;
      const camT = THREE.MathUtils.lerp(0.05, 0.95, scrollProgress);

      // Camera follow
      const camPoint = curve.getPoint(camT);
      const camAhead = curve.getPoint(Math.min(camT + 0.015, 0.995));
      const desiredPos = camPoint.clone().add(new THREE.Vector3(0, 12, 22));
      camera.position.lerp(desiredPos, 0.08);
      camera.lookAt(camAhead);

      parallaxGroup.position.z = camPoint.z * 0.05;
      stars.rotation.z += 0.0002;

      (roadMaterial.uniforms.uTime as THREE.IUniform).value = elapsed;

      cardEntries.forEach((entry) => {
        const focusDist = Math.abs(entry.t - camT);
        const focusFactor = THREE.MathUtils.clamp(1 - focusDist * 3, 0, 1);
        const isSelected = selectedYearRef.current === entry.year;
        const isHovered = hoveredYearRef.current === entry.year;

        entry.hover = THREE.MathUtils.lerp(entry.hover, isHovered ? 1 : 0, 0.15);

        const scaleTarget = 0.7 + focusFactor * 0.7 + entry.hover * 0.2 + (isSelected ? 0.25 : 0);
        entry.group.scale.lerp(new THREE.Vector3(scaleTarget, scaleTarget, scaleTarget), 0.1);

        const wave = Math.sin(elapsed * 1.8 + entry.t * 60) * 0.6;
        entry.group.position.y = entry.basePosition.y + wave;

        (entry.glow.material as THREE.MeshBasicMaterial).opacity = 0.15 + focusFactor * 0.4 + entry.hover * 0.3;
        (entry.sprite.material as THREE.SpriteMaterial).opacity = 0.6 + focusFactor * 0.4 + entry.hover * 0.2;
      });

      detailVisibility.current = THREE.MathUtils.lerp(
        detailVisibility.current,
        detailTargetVisibility.current,
        0.12
      );
      detailGroup.visible = detailVisibility.current > 0.01;
      if (detailGroup.visible) {
        const hologramScale = 0.2 + detailVisibility.current * 0.8;
        detailGroup.scale.setScalar(hologramScale);
        detailWrapper.rotation.y = Math.sin(elapsed * 0.25) * 0.12;
        detailWrapper.position.y = Math.sin(elapsed * 0.6) * 0.5;
      }

      composer.render();
    }

    animate();

    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

    scene.traverse((obj) => {
      const potentialMesh = obj as THREE.Object3D & {
        geometry?: THREE.BufferGeometry<any>;
        material?: THREE.Material | THREE.Material[];
        isMesh?: boolean;
      };

      if (!potentialMesh.isMesh) return;

      potentialMesh.geometry?.dispose();

      const material = potentialMesh.material;
      if (Array.isArray(material)) {
        material.forEach(mat => mat.dispose());
      } else if (material) {
        material.dispose();
      }
    });

      detailPanelGeometry.dispose();
      detailPanelMaterial.dispose();
      (detailFrame.geometry as THREE.BufferGeometry).dispose();
      (detailFrame.material as THREE.Material).dispose();
      (detailGlow.geometry as THREE.BufferGeometry).dispose();
      (detailGlow.material as THREE.Material).dispose();
      detailTexture.dispose();
      camera.remove(detailGroup);

      renderer.dispose();
      composer.dispose();
    };
  }, [data, onYearSelect, mapReady]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />
      <div
        ref={threeContainerRef}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}
