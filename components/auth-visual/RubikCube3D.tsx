'use client';

if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('THREE.Clock') || args[0].includes('deprecated'))) {
      return;
    }
    originalWarn(...args);
  };
}

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useLayoutEffect, forwardRef, useState } from 'react';
import * as THREE from 'three';

// ─── Constants ──────────────────────────────────────────────────
const CUBIE_SIZE = 0.94;
const STICKER_OFFSET = 0.471;
const STICKER_SIZE = 0.78;
const STICKER_THICKNESS = 0.02;

// Realistic Rubik colors (matte plastic look)
const COLORS = {
  red: '#d90429',
  orange: '#f77f00',
  yellow: '#fcbf49',
  white: '#f8f9fa',
  green: '#38b000',
  blue: '#0077b6',
  body: '#151518',
};

// Generate 26 cubies (excluding the internal center cubie)
const cubies = (() => {
  const list = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        list.push({ x, y, z });
      }
    }
  }
  return list;
})();

interface CubieProps {
  x: number;
  y: number;
  z: number;
}

/** Individual Cubie component with separate stickers for outer faces */
const Cubie = forwardRef<THREE.Group, CubieProps>(({ x, y, z }, ref) => {
  const stickers = [];

  // Right face (X+)
  if (x === 1) {
    stickers.push({
      key: 'r',
      position: [STICKER_OFFSET, 0, 0] as [number, number, number],
      args: [STICKER_THICKNESS, STICKER_SIZE, STICKER_SIZE] as [number, number, number],
      color: COLORS.blue,
    });
  }
  // Left face (X-)
  if (x === -1) {
    stickers.push({
      key: 'l',
      position: [-STICKER_OFFSET, 0, 0] as [number, number, number],
      args: [STICKER_THICKNESS, STICKER_SIZE, STICKER_SIZE] as [number, number, number],
      color: COLORS.green,
    });
  }
  // Top face (Y+)
  if (y === 1) {
    stickers.push({
      key: 't',
      position: [0, STICKER_OFFSET, 0] as [number, number, number],
      args: [STICKER_SIZE, STICKER_THICKNESS, STICKER_SIZE] as [number, number, number],
      color: COLORS.white,
    });
  }
  // Bottom face (Y-)
  if (y === -1) {
    stickers.push({
      key: 'b',
      position: [0, -STICKER_OFFSET, 0] as [number, number, number],
      args: [STICKER_SIZE, STICKER_THICKNESS, STICKER_SIZE] as [number, number, number],
      color: COLORS.yellow,
    });
  }
  // Front face (Z+)
  if (z === 1) {
    stickers.push({
      key: 'f',
      position: [0, 0, STICKER_OFFSET] as [number, number, number],
      args: [STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS] as [number, number, number],
      color: COLORS.red,
    });
  }
  // Back face (Z-)
  if (z === -1) {
    stickers.push({
      key: 'ba',
      position: [0, 0, -STICKER_OFFSET] as [number, number, number],
      args: [STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS] as [number, number, number],
      color: COLORS.orange,
    });
  }

  return (
    <group ref={ref}>
      {/* Cubie Body (black base) */}
      <mesh>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        <meshStandardMaterial
          color={COLORS.body}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Render Stickers */}
      {stickers.map((sticker) => (
        <mesh key={sticker.key} position={sticker.position}>
          <boxGeometry args={sticker.args} />
          <meshStandardMaterial
            color={sticker.color}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
});

Cubie.displayName = 'Cubie';

/** Rubik's Cube model handles floating bobbing, multi-axis rotation, and automatic layer turning */
function RubikCube() {
  const groupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<(THREE.Group | null)[]>([]);

  // Track orientation and logical position of all 26 cubies
  const cubiesState = useRef(
    cubies.map((c, index) => ({
      id: index,
      currentPos: new THREE.Vector3(c.x, c.y, c.z),
      quaternion: new THREE.Quaternion(),
    }))
  );

  // Active layer rotation state
  const activeRotation = useRef<{
    axis: 'x' | 'y' | 'z';
    layer: number;
    angle: number;
    targetAngle: number;
    progress: number;
    speed: number;
  } | null>(null);

  // State machine for rotation transitions and pauses
  const stateMachine = useRef({
    phase: 'idle' as 'idle' | 'rotating' | 'pause',
    timer: 0.8, // Wait 0.8s initially
  });

  useLayoutEffect(() => {
    // Position cubies at their initial grid locations
    cubiesState.current.forEach((cubie, idx) => {
      const ref = cubieRefs.current[idx];
      if (ref) {
        ref.position.copy(cubie.currentPos);
        ref.quaternion.copy(cubie.quaternion);
      }
    });
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Overall Rubik's Cube floating and gentle slow drift rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.15 + 0.35;
      groupRef.current.rotation.z = Math.cos(t * 0.08) * 0.1;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.12;
    }

    const sm = stateMachine.current;
    const active = activeRotation.current;

    // Limit delta time to prevent physics/animation jumps when tabbed away
    const cappedDelta = Math.min(delta, 0.1);

    // 2. Layer-wise rotation animation state machine
    if (sm.phase === 'idle') {
      const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
      const axis = axes[Math.floor(Math.random() * 3)];
      const layer = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const direction = Math.random() > 0.5 ? 1 : -1;

      activeRotation.current = {
        axis,
        layer,
        angle: 0,
        targetAngle: (Math.PI / 2) * direction,
        progress: 0,
        speed: 1.8, // animation takes ~0.55s
      };
      sm.phase = 'rotating';
    } else if (sm.phase === 'rotating' && active) {
      active.progress += cappedDelta * active.speed;
      if (active.progress >= 1) {
        active.progress = 1;
      }
      active.angle = active.targetAngle * active.progress;

      // Construct rotation quaternion for current frame
      const axisVec = new THREE.Vector3();
      if (active.axis === 'x') axisVec.set(1, 0, 0);
      else if (active.axis === 'y') axisVec.set(0, 1, 0);
      else if (active.axis === 'z') axisVec.set(0, 0, 1);

      const rotQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, active.angle);

      // Render updated positions/rotations for cubies in the rotating layer
      cubiesState.current.forEach((cubie, idx) => {
        const ref = cubieRefs.current[idx];
        if (!ref) return;

        let inLayer = false;
        const threshold = 0.1;
        if (active.axis === 'x' && Math.abs(cubie.currentPos.x - active.layer) < threshold) inLayer = true;
        if (active.axis === 'y' && Math.abs(cubie.currentPos.y - active.layer) < threshold) inLayer = true;
        if (active.axis === 'z' && Math.abs(cubie.currentPos.z - active.layer) < threshold) inLayer = true;

        if (inLayer) {
          const tempPos = cubie.currentPos.clone().applyQuaternion(rotQuat);
          const tempQuat = rotQuat.clone().multiply(cubie.quaternion);
          ref.position.copy(tempPos);
          ref.quaternion.copy(tempQuat);
        } else {
          // Cubies outside the rotating layer stay still
          ref.position.copy(cubie.currentPos);
          ref.quaternion.copy(cubie.quaternion);
        }
      });

      // Complete active animation
      if (active.progress >= 1) {
        const endQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, active.targetAngle);

        cubiesState.current.forEach((cubie) => {
          let inLayer = false;
          const threshold = 0.1;
          if (active.axis === 'x' && Math.abs(cubie.currentPos.x - active.layer) < threshold) inLayer = true;
          if (active.axis === 'y' && Math.abs(cubie.currentPos.y - active.layer) < threshold) inLayer = true;
          if (active.axis === 'z' && Math.abs(cubie.currentPos.z - active.layer) < threshold) inLayer = true;

          if (inLayer) {
            // Permanently update logical positions and quaternions
            cubie.currentPos.applyQuaternion(endQuat);
            // Snap to exact coordinates to eliminate floating-point creep
            cubie.currentPos.x = Math.round(cubie.currentPos.x);
            cubie.currentPos.y = Math.round(cubie.currentPos.y);
            cubie.currentPos.z = Math.round(cubie.currentPos.z);
            cubie.quaternion.premultiply(endQuat).normalize();
          }
        });

        activeRotation.current = null;
        sm.phase = 'pause';
        sm.timer = 1.0; // Wait 1s between animations
      }
    } else if (sm.phase === 'pause') {
      sm.timer -= cappedDelta;

      // Keep position and orientation accurate during pauses
      cubiesState.current.forEach((cubie, idx) => {
        const ref = cubieRefs.current[idx];
        if (ref) {
          ref.position.copy(cubie.currentPos);
          ref.quaternion.copy(cubie.quaternion);
        }
      });

      if (sm.timer <= 0) {
        sm.phase = 'idle';
      }
    }
  });

  return (
    <group ref={groupRef}>
      {cubies.map((c, i) => (
        <Cubie
          key={i}
          ref={(el) => {
            cubieRefs.current[i] = el;
          }}
          x={c.x}
          y={c.y}
          z={c.z}
        />
      ))}
    </group>
  );
}

/** Floating cloud of warm yellow-gold particles around the Rubik's cube */
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate 150 random particles around the Rubik's cube
  const [positions] = useState(() => {
    const arr = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      const r = 2.8 + Math.random() * 4.5; // distance from center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  });

  useFrame((state) => {
    if (pointsRef.current) {
      // Rotate the field of particles very slowly
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.04;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#fcbf49" // matches landing page accent yellow
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

/** Holographic concentric rotating rings below the Rubik's cube */
function HologramDisk() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.12;
      const s = 1 + Math.sin(t * 1.6) * 0.04;
      ring1Ref.current.scale.set(s, s, 1);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.06;
      const s = 1 + Math.cos(t * 1.6) * 0.03;
      ring2Ref.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[0, -2.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Inner Holographic Ring */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[1.7, 1.72, 64]} />
        <meshBasicMaterial color="#ffb703" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer Holographic Ring */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[2.3, 2.315, 64]} />
        <meshBasicMaterial color="#0077b6" transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function RubikCube3D() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Canvas
        camera={{ position: [4.2, 4.2, 4.2], fov: 42 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.5} />
        {/* Main light simulating sunlight/studio light */}
        <directionalLight position={[8, 12, 8]} intensity={2.2} />
        {/* Soft fill light from opposite bottom corner with slightly warmer tone */}
        <pointLight position={[-6, -8, -6]} intensity={1.5} color="#fcbf49" />
        {/* Violet backlight for high-tech glow effect on the cube contours */}
        <pointLight position={[0, 0, -4]} intensity={1.2} color="#8b5cf6" />
        <ParticleField />
        <HologramDisk />
        <RubikCube />
      </Canvas>
    </div>
  );
}
