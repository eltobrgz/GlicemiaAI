
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
      <UserProfileCard />
    </div>
  );
}
