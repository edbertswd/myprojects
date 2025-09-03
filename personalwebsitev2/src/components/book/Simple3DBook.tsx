// Simple3DBook.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useAtom } from "jotai";
import { easing } from "maath";
import {
  Bone,
  BoxGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Material,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { pageAtom, pages } from "./UI";


type PageData = { title?: string; content?: string };
type PageProps = {
  number: number;
  pageData: PageData;
  page: number;
  opened: boolean;
  bookClosed: boolean;
} & JSX.IntrinsicElements["group"];
type BookProps = JSX.IntrinsicElements["group"];

// ---------- Tuning ----------
const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

// ---------- Geometry ----------
const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// Create geometry function to avoid shared state issues
const createPageGeometry = () => {
  const geometry = new BoxGeometry(
    PAGE_WIDTH,
    PAGE_HEIGHT,
    PAGE_DEPTH,
    PAGE_SEGMENTS,
    2
  );
  // Anchor left edge so bones move along +x
  geometry.translate(PAGE_WIDTH / 2, 0, 0);
  return geometry;
};

// Function to setup skin weights for geometry
const setupSkinWeights = (geometry: BoxGeometry) => {
  const position = geometry.attributes.position;
  const vertex = new Vector3();
  const skinIndexes: number[] = [];
  const skinWeights: number[] = [];

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const x = vertex.x;

    // clamp so (skinIndex + 1) is valid
    const rawIndex = Math.floor(x / SEGMENT_WIDTH);
    const skinIndex = Math.min(PAGE_SEGMENTS - 1, Math.max(0, rawIndex));
    const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
  }

  geometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(skinIndexes, 4)
  );
  geometry.setAttribute(
    "skinWeight",
    new Float32BufferAttribute(skinWeights, 4)
  );
  
  return geometry;
};

// ---------- Colors / Materials ----------
const whiteColor = new Color("white");
const emissiveColor = new Color("#ffd700");

const baseFaceMaterials = [
  new MeshStandardMaterial({ color: whiteColor }), // right
  new MeshStandardMaterial({ color: "#111" }),     // left
  new MeshStandardMaterial({ color: whiteColor }), // top
  new MeshStandardMaterial({ color: whiteColor }), // bottom
];

// ---------- Texture Drawing (Web-only) ----------
function createPageTexture(pageData: PageData, pageNumber: number) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("Failed to get 2D context for page texture");
      return null;
    }

    if (pageNumber === 0) {
      // Cover
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, "#8b5a96");
      gradient.addColorStop(0.5, "#4a0e4e");
      gradient.addColorStop(1, "#2d0a30");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 36px serif";
      ctx.textAlign = "center";
      ctx.fillText("Alyssa's", 256, 200);
      ctx.fillText("Fairy Tale", 256, 250);

      ctx.font = "18px serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("A Magical Story from Jakarta", 256, 300);
    } else {
      // Inner page
      ctx.fillStyle = "#fefefe";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // subtle paper noise
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const opacity = Math.random() * 0.05;
        ctx.fillStyle = `rgba(200, 200, 200, ${opacity})`;
        ctx.fillRect(x, y, 1, 1);
      }

      ctx.fillStyle = "#333333";
      ctx.font = "bold 24px serif";
      ctx.textAlign = "center";
      ctx.fillText(pageData.title || "", 256, 80);

      ctx.fillStyle = "#444444";
      ctx.font = "16px serif";
      ctx.textAlign = "left";

      const text = pageData.content || "";
      const words = text.split(" ");
      let line = "";
      let y = 150;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > 400 && n > 0) {
          ctx.fillText(line, 56, y);
          line = words[n] + " ";
          y += 20;
        } else {
          line = testLine;
        }
        if (y > 450) break;
      }
      ctx.fillText(line, 56, y);
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  } catch (error) {
    console.error("Error creating page texture:", error);
    return null;
  }
}

// ---------- Page ----------
const Page: React.FC<PageProps> = ({ number, pageData, page, opened, bookClosed, ...props }) => {
  const group = useRef<THREE.Group>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);

  const meshRef = useRef<SkinnedMesh>(null);
  const skeletonRef = useRef<Skeleton>();

  const pageTexture = useMemo(() => createPageTexture(pageData, number), [pageData, number]);

  // Create SkinnedMesh with proper cleanup
  const mesh = useMemo(() => {
    console.log(`Creating mesh for page ${number}`);
    const bones: Bone[] = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const b = new Bone();
      b.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) bones[i - 1].add(b);
      bones.push(b);
    }

    const skeleton = new Skeleton(bones);
    skeletonRef.current = skeleton;

    const mappedFront = new MeshStandardMaterial({
      color: number === 0 ? new Color("#4a0e4e") : whiteColor.clone(),
      roughness: number === 0 ? 0.3 : 0.1,
      emissive: emissiveColor.clone(),
      emissiveIntensity: 0,
    });
    const mappedBack = new MeshStandardMaterial({
      color: whiteColor.clone(),
      roughness: 0.1,
      emissive: emissiveColor.clone(),
      emissiveIntensity: 0,
    });

    const materials = [
      new MeshStandardMaterial({ color: whiteColor.clone() }), // right
      new MeshStandardMaterial({ color: "#111" }),     // left
      new MeshStandardMaterial({ color: whiteColor.clone() }), // top
      new MeshStandardMaterial({ color: whiteColor.clone() }), // bottom
      mappedFront, // index 4
      mappedBack,  // index 5
    ];

    const geometry = setupSkinWeights(createPageGeometry());
    const mesh = new SkinnedMesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);

    meshRef.current = mesh;
    console.log(`Mesh created successfully for page ${number}:`, mesh);
    return mesh;
  }, [number]);

  // Update only the texture maps when data changes
  useEffect(() => {
    if (!mesh || !pageTexture) return;
    
    const mats = mesh.material as MeshStandardMaterial[];
    const front = mats?.[4];
    const back = mats?.[5];
    
    if (front) {
      // Dispose old texture if it exists
      if (front.map) {
        front.map.dispose();
      }
      front.map = pageTexture;
      front.needsUpdate = true;
    }
    if (back) {
      // Back page can use same texture or a different one
      back.map = pageTexture;
      back.needsUpdate = true;
    }
    
    return () => {
      // Don't dispose texture here as it might be shared
    };
  }, [mesh, pageTexture]);

  // Hover cursor + emissive tween
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((_, delta) => {
    if (!mesh || !group.current || !skeletonRef.current) return;

    // Hover emissive
    const mats = mesh.material as MeshStandardMaterial[];
    const front = mats?.[4];
    const back = mats?.[5];
    const targetEmissive = hovered ? 0.22 : 0;
    if (front && back) {
      const next = MathUtils.lerp(front.emissiveIntensity, targetEmissive, 0.1);
      front.emissiveIntensity = next;
      back.emissiveIntensity = next;
    }

    // Turning timing
    if (lastOpened.current !== opened) {
      turnedAt.current = Date.now();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, Date.now() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    // Base rotation target
    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += MathUtils.degToRad(number * 0.8);
    }

    const bones = skeletonRef.current.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity = Math.sin((i * Math.PI) / bones.length) * turningTime;

      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;

      let foldRotationAngle = MathUtils.degToRad(Math.sign(targetRotation) * 2);

      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      easing.dampAngle(target!.rotation, "y", rotationAngle, easingFactor, delta);

      const foldIntensity =
        i > 8 ? Math.sin((i * Math.PI) / bones.length - 0.5) * turningTime : 0;
      easing.dampAngle(
        target!.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  const [, setPage] = useAtom(pageAtom);

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setPage(opened ? number : number + 1);
        setHovered(false);
      }}
    >
      {/* Stable instance; let R3F dispose normally */}
      <primitive
        object={mesh}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
};

// ---------- Book ----------
export const Simple3DBook: React.FC<BookProps> = (props) => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  
  console.log("Simple3DBook rendering with page:", page, "delayedPage:", delayedPage);
  console.log("Pages data:", pages);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const stepToward = () => {
      setDelayedPage((curr) => {
        if (page === curr) return curr;
        timeout = setTimeout(stepToward, Math.abs(page - curr) > 2 ? 50 : 150);
        return page > curr ? curr + 1 : curr - 1;
      });
    };
    stepToward();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [page]);

  return (
    <group {...props} rotation-y={-Math.PI / 2}>
      {pages.map((pageData, index) => (
        <Page
          key={index}
          page={delayedPage}
          number={index}
          pageData={pageData as PageData}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
        />
      ))}
    </group>
  );
};
