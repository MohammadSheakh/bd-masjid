'use client';

import React, { useState, useEffect } from 'react';
import { Mosque, MosqueFacility } from '@/types/mosque';
import { MosqueFacilitiesCard } from './MosqueFacilitiesCard';
import { EditFacilitiesModal } from './EditFacilitiesModal';

interface MosqueFacilitiesSectionProps {
  mosque: Mosque;
  initialFacility?: MosqueFacility | null;
}

export const MosqueFacilitiesSection: React.FC<MosqueFacilitiesSectionProps> = ({
  mosque,
  initialFacility,
}) => {
  const [facility, setFacility] = useState<MosqueFacility | null>(
    initialFacility || mosque.facility || null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // Check if user is platform admin or mosque staff
    try {
      const token =
        localStorage.getItem('access_token') || localStorage.getItem('token');
      if (token) {
        const storedRole = localStorage.getItem('user_role');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        const isPlatformAdmin =
          storedRole === 'admin' ||
          storedRole === 'moderator' ||
          user?.role === 'admin' ||
          user?.role === 'moderator';

        const isLocalStaff = Boolean(
          user &&
            mosque.staffMembers?.some(
              (s) =>
                s.userId === user.id &&
                s.isVerified &&
                [
                  'MOSQUE_ADMIN',
                  'COMMITTEE_PRESIDENT',
                  'COMMITTEE_MEMBER',
                  'MUTAWALLI',
                ].includes(s.role),
            ),
        );

        setCanEdit(Boolean(isPlatformAdmin || isLocalStaff));
      }
    } catch {
      setCanEdit(false);
    }
  }, [mosque.staffMembers]);

  return (
    <>
      <MosqueFacilitiesCard
        mosque={mosque}
        facility={facility}
        canEdit={canEdit}
        onEdit={() => setIsModalOpen(true)}
      />

      {isModalOpen && (
        <EditFacilitiesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mosqueId={mosque.id}
          initialData={facility}
          onSaved={(updated) => {
            setFacility(updated);
          }}
        />
      )}
    </>
  );
};
