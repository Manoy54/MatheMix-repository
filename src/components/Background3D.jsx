// src/components/ui/Background3D.jsx

import React, { useMemo, useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

const symbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "%", "π", "÷", "×", "∑", "√"];

function LoadSignal({ onLoaded }) {
    useEffect(() => {
        if (onLoaded) onLoaded();
    }, [onLoaded]);
    return null;
}

function Particle({ symbol, position }) {
    const ref = useRef();

    // Store random animation data once
    const [randomData] = useState(() => ({
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: 0.2 + Math.random() * 0.3,
        speedY: 0.2 + Math.random() * 0.3,
        ampX: 0.5 + Math.random() * 0.5,
        ampY: 0.5 + Math.random() * 0.5,
        initialRotation: new THREE.Euler(0, 0, Math.random() * Math.PI * 2),
        rotationSpeed: (Math.random() - 0.5) * 0.005
    }));

    useFrame((state) => {
        if (!ref.current) return;

        const t = state.clock.getElapsedTime();

        // Floating motion anchored to initial position (prevents drifting away)
        ref.current.position.x = position.x + Math.sin(t * randomData.speedX + randomData.phaseX) * randomData.ampX;
        ref.current.position.y = position.y + Math.cos(t * randomData.speedY + randomData.phaseY) * randomData.ampY;
        ref.current.rotation.z += randomData.rotationSpeed;

        // Mouse Interaction
        const x = (state.pointer.x * state.viewport.width) / 2;
        const y = (state.pointer.y * state.viewport.height) / 2;
        // Optimization: Dist squared check
        const dx = x - ref.current.position.x;
        const dy = y - ref.current.position.y;
        const distSq = dx * dx + dy * dy;

        const isNear = distSq < 16; // 4^2
        const targetScale = isNear ? 2 : 0.8;

        ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    return (
        <mesh ref={ref} position={position} rotation={randomData.initialRotation}>
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
        const spacing = 2; // Decreased spacing for higher density
        // Calculate columns/rows relative to spacing to cover the viewport + margins
        const cols = Math.ceil(viewport.width / spacing) + 2;
        const rows = Math.ceil(viewport.height / spacing) + 2;

        const startX = -((cols - 1) * spacing) / 2;
        const startY = -((rows - 1) * spacing) / 2;

        let symbolIndex = 0;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                // Fixed grid position
                const x = startX + i * spacing;
                const y = startY + j * spacing;

                // Add moderate jitter to avoid rigid grid look
                const jitterX = (Math.random() - 0.5) * 1.5;
                const jitterY = (Math.random() - 0.5) * 1.5;

                data.push({
                    id: `${i}-${j}`, // Stable ID system for grid
                    symbol: symbols[symbolIndex % symbols.length],
                    position: new THREE.Vector3(x + jitterX, y + jitterY, (Math.random() - 0.5) * 2)
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

const Background3D = React.memo(function Background3D({ onLoaded }) {
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
                    <LoadSignal onLoaded={onLoaded} />
                </Suspense>
            </Canvas>
        </div>
    );
});

export default Background3D;
