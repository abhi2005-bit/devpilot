import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { githubService } from "../../services/githubService";

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  
  useEffect(() => {
    const code = searchParams.get("code");
    const redirectUrl = sessionStorage.getItem("github_redirect") || "/projects";
    
    if (!code) {
      setStatus("error");
      return;
    }
    
    githubService.authorizeCallback(code)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate(redirectUrl, { replace: true }), 1000);
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
      
  }, [searchParams, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-xl">
      <div className="bg-surface-container p-xl rounded-xl border border-outline-variant/30 text-center max-w-[400px] w-full shadow-lg">
        <span className="material-symbols-outlined text-[48px] text-primary mb-md animate-pulse">
          sync
        </span>
        
        {status === "loading" && (
          <>
            <h1 className="text-title-lg font-bold text-on-surface mb-sm">Connecting GitHub...</h1>
            <p className="text-body-md text-on-surface-variant">Please wait while we secure your connection.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <h1 className="text-title-lg font-bold text-success mb-sm">Successfully Connected!</h1>
            <p className="text-body-md text-on-surface-variant">Redirecting you back to DevPilot...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <h1 className="text-title-lg font-bold text-error mb-sm">Connection Failed</h1>
            <p className="text-body-md text-on-surface-variant mb-md">We couldn't connect your GitHub account.</p>
            <button 
              onClick={() => navigate("/projects", { replace: true })}
              className="px-md py-sm bg-primary text-on-primary rounded-full font-medium"
            >
              Return to DevPilot
            </button>
          </>
        )}
      </div>
    </div>
  );
}
