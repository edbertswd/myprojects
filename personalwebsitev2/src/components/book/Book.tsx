import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { 
  BoxGeometry, 
  Vector3, 
  Bone, 
  Skeleton, 
  SkinnedMesh, 
  MeshBasicMaterial,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  CanvasTexture
} from "three";
import { pageAtom, pages } from "./UI";

// Page configuration
const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const COVER_DEPTH = 0.015; // Covers are much thicker (5x regular pages)
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;
const GAP_SIZE = 0.002; // Small gap to prevent overlap

// Calculate total book thickness including all pages and gaps
const calculateTotalBookThickness = () => {
  const totalPages = pages.length;
  const regularPages = totalPages - 2; // Exclude front and back covers
  const coverThickness = 2 * COVER_DEPTH; // Front + back covers
  const pageThickness = regularPages * PAGE_DEPTH; // All regular pages
  const gaps = totalPages * GAP_SIZE; // Small gaps between pages
  
  return coverThickness + pageThickness + gaps;
};

// Create shared geometries to avoid recreation
let sharedPageGeometry = null;
let sharedCoverGeometry = null;

const createGeometry = (isCover = false) => {
  const depth = isCover ? COVER_DEPTH : PAGE_DEPTH;
  const sharedGeometry = isCover ? sharedCoverGeometry : sharedPageGeometry;
  
  if (!sharedGeometry) {
    const geometry = new BoxGeometry(
      PAGE_WIDTH,
      PAGE_HEIGHT,
      depth,
      PAGE_SEGMENTS,
      2
    );
    
    // Anchor the geometry so pages bend from the spine (left edge)
    geometry.translate(PAGE_WIDTH / 2, 0, 0);
    
    const position = geometry.attributes.position;
    const vertex = new Vector3();
    const skinIndexes = [];
    const skinWeights = [];

    // Set up skin weights for skeletal animation
    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      const x = vertex.x;

      const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
      const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

      skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
    }

    geometry.setAttribute("skinIndex", new Uint16BufferAttribute(skinIndexes, 4));
    geometry.setAttribute("skinWeight", new Float32BufferAttribute(skinWeights, 4));
    
    if (isCover) {
      sharedCoverGeometry = geometry;
    } else {
      sharedPageGeometry = geometry;
    }
  }
  
  const targetGeometry = isCover ? sharedCoverGeometry : sharedPageGeometry;
  return targetGeometry.clone();
};

export const Book = () => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  
  console.log("Book rendering, page:", page, "delayedPage:", delayedPage);

  useEffect(() => {
    let timeout;
    const goToPage = () => {
      setDelayedPage((curr) => {
        if (page === curr) {
          return curr;
        } else {
          timeout = setTimeout(goToPage, 800); // Much slower page turning
          return page > curr ? curr + 1 : curr - 1;
        }
      });
    };
    goToPage();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [page]);

  return (
    <group position={[0, 0, 0]} rotation-y={-Math.PI / 2}>
      {/* Book spine - the anchor point - calculated thickness */}
      <mesh position={[-0.02, 0, 0]}>
        <boxGeometry args={[0.04, PAGE_HEIGHT, calculateTotalBookThickness()]} />
        <meshBasicMaterial color="#2d0a30" />
      </mesh>
      
      <React.Suspense fallback={null}>
        {pages.map((pageData, index) => {
          const isFirstPage = index === 0;
          const isLastPage = index === pages.length - 1;
          const isCover = isFirstPage || isLastPage;
          
          return (
            <PageComponent 
              key={index} 
              index={index} 
              delayedPage={delayedPage}
              isCover={isCover}
              isFirstPage={isFirstPage}
              isLastPage={isLastPage}
            />
          );
        })}
      </React.Suspense>
    </group>
  );
};

const PageComponent = ({ index, delayedPage, isCover, isFirstPage, isLastPage }) => {
  const groupRef = useRef();
  const skeletonRef = useRef();
  const [, setPage] = useAtom(pageAtom);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Create skeletal mesh with bones
  const skinnedMesh = useMemo(() => {
    const geometry = createGeometry(isCover);
    
    // Create bones for page bending
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new Bone();
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) bones[i - 1].add(bone);
      bones.push(bone);
    }

    const skeleton = new Skeleton(bones);
    skeletonRef.current = skeleton;

    // Create materials with content
    let material;
    if (isFirstPage) {
      // Disney-esque Rapunzel themed front cover
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Magical twilight sky background
        const skyGradient = ctx.createLinearGradient(0, 0, 0, 1024);
        skyGradient.addColorStop(0, '#ff6b9d'); // Pink sunset
        skyGradient.addColorStop(0.3, '#c44569'); // Rose
        skyGradient.addColorStop(0.6, '#6a1b99'); // Purple
        skyGradient.addColorStop(1, '#2d1b69'); // Deep purple night
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 400; // Stars in upper area
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Castle silhouette at bottom
        ctx.fillStyle = '#fffb00ff';
        ctx.beginPath();
        ctx.moveTo(0, 800);
        ctx.lineTo(150, 750);
        ctx.lineTo(200, 720);
        ctx.lineTo(250, 740);
        ctx.lineTo(300, 700);
        ctx.lineTo(350, 710);
        ctx.lineTo(450, 680);
        ctx.lineTo(550, 690);
        ctx.lineTo(650, 670);
        ctx.lineTo(750, 700);
        ctx.lineTo(850, 680);
        ctx.lineTo(1024, 750);
        ctx.lineTo(1024, 1024);
        ctx.lineTo(0, 1024);
        ctx.closePath();
        ctx.fill();
        
        // Tower with window (Rapunzel's tower)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(400, 500, 80, 250);
        // Tower top
        ctx.beginPath();
        ctx.moveTo(400, 500);
        ctx.lineTo(440, 450);
        ctx.lineTo(480, 500);
        ctx.closePath();
        ctx.fill();
        // Window with warm light
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(420, 550, 40, 40);
        ctx.fillStyle = '#ff9999';
        ctx.fillRect(425, 555, 30, 30);
        
        // Floating lanterns
        const lanternColors = ['#ffdd44', '#ff6b9d', '#44ddff', '#77ff77'];
        for (let i = 0; i < 15; i++) {
          const x = Math.random() * 900 + 50;
          const y = Math.random() * 600 + 100;
          const size = Math.random() * 8 + 4;
          
          ctx.fillStyle = lanternColors[Math.floor(Math.random() * lanternColors.length)];
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Lantern glow
          ctx.fillStyle = `rgba(255, 221, 68, 0.3)`;
          ctx.beginPath();
          ctx.arc(x, y, size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Title with Disney-style lettering
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6a1b99';
        ctx.lineWidth = 4;
        ctx.font = 'bold 72px serif';
        ctx.textAlign = 'center';
        ctx.strokeText("Alyssa's", 512, 280);
        ctx.fillText("Alyssa's", 512, 280);
        
        ctx.font = 'bold 64px serif';
        ctx.strokeText("Fairy Tale", 512, 360);
        ctx.fillText("Fairy Tale", 512, 360);
        
        // Subtitle with decorative elements
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'italic 28px serif';
        ctx.fillText("✨ A Magical Story from Jakarta ✨", 512, 420);
        
        // Decorative border
        ctx.strokeStyle = '#ffdd44';
        ctx.lineWidth = 6;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(30, 30, 964, 964);
        ctx.setLineDash([]);
        
        // Magic sparkles around title
        ctx.fillStyle = '#ffdd44';
        const sparklePositions = [
          {x: 200, y: 250}, {x: 820, y: 280}, {x: 150, y: 350}, 
          {x: 870, y: 330}, {x: 300, y: 200}, {x: 720, y: 380}
        ];
        sparklePositions.forEach(pos => {
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 15);
          }
          ctx.stroke();
          ctx.restore();
        });
      }
      const texture = new CanvasTexture(canvas);
      material = new MeshBasicMaterial({ map: texture, side: 2 });
    } else if (isLastPage) {
      // Back cover
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#2d0a30';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 48px serif';
        ctx.textAlign = 'center';
        ctx.fillText('The End', 512, 512);
      }
      const texture = new CanvasTexture(canvas);
      material = new MeshBasicMaterial({ map: texture, side: 2 });
    } else {
      // Regular story pages - alternating image/text
      const pageData = pages[index];
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Determine if this is an image page or text page
        // Odd pages (1, 3, 5...) = images, Even pages (2, 4, 6...) = text
        const isImagePage = index % 2 === 1;
        
        if (isImagePage) {
          const imgUrl = pageData?.imageURL; 

          if (imgUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // needed if image comes from another domain
            img.onload = () => {
              // Draw the image into the same placeholder box (cover-fit logic optional)
              ctx.drawImage(img, 100, 100, 824, 600);

              // mark the texture as dirty so Three.js updates it
              if (material?.map) {
                material.map.needsUpdate = true;
              }
            };
            img.onerror = () => {
              // fallback if image fails
              ctx.fillStyle = '#8b5a96';
              ctx.fillRect(100, 100, 824, 600);
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 32px serif';
              ctx.textAlign = 'center';
              ctx.fillText('Image failed to load', 512, 400);
            };
            img.src = imgUrl;
          } else {
            // fallback placeholder if no image URL in pageData
            ctx.fillStyle = '#8b5a96';
            ctx.fillRect(100, 100, 824, 600);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px serif';
            ctx.textAlign = 'center';
            ctx.fillText('Story Image', 512, 380);
            ctx.font = '24px serif';
            ctx.fillText('Illustration for:', 512, 420);
            ctx.fillText(pageData.title || '', 512, 450);
          }
          
        } else {
          // Full page text
          ctx.fillStyle = '#fefefe';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Title
          ctx.fillStyle = '#4a0e4e';
          ctx.font = 'bold 48px serif';
          ctx.textAlign = 'center';
          ctx.fillText(pageData.title || '', 512, 120);
          
          // Decorative line under title
          ctx.strokeStyle = '#8b5a96';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(200, 150);
          ctx.lineTo(824, 150);
          ctx.stroke();
          
          // Story text
          ctx.fillStyle = '#333333';
          ctx.font = '28px serif';
          ctx.textAlign = 'left';
          const text = pageData.content || '';
          const words = text.split(' ');
          let line = '';
          let y = 220;
          const maxWidth = 700;
          const lineHeight = 40;
          
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, 160, y);
              line = words[n] + ' ';
              y += lineHeight;
              if (y > 900) break;
            } else {
              line = testLine;
            }
          }
          if (line.trim()) {
            ctx.fillText(line, 160, y);
          }
        }
      }
      const texture = new CanvasTexture(canvas);
      material = new MeshBasicMaterial({ map: texture, side: 2 });
    }

    const mesh = new SkinnedMesh(geometry, material);
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    mesh.frustumCulled = false;
    
    // Mark as loaded once mesh is created
    setTimeout(() => setIsLoaded(true), 0);
    
    return mesh;
  }, [index]);
  
  useFrame((_, delta) => {
    if (!groupRef.current || !skeletonRef.current) return;
    
    const opened = delayedPage > index;
    const bookClosed = delayedPage === 0 || delayedPage === pages.length;
    
    let targetRotation;
    
    // Simple book mechanics: Spine is at 0°, pages flip from right to left
    // Calculate proper paper physics to prevent overlap
    const pageThickness = isCover ? COVER_DEPTH : PAGE_DEPTH;
    const totalPagesRead = delayedPage;
    const totalPagesUnread = pages.length - delayedPage;
    
    if (delayedPage === 0) {
      // Book is closed - all pages/covers flat at 0°
      targetRotation = 0;
    } else {
      // Book is open - pages flip based on whether they've been "read"
      if (opened) {
        // Page has been read - it's now on the LEFT side (flipped towards camera)
        targetRotation = -Math.PI; // -180° (left side, towards camera)
        
        // Stack read pages on left side with proper thickness
        const readPageIndex = totalPagesRead - index - 1;
        const leftStackOffset = readPageIndex * pageThickness * 20;
        targetRotation += leftStackOffset * 0.01; // Small angular offset for thickness
      } else {
        // Page hasn't been read - it's on the RIGHT side  
        targetRotation = 0; // 0° (right side, starting position)
        
        // Stack unread pages on right side with proper thickness
        const unreadPageIndex = index - totalPagesRead;
        const rightStackOffset = unreadPageIndex * pageThickness * 20;
        targetRotation -= rightStackOffset * 0.01; // Small angular offset for thickness
      }
    }
    
    const bones = skeletonRef.current.bones;
    
    // Animate each bone for realistic page curving
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? groupRef.current : bones[i];
      
      // Create curve effect as page turns
      let rotationAngle = 0;
      
      if (i === 0) {
        // Main rotation for the whole page
        rotationAngle = targetRotation;
      } else {
        // Minimal curve effect for individual segments
        const curveStrength = 0.005; // Even more subtle
        const segmentProgress = i / bones.length;
        const curveIntensity = Math.sin(segmentProgress * Math.PI * 0.3); // Much less dramatic curve
        rotationAngle = targetRotation * curveStrength * curveIntensity;
      }
      
      // Different rotation logic for covers vs regular pages
      if (i === 0) {
        const current = target.rotation.y;
        const target_angle = rotationAngle;
        
        if (isCover) {
          // Special handling for covers
          if (isFirstPage) {
            // Front cover: when opening (0° to -180°), flip towards camera
            if (Math.abs(current) < 0.1 && Math.abs(target_angle + Math.PI) < 0.1) {
              // Opening: flip towards camera (negative direction)
              target.rotation.y = current - 0.1;
            } else if (Math.abs(current + Math.PI) < 0.1 && Math.abs(target_angle) < 0.1) {
              // Closing: flip back away from camera (positive direction)
              target.rotation.y = current + 0.1;
            } else {
              easing.dampAngle(target.rotation, "y", rotationAngle, 0.3, delta);
            }
          } else if (isLastPage) {
            // Back cover: should flip like regular pages towards camera
            if (Math.abs(current) < 0.1 && Math.abs(target_angle + Math.PI) < 0.1) {
              // Opening: flip towards camera (negative direction)
              target.rotation.y = current - 0.15;
            } else if (Math.abs(current + Math.PI) < 0.1 && Math.abs(target_angle) < 0.1) {
              // Closing: flip back away from camera (positive direction)
              target.rotation.y = current + 0.15;
            } else {
              easing.dampAngle(target.rotation, "y", rotationAngle, 0.3, delta);
            }
          } else {
            // Other covers use normal rotation
            easing.dampAngle(target.rotation, "y", rotationAngle, 0.3, delta);
          }
        } else {
          // Regular pages must flip over covers towards camera
          // When going from 0° to -180°, flip towards camera (negative rotation)
          // When going from -180° to 0°, flip away from camera (positive rotation)
          if (Math.abs(current) < 0.1 && Math.abs(target_angle + Math.PI) < 0.1) {
            // Going from 0° to -180° - flip towards camera
            target.rotation.y = current - 0.15; // Flip towards camera
          } else if (Math.abs(current + Math.PI) < 0.1 && Math.abs(target_angle) < 0.1) {
            // Going from -180° to 0° - flip back away from camera
            target.rotation.y = current + 0.15; // Flip back
          } else {
            // Normal easing for fine adjustments
            easing.dampAngle(target.rotation, "y", rotationAngle, 0.3, delta);
          }
        }
      } else {
        // For bone segments, use normal easing
        easing.dampAngle(target.rotation, "y", rotationAngle, 0.3, delta);
      }
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (delayedPage === 0) {
      // Book is closed - clicking anything opens to first page
      setPage(1);
    } else if (isFirstPage && delayedPage > 0) {
      // Front cover is on left side - clicking it closes the book
      setPage(0);
    } else {
      // Regular page behavior - flip to other side
      const opened = delayedPage > index;
      if (opened) {
        // Page is on left side - flip it back to right (go back)
        setPage(index);
      } else {
        // Page is on right side - flip it to left (go forward)  
        setPage(index + 1);
      }
    }
  };

  // Calculate proper z-position to prevent mesh overlap
  const opened = delayedPage > index;
  const currentPageThickness = isCover ? COVER_DEPTH : PAGE_DEPTH;
  
  let zPosition;
  
  if (opened) {
    // Page is flipped to the left side - stack on positive Z
    // Start from front of spine and add thickness of each flipped page
    let position = 0;
    for (let i = 0; i <= index; i++) {
      if (delayedPage > i) {
        const pageIsCover = i === 0 || i === pages.length - 1;
        const pageThickness = pageIsCover ? COVER_DEPTH : PAGE_DEPTH;
        
        if (i === index) {
          // This is the current page - position its center
          position += pageThickness / 2;
        } else {
          // Previous flipped pages - add their full thickness + gap
          position += pageThickness + GAP_SIZE;
        }
      }
    }
    zPosition = position;
  } else {
    // Page is unflipped - stack on negative Z from spine
    // Calculate position from spine backwards
    let position = 0;
    for (let i = 0; i < index; i++) {
      const pageIsCover = i === 0 || i === pages.length - 1;
      const pageThickness = pageIsCover ? COVER_DEPTH : PAGE_DEPTH;
      position -= pageThickness + GAP_SIZE;
    }
    // Add half of current page thickness to center it properly
    position -= currentPageThickness / 2;
    zPosition = position;
  }

  return (
    <group ref={groupRef} onClick={handleClick} position={[0, 0, zPosition]}>
      {isLoaded && <primitive object={skinnedMesh} />}
    </group>
  );
};