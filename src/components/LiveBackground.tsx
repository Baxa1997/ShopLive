'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Instances, Instance, Float, Environment } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { MathUtils, Color } from 'three';

const particles = Array.from({ length: 40 }, () => ({
  position: [MathUtils.randFloatSpread(40), MathUtils.randFloatSpread(40), MathUtils.randFloatSpread(20)],
  scale: MathUtils.randFloat(0.5, 1.5),
  speed: MathUtils.randFloat(0.2, 0.8),
  color: new Color().setHSL(Math.random() * 0.3 + 0.4, 0.7, 0.5) // Emerald/Teal/Cyan range
}));

function FloatingSpheres() {
  const ref = useRef<any>(null);
  
  useFrame((state) => {
    if (ref.current) {
        // Slow rotation of the entire group
        ref.current.rotation.y = MathUtils.lerp(ref.current.rotation.y, (state.mouse.x * Math.PI) / 20, 0.05);
        ref.current.rotation.x = MathUtils.lerp(ref.current.rotation.x, (state.mouse.y * Math.PI) / 20, 0.05);
    }
  });

  return (
    <group ref={ref}>
        <Instances range={40}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            roughness={0.2} 
            metalness={0.1} 
            emissive="#064e3b" 
            emissiveIntensity={0.2}
            color="#34d399"
            transparent
            opacity={0.2}
          />
          {particles.map((data, i) => (
            <FloatingInstance key={i} {...data} />
          ))}
        </Instances>
    </group>
  );
}

function FloatingInstance({ position, scale, speed, color }: any) {
    return (
        <Float speed={speed} rotationIntensity={1} floatIntensity={1.5}>
            <Instance position={position} scale={scale} color={color} />
        </Float>
    )
}

export default function LiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-slate-50">
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} color="#f0fdf4" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#ccfbf1" />
          <Environment preset="city" /> 
          <FloatingSpheres />
        </Suspense>
      </Canvas>
      {/* Overlay gradient to soften the look */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white/95 pointer-events-none" />
    </div>
  );
}
