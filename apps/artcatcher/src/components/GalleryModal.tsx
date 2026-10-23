import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CollectionItem, PrizeMetadata } from '../types';
import { PRIZES } from '../utils/artData';
import { createFigurine } from '../game/figurineBuilder';
import { sound } from '../utils/audio';
import { X, Lock, CheckCircle2, Rotate3d, Compass } from 'lucide-react';

interface GalleryModalProps {
  collection: Record<string, CollectionItem>;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ collection, onClose }) => {
  const [selectedPrize, setSelectedPrize] = useState<PrizeMetadata>(PRIZES[0]);
  const [filterSeries, setFilterSeries] = useState<'ALL' | 'TELETUBBY' | 'PONY' | 'ART' | 'Legendary' | 'Rare'>('ALL');
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  const unlockedCount = Object.keys(collection).length;
  const isSelectedUnlocked = !!collection[selectedPrize.id];

  // 3D Inspection Viewer for Selected Figurine
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    const container = previewCanvasRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
    camera.position.set(0, 1.1, 2.5);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // Marble Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.65, 0.72, 0.1, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.6,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.05;
    scene.add(pedestal);

    // Figurine
    const figurine = createFigurine(selectedPrize);
    if (!isSelectedUnlocked) {
      // Silhouette shadow material if locked
      figurine.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.8,
            metalness: 0.1,
          });
        }
      });
    }
    scene.add(figurine);

    // Manual Drag Orbit Rotation
    let isDragging = false;
    let prevX = 0;
    let rotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      prevX = e.clientX;
      rotY += dx * 0.012;
      figurine.rotation.y = rotY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let animId: number;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      if (!isDragging) {
        rotY += 0.008;
        figurine.rotation.y = rotY;
      }
      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedPrize, isSelectedUnlocked]);

  const filteredPrizes = PRIZES.filter((p) => {
    if (filterSeries === 'ALL') return true;
    if (filterSeries === 'TELETUBBY') return p.id.includes('teletubby');
    if (filterSeries === 'PONY') return p.id.includes('pony');
    if (filterSeries === 'ART') return !p.id.includes('pony') && !p.id.includes('teletubby');
    return p.rarity === filterSeries;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white tracking-tight">艺术名画 · 小马宝莉 · 天线宝宝私人展柜</h2>
            <div className="text-xs text-slate-400 font-mono">
              已收集: <span className="text-amber-400 font-bold">{unlockedCount}</span> / {PRIZES.length} 件
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Grid Catalogue (7 Cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col overflow-y-auto border-r border-slate-800/80 space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
              {[
                { id: 'ALL', label: '全部展品 (24)' },
                { id: 'TELETUBBY', label: '📺 天线宝宝系列' },
                { id: 'PONY', label: '🦄 小马宝莉系列' },
                { id: 'ART', label: '🎨 名画艺术系列' },
                { id: 'Legendary', label: '传奇 (Legendary)' },
                { id: 'Rare', label: '稀有 (Rare)' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => {
                    sound.playClick();
                    setFilterSeries(btn.id as typeof filterSeries);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filterSeries === btn.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Figurine Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {filteredPrizes.map((p) => {
                const isUnlocked = !!collection[p.id];
                const count = collection[p.id]?.caughtCount || 0;
                const isCurrent = selectedPrize.id === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedPrize(p);
                    }}
                    className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    {/* Top status */}
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span
                        className={`font-semibold ${
                          p.rarity === 'Legendary'
                            ? 'text-amber-400'
                            : p.rarity === 'Rare'
                            ? 'text-sky-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {p.rarity}
                      </span>
                      {isUnlocked ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>x{count}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-0.5">
                          <Lock className="w-3 h-3" />
                          <span>未拥有</span>
                        </span>
                      )}
                    </div>

                    {/* Figurine Name & Art */}
                    <div className="mt-4">
                      <div className="font-bold text-sm text-slate-100 group-hover:text-amber-300">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {p.originalArtwork}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Collection Progress Bar */}
            <div className="mt-auto pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>馆藏完成度</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.round((unlockedCount / PRIZES.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${(unlockedCount / PRIZES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right 3D Inspection Viewer (5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-950/80 flex flex-col justify-between overflow-y-auto">
            {/* 3D Canvas Box */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <Rotate3d className="w-4 h-4 text-amber-400" />
                  <span>3D 展台鉴赏模式</span>
                </span>
                <span className="text-[11px] text-slate-500">按住拖拽 360° 旋转</span>
              </div>

              <div className="relative w-full h-64 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                <div ref={previewCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                {!isSelectedUnlocked && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-sm font-bold text-slate-300">尚未在抓娃娃机中捕获</span>
                    <span className="text-xs text-slate-500 mt-1">在抓娃娃机中找准方位抓取即可解锁！</span>
                  </div>
                )}
              </div>
            </div>

            {/* Spec / Historical Story Sheet */}
            <div className="mt-4 space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">{selectedPrize.name}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                    selectedPrize.rarity === 'Legendary'
                      ? 'border-amber-500/80 text-amber-300 bg-amber-950/60'
                      : 'border-slate-700 text-slate-300 bg-slate-800'
                  }`}
                >
                  {selectedPrize.rarity}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-300 border-t border-slate-800 pt-2">
                <p>
                  <strong className="text-slate-400">传世名作:</strong> {selectedPrize.originalArtwork}
                </p>
                <p>
                  <strong className="text-slate-400">艺术家:</strong> {selectedPrize.artist}
                </p>
                <p>
                  <strong className="text-slate-400">创作年份:</strong> {selectedPrize.year}
                </p>
                <p>
                  <strong className="text-slate-400">馆藏出处:</strong> {selectedPrize.museum}
                </p>
              </div>

              <p className="text-xs text-slate-300/90 leading-relaxed pt-1 border-t border-slate-800">
                {selectedPrize.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
