// src/components/ui/Background3D.jsx

import React, { useMemo, useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";
import * as THREE from "three";
import { useMobile } from "../hooks/useMobile";

const symbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "%", "π", "÷", "×", "∑", "√"];

function LoadSignal({ onLoaded }) {
    useEffect(() => {
        if (onLoaded) onLoaded();
    }, [onLoaded]);
    return null;
}

function Particle({ symbol, position, interactive = true, activeCardBounds }) {
    const isMobile = useMobile();
    const ref = useRef();
    const currentOffset = useRef(new THREE.Vector3(0, 0, 0));

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

        const basePosX = position.x + Math.sin(t * randomData.speedX + randomData.phaseX) * randomData.ampX;
        const basePosY = position.y + Math.cos(t * randomData.speedY + randomData.phaseY) * randomData.ampY;

        // Magnetic Attraction Logic
        let magneticTargetX = 0;
        let magneticTargetY = 0;

        if (activeCardBounds && !isMobile) {
            const { left, right, top, bottom } = activeCardBounds;

            // Get closest point on card border
            let bx = Math.max(left, Math.min(basePosX, right));
            let by = Math.max(bottom, Math.min(basePosY, top));

            // If inside, push to border
            if (bx === basePosX && by === basePosY) {
                const dl = basePosX - left;
                const dr = right - basePosX;
                const dt = top - basePosY;
                const db = basePosY - bottom;
                const min = Math.min(dl, dr, dt, db);
                if (min === dl) bx = left;
                else if (min === dr) bx = right;
                else if (min === dt) by = top;
                else by = bottom;
            }

            const dxB = bx - basePosX;
            const dyB = by - basePosY;
            const distSqB = dxB * dxB + dyB * dyB;
            const attractionRadius = 6;

            if (distSqB < attractionRadius * attractionRadius) {
                const strength = 1 - (Math.sqrt(distSqB) / attractionRadius);
                magneticTargetX = dxB * strength * 0.95; // 95% attraction to border
                magneticTargetY = dyB * strength * 0.95;
            }
        }

        // Smoothly update offset
        currentOffset.current.lerp(new THREE.Vector3(magneticTargetX, magneticTargetY, 0), 0.1);

        ref.current.position.x = basePosX + currentOffset.current.x;
        ref.current.position.y = basePosY + currentOffset.current.y;
        ref.current.rotation.z += randomData.rotationSpeed;

        // Mouse Hover Scaling Interaction
        const vector = new THREE.Vector3(state.pointer.x, state.pointer.y, 0).unproject(state.camera);
        const mouseX = vector.x;
        const mouseY = vector.y;
        const dxM = mouseX - ref.current.position.x;
        const dyM = mouseY - ref.current.position.y;
        const distSqM = dxM * dxM + dyM * dyM;

        const isNear = !isMobile && interactive && distSqM < 16; // 4^2
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

function Particles({ interactive, activeCardId, cardBounds }) {
    const { viewport } = useThree();

    const activeCardWorldBounds = useMemo(() => {
        if (!activeCardId || !cardBounds || !cardBounds[activeCardId]) return null;
        const rect = cardBounds[activeCardId];
        const { innerWidth, innerHeight } = window;

        const ndcLeft = (rect.x / innerWidth) * 2 - 1;
        const ndcRight = ((rect.x + rect.width) / innerWidth) * 2 - 1;
        const ndcTop = -(rect.y / innerHeight) * 2 + 1;
        const ndcBottom = -((rect.y + rect.height) / innerHeight) * 2 + 1;

        return {
            left: (ndcLeft * viewport.width) / 2,
            right: (ndcRight * viewport.width) / 2,
            top: (ndcTop * viewport.height) / 2,
            bottom: (ndcBottom * viewport.height) / 2
        };
    }, [activeCardId, cardBounds, viewport.width, viewport.height]);

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
                <Particle
                    key={data.id}
                    symbol={data.symbol}
                    position={data.position}
                    interactive={interactive}
                    activeCardBounds={activeCardWorldBounds}
                />
            ))}
        </>
    );
}

const Background3D = React.memo(function Background3D({ onLoaded, interactive = true, activeCardId = null, cardBounds = null }) {
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
                    <Particles
                        interactive={interactive}
                        activeCardId={activeCardId}
                        cardBounds={cardBounds}
                    />
                    <LoadSignal onLoaded={onLoaded} />
                </Suspense>
            </Canvas>
        </div>
    );
});

export default Background3D;
