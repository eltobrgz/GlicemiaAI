
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/types';
import { getUserProfile, saveUserProfile } from '@/lib/storage';
import { Edit3, Save, UserCircle, Mail, ShieldCheck, CalendarDays, Droplet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Mock function if not implemented in storage.ts yet
const ensureUserProfileFunctions = () => {
  if (typeof getUserProfile !== 'function' || typeof saveUserProfile !== 'function') {
    console.warn('getUserProfile or saveUserProfile not found in storage.ts. Using mock profile.');
    (window as any)._temp_userProfile = {
      id: 'mock-user-123',
      name: 'Usuário Teste',
      email: 'usuario.teste@example.com',
      avatarUrl: 'https://placehold.co/100x100.png',
      dateOfBirth: '1990-01-01',
      diabetesType: 'tipo1',
    };
    (getUserProfile as any) = () => (window as any)._temp_userProfile;
    (saveUserProfile as any) = (profile: UserProfile) => { (window as any)._temp_userProfile = profile; };
  }
};
ensureUserProfileFunctions();


export default function UserProfileCard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({ name: '', email: '', dateOfBirth: '', diabetesType: 'outro' });
  const { toast } = useToast();

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setUser(profile);
      setEditForm({ 
        name: profile.name, 
        email: profile.email,
        dateOfBirth: profile.dateOfBirth || '',
        diabetesType: profile.diabetesType || 'outro',
        // Initialize other fields as needed
      });
    }
  }, []);

  const handleEditToggle = () => {
    if (user) {
      setEditForm({ 
        name: user.name, 
        email: user.email,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
        diabetesType: user.diabetesType,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (user && editForm) {
      const updatedUser: UserProfile = {
        ...user,
        name: editForm.name || user.name,
        email: editForm.email || user.email,
        avatarUrl: editForm.avatarUrl || user.avatarUrl, // Assuming avatarUrl might be editable later
        dateOfBirth: editForm.dateOfBirth,
        diabetesType: editForm.diabetesType,
      };
      saveUserProfile(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
    }
  };
  
  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl animate-pulse">
        <CardHeader className="items-center text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-muted" />
          <div className="h-8 w-48 mb-2 rounded bg-muted" />
          <div className="h-6 w-64 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted" />)}
        </CardContent>
         <CardFooter className="border-t pt-6">
            <div className="h-10 w-full rounded bg-muted" />
        </CardFooter>
      </Card>
    );
  }

  const profileInfoItems = [
    { icon: UserCircle, label: "Nome Completo", value: user.name, key: 'name', type: 'text' },
    { icon: Mail, label: "Email", value: user.email, key: 'email', type: 'email' },
    { icon: CalendarDays, label: "Data de Nascimento", value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado', formValue: user.dateOfBirth, key: 'dateOfBirth', type: 'date' },
    { 
      icon: Droplet, 
      label: "Tipo de Diabetes", 
      value: user.diabetesType ? user.diabetesType.charAt(0).toUpperCase() + user.diabetesType.slice(1) : 'Não informado',
      key: 'diabetesType', 
      type: 'select',
      options: [
        {value: 'tipo1', label: 'Tipo 1'},
        {value: 'tipo2', label: 'Tipo 2'},
        {value: 'gestacional', label: 'Gestacional'},
        {value: 'outro', label: 'Outro/Não especificado'}
      ]
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="items-center text-center border-b pb-6">
        <Avatar className="w-28 h-28 mb-4 border-4 border-primary shadow-lg" data-ai-hint="person avatar">
          <AvatarImage src={user.avatarUrl || `https://placehold.co/120x120.png`} alt={user.name} />
          <AvatarFallback className="text-4xl bg-primary/20 text-primary font-semibold">
            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)}
          </AvatarFallback>
        </Avatar>
        {isEditing ? (
          <Input 
            id="name" 
            name="name" 
            value={editForm.name || ''} 
            onChange={handleInputChange} 
            className="mt-1 text-2xl font-bold text-center h-auto p-1" 
          />
        ) : (
          <CardTitle className="text-3xl font-headline text-primary">{user.name}</CardTitle>
        )}
        {isEditing ? (
          <Input 
            id="email" 
            name="email" 
            type="email" 
            value={editForm.email || ''} 
            onChange={handleInputChange} 
            className="mt-1 text-center text-muted-foreground" 
          />
        ) : (
          <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {profileInfoItems.map(item => (
          item.key !== 'name' && item.key !== 'email' && ( // Name and email are in header
            <div key={item.key} className="flex items-start space-x-4">
              <item.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-grow">
                <Label htmlFor={item.key} className="text-sm text-muted-foreground">{item.label}</Label>
                {isEditing ? (
                  item.type === 'select' && item.options ? (
                    <select 
                      name={item.key} 
                      id={item.key} 
                      value={editForm[item.key as keyof UserProfile] as string || ''} 
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-input bg-background p-2 text-base focus:border-primary focus:ring-primary"
                    >
                      {item.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <Input 
                      id={item.key} 
                      name={item.key} 
                      type={item.type} 
                      value={editForm[item.key as keyof UserProfile] as string || ''} 
                      onChange={handleInputChange} 
                      className="mt-1 text-base" 
                    />
                  )
                ) : (
                  <p className="text-lg font-medium text-card-foreground">{item.value || 'Não informado'}</p>
                )}
              </div>
            </div>
          )
        ))}
        
        {!isEditing && (
          <>
            <div className="flex items-start space-x-4 pt-4 border-t">
              <ShieldCheck className="mr-3 h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-sm text-muted-foreground">Segurança da Conta</p>
                <Button variant="link" className="p-0 h-auto text-lg text-primary hover:underline">Alterar Senha</Button>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <FileText className="mr-3 h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-sm text-muted-foreground">Dados e Privacidade</p>
                <Button variant="link" className="p-0 h-auto text-lg text-primary hover:underline">Gerenciar dados</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6">
        {isEditing ? (
          <div className="flex gap-4 w-full">
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

