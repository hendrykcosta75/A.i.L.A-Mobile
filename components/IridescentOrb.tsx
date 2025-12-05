import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface IridescentOrbProps {
    state: OrbState;
    size?: number;
}

// GLSL Shader Source
const source = Skia.RuntimeEffect.Make(`
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_intensity; // Used for pulsing behavior

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Cubic Hermite Curve
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// #define OCTAVES 4 -- Unsupported in SkSL
const int OCTAVES = 4;

float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float shift = 0.0;
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st = rot * st * 2.0 + shift;
        amplitude *= 0.5;
    }
    return value;
}

vec3 palette(float t) {
    // Custom neon palette
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    // Colors: Purple/Blue/Cyan mix
    vec3 d = vec3(0.263, 0.416, 0.557); 
    return a + b * cos(6.28318 * (c * t + d));
}

half4 main(vec2 fragCoord) {
    // Normalize coordinates -1 to 1
    vec2 uv = (fragCoord * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Circle Mask
    float dist = length(uv);
    float circleRadius = 0.95;
    if (dist > circleRadius) {
        return vec4(0.0, 0.0, 0.0, 0.0); // Transparent outside
    }

    // Domain Warping for "Ribbon" / Plasma effect
    vec2 q = vec2(0.); // Pattern 1
    q.x = fbm(uv + 0.1 * u_time);
    q.y = fbm(uv + vec2(1.0));

    vec2 r = vec2(0.); // Pattern 2
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

    float f = fbm(uv + r); // Final noise value

    // Color Mixing
    // Mix between Deep Purple (0.2, 0.0, 0.4) and Cyan/Neon
    vec3 color = mix(vec3(0.1, 0.0, 0.3), vec3(0.0, 0.8, 1.0), clamp(f * f * 4.0, 0.0, 1.0));
    
    // Add ribbon highlights
    color = mix(color, vec3(0.9, 0.2, 1.0), clamp(length(q) * length(r), 0.0, 1.0)); // Pink/Magenta glints
    
    // Pulsing core intensity
    color = color * (1.2 + 0.4 * sin(u_time * 2.0) * u_intensity);

    // Sphere pseudo-3D shading (fresnel-ish)
    float sphereShading = sqrt(1.0 - dist * dist);
    color *= sphereShading * 1.5; // Brighten center
    
    // Smooth edge alpha
    float alpha = smoothstep(circleRadius, circleRadius - 0.05, dist);
    
    return vec4(color, alpha);
}
`);

export default function IridescentOrb({ state, size = 200 }: IridescentOrbProps) {
    const time = useSharedValue(0);
    const intensity = useSharedValue(1);

    useEffect(() => {
        // Continuous time loop
        time.value = withRepeat(withTiming(1000, { duration: 1000000, easing: Easing.linear }), -1);
    }, []);

    useEffect(() => {
        // State reactions
        if (state === 'speaking') {
            intensity.value = withTiming(2.0, { duration: 500 });
        } else if (state === 'listening') {
            intensity.value = withRepeat(withTiming(1.5, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true);
        } else if (state === 'processing') {
            intensity.value = withRepeat(withTiming(1.2, { duration: 300, easing: Easing.linear }), -1, true);
        } else {
            intensity.value = withTiming(1.0, { duration: 1000 });
        }
    }, [state]);

    const uniforms = useDerivedValue(() => {
        return {
            u_time: time.value * 0.5, // Slow down time slightly
            u_resolution: [size, size],
            u_intensity: intensity.value,
        };
    }, [size]);

    if (!source) {
        return <View style={{ width: size, height: size, backgroundColor: '#2A0066', borderRadius: size / 2 }} />;
    }

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Canvas style={{ width: size, height: size }}>
                <Fill>
                    <Shader source={source} uniforms={uniforms} />
                </Fill>
            </Canvas>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#B026FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
});
