import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CinematicExperience } from '@/components/cinematic/CinematicExperience';
import { useCinematicData } from '@/components/cinematic/useCinematicData';
import { useAuth } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * The public home page: the cinematic AirSense narrative.
 *
 * This is the only place that connects the experience to the application —
 * it loads observations through the existing services and hands the resolved
 * contract to the reusable component as props.
 */
export function ExperiencePage() {
  usePageTitle('Environmental intelligence');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading } = useCinematicData();

  const enterLabel = user ? 'Open dashboard' : 'Sign in to AirSense';

  const handleEnter = useCallback(() => {
    navigate(user ? '/dashboard' : '/login');
  }, [navigate, user]);

  return (
    <>
      <CinematicExperience data={data} onEnter={handleEnter} enterLabel={enterLabel} />
      <p className="sr-only" role="status" aria-live="polite">
        {loading
          ? 'Loading environmental observations.'
          : data.isDemo
            ? 'AirSense reference dataset loaded.'
            : 'Live environmental observations loaded.'}
      </p>
    </>
  );
}