import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { animated } from '@react-spring/three'
import { YearAchievements } from '@/lib/achievements-parser'

/**
 * Timeline3D - Interaktywny timeline 3D z tablicami osiągnięć dla każdego roku.
 * @param {YearAchievements[]} data - Tablica lat z osiągnięciami
 */
export function Timeline3D({ data }: { data: YearAchievements[] }) {
  // Rozmieszczenie tablic wzdłuż osi X
  const spacing = 6
  return (
    <Canvas camera={{ position: [0, 10, 40], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <Suspense fallback={<Html>Ładowanie...</Html>}>
        {data.map((year, idx) => (
          <animated.mesh
            key={year.year}
            position={[idx * spacing, 0, 0]}
            scale={[1, 1, 1]}
            // TODO: Add morph/physics animation on hover/click
          >
            <boxGeometry args={[4, 2, 0.5]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFF8DC" />
            <Html center style={{ pointerEvents: 'auto', width: 220 }}>
              <div className="bg-white/80 rounded-lg p-2 shadow-lg text-xs">
                <strong>{year.year}</strong>
                <ul>
                  {year.achievements.map((a, i) => (
                    <li key={i}>
                      <span className="font-bold">{a.title}</span> — {a.category} ({a.place}) <br />
                      <span className="text-gray-600">Coeff: {a.coeff} | Kon: {a.kon}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Html>
          </animated.mesh>
        ))}
        <OrbitControls enablePan enableZoom enableRotate />
      </Suspense>
    </Canvas>
  )
}
