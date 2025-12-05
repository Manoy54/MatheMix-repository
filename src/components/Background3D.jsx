// src/components/ui/Background3D.jsx

import React, { useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

const symbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "%", "π", "÷", "×", "∑", "√"];

function Particle({ symbol, position }) {
    const ref = useRef();
    const { viewport } = useThree();

    const [initialRotation] = useState(() => new THREE.Euler(0, 0, Math.random() * Math.PI * 2));
    const [velocity] = useState(() => new THREE.Vector3((Math.random() - 0.5) * 0.015, (Math.random() - 0.5) * 0.015, 0));
    const [rotationSpeed] = useState(() => new THREE.Vector3(0, 0, (Math.random() - 0.5) * 0.01));

    useFrame((state) => {
        if (!ref.current) return;

        ref.current.position.add(velocity);
        ref.current.rotation.z += rotationSpeed.z;

        // Mouse Interaction
        const x = (state.pointer.x * state.viewport.width) / 2;
        const y = (state.pointer.y * state.viewport.height) / 2;
        const dist = Math.sqrt(Math.pow(x - ref.current.position.x, 2) + Math.pow(y - ref.current.position.y, 2));

        const isNear = dist < 4;
        const targetScale = isNear ? 2 : 0.8;

        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        const halfWidth = viewport.width / 2 + 2;
        const halfHeight = viewport.height / 2 + 2;

        if (ref.current.position.x > halfWidth) ref.current.position.x = -halfWidth;
        if (ref.current.position.x < -halfWidth) ref.current.position.x = halfWidth;
        if (ref.current.position.y > halfHeight) ref.current.position.y = -halfHeight;
        if (ref.current.position.y < -halfHeight) ref.current.position.y = halfHeight;
    });

    return (
        <mesh ref={ref} position={position} rotation={initialRotation}>
            <Center>
                <Text3D
                    font="/helvetiker_regular.typeface.json"
                    size={0.8} height={0.1} curveSegments={12} bevelEnabled bevelThickness={0.01} bevelSize={0.01} bevelSegments={3}
                >
                    {symbol}
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
                </Text3D>
            </Center>
        </mesh>
    );
}

function Particles() {
    const { viewport } = useThree();

    const particlesData = useMemo(() => {
        const data = [];
        const cols = Math.floor(viewport.width / 2);
        const rows = Math.floor(viewport.height / 2);
        const offsetX = viewport.width / 2;
        const offsetY = viewport.height / 2;
        let symbolIndex = 0;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let x = (i / cols) * viewport.width - offsetX + (viewport.width / cols) / 2;
                let y = (j / rows) * viewport.height - offsetY + (viewport.height / rows) / 2;
                x += (Math.random() - 0.5) * 1.5;
                y += (Math.random() - 0.5) * 1.5;
                const z = (Math.random() - 0.5) * 5;

                data.push({
                    id: `${i}-${j}`,
                    symbol: symbols[symbolIndex % symbols.length],
                    position: new THREE.Vector3(x, y, z)
                });
                symbolIndex++;
            }
        }
        return data;
    }, [viewport.width, viewport.height]);

    return (
        <>
            {particlesData.map((data) => (
                <Particle key={data.id} symbol={data.symbol} position={data.position} />
            ))}
        </>
    );
}

export default function Background3D() {
    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Canvas
                orthographic
                camera={{ position: [0, 0, 50], zoom: 40 }}
                // FIX: Listen to events on the body, so the UI on top doesn't block the mouse
                eventSource={document.body}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={2.5} />
                    <Particles />
                </Suspense>
            </Canvas>
        </div>
    );
}