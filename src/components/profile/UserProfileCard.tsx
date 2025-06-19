
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/types';
import { getUserProfile, saveUserProfile } from '@/lib/storage'; // Assuming these functions exist
import { Edit3, Save, UserCircle, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock function if not implemented in storage.ts yet
const ensureUserProfileFunctions = () => {
  if (typeof getUserProfile !== 'function' || typeof saveUserProfile !== 'function') {
    console.warn('getUserProfile or saveUserProfile not found in storage.ts. Using mock profile.');
    (window as any)._temp_userProfile = {
      id: 'mock-user-123',
      name: 'Usuário Teste',
      email: 'usuario.teste@example.com',
      avatarUrl: 'https://placehold.co/100x100.png',
    };
    (getUserProfile as any) = () => (window as any)._temp_userProfile;
    (saveUserProfile as any) = (profile: UserProfile) => { (window as any)._temp_userProfile = profile; };
  }
};
ensureUserProfileFunctions();


export default function UserProfileCard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const { toast } = useToast();

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setUser(profile);
      setEditForm({ name: profile.name, email: profile.email });
    }
  }, []);

  const handleEditToggle = () => {
    if (user) {
      setEditForm({ name: user.name, email: user.email });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        name: editForm.name,
        email: editForm.email,
      };
      saveUserProfile(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    }
  };
  
  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>Carregando Perfil...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Aguarde enquanto carregamos suas informações.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="items-center text-center">
        <Avatar className="w-24 h-24 mb-4 border-2 border-primary shadow-md" data-ai-hint="person avatar">
          <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
          <AvatarFallback className="text-3xl bg-primary/20 text-primary">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl font-headline text-primary">{user.name}</CardTitle>
        <CardDescription className="text-lg">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-base">Nome Completo</Label>
              <Input id="name" name="name" value={editForm.name} onChange={handleInputChange} className="mt-1 text-base" />
            </div>
            <div>
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input id="email" name="email" type="email" value={editForm.email} onChange={handleInputChange} className="mt-1 text-base" />
            </div>
            {/* Add more fields like avatar upload here in the future */}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <UserCircle className="mr-3 h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="text-lg font-medium">{user.name}</p>
              </div>
            </div>
             <div className="flex items-center">
              <Mail className="mr-3 h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg font-medium">{user.email}</p>
              </div>
            </div>
             <div className="flex items-center">
              <ShieldCheck className="mr-3 h-6 w-6 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Segurança da Conta</p>
                <Button variant="link" className="p-0 h-auto text-lg text-accent">Alterar Senha</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6">
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Button onClick={handleSave} className="flex-1">
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
            <Button variant="outline" onClick={handleEditToggle} className="flex-1">
              Cancelar
            </Button>
          </div>
        ) : (
          <Button onClick={handleEditToggle} className="w-full">
            <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

