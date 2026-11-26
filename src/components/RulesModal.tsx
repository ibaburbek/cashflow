import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { QoshqarMuiizDivider } from './KazakhOrnament';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Ойын ережесі"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131C26] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-white/95 dark:bg-[#131C26]/95 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              «Қаржы Ағыны» ойын ережесі
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Жабу"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>«Қаржы Ағыны»</strong> — нақты Қазақстан экономикасына негізделген қаржылық сауаттылық үстел ойыны.
            Мақсатыңыз — жалақыға тәуелділіктен шығып, пассивті табыс есебінен қаржылық еркіндікке жету.
          </p>

          <QoshqarMuiizDivider />

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1-кезең: Қарбалас шеңбер (24 ұяшық)
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Ойын басында кәсіп пен жеке «Арманды» таңдайсыз. Әр кәсіптің жалақысы, салықтары (ИПН, ОПВ, ВОСМС), ипотекасы және несиелері бар.
              </li>
              <li>
                <strong>Жалақы күні:</strong> Осы ұяшықтан өткенде немесе тоқтағанда айлық ақша ағынын (Жалақы + Пассивті табыс − Шығыстар) аласыз.
              </li>
              <li>
                <strong>Мүмкіндік:</strong> Шағын мәміле (депозит, мал, кофе аппараты, акция/валюта/крипто) немесе Ірі мәміле (пәтер, ПВЗ, автожуу, бизнес) сатып алуға болады.
              </li>
              <li>
                <strong>Нарық:</strong> Экономикалық жаңалықтар (теңге бағамы, пәтер бағасы, KASE өсімі). Меншігіңіздегі активтерді қымбатқа сату мүмкіндігі туады.
              </li>
              <li>
                <strong>Күтпеген шығын / Бала / Қысқарту:</strong> Шынайы өмірдегі тосын жағдайлар. Ақша жетпесе, банктен 10% мөлшерлемемен несие алуға болады.
              </li>
              <li>
                <strong>Қайырымдылық (Садақа):</strong> Табыстың 10%-ын беріп, келесі 3 жүрісте 2 сүйек лақтыру құқығын аласыз — бұл жылдам дамуға көмектеседі!
              </li>
            </ul>
            <p className="font-semibold text-teal-800 dark:text-teal-300">
              1-кезең жеңіс шарты: Пассивті табысыңыз жалпы айлық шығыстарыңыздан асса, сіз «Еркін жолға» өтесіз!
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2-кезең: Еркін жол (18 ұяшық)
            </h3>
            <p>
              Бұл кезеңде ірі бизнес-жобаларға (логистикалық хаб, күн станциясы, қонақ үй, зауыт) инвестиция саласыз.
              <strong> Ойын жеңімпазы болу үшін:</strong> өзіңіз таңдаған «Арман» ұяшығына түсіп оны сатып алыңыз немесе Еркін жолдағы пассивті табысты +5 000 000 ₸-ге арттырыңыз!
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold cursor-pointer"
            >
              Түсінікті, ойынға оралу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
