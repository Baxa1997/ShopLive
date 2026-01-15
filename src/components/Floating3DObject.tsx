import { Canvas } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, MeshDistortMaterial } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { Mesh } from 'three';

function Geometries() {
  const meshRef = useRef<Mesh>(null);

  return (
    <Float
      speed={4} // Animation speed, defaults to 1
      rotationIntensity={1} // XYZ rotation intensity, defaults to 1
      floatIntensity={2} // Up/down float intensity, defaults to 1
    >
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <icosahedronGeometry args={[2.5, 0]} />
        <MeshDistortMaterial
          color="#10b981" // emerald-500
          envMapIntensity={0.8}
          clearcoat={0.8}
          clearcoatRoughness={0}
          metalness={0.2}
          distort={0.4} // Strength, 0 disables distortion (default=1)
          speed={2} // Speed, defaults to 1
          roughness={0.2} 
        />
      </mesh>
    </Float>
  );
}

const Lights = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ccfbf1" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={1} castShadow />
    </>
  );
};

export default function Floating3DObject() {
  return (
    <div className="w-full h-[500px] absolute inset-0 z-0 pointer-events-none md:pointer-events-auto">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <Environment preset="city" />
          <Lights />
          <Geometries />
        </Suspense>
      </Canvas>
    </div>
  );
}
