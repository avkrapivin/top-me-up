import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

function useRequireAuth(redirectToLogin = true) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            const redirectPath = location.pathname !== '/' ? location.pathname : '/dashboard';

            if (redirectToLogin) {
                navigate('/login', {
                    state: { from: redirectPath },
                    replace: true
                });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [user, loading, navigate, location.pathname, redirectToLogin]);

    return { user, loading };
}

export default useRequireAuth;