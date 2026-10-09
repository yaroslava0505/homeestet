import { useEffect, useState } from 'react';
import type {
  PlanEntry,
  PlanState,
  Preferences,
  ProductItem,
  QuizResult,
  SavedItem,
  SurpriseIdea,
  ZoneSolution,
} from './types.ts';
import { useRouter, viewToPath } from './lib/router.ts';
import * as storage from './lib/storage.ts';
import { DevicePreviewBar, type DeviceMode } from './components/DevicePreviewBar.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ZoneBuilderPage } from './pages/ZoneBuilderPage.tsx';
import { StyleQuizPage } from './pages/StyleQuizPage.tsx';
import { SmallSpacesPage } from './pages/SmallSpacesPage.tsx';
import { RentedHomePage } from './pages/RentedHomePage.tsx';
import { PersonalPlanPage } from './pages/PersonalPlanPage.tsx';
import { InspirationPage } from './pages/InspirationPage.tsx';
import { MyHomeEstetPage } from './pages/MyHomeEstetPage.tsx';
import { SurpriseModal } from './components/SurpriseModal.tsx';
import { PhotoAIAnalyzerModal } from './components/PhotoAIAnalyzerModal.tsx';
import { ProductModal } from './components/ProductModal.tsx';

/** The layout preview bar is a design-review tool and exists only in development builds. */
const SHOW_DEV_PANEL = import.meta.env.DEV;

export default function App() {
  const [pageView, navigate] = useRouter();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('fluid');

  // Persisted user data (localStorage via src/lib/storage.ts). State mirrors what storage returns.
  const [preferences, setPreferences] = useState<Preferences>(() => storage.getPreferences());
  const [quizResult, setQuizResult] = useState<QuizResult | null>(() => storage.getQuiz());
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => storage.getSavedIdeas());
  const [plan, setPlan] = useState<PlanState>(() => storage.getPlan());
  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => storage.getSavedProducts());

  // Modals
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [aiAnalyzerOpen, setAiAnalyzerOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);

  // Scroll to top when the route changes.
  const routePath = viewToPath(pageView);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [routePath]);

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(storage.saveQuiz(result));
    setPreferences(storage.savePreferences({ styleId: result.primaryStyleId }));
  };

  const handleSaveSolution = (solution: ZoneSolution) => {
    setSavedItems(
      storage.saveIdea({
        kind: 'solution',
        id: solution.id,
        title: `${solution.zoneName}: ${solution.styleName}`,
        zoneId: solution.zoneId,
        zoneName: solution.zoneName,
        styleId: solution.styleId,
        styleName: solution.styleName,
        budgetId: solution.budgetId,
        budgetName: solution.budgetName,
        estimatedCost: solution.estimatedCost,
        params: solution.params,
        savedAt: new Date().toISOString(),
      })
    );
  };

  const handleSaveIdea = (idea: SurpriseIdea) => {
    setSavedItems(
      storage.saveIdea({
        kind: 'idea',
        id: `idea-${idea.id}`,
        ideaId: idea.id,
        title: idea.title,
        zoneHint: idea.zoneHint,
        zoneId: idea.zoneId,
        estimatedBudget: idea.estimatedBudget,
        savedAt: new Date().toISOString(),
      })
    );
  };

  const handleRemoveSaved = (id: string) => setSavedItems(storage.removeIdea(id));
  const handleAddToPlan = (entry: PlanEntry) => setPlan(storage.addToPlan(entry));
  const handleRemoveFromPlan = (entryId: string) => setPlan(storage.removeFromPlan(entryId));
  const handleToggleTask = (taskId: string) => setPlan(storage.toggleTask(taskId));
  const handleToggleSavedProduct = (productId: string) =>
    setSavedProductIds(storage.toggleSavedProduct(productId));

  const isSaved = (id: string) => savedItems.some((item) => item.id === id);
  const isInPlan = (entryId: string) => plan.entries.some((entry) => entry.id === entryId);

  const openSurprise = () => setSurpriseOpen(true);
  const openAiAnalyzer = () => setAiAnalyzerOpen(true);

  const renderPage = () => {
    switch (pageView.type) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'zone-builder':
        return (
          <ZoneBuilderPage
            key={`zone-${pageView.zoneId ?? 'start'}`}
            zoneId={pageView.zoneId}
            prefilledStyle={pageView.prefilledStyle ?? preferences.styleId}
            params={pageView.params}
            onNavigate={navigate}
            onSaveSolution={handleSaveSolution}
            isSolutionSaved={isSaved}
            onAddToPlan={handleAddToPlan}
            isInPlan={isInPlan}
            onOpenProduct={setActiveProduct}
          />
        );
      case 'style-quiz':
        return <StyleQuizPage onNavigate={navigate} onComplete={handleQuizComplete} />;
      case 'small-spaces':
        return <SmallSpacesPage onNavigate={navigate} onOpenProduct={setActiveProduct} />;
      case 'rented-home':
        return <RentedHomePage onNavigate={navigate} onOpenProduct={setActiveProduct} />;
      case 'personal-plan':
        return (
          <PersonalPlanPage
            plan={plan}
            onToggleTask={handleToggleTask}
            onRemoveEntry={handleRemoveFromPlan}
            onNavigate={navigate}
          />
        );
      case 'inspiration':
        return (
          <InspirationPage
            key={`inspiration-${pageView.articleId ?? 'list'}`}
            articleId={pageView.articleId}
            onNavigate={navigate}
            onOpenProduct={setActiveProduct}
          />
        );
      case 'my-homeestet':
        return (
          <MyHomeEstetPage
            styleId={preferences.styleId}
            quizResult={quizResult}
            savedItems={savedItems}
            onRemoveSaved={handleRemoveSaved}
            savedProductIds={savedProductIds}
            onToggleSavedProduct={handleToggleSavedProduct}
            plan={plan}
            onNavigate={navigate}
            onOpenProduct={setActiveProduct}
          />
        );
    }
  };

  const frameClass = !SHOW_DEV_PANEL
    ? 'max-w-none bg-[#FAF8F5]'
    : deviceMode === 'desktop-1440'
      ? 'max-w-[1440px] my-6 shadow-2xl rounded-2xl overflow-hidden border border-[#D5CEC2] bg-[#FAF8F5]'
      : deviceMode === 'mobile-375'
        ? 'max-w-[375px] my-8 shadow-2xl rounded-[38px] overflow-hidden border-[8px] border-[#222] bg-[#FAF8F5] ring-1 ring-black/20'
        : 'max-w-none bg-[#FAF8F5]';

  return (
    <div className="min-h-screen bg-[#F0EDE8] flex flex-col selection:bg-[#E8DFD8]">
      {SHOW_DEV_PANEL && (
        <DevicePreviewBar
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          pageView={pageView}
          setPageView={navigate}
          onOpenAIAnalyzer={openAiAnalyzer}
          onOpenSurprise={openSurprise}
        />
      )}

      <div className={`flex-1 transition-all duration-300 mx-auto w-full ${frameClass}`}>
        <Header
          onNavigate={navigate}
          currentView={pageView}
          onOpenSurprise={openSurprise}
          onOpenAIAnalyzer={openAiAnalyzer}
          savedCount={savedItems.length}
        />

        <main className="min-h-[65vh]">{renderPage()}</main>

        <Footer onNavigate={navigate} />
      </div>

      <SurpriseModal
        isOpen={surpriseOpen}
        onClose={() => setSurpriseOpen(false)}
        onSaveIdea={handleSaveIdea}
        isIdeaSaved={(ideaId) => isSaved(`idea-${ideaId}`)}
        onTryToday={(idea) => {
          setSurpriseOpen(false);
          navigate({ type: 'zone-builder', zoneId: idea.zoneId });
        }}
      />

      <PhotoAIAnalyzerModal
        isOpen={aiAnalyzerOpen}
        onClose={() => setAiAnalyzerOpen(false)}
        onNavigate={navigate}
      />

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        isSaved={activeProduct ? savedProductIds.includes(activeProduct.id) : false}
        onToggleSave={handleToggleSavedProduct}
      />
    </div>
  );
}
