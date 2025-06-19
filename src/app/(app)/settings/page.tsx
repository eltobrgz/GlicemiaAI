
'use client';

import PageHeader from '@/components/PageHeader';
import SettingsPageContent from '@/components/settings/SettingsPageContent';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as preferências da sua conta e do aplicativo."
      />
      <SettingsPageContent />
    </div>
  );
}
