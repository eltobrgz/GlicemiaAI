
'use client';

import PageHeader from '@/components/PageHeader';
import UserProfileCard from '@/components/profile/UserProfileCard';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Visualize e gerencie suas informações pessoais."
      />
      {/* UserProfileCard already has mx-auto and max-w-2xl, so it will center itself */}
      <UserProfileCard />
    </div>
  );
}

