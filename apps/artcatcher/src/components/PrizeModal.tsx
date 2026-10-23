import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { PrizeMetadata } from '../types';
import { createFigurine } from '../game/figurineBuilder';
import { Sparkles, Trophy, ExternalLink, X } from 'lucide-react';

interface PrizeModalProps {
  prize: PrizeMetadata;
  onClose: () => void;
  onOpenGallery: () => void;
}

export const PrizeModal: React.FC<PrizeModalProps> = ({ prize, onClose, onOpenGallery }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#ffffff'],
    });

    // Setup 3D preview scene for the single figurine
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
    camera.position.set(0, 1.2, 2.6);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Light
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffedd5, 2.5);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    const figurineMesh = createFigurine(prize);
    scene.add(figurineMesh);

    let animId: number;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      figurineMesh.rotation.y += 0.015;
      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prize]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Glowing background halo */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: prize.accentColor }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>
            {prize.id.includes('teletubby')
              ? '📺 恭喜抓获天线宝宝超萌玩偶！'
              : prize.id.includes('pony')
              ? '🦄 恭喜抓获小马宝莉梦幻玩偶！'
              : '🎨 恭喜抓获 Google Arts 馆藏名作！'}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="text-2xl font-black text-white tracking-tight">{prize.name}</h2>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              prize.rarity === 'Legendary'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : prize.rarity === 'Rare'
                ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            {prize.rarity}
          </span>
        </div>

        {/* 3D Preview Frame */}
        <div className="relative w-full h-52 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-850 border border-slate-800 flex items-center justify-center mb-5 overflow-hidden">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          <div className="absolute bottom-2 text-[11px] text-slate-500 pointer-events-none font-mono">
            3D 预览 · 自动全方位旋转中
          </div>
        </div>

        {/* Art Details */}
        <div className="space-y-2.5 text-xs text-slate-300 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">原作名称:</span>
            <span className="font-semibold text-slate-100">{prize.originalArtwork}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">艺术大师:</span>
            <span className="font-semibold text-slate-100">{prize.artist}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">创作年代:</span>
            <span className="font-mono text-slate-100">{prize.year}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1.5">
            <span className="text-slate-400">收藏机构:</span>
            <span className="text-amber-200/90 text-right max-w-[220px] truncate">{prize.museum}</span>
          </div>
          <p className="pt-1.5 text-slate-300 leading-relaxed text-[13px]">{prize.description}</p>
        </div>

        {/* Reward Bonus & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 w-full sm:w-auto">
            <Trophy className="w-4 h-4 shrink-0" />
            <span>奖励金币: +2 代币已入账</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenGallery();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>查看个人展柜</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              继续抓娃娃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
