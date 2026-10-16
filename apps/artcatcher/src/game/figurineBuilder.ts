import * as THREE from 'three';
import { PrizeMetadata } from '../types';
import { getArtTexture } from '../utils/artTextures';

export interface FigurineInstance {
  id: string;
  metadata: PrizeMetadata;
  mesh: THREE.Group;
  initialPos: THREE.Vector3;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  radius: number;
  isGripped: boolean;
  isWon: boolean;
}

/**
 * Builds a stylized 3D art figurine for each character/artwork.
 */
export function createFigurine(metadata: PrizeMetadata): THREE.Group {
  const group = new THREE.Group();
  const artTexture = getArtTexture(metadata.id);

  // Standard art material
  const artMaterial = new THREE.MeshStandardMaterial({
    map: artTexture,
    roughness: 0.35,
    metalness: metadata.rarity === 'Legendary' ? 0.3 : 0.1,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.85,
  });

  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.6,
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
  });

  switch (metadata.figurineType) {
    case 'bear': {
      // Body
      const bodyGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.45, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.25;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.28, 20, 20);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.y = 0.62;
      head.castShadow = true;
      group.add(head);

      // Ears
      const earGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const earL = new THREE.Mesh(earGeo, artMaterial);
      earL.position.set(-0.22, 0.82, 0);
      const earR = new THREE.Mesh(earGeo, artMaterial);
      earR.position.set(0.22, 0.82, 0);
      group.add(earL, earR);

      // Snout & Eyes
      const snoutGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const snout = new THREE.Mesh(snoutGeo, whiteMaterial);
      snout.position.set(0, 0.58, 0.22);
      group.add(snout);

      const noseGeo = new THREE.SphereGeometry(0.04, 12, 12);
      const nose = new THREE.Mesh(noseGeo, blackMaterial);
      nose.position.set(0, 0.62, 0.3);
      group.add(nose);

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.03, 10, 10);
      const eyeL = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeL.position.set(-0.09, 0.67, 0.24);
      const eyeR = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeR.position.set(0.09, 0.67, 0.24);
      group.add(eyeL, eyeR);

      // Small crescent star moon emblem on chest
      const starGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI * 1.3);
      const star = new THREE.Mesh(starGeo, goldMaterial);
      star.position.set(0, 0.32, 0.28);
      group.add(star);
      break;
    }

    case 'cat': {
      // Body
      const bodyGeo = new THREE.ConeGeometry(0.28, 0.55, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.28;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.25, 20, 20);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.y = 0.65;
      head.castShadow = true;
      group.add(head);

      // Pointy Cat Ears
      const earGeo = new THREE.ConeGeometry(0.09, 0.18, 8);
      const earL = new THREE.Mesh(earGeo, artMaterial);
      earL.position.set(-0.16, 0.88, 0.02);
      earL.rotation.z = 0.25;
      const earR = new THREE.Mesh(earGeo, artMaterial);
      earR.position.set(0.16, 0.88, 0.02);
      earR.rotation.z = -0.25;
      group.add(earL, earR);

      // Eyes with Mona Lisa gentle smile
      const eyeGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const eyeL = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeL.position.set(-0.08, 0.67, 0.22);
      const eyeR = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeR.position.set(0.08, 0.67, 0.22);
      group.add(eyeL, eyeR);

      // Classical Renaissance Collar
      const collarGeo = new THREE.TorusGeometry(0.22, 0.04, 12, 24);
      const collar = new THREE.Mesh(collarGeo, goldMaterial);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.5;
      group.add(collar);
      break;
    }

    case 'bunny': {
      // Body
      const bodyGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.28;
      body.scale.set(1, 1.2, 0.9);
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.24, 20, 20);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.y = 0.65;
      head.castShadow = true;
      group.add(head);

      // Long Bunny Ears
      const earGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.38, 12);
      const earL = new THREE.Mesh(earGeo, artMaterial);
      earL.position.set(-0.12, 0.98, 0);
      earL.rotation.z = 0.15;
      const earR = new THREE.Mesh(earGeo, artMaterial);
      earR.position.set(0.12, 0.98, 0);
      earR.rotation.z = -0.15;
      group.add(earL, earR);

      // Vermeer Blue Turban Drape
      const turbanGeo = new THREE.TorusGeometry(0.25, 0.05, 12, 24);
      const turban = new THREE.Mesh(turbanGeo, new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }));
      turban.rotation.x = Math.PI / 2;
      turban.position.y = 0.76;
      group.add(turban);

      // Hanging Shimmering Pearl Earring
      const pearlGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const pearlMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      pearl.position.set(-0.25, 0.6, 0.05);
      group.add(pearl);
      break;
    }

    case 'whale': {
      // Whale body
      const whaleGeo = new THREE.SphereGeometry(0.32, 20, 20);
      const whale = new THREE.Mesh(whaleGeo, artMaterial);
      whale.scale.set(1.4, 0.9, 0.9);
      whale.position.y = 0.32;
      whale.castShadow = true;
      group.add(whale);

      // Tail
      const tailGeo = new THREE.ConeGeometry(0.15, 0.3, 12);
      const tail = new THREE.Mesh(tailGeo, artMaterial);
      tail.rotation.z = -Math.PI / 2;
      tail.position.set(-0.45, 0.32, 0);
      group.add(tail);

      // Flippers
      const flipperGeo = new THREE.BoxGeometry(0.2, 0.04, 0.12);
      const flipperL = new THREE.Mesh(flipperGeo, whiteMaterial);
      flipperL.position.set(0.05, 0.2, 0.3);
      flipperL.rotation.y = 0.3;
      const flipperR = new THREE.Mesh(flipperGeo, whiteMaterial);
      flipperR.position.set(0.05, 0.2, -0.3);
      flipperR.rotation.y = -0.3;
      group.add(flipperL, flipperR);

      // Spout / Wave water drop
      const spoutGeo = new THREE.ConeGeometry(0.05, 0.14, 8);
      const spout = new THREE.Mesh(spoutGeo, whiteMaterial);
      spout.position.set(0.15, 0.64, 0);
      group.add(spout);
      break;
    }

    case 'scream': {
      // Ghostly Munch wavy body
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.65, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.35;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.scale.set(0.85, 1.25, 0.9);
      head.position.y = 0.72;
      group.add(head);

      // Oval Agog Eyes & Mouth
      const eyeGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const eyeL = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeL.position.set(-0.08, 0.77, 0.2);
      const eyeR = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeR.position.set(0.08, 0.77, 0.2);

      const mouthGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.12, 12);
      const mouth = new THREE.Mesh(mouthGeo, blackMaterial);
      mouth.position.set(0, 0.63, 0.2);
      group.add(eyeL, eyeR, mouth);

      // Hands Clasping Cheeks
      const handGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const handL = new THREE.Mesh(handGeo, whiteMaterial);
      handL.position.set(-0.2, 0.68, 0.14);
      const handR = new THREE.Mesh(handGeo, whiteMaterial);
      handR.position.set(0.2, 0.68, 0.14);
      group.add(handL, handR);
      break;
    }

    case 'dog': {
      // Cubist origami dog
      const bodyGeo = new THREE.BoxGeometry(0.38, 0.35, 0.52);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.28;
      body.castShadow = true;
      group.add(body);

      // Faceted Head
      const headGeo = new THREE.BoxGeometry(0.3, 0.32, 0.32);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.rotation.y = 0.25;
      head.position.set(0, 0.58, 0.2);
      group.add(head);

      // Angular Snout
      const snoutGeo = new THREE.ConeGeometry(0.12, 0.22, 4);
      const snout = new THREE.Mesh(snoutGeo, artMaterial);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 0.52, 0.42);
      group.add(snout);

      // Angular Ears
      const earGeo = new THREE.ConeGeometry(0.09, 0.24, 4);
      const earL = new THREE.Mesh(earGeo, blackMaterial);
      earL.position.set(-0.16, 0.78, 0.18);
      earL.rotation.z = 0.4;
      const earR = new THREE.Mesh(earGeo, goldMaterial);
      earR.position.set(0.16, 0.78, 0.18);
      earR.rotation.z = -0.4;
      group.add(earL, earR);
      break;
    }

    case 'capybara': {
      // Plump Chill Capybara Body
      const bodyGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.5, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.26;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.28, 0.26, 0.36);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.set(0, 0.42, 0.26);
      group.add(head);

      // Lotus Flower on Head
      const lotusBaseGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.04, 8);
      const lotusBase = new THREE.Mesh(lotusBaseGeo, new THREE.MeshStandardMaterial({ color: 0x22c55e }));
      lotusBase.position.set(0, 0.58, 0.26);
      group.add(lotusBase);

      const petalGeo = new THREE.SphereGeometry(0.07, 8, 8);
      const petalMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(0, 0.65, 0.26);
      group.add(petal);

      // Closed Chill Eyes
      const eyeGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
      const eyeL = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeL.position.set(-0.14, 0.44, 0.36);
      const eyeR = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeR.position.set(0.14, 0.44, 0.36);
      group.add(eyeL, eyeR);
      break;
    }

    case 'lion': {
      // Body
      const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.46, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.25;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeo, goldMaterial);
      head.position.y = 0.58;
      group.add(head);

      // Majestic Klimt Golden Mane
      const maneGeo = new THREE.TorusGeometry(0.26, 0.09, 12, 24);
      const mane = new THREE.Mesh(maneGeo, artMaterial);
      mane.position.set(0, 0.58, -0.02);
      group.add(mane);

      // Golden Crown / Tiara
      const crownGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.1, 8);
      const crown = new THREE.Mesh(crownGeo, goldMaterial);
      crown.position.set(0, 0.82, 0);
      group.add(crown);
      break;
    }

    case 'rainbow_pony':
    case 'twilight_pony':
    case 'pinkie_pony':
    case 'fluttershy_pony': {
      // 1. Torso
      const bodyMat = artMaterial;
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.42, 16);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      body.position.set(0, 0.34, 0);
      body.castShadow = true;
      group.add(body);

      // 2. Four Legs / Hooves
      const legGeo = new THREE.CylinderGeometry(0.05, 0.065, 0.28, 12);
      const legPositions = [
        [-0.14, 0.15, 0.12],
        [0.14, 0.15, 0.12],
        [-0.14, 0.15, -0.12],
        [0.14, 0.15, -0.12],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        group.add(leg);
      });

      // 3. Graceful Neck
      const neckGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.26, 12);
      const neck = new THREE.Mesh(neckGeo, bodyMat);
      neck.position.set(0.16, 0.48, 0);
      neck.rotation.z = -0.35;
      neck.castShadow = true;
      group.add(neck);

      // 4. Expressive Pony Head & Snout
      const headGeo = new THREE.SphereGeometry(0.22, 20, 20);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(0.24, 0.68, 0);
      head.castShadow = true;
      group.add(head);

      const snoutGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const snout = new THREE.Mesh(snoutGeo, bodyMat);
      snout.scale.set(1.2, 0.8, 0.9);
      snout.position.set(0.4, 0.62, 0);
      group.add(snout);

      // 5. Pointed Pony Ears
      const earGeo = new THREE.ConeGeometry(0.06, 0.16, 8);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(0.2, 0.86, 0.11);
      earL.rotation.x = 0.2;
      earL.rotation.z = -0.2;

      const earR = new THREE.Mesh(earGeo, bodyMat);
      earR.position.set(0.2, 0.86, -0.11);
      earR.rotation.x = -0.2;
      earR.rotation.z = -0.2;
      group.add(earL, earR);

      // 6. Big Sparkly Eyes
      const eyeGeo = new THREE.SphereGeometry(0.055, 12, 12);
      const eyeL = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeL.position.set(0.34, 0.72, 0.14);
      eyeL.scale.set(0.6, 1.2, 1.0);

      const eyeR = new THREE.Mesh(eyeGeo, blackMaterial);
      eyeR.position.set(0.34, 0.72, -0.14);
      eyeR.scale.set(0.6, 1.2, 1.0);

      // Sparkle Highlights in Eyes
      const sparkleGeo = new THREE.SphereGeometry(0.02, 8, 8);
      const spL = new THREE.Mesh(sparkleGeo, whiteMaterial);
      spL.position.set(0.37, 0.75, 0.15);
      const spR = new THREE.Mesh(sparkleGeo, whiteMaterial);
      spR.position.set(0.37, 0.75, -0.15);
      group.add(eyeL, eyeR, spL, spR);

      // 7. Character-specific Features: Horn, Wings, Mane & Tail
      if (metadata.figurineType === 'twilight_pony') {
        // Unicorn Magic Horn
        const hornGeo = new THREE.ConeGeometry(0.045, 0.24, 12);
        const hornMat = new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          roughness: 0.2,
          metalness: 0.8,
        });
        const horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(0.32, 0.88, 0);
        horn.rotation.z = -0.45;
        group.add(horn);

        // Sleek Royal Mane & Tail
        const maneMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
        const maneGeo = new THREE.BoxGeometry(0.12, 0.35, 0.16);
        const mane = new THREE.Mesh(maneGeo, maneMat);
        mane.position.set(0.08, 0.65, 0);
        group.add(mane);

        const tailGeo = new THREE.ConeGeometry(0.08, 0.4, 8);
        const tail = new THREE.Mesh(tailGeo, maneMat);
        tail.position.set(-0.28, 0.35, 0);
        tail.rotation.z = 0.8;
        group.add(tail);
      } else if (metadata.figurineType === 'rainbow_pony') {
        // Pegasus Wings
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
        const wingGeo = new THREE.BoxGeometry(0.04, 0.14, 0.28);

        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(0, 0.46, 0.2);
        wingL.rotation.x = 0.4;
        wingL.rotation.y = 0.2;

        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(0, 0.46, -0.2);
        wingR.rotation.x = -0.4;
        wingR.rotation.y = -0.2;
        group.add(wingL, wingR);

        // Dynamic Rainbow Mane
        const rainbowColors = [0xef4444, 0xfacc15, 0x22c55e, 0x06b6d4, 0x8b5cf6];
        rainbowColors.forEach((col, i) => {
          const mPieceGeo = new THREE.BoxGeometry(0.08, 0.12, 0.1);
          const mPiece = new THREE.Mesh(mPieceGeo, new THREE.MeshStandardMaterial({ color: col }));
          mPiece.position.set(0.2 - i * 0.05, 0.8 - i * 0.05, 0);
          group.add(mPiece);
        });

        // Arched Rainbow Tail
        const tailGeo = new THREE.CylinderGeometry(0.05, 0.1, 0.36, 8);
        const tail = new THREE.Mesh(tailGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        tail.position.set(-0.28, 0.38, 0);
        tail.rotation.z = 0.9;
        group.add(tail);
      } else if (metadata.figurineType === 'pinkie_pony') {
        // Cotton candy bubbly curly mane
        const curlMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.4 });
        for (let i = 0; i < 5; i++) {
          const curlGeo = new THREE.SphereGeometry(0.09, 10, 10);
          const curl = new THREE.Mesh(curlGeo, curlMat);
          curl.position.set(0.18 - i * 0.06, 0.78 - i * 0.04 + (i % 2) * 0.05, (i % 2 === 0 ? 0.04 : -0.04));
          group.add(curl);
        }

        // Big bouncy curly tail
        const tailCurl1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), curlMat);
        tailCurl1.position.set(-0.26, 0.42, 0);
        const tailCurl2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), curlMat);
        tailCurl2.position.set(-0.35, 0.32, 0);
        group.add(tailCurl1, tailCurl2);
      } else if (metadata.figurineType === 'fluttershy_pony') {
        // Delicate Fluttershy Pegasus Wings
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
        const wingGeo = new THREE.BoxGeometry(0.03, 0.12, 0.22);
        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(0, 0.44, 0.18);
        wingL.rotation.x = 0.3;
        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(0, 0.44, -0.18);
        wingR.rotation.x = -0.3;
        group.add(wingL, wingR);

        // Long soft pastel pink mane
        const maneMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
        const maneFlowGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.42, 12);
        const maneFlow = new THREE.Mesh(maneFlowGeo, maneMat);
        maneFlow.position.set(0.12, 0.52, 0.12);
        maneFlow.rotation.z = -0.2;
        group.add(maneFlow);

        // Long sweeping tail
        const tailGeo = new THREE.CylinderGeometry(0.06, 0.11, 0.38, 8);
        const tail = new THREE.Mesh(tailGeo, maneMat);
        tail.position.set(-0.26, 0.28, 0);
        tail.rotation.z = 0.5;
        group.add(tail);
      } else if (metadata.figurineType === 'applejack_pony') {
        // Brown Stetson Cowboy Hat
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
        const brimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.025, 16);
        const brim = new THREE.Mesh(brimGeo, hatMat);
        brim.position.set(0.22, 0.88, 0);
        brim.rotation.z = -0.2;

        const crownGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.12, 16);
        const crown = new THREE.Mesh(crownGeo, hatMat);
        crown.position.set(0.23, 0.95, 0);
        crown.rotation.z = -0.2;
        group.add(brim, crown);

        // Golden Ponytail
        const maneMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
        const ponyTail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.34, 8), maneMat);
        ponyTail.position.set(-0.26, 0.32, 0);
        ponyTail.rotation.z = 0.6;
        group.add(ponyTail);
      } else if (metadata.figurineType === 'rarity_pony') {
        // Spiral Diamond Horn
        const hornGeo = new THREE.ConeGeometry(0.04, 0.24, 12);
        const hornMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.1,
          metalness: 0.85,
        });
        const horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(0.32, 0.88, 0);
        horn.rotation.z = -0.45;
        group.add(horn);

        // Royal Purple Hair Curls
        const curlMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.3 });
        const curl1 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 8, 16), curlMat);
        curl1.position.set(0.12, 0.62, 0.12);
        curl1.rotation.y = 0.4;
        group.add(curl1);
      } else if (metadata.figurineType === 'celestia_pony') {
        // Princess Celestia Grand Alicorn Horn
        const hornGeo = new THREE.ConeGeometry(0.045, 0.3, 12);
        const horn = new THREE.Mesh(hornGeo, goldMaterial);
        horn.position.set(0.32, 0.92, 0);
        horn.rotation.z = -0.45;
        group.add(horn);

        // Grand Sun Tiara
        const tiara = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.08, 8), goldMaterial);
        tiara.position.set(0.26, 0.86, 0);
        group.add(tiara);

        // Majestic Alicorn Wings
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const wingGeo = new THREE.BoxGeometry(0.04, 0.2, 0.38);
        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(0, 0.52, 0.24);
        wingL.rotation.x = 0.5;
        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(0, 0.52, -0.24);
        wingR.rotation.x = -0.5;
        group.add(wingL, wingR);
      } else if (metadata.figurineType === 'luna_pony') {
        // Night Alicorn Horn
        const hornGeo = new THREE.ConeGeometry(0.045, 0.28, 12);
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
        const horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(0.32, 0.9, 0);
        horn.rotation.z = -0.45;
        group.add(horn);

        // Dark Night Wings
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
        const wingGeo = new THREE.BoxGeometry(0.04, 0.18, 0.34);
        const wingL = new THREE.Mesh(wingGeo, wingMat);
        wingL.position.set(0, 0.5, 0.22);
        wingL.rotation.x = 0.45;
        const wingR = new THREE.Mesh(wingGeo, wingMat);
        wingR.position.set(0, 0.5, -0.22);
        wingR.rotation.x = -0.45;
        group.add(wingL, wingR);
      }
      break;
    }

    case 'dali_clock': {
      // Surreal Dali Bear with draped melting clock
      const bodyGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.45, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.25;
      body.castShadow = true;
      group.add(body);

      const headGeo = new THREE.SphereGeometry(0.28, 20, 20);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.y = 0.62;
      head.castShadow = true;
      group.add(head);

      // Drooping melting clock on ear/shoulder
      const clockGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 24, Math.PI * 1.5);
      const clockMesh = new THREE.Mesh(clockGeo, goldMaterial);
      clockMesh.position.set(0.22, 0.58, 0.12);
      clockMesh.rotation.x = Math.PI / 3;
      clockMesh.rotation.z = -0.4;
      group.add(clockMesh);
      break;
    }

    case 'kusama_pumpkin': {
      // Bulbous Pumpkin Form
      const pumpGeo = new THREE.SphereGeometry(0.32, 20, 20);
      const pumpMesh = new THREE.Mesh(pumpGeo, artMaterial);
      pumpMesh.scale.set(1.15, 0.85, 1.15);
      pumpMesh.position.y = 0.35;
      pumpMesh.castShadow = true;
      group.add(pumpMesh);

      // Green curled pumpkin stalk stem
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.16, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, 0.68, 0);
      stem.rotation.z = 0.25;
      group.add(stem);

      // Cute playful eyes
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blackMaterial);
      eyeL.position.set(-0.1, 0.4, 0.32);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blackMaterial);
      eyeR.position.set(0.1, 0.4, 0.32);
      group.add(eyeL, eyeR);
      break;
    }

    case 'warhol_soup': {
      // Soup Can Body
      const canGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.48, 24);
      const canMesh = new THREE.Mesh(canGeo, artMaterial);
      canMesh.position.y = 0.3;
      canMesh.castShadow = true;
      group.add(canMesh);

      // Raccoon Head on top
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeo, whiteMaterial);
      head.position.y = 0.64;
      group.add(head);

      // Raccoon eye mask
      const maskGeo = new THREE.BoxGeometry(0.28, 0.08, 0.08);
      const mask = new THREE.Mesh(maskGeo, blackMaterial);
      mask.position.set(0, 0.66, 0.18);
      group.add(mask);

      // Striped tail
      const tailGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.32, 8);
      const tail = new THREE.Mesh(tailGeo, blackMaterial);
      tail.position.set(0, 0.25, -0.28);
      tail.rotation.x = -0.7;
      group.add(tail);
      break;
    }

    case 'angel_pup': {
      // Angel Puppy Body
      const bodyGeo = new THREE.SphereGeometry(0.26, 16, 16);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.28;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.y = 0.62;
      group.add(head);

      // Golden Halo Ring
      const haloGeo = new THREE.TorusGeometry(0.16, 0.025, 8, 24);
      const halo = new THREE.Mesh(haloGeo, goldMaterial);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.92, 0);
      group.add(halo);

      // Angelic Wings
      const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
      const wingGeo = new THREE.BoxGeometry(0.03, 0.16, 0.28);
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-0.16, 0.44, -0.05);
      wingL.rotation.y = -0.4;
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0.16, 0.44, -0.05);
      wingR.rotation.y = 0.4;
      group.add(wingL, wingR);
      break;
    }

    case 'teletubby_tinky':
    case 'teletubby_dipsy':
    case 'teletubby_laalaa':
    case 'teletubby_po': {
      // 1. Chubby Plush Body
      const bodyGeo = new THREE.CylinderGeometry(0.22, 0.3, 0.46, 20);
      const body = new THREE.Mesh(bodyGeo, artMaterial);
      body.position.y = 0.26;
      body.castShadow = true;
      group.add(body);

      // 2. Silver TV Screen Belly
      const tvMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.15,
        metalness: 0.9,
      });
      const tvGeo = new THREE.BoxGeometry(0.24, 0.18, 0.04);
      const tvMesh = new THREE.Mesh(tvGeo, tvMat);
      tvMesh.position.set(0, 0.26, 0.24);
      group.add(tvMesh);

      // 3. Stubby Legs
      const legGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.16, 12);
      const legL = new THREE.Mesh(legGeo, artMaterial);
      legL.position.set(-0.12, 0.08, 0);
      const legR = new THREE.Mesh(legGeo, artMaterial);
      legR.position.set(0.12, 0.08, 0);
      group.add(legL, legR);

      // 4. Plush Arms
      const armGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.24, 12);
      const armL = new THREE.Mesh(armGeo, artMaterial);
      armL.position.set(-0.24, 0.28, 0.04);
      armL.rotation.z = 0.35;
      const armR = new THREE.Mesh(armGeo, artMaterial);
      armR.position.set(0.24, 0.28, 0.04);
      armR.rotation.z = -0.35;
      group.add(armL, armR);

      // 5. Chubby Head & Baby Face
      const headGeo = new THREE.SphereGeometry(0.26, 20, 20);
      const head = new THREE.Mesh(headGeo, artMaterial);
      head.position.y = 0.65;
      head.castShadow = true;
      group.add(head);

      // Soft Peach Baby Face inset
      const faceMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
      const faceGeo = new THREE.SphereGeometry(0.17, 16, 16);
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.scale.set(1.0, 0.95, 0.4);
      face.position.set(0, 0.63, 0.2);
      group.add(face);

      // Cute Round Eyes & Warm Smile
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), blackMaterial);
      eyeL.position.set(-0.065, 0.66, 0.26);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), blackMaterial);
      eyeR.position.set(0.065, 0.66, 0.26);

      const smileGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 12, Math.PI);
      const smile = new THREE.Mesh(smileGeo, blackMaterial);
      smile.position.set(0, 0.6, 0.27);
      smile.rotation.x = Math.PI;
      group.add(eyeL, eyeR, smile);

      // Cute Rounded Ears
      const earGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const earL = new THREE.Mesh(earGeo, artMaterial);
      earL.scale.set(0.4, 1.0, 0.8);
      earL.position.set(-0.26, 0.68, 0);
      const earR = new THREE.Mesh(earGeo, artMaterial);
      earR.scale.set(0.4, 1.0, 0.8);
      earR.position.set(0.26, 0.68, 0);
      group.add(earL, earR);

      // 6. Distinctive Antennas & Signature Accessories
      if (metadata.figurineType === 'teletubby_tinky') {
        // Tinky Winky: Triangular Antenna & Red Magic Purse
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), artMaterial);
        stem.position.set(0, 0.94, 0);
        group.add(stem);

        // Inverted Triangle Loop atop head
        const triGeo = new THREE.TorusGeometry(0.09, 0.025, 8, 3);
        const tri = new THREE.Mesh(triGeo, artMaterial);
        tri.position.set(0, 1.05, 0);
        tri.rotation.z = Math.PI / 3;
        group.add(tri);

        // Red Magic Handbag
        const bagMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.06), bagMat);
        bag.position.set(0.28, 0.18, 0.12);
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 16, Math.PI), bagMat);
        handle.position.set(0.28, 0.26, 0.12);
        group.add(bag, handle);
      } else if (metadata.figurineType === 'teletubby_dipsy') {
        // Dipsy: Straight Dipstick Antenna & Cow Print Top Hat
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.26, 8), artMaterial);
        antenna.position.set(0, 1.02, 0);
        group.add(antenna);

        // Cow print top hat tipped on ear
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16), hatMat);
        hatBrim.position.set(0.18, 0.88, 0);
        hatBrim.rotation.z = -0.3;
        const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 16), hatMat);
        hatCrown.position.set(0.2, 0.96, 0);
        hatCrown.rotation.z = -0.3;
        group.add(hatBrim, hatCrown);
      } else if (metadata.figurineType === 'teletubby_laalaa') {
        // Laa-Laa: Curly Spiral Antenna & Orange Bouncy Ball
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8), artMaterial);
        stem.position.set(0, 0.93, 0);
        group.add(stem);

        const spiral = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16, Math.PI * 1.5), artMaterial);
        spiral.position.set(0, 1.04, 0);
        spiral.rotation.y = Math.PI / 4;
        group.add(spiral);

        // Big Orange Bouncy Ball beside foot
        const ballMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.2 });
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), ballMat);
        ball.position.set(-0.25, 0.14, 0.15);
        group.add(ball);
      } else if (metadata.figurineType === 'teletubby_po') {
        // Po: Circular Ring Antenna & Pink Scooter
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8), artMaterial);
        stem.position.set(0, 0.93, 0);
        group.add(stem);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.025, 8, 16), artMaterial);
        ring.position.set(0, 1.06, 0);
        group.add(ring);

        // Pink Scooter
        const scooterMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
        const deck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.28), scooterMat);
        deck.position.set(0.24, 0.04, 0.15);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 8), scooterMat);
        bar.position.set(0.24, 0.18, 0.26);
        group.add(deck, bar);
      }
      break;
    }
  }

  // Common Golden Pedestal Ring base
  const baseGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.06, 24);
  const baseMesh = new THREE.Mesh(baseGeo, goldMaterial);
  baseMesh.position.y = 0.03;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Group scale normalization (scaled to 0.68 for realistic arcade doll pit proportion)
  group.scale.set(0.68, 0.68, 0.68);

  return group;
}
