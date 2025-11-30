import React, { useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

const symbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "%"];

function Particle({ symbol, position }) {
    const ref = useRef();
    const { viewport } = useThree();

    // Random initial rotation
    // Random initial rotation (only Z axis for 2D spin)
    const [initialRotation] = useState(() =>
        new THREE.Euler(0, 0, Math.random() * Math.PI * 2)
    );

    // Very slow random velocity
    const [velocity] = useState(() =>
        new THREE.Vector3(
            (Math.random() - 0.5) * 0.002, // Super slow X
            (Math.random() - 0.5) * 0.002, // Super slow Y
            (Math.random() - 0.5) * 0.002  // Super slow Z
        )
    );

    // Random rotation speed (also very slow)
    // Random rotation speed (only Z axis)
    const [rotationSpeed] = useState(() =>
        new THREE.Vector3(
            0,
            0,
            (Math.random() - 0.5) * 0.01
        )
    );

    useFrame((state) => {
        if (!ref.current) return;

        // Move particle
        ref.current.position.add(velocity);

        // Rotate particle
        // Rotate particle
        ref.current.rotation.z += rotationSpeed.z;

        // Proximity Effect: Scale up when near mouse
        // Convert normalized pointer (-1 to 1) to world coordinates
        const x = (state.pointer.x * state.viewport.width) / 2;
        const y = (state.pointer.y * state.viewport.height) / 2;

        // Calculate 2D distance
        const dist = Math.sqrt(
            Math.pow(x - ref.current.position.x, 2) +
            Math.pow(y - ref.current.position.y, 2)
        );

        // Threshold for effect (5 units)
        const isNear = dist < 5;
        const targetScale = isNear ? 2.5 : 1;

        ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.1);
        ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetScale, 0.1);
        ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, targetScale, 0.1);

        // Screen wrapping (keep them in view based on dynamic viewport)
        const halfWidth = viewport.width / 2 + 2; // Add buffer
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
                    size={0.5}
                    height={0.15}
                    curveSegments={6}
                    bevelEnabled // <--- Enable bevel
                    bevelThickness={0.02} // Depth of the bevel
                    bevelSize={0.02} // <--- Increase this to make the font look "bolder" (wider)
                    bevelSegments={5}
                >
                    {symbol}
                    <meshStandardMaterial color="#0077b6" />
                </Text3D>
            </Center>
        </mesh>
    );
}

function Particles() {
    const { viewport } = useThree();

    const particlesData = useMemo(() => {
        const data = [];
        const positions = [];
        // Adjust count based on viewport width (base 170 for desktop ~48 units)
        const count = Math.max(30, Math.floor(250 * (viewport.width / 48)));
        const minDistance = 2; // Minimum distance between particles

        for (let i = 0; i < count; i++) {
            let pos;
            let valid = false;
            let attempts = 0;

            // Try to find a position that isn't too close to others
            while (!valid && attempts < 50) {
                pos = [
                    (Math.random() - 0.5) * viewport.width,
                    (Math.random() - 0.5) * viewport.height,
                    (Math.random() - 0.5) * 10
                ];

                valid = true;
                for (const p of positions) {
                    const dx = p[0] - pos[0];
                    const dy = p[1] - pos[1];
                    const dz = p[2] - pos[2];
                    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < minDistance) {
                        valid = false;
                        break;
                    }
                }
                attempts++;
            }

            // If a valid position wasn't found after attempts, just use the last generated one
            // to prevent infinite loops, though it might violate minDistance
            if (!valid) {
                // console.warn(`Could not find a valid position for particle ${i} after ${attempts} attempts.`);
                // Fallback to a random position without validation
                pos = [
                    (Math.random() - 0.5) * viewport.width,
                    (Math.random() - 0.5) * viewport.height,
                    (Math.random() - 0.5) * 10
                ];
            }

            positions.push(pos);
            data.push({
                id: i,
                symbol: symbols[i % symbols.length],
                position: new THREE.Vector3(pos[0], pos[1], pos[2]) // Convert to THREE.Vector3
            });
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
                />
            ))}
        </>
    );
}

function ParticleScene() {
    return (
        <Canvas
            orthographic
            camera={{ position: [0, 0, 50], zoom: 40 }}
            style={{ width: "100%", height: "100%" }}
            eventSource={document.body}
        >
            <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Particles />
            </Suspense>
        </Canvas>
    );
}

export default function Home() {
    return (
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border bg-card p-6">
            {/* Background Layer: Blurred Particles */}
            <div className="absolute inset-0 z-0">
                <ParticleScene />
            </div>

            {/* Foreground Layer: Content */}
            <div className="relative z-10 flex flex-col gap-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Home</p>
                        <h1 className="text-2xl font-semibold">Welcome</h1>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Add your dashboard content here.
                </p>
            </div>
        </div>
    );
}
