import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { checkIfAdmin } from '../utils/adminUtils';
import LoadingScreen from './LoadingScreen';
import MobileLoadingFallback from './MobileLoadingFallback';
import { useMobile } from '../hooks/useMobile';

/**
 * AdminRoute component
 * Wraps routes that should only be accessible by users with the ADMIN role.
 * Redirects to home/mode-select if the user is not an admin.
 */
const AdminRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMobile = useMobile();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const adminStatus = await checkIfAdmin(user.uid);
                setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return isMobile ? <MobileLoadingFallback /> : <LoadingScreen />;
    }

    if (!isAdmin) {
        // Redirect non-admin users to the mode selection page
        return <Navigate to="/mode-select" replace />;
    }

    return children;
};

export default AdminRoute;
