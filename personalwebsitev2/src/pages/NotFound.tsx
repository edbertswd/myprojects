import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: no route for", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-sage">Error 404</p>
        <h1 className="display-lg mt-3 font-extrabold text-slate">Wrong turn.</h1>
        <p className="mt-3 text-muted-foreground">That page doesn&rsquo;t exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
