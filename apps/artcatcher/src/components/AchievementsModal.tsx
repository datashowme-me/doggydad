import React from 'react';
import { Achievement, GameStats } from '../types';
import { sound } from '../utils/audio';
import { X, Award, CheckCircle, Gift, Sparkles, Coins, Palette, Crown, Trophy } from 'lucide-react';

interface AchievementsModalProps {
  achievements: Achievement[];
  stats: GameStats;
  claimedAchievementIds: string[];
  onClaimReward: (achievementId: string, rewardCoins: number) => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  stats,
  claimedAchievementIds,
  onClaimReward,
  onClose,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-sky-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-orange-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      default:
        return <Award className="w-5 h-5 text-amber-400" />;
    }
  };

  const unlockedCount = achievements.filter((a) => a.condition(stats)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-black text-white">荣誉勋章与成就奖励</h2>
              <p className="text-xs text-slate-400">
                已达成: <span className="text-amber-400 font-bold">{unlockedCount}</span> / {achievements.length} 个成就
              </p>
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

        {/* Achievement list */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          {achievements.map((item) => {
            const isUnlocked = item.condition(stats);
            const isClaimed = claimedAchievementIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isUnlocked
                    ? 'bg-slate-850 border-amber-500/30 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{item.title}</h4>
                      {isUnlocked && (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          已达成
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isUnlocked && !isClaimed ? (
                    <button
                      onClick={() => {
                        sound.playCoin();
                        onClaimReward(item.id, item.rewardCoins);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>领 +{item.rewardCoins} 币</span>
                    </button>
                  ) : isClaimed ? (
                    <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-800/60 rounded-lg">
                      已领奖
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500/60 font-mono">
                      +{item.rewardCoins} 币
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
