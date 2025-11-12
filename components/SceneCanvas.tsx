"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import type { SceneParams } from '@lib/promptMapper';


function FeaturelessHumanoid({ pose, material }: { pose: SceneParams['pose']; material: THREE.Material }) {
  // Simple mannequin using primitives; sized for realism
  const group = useRef<THREE.Group>(null!);

  const parts = useMemo(() => {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 48, 48), material);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 8, 24), material);
    const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.12, 8, 24), material);

    const armGeom = new THREE.CapsuleGeometry(0.07, 0.36, 8, 16);
    const legGeom = new THREE.CapsuleGeometry(0.09, 0.56, 8, 16);

    const lArm = new THREE.Mesh(armGeom, material);
    const rArm = new THREE.Mesh(armGeom, material);
    const lForearm = new THREE.Mesh(armGeom, material);
    const rForearm = new THREE.Mesh(armGeom, material);
    const lLeg = new THREE.Mesh(legGeom, material);
    const rLeg = new THREE.Mesh(legGeom, material);
    const lShin = new THREE.Mesh(legGeom, material);
    const rShin = new THREE.Mesh(legGeom, material);

    return { head, torso, pelvis, lArm, rArm, lForearm, rForearm, lLeg, rLeg, lShin, rShin };
  }, [material]);

  useMemo(() => {
    // Initial placement (T-pose baseline)
    parts.head.position.set(0, 1.6, 0);
    parts.torso.position.set(0, 1.2, 0);
    parts.pelvis.position.set(0, 0.8, 0);

    parts.lArm.position.set(-0.38, 1.25, 0);
    parts.rArm.position.set(0.38, 1.25, 0);
    parts.lForearm.position.set(-0.38, 0.85, 0);
    parts.rForearm.position.set(0.38, 0.85, 0);

    parts.lLeg.position.set(-0.16, 0.4, 0);
    parts.rLeg.position.set(0.16, 0.4, 0);
    parts.lShin.position.set(-0.16, -0.1, 0);
    parts.rShin.position.set(0.16, -0.1, 0);
  }, [parts]);

  useMemo(() => {
    // Pose adjustments (very simple)
    const setRotation = (obj: THREE.Object3D, x=0,y=0,z=0) => obj.rotation.set(x,y,z);
    const deg = (d: number) => (d * Math.PI) / 180;

    if (pose === 'standing') {
      setRotation(parts.lArm, deg(-10), 0, deg(-6));
      setRotation(parts.rArm, deg(-8), 0, deg(6));
      setRotation(parts.lForearm, deg(-12), 0, deg(-4));
      setRotation(parts.rForearm, deg(-14), 0, deg(4));
      setRotation(parts.lLeg, deg(2), 0, deg(-2));
      setRotation(parts.rLeg, deg(0), 0, deg(2));
      setRotation(parts.lShin, deg(0), 0, deg(0));
      setRotation(parts.rShin, deg(0), 0, deg(0));
    } else if (pose === 'profile') {
      group.current.rotation.y = deg(90);
      setRotation(parts.lArm, deg(-15), 0, deg(-2));
      setRotation(parts.rArm, deg(-10), 0, deg(2));
    } else if (pose === 'looking_down') {
      parts.head.rotation.x = deg(18);
      setRotation(parts.lArm, deg(-18), 0, deg(-8));
      setRotation(parts.rArm, deg(-20), 0, deg(8));
    } else if (pose === 'seated') {
      parts.torso.position.y = 1.1;
      parts.lLeg.rotation.x = deg(70);
      parts.rLeg.rotation.x = deg(70);
      parts.lShin.rotation.x = deg(-70);
      parts.rShin.rotation.x = deg(-70);
    }
  }, [pose, parts]);

  return (
    <group ref={group}>
      {Object.values(parts).map((mesh, idx) => (
        <primitive object={mesh} key={idx} castShadow receiveShadow />
      ))}
    </group>
  );
}

function Ground({ mood }: { mood: SceneParams['mood'] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const color = mood === 'clinical' ? '#ffffff' : '#0e0f12';
  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.0} />
    </mesh>
  );
}

function SceneContent({ params, isRecording }: { params: SceneParams; isRecording: boolean }) {
  const hueLight = new THREE.Color(params.lightColor);
  const mannequinMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e6e7ea'),
      roughness: 0.3,
      metalness: 0.0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      sheen: 0.0,
      transmission: 0.0,
      envMapIntensity: 0.6,
    });
    return m;
  }, []);

  const camRef = useRef<THREE.PerspectiveCamera>(null!);
  const rigRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (!camRef.current || !rigRef.current) return;
    const t = state.clock.getElapsedTime();
    if (params.cameraPath === 'orbit') {
      const r = 2.2;
      const speed = isRecording ? 0.35 : 0.15;
      camRef.current.position.set(Math.cos(t * speed) * r, 1.4, Math.sin(t * speed) * r);
      camRef.current.lookAt(0, 1.1, 0);
    } else if (params.cameraPath === 'dolly_in') {
      camRef.current.position.lerp(new THREE.Vector3(0.4, 1.25, 2.2), 0.03);
      if (isRecording) camRef.current.position.z = 1.6 + Math.cos(t * 0.2) * 0.1;
      camRef.current.lookAt(0, 1.1, 0);
    } else if (params.cameraPath === 'pan') {
      camRef.current.position.set(1.6 + Math.sin(t * 0.25) * 0.6, 1.3, 1.8);
      camRef.current.lookAt(0, 1.1, 0);
    }
  });

  return (
    <>
      <color attach="background" args={[params.mood === 'clinical' ? '#f7f7f8' : '#0b0b0c']} />
      <fog attach="fog" args={[params.mood === 'clinical' ? '#f7f7f8' : '#0b0b0c', 4, 14]} />

      <group ref={rigRef}>
        <PerspectiveCamera ref={camRef} makeDefault fov={params.fov} position={[2.2, 1.4, 2.2]} />

        <group position={[0, 0, 0]}>
          <FeaturelessHumanoid pose={params.pose} material={mannequinMat} />
        </group>

        <Ground mood={params.mood} />

        {/* Lighting */}
        <ambientLight intensity={0.25} />
        <spotLight
          color={hueLight}
          intensity={params.keyIntensity}
          position={[1.6, 2.2, 1.2]}
          angle={0.5}
          penumbra={0.6}
          castShadow
          shadow-bias={-0.0002}
        />
        <spotLight
          color={params.mood === 'clinical' ? '#a3a6ad' : '#223'}
          intensity={params.rimIntensity}
          position={[-1.6, 1.8, -1.2]}
          angle={0.8}
          penumbra={0.8}
          castShadow
          shadow-bias={-0.0002}
        />

        {/* Minimal environment reflections */}
        <Environment preset={params.mood === 'clinical' ? 'city' : 'night'} />

        <EffectComposer>
          <Bloom intensity={params.mood === 'dramatic' ? 1.2 : 0.6} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.2} darkness={params.mood === 'clinical' ? 0.2 : 0.6} />
          <Noise opacity={0.03} />
        </EffectComposer>
      </group>

      <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} />
    </>
  );
}

export default function SceneCanvas({ params, canvasRef, isRecording }: { params: SceneParams; canvasRef: React.RefObject<HTMLCanvasElement>; isRecording: boolean; }) {
  return (
    <Canvas
      ref={canvasRef as any}
      shadows
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      dpr={[1, 2]}
      camera={{ fov: params.fov, position: [2.2, 1.4, 2.2] }}
      className="w-full h-[calc(100vh-0px)]"
    >
      <SceneContent params={params} isRecording={isRecording} />
    </Canvas>
  );
}
