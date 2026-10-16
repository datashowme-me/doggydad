import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates high-detail procedural canvas textures representing the Google Arts & Culture masterpieces.
 */
export function getArtTexture(id: string): THREE.CanvasTexture {
  if (textureCache.has(id)) {
    return textureCache.get(id)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  switch (id) {
    case 'starry_bear': {
      // Van Gogh Starry Night swirling blues and yellows
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#0a1931');
      grad.addColorStop(0.5, '#153e75');
      grad.addColorStop(1, '#1b2a47');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Swirling sky strokes
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      const swirls = [
        { x: 180, y: 160, r: 90, color: '#facc15' },
        { x: 320, y: 190, r: 120, color: '#60a5fa' },
        { x: 150, y: 280, r: 70, color: '#93c5fd' },
        { x: 360, y: 320, r: 85, color: '#fde047' },
      ];

      swirls.forEach((s) => {
        ctx.strokeStyle = s.color;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3.5; a += 0.2) {
          const rad = (s.r * a) / (Math.PI * 3.5);
          const px = s.x + Math.cos(a) * rad;
          const py = s.y + Math.sin(a) * rad;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });

      // Stars
      for (let i = 0; i < 18; i++) {
        const sx = (i * 73 + 40) % 480;
        const sy = (i * 97 + 30) % 450;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'mona_cat': {
      // Leonardo da Vinci Sfumato Renaissance Palette
      const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 300);
      grad.addColorStop(0, '#a16207');
      grad.addColorStop(0.4, '#713f12');
      grad.addColorStop(0.8, '#422006');
      grad.addColorStop(1, '#1c1917');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Soft brush drapery folds
      ctx.strokeStyle = 'rgba(202, 138, 4, 0.25)';
      ctx.lineWidth = 20;
      for (let y = 100; y < 480; y += 45) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.bezierCurveTo(180, y + 30, 320, y - 20, 470, y + 40);
        ctx.stroke();
      }

      // Renaissance craquelure subtle crack lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        const rx = (i * 61) % 512;
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + ((i % 5) - 2) * 20, 512);
        ctx.stroke();
      }
      break;
    }

    case 'pearl_bunny': {
      // Vermeer Ultramarine Blue and Golden Ocre
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Oriental Turban Blue Flow
      const blueGrad = ctx.createLinearGradient(0, 0, 512, 512);
      blueGrad.addColorStop(0, '#0284c7');
      blueGrad.addColorStop(0.5, '#0369a1');
      blueGrad.addColorStop(1, '#075985');
      ctx.fillStyle = blueGrad;
      ctx.beginPath();
      ctx.ellipse(256, 220, 200, 140, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Ochre Collar Fold
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(256, 380, 220, 100, -Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Pearl Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(280, 290, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(280, 290, 42, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'great_wave_whale': {
      // Hokusai Great Wave Prussian Blue and Frothing Crests
      ctx.fillStyle = '#082f49';
      ctx.fillRect(0, 0, 512, 512);

      // Deep sea gradient
      const waveGrad = ctx.createLinearGradient(0, 512, 512, 0);
      waveGrad.addColorStop(0, '#0c4a6e');
      waveGrad.addColorStop(0.7, '#0284c7');
      waveGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = waveGrad;

      // Japanese wave claw arcs
      for (let layer = 0; layer < 4; layer++) {
        ctx.beginPath();
        const startY = 200 + layer * 70;
        ctx.moveTo(0, startY);
        for (let x = 0; x <= 512; x += 64) {
          ctx.bezierCurveTo(x + 20, startY - 70, x + 40, startY + 50, x + 64, startY);
        }
        ctx.lineTo(512, 512);
        ctx.lineTo(0, 512);
        ctx.fill();

        // White foam crests
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        for (let x = 0; x <= 512; x += 64) {
          ctx.bezierCurveTo(x + 20, startY - 70, x + 40, startY + 50, x + 64, startY);
        }
        ctx.stroke();
      }
      break;
    }

    case 'scream_ghost': {
      // Edvard Munch dramatic orange, red, and slate swirls
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0, '#ea580c'); // fiery orange
      skyGrad.addColorStop(0.35, '#dc2626'); // blood red
      skyGrad.addColorStop(0.65, '#475569'); // slate fjord
      skyGrad.addColorStop(1, '#0f172a'); // deep abyss
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Wavy expressionist contours
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      for (let y = 30; y < 240; y += 35) {
        ctx.strokeStyle = y % 2 === 0 ? '#f97316' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(150, y + 40, 300, y - 40, 512, y + 20);
        ctx.stroke();
      }

      // Fjord water ripples
      for (let y = 300; y < 512; y += 45) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(160, y - 25, 340, y + 25, 512, y - 10);
        ctx.stroke();
      }
      break;
    }

    case 'cubist_dog': {
      // Picasso geometric faceted planes
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 512);

      const facets = [
        { p: [[0, 0], [280, 0], [180, 240], [0, 160]], c: '#b45309' },
        { p: [[280, 0], [512, 0], [512, 220], [180, 240]], c: '#0284c7' },
        { p: [[0, 160], [180, 240], [120, 512], [0, 512]], c: '#475569' },
        { p: [[180, 240], [360, 280], [310, 512], [120, 512]], c: '#f59e0b' },
        { p: [[180, 240], [512, 220], [512, 440], [360, 280]], c: '#dc2626' },
        { p: [[360, 280], [512, 440], [512, 512], [310, 512]], c: '#1e293b' },
      ];

      facets.forEach((f) => {
        ctx.fillStyle = f.c;
        ctx.beginPath();
        ctx.moveTo(f.p[0][0], f.p[0][1]);
        for (let i = 1; i < f.p.length; i++) {
          ctx.lineTo(f.p[i][0], f.p[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
      break;
    }

    case 'water_lily_capybara': {
      // Claude Monet Water Lilies dabs
      ctx.fillStyle = '#14532d'; // pond dark green
      ctx.fillRect(0, 0, 512, 512);

      // Water ripples
      const pondGrad = ctx.createLinearGradient(0, 0, 512, 512);
      pondGrad.addColorStop(0, '#1e3a8a');
      pondGrad.addColorStop(0.5, '#065f46');
      pondGrad.addColorStop(1, '#4c1d95');
      ctx.fillStyle = pondGrad;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(0, 0, 512, 512);
      ctx.globalAlpha = 1.0;

      // Impressionistic Lily pads
      const pads = [
        { x: 120, y: 150, r: 60, c: '#22c55e' },
        { x: 380, y: 180, r: 75, c: '#16a34a' },
        { x: 220, y: 340, r: 85, c: '#15803d' },
        { x: 420, y: 400, r: 55, c: '#4ade80' },
      ];

      pads.forEach((p) => {
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 1.8);
        ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.fill();

        // Pink blooming lotus
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'kiss_lion': {
      // Gustav Klimt Golden Kiss mosaic
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 0, 512, 512);

      // Gold shimmer gradients
      const goldGrad = ctx.createLinearGradient(0, 0, 512, 512);
      goldGrad.addColorStop(0, '#fef08a');
      goldGrad.addColorStop(0.5, '#eab308');
      goldGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Klimt geometric mosaic rects and circles
      for (let x = 30; x < 480; x += 55) {
        for (let y = 30; y < 480; y += 55) {
          if ((x + y) % 2 === 0) {
            // Black and white rectangles
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(x, y, 36, 18);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x + 4, y + 3, 28, 12);
          } else {
            // Concentric gold & turquoise spirals
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x + 18, y + 18, 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(x + 18, y + 18, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
    }

    case 'rainbow_pony': {
      // Rainbow Dash Sky Blue & Rainbow Mane Stripes & Lightning Cloud
      const skyGrad = ctx.createLinearGradient(0, 0, 512, 512);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.5, '#0ea5e9');
      skyGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Rainbow Streaks
      const rainbowColors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#8b5cf6'];
      rainbowColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        const startY = 60 + i * 28;
        ctx.moveTo(0, startY);
        ctx.bezierCurveTo(160, startY + 40, 340, startY - 30, 512, startY + 20);
        ctx.lineTo(512, startY + 45);
        ctx.bezierCurveTo(340, startY - 5, 160, startY + 65, 0, startY + 25);
        ctx.closePath();
        ctx.fill();
      });

      // White Cloud Cutie Mark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(360, 360, 36, 0, Math.PI * 2);
      ctx.arc(395, 350, 42, 0, Math.PI * 2);
      ctx.arc(430, 365, 32, 0, Math.PI * 2);
      ctx.fill();

      // Red/Yellow/Blue Lightning Bolt
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(380, 380);
      ctx.lineTo(405, 380);
      ctx.lineTo(390, 420);
      ctx.lineTo(415, 420);
      ctx.lineTo(385, 470);
      ctx.lineTo(395, 430);
      ctx.lineTo(375, 430);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'twilight_pony': {
      // Twilight Sparkle Lavender & Deep Royal Star Magic
      const tGrad = ctx.createLinearGradient(0, 0, 512, 512);
      tGrad.addColorStop(0, '#c084fc');
      tGrad.addColorStop(0.5, '#9333ea');
      tGrad.addColorStop(1, '#581c87');
      ctx.fillStyle = tGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Midnight Blue & Hot Pink Hair Strands
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.bezierCurveTo(200, 140, 300, 40, 512, 100);
      ctx.stroke();

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 110);
      ctx.bezierCurveTo(200, 170, 300, 70, 512, 130);
      ctx.stroke();

      // Magenta 6-pointed Starburst Cutie Mark
      const cx = 380;
      const cy = 360;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const rad = i % 2 === 0 ? 55 : 20;
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // 5 Mini White Stars surrounding
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        const sx = cx + Math.cos(a) * 75;
        const sy = cy + Math.sin(a) * 75;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'pinkie_pony': {
      // Pinkie Pie Candy Pink & Balloon Party Swirls
      const pGrad = ctx.createLinearGradient(0, 0, 512, 512);
      pGrad.addColorStop(0, '#f472b6');
      pGrad.addColorStop(0.5, '#ec4899');
      pGrad.addColorStop(1, '#db2777');
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Curly Cotton Candy Waves
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const y = 80 + i * 45;
        ctx.arc(100 + (i % 2) * 50, y, 35, 0, Math.PI * 1.5);
        ctx.stroke();
      }

      // Three Party Balloons (2 Blue, 1 Yellow)
      const balloons = [
        { x: 350, y: 340, c: '#0284c7' },
        { x: 420, y: 350, c: '#0284c7' },
        { x: 385, y: 390, c: '#facc15' },
      ];
      balloons.forEach((b) => {
        ctx.fillStyle = b.c;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        // String
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + 28);
        ctx.bezierCurveTo(b.x - 5, b.y + 45, b.x + 8, b.y + 60, b.x, b.y + 75);
        ctx.stroke();
      });
      break;
    }

    case 'fluttershy_pony': {
      // Fluttershy Buttercream Yellow & Pastel Pink Flow
      const fGrad = ctx.createLinearGradient(0, 0, 512, 512);
      fGrad.addColorStop(0, '#fef08a');
      fGrad.addColorStop(0.5, '#fde047');
      fGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = fGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Gentle Pastel Pink Mane Flow
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 22;
      for (let y = 80; y < 300; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(180, y + 50, 320, y - 20, 512, y + 30);
        ctx.stroke();
      }

      // Three Turquoise Butterflies
      const butterflies = [
        { x: 370, y: 360 },
        { x: 420, y: 340 },
        { x: 400, y: 400 },
      ];
      butterflies.forEach((bf) => {
        ctx.fillStyle = '#06b6d4';
        // Left wings
        ctx.beginPath();
        ctx.ellipse(bf.x - 12, bf.y - 8, 14, 8, -Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(bf.x - 10, bf.y + 6, 10, 6, -Math.PI / 6, 0, Math.PI * 2);
        // Right wings
        ctx.ellipse(bf.x + 12, bf.y - 8, 14, 8, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(bf.x + 10, bf.y + 6, 10, 6, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#0e7490';
        ctx.beginPath();
        ctx.ellipse(bf.x, bf.y, 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'applejack_pony': {
      // Warm orange body with rustic farm glow
      const ajGrad = ctx.createLinearGradient(0, 0, 512, 512);
      ajGrad.addColorStop(0, '#fb923c');
      ajGrad.addColorStop(0.5, '#f97316');
      ajGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = ajGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Golden Yellow Mane Strands
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      for (let y = 60; y < 260; y += 40) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.bezierCurveTo(150, y + 30, 280, y - 10, 480, y + 20);
        ctx.stroke();
      }

      // Three Red Apples Cutie Mark
      const apples = [
        { x: 380, y: 350 },
        { x: 430, y: 380 },
        { x: 370, y: 410 },
      ];
      apples.forEach((ap) => {
        // Red fruit
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(ap.x - 7, ap.y, 16, 0, Math.PI * 2);
        ctx.arc(ap.x + 7, ap.y, 16, 0, Math.PI * 2);
        ctx.fill();
        // Green leaf
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(ap.x + 4, ap.y - 18, 5, 10, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        // Brown stem
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y - 14);
        ctx.lineTo(ap.x - 2, ap.y - 22);
        ctx.stroke();
      });
      break;
    }

    case 'rarity_pony': {
      // Elegant Pearl White Body
      const rGrad = ctx.createRadialGradient(256, 256, 50, 256, 256, 320);
      rGrad.addColorStop(0, '#ffffff');
      rGrad.addColorStop(0.6, '#f8fafc');
      rGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = rGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Royal Indigo & Violet Curls
      ctx.strokeStyle = '#6d28d9';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.bezierCurveTo(200, 180, 280, 20, 512, 120);
      ctx.stroke();

      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 130);
      ctx.bezierCurveTo(200, 210, 280, 50, 512, 150);
      ctx.stroke();

      // Three Sparkling Blue Diamonds
      const diamonds = [
        { x: 380, y: 330 },
        { x: 425, y: 375 },
        { x: 365, y: 405 },
      ];
      diamonds.forEach((d) => {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - 20);
        ctx.lineTo(d.x + 14, d.y);
        ctx.lineTo(d.x, d.y + 20);
        ctx.lineTo(d.x - 14, d.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      break;
    }

    case 'celestia_pony': {
      // Celestia Radiant Pearlescent & Aurora Flow
      const cGrad = ctx.createLinearGradient(0, 0, 512, 512);
      cGrad.addColorStop(0, '#ffffff');
      cGrad.addColorStop(0.5, '#fefce8');
      cGrad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = cGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Shimmering Aurora Hair Waves (Pink, Cyan, Green)
      const auroraCols = ['#f472b6', '#38bdf8', '#4ade80'];
      auroraCols.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 22;
        ctx.beginPath();
        const startY = 80 + i * 35;
        ctx.moveTo(0, startY);
        ctx.bezierCurveTo(180, startY + 45, 340, startY - 35, 512, startY + 20);
        ctx.stroke();
      });

      // Golden Sun Cutie Mark
      const sx = 385;
      const sy = 375;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(sx, sy, 24, 0, Math.PI * 2);
      ctx.fill();

      // Wavy Golden Rays
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 26, sy + Math.sin(a) * 26);
        ctx.lineTo(sx + Math.cos(a) * 44, sy + Math.sin(a) * 44);
        ctx.stroke();
      }
      break;
    }

    case 'luna_pony': {
      // Midnight Twilight & Starry Sky
      const lGrad = ctx.createLinearGradient(0, 0, 512, 512);
      lGrad.addColorStop(0, '#0f172a');
      lGrad.addColorStop(0.5, '#1e1b4b');
      lGrad.addColorStop(1, '#172554');
      ctx.fillStyle = lGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Star Nebula Mane
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.ellipse(256, 150, 240, 70, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling stars
      for (let i = 0; i < 24; i++) {
        const px = (i * 79 + 30) % 490;
        const py = (i * 61 + 20) % 490;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crescent Moon Cutie Mark in dark purple badge
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(390, 370, 48, 38, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(390, 370, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(382, 365, 20, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'dali_clock': {
      // Salvador Dali Desert Ochre & Melting Watch Face
      const dGrad = ctx.createLinearGradient(0, 0, 512, 512);
      dGrad.addColorStop(0, '#fef08a');
      dGrad.addColorStop(0.5, '#d97706');
      dGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = dGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Melted soft watch shape
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(180, 200);
      ctx.bezierCurveTo(340, 180, 420, 240, 390, 360);
      ctx.bezierCurveTo(360, 460, 260, 450, 180, 380);
      ctx.bezierCurveTo(120, 320, 140, 220, 180, 200);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Melted clock hands
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(270, 310);
      ctx.lineTo(250, 250);
      ctx.moveTo(270, 310);
      ctx.bezierCurveTo(310, 320, 340, 360, 350, 400);
      ctx.stroke();
      break;
    }

    case 'kusama_pumpkin': {
      // Yayoi Kusama Vibrant Yellow and Infinitude of Black Dots
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, 512, 512);

      // Concentric rows of graduating polka dots
      for (let col = 0; col < 10; col++) {
        const x = 30 + col * 48;
        for (let row = 0; row < 12; row++) {
          const y = 25 + row * 42;
          const distFromCenter = Math.abs(x - 256);
          const r = Math.max(4, 18 - distFromCenter * 0.05);
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'warhol_soup': {
      // Andy Warhol Campbell's Red and White Split
      ctx.fillStyle = '#dc2626'; // Red top half
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#ffffff'; // White bottom half
      ctx.fillRect(0, 256, 512, 256);

      // Gold Royal Medallion Center
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(256, 256, 68, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Bold Pop Lines
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('SOUP', 256, 160);
      break;
    }

    case 'angel_pup': {
      // Michelangelo Carrara Marble & Golden Renaissance Glory
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 512);

      // Subtle marble veins
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        const startX = (i * 47) % 512;
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(startX + 40, 160, startX - 50, 320, startX + 30, 512);
        ctx.stroke();
      }

      // Golden Halo Glow
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(256, 220, 110, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'teletubby_tinky': {
      // Tinky Winky Deep Royal Purple Plush & Silver TV Screen
      const twGrad = ctx.createLinearGradient(0, 0, 512, 512);
      twGrad.addColorStop(0, '#9333ea');
      twGrad.addColorStop(0.5, '#7c3aed');
      twGrad.addColorStop(1, '#581c87');
      ctx.fillStyle = twGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Silver TV Screen Belly
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(140, 220, 232, 170, 24);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Screen glow
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(160, 240, 192, 130);

      // Red Magic Handbag Emblem
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(360, 360, 80, 65, 12);
      ctx.fill();
      // Bag handle
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(400, 360, 24, Math.PI, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'teletubby_dipsy': {
      // Dipsy Lime Green Plush & Cow Print Top Hat
      const dGrad = ctx.createLinearGradient(0, 0, 512, 512);
      dGrad.addColorStop(0, '#4ade80');
      dGrad.addColorStop(0.5, '#22c55e');
      dGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = dGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Silver TV Screen Belly
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(140, 220, 232, 170, 24);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(160, 240, 192, 130);

      // Cow Print Top Hat Badge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(360, 340, 75, 75);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(380, 360, 16, 0, Math.PI * 2);
      ctx.arc(415, 385, 18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'teletubby_laalaa': {
      // Laa-Laa Sunny Yellow Plush & Orange Bouncy Ball
      const lGrad = ctx.createLinearGradient(0, 0, 512, 512);
      lGrad.addColorStop(0, '#fef08a');
      lGrad.addColorStop(0.5, '#facc15');
      lGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = lGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Silver TV Screen Belly
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(140, 220, 232, 170, 24);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(160, 240, 192, 130);

      // Big Orange Bouncy Ball Emblem
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(400, 380, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdba74';
      ctx.beginPath();
      ctx.arc(388, 368, 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'teletubby_po': {
      // Po Candy Red Plush & Pink Scooter
      const poGrad = ctx.createLinearGradient(0, 0, 512, 512);
      poGrad.addColorStop(0, '#f87171');
      poGrad.addColorStop(0.5, '#ef4444');
      poGrad.addColorStop(1, '#b91c1c');
      ctx.fillStyle = poGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Silver TV Screen Belly
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(140, 220, 232, 170, 24);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(160, 240, 192, 130);

      // Pink Scooter Emblem
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(360, 390, 80, 16, 8);
      ctx.fill();
      // Wheels
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(370, 415, 14, 0, Math.PI * 2);
      ctx.arc(430, 415, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, 512, 512);
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(id, texture);
  return texture;
}

/**
 * Creates arcade cabinet marquees and logos
 */
export function getMarqueeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.3, '#1e1b4b');
  grad.addColorStop(0.7, '#1e1b4b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  // Neon glowing border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 992, 224);

  // Title text
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 78px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ ART CLAW MASTER ★', 512, 100);

  // Subtitle
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('GOOGLE ARTS · MY LITTLE PONY · TELETUBBIES', 512, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
