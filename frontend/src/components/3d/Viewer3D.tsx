import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import { useGenerationStore } from '@/store/generationStore';

// Placeholder 3D cube component
function PlaceholderCube() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#6366f1" wireframe={false} />
    </mesh>
  );
}

// Scene component with lighting and helpers
function Scene() {
  const { viewerSettings } = useGenerationStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Grid Helper */}
      {viewerSettings.showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9ca3af"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      {/* Axes Helper */}
      {viewerSettings.showAxes && <axesHelper args={[5]} />}

      {/* Placeholder Model */}
      <PlaceholderCube />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={viewerSettings.autoRotate}
        autoRotateSpeed={2}
      />

      {/* Environment */}
      <Environment preset="studio" />
    </>
  );
}

interface Viewer3DProps {
  className?: string;
}

export default function Viewer3D({ className = '' }: Viewer3DProps) {
  const { viewerSettings } = useGenerationStore();

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        style={{
          background: viewerSettings.backgroundColor,
        }}
        shadows
      >
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#888" wireframe />
            </mesh>
          }
        >
          <Scene />
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      <Suspense fallback={null}>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* Future: Add loading state here */}
        </div>
      </Suspense>
    </div>
  );
}
