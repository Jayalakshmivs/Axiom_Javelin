import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import OverviewModule from "@/components/dashboard/OverviewModule";
import PhishingModule from "@/components/dashboard/PhishingModule";
import DeepfakeModule from "@/components/dashboard/DeepfakeModule";
import RansomwareModule from "@/components/dashboard/RansomwareModule";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentView = searchParams.get("view") || "overview";

  // Helper to change view and update URL query param
  const navigateTo = (view: string) => {
    setSearchParams({ view });
  };

  const renderModule = () => {
    switch (currentView) {
      case "overview":
        return <OverviewModule navigateTo={navigateTo} />;
      case "phishing":
        return <PhishingModule />;
      case "deepfake":
        return <DeepfakeModule />;
      case "ransomware":
        return <RansomwareModule />;
      default:
        return <OverviewModule navigateTo={navigateTo} />;
    }
  };

  return (
    <MainLayout>
      {renderModule()}
    </MainLayout>
  );
};

export default Dashboard;
