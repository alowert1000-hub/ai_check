import { Navigate, Route, Routes } from "react-router-dom";
import { InterviewProvider } from "./context/InterviewContext.jsx";
import { FeedbackPage } from "./pages/FeedbackPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { InterviewPage } from "./pages/InterviewPage.jsx";
import { MasteryPage } from "./pages/MasteryPage.jsx";
import { ReportPage } from "./pages/ReportPage.jsx";
import { ResumePage } from "./pages/ResumePage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

export function App() {
  return (
    <InterviewProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/mastery" element={<MasteryPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InterviewProvider>
  );
}
