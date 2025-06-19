
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/types';
import { getUserProfile, saveUserProfile } from '@/lib/storage'; // Now async
import { Edit3, Save, UserCircle, Mail, ShieldCheck, CalendarDays, Droplet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';


export default function UserProfileCard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await getUserProfile();
        if (profile) {
          setUser(profile);
          setEditForm({ 
            name: profile.name, 
            email: profile.email, // Email might not be editable directly here
            avatarUrl: profile.avatarUrl,
            dateOfBirth: profile.dateOfBirth || '',
            diabetesType: profile.diabetesType || 'outro',
          });
        } else {
          // Handle case where profile is null (e.g., new user, error fetching)
           const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const newProfile: UserProfile = {
                    id: authUser.id,
                    name: authUser.user_metadata?.full_name || authUser.email || 'Novo Usuário',
                    email: authUser.email || '',
                    avatarUrl: authUser.user_metadata?.avatar_url,
                };
                setUser(newProfile);
                setEditForm(newProfile);
                // setIsEditing(true); // Optionally prompt user to complete profile
                toast({ title: "Complete seu Perfil", description: "Algumas informações do perfil estão ausentes."});
            } else {
               toast({ title: "Erro", description: "Não foi possível carregar o perfil do usuário.", variant: "destructive" });
            }
        }
      } catch (error: any) {
        toast({ title: "Erro ao Carregar Perfil", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditToggle = () => {
    if (user && !isEditing) { // Entering edit mode
      setEditForm({ 
        name: user.name, 
        email: user.email,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth || '',
        diabetesType: user.diabetesType || 'outro',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (user && editForm) {
      setIsSaving(true);
      try {
        const updatedUser: UserProfile = {
          ...user, // Stays as base
          name: editForm.name || user.name,
          // email: editForm.email || user.email, // Email changes are complex, usually handled separately
          avatarUrl: editForm.avatarUrl || user.avatarUrl,
          dateOfBirth: editForm.dateOfBirth || undefined,
          diabetesType: editForm.diabetesType as UserProfile['diabetesType'] || undefined,
        };
        await saveUserProfile(updatedUser);
        setUser(updatedUser); // Update local state with the saved data
        setIsEditing(false);
        toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
      } catch (error: any) {
         toast({ title: "Erro ao Salvar Perfil", description: error.message, variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-48 mb-2 rounded bg-muted animate-pulse" />
          <div className="h-6 w-64 rounded bg-muted animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
        </CardContent>
         <CardFooter className="border-t pt-6">
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
        </CardFooter>
      </Card>
    );
  }
  
  if (!user) {
     return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle>Perfil não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Não foi possível carregar as informações do perfil.</p>
        </CardContent>
      </Card>
     )
  }


  const profileInfoItems = [
    { icon: UserCircle, label: "Nome Completo", value: user.name, key: 'name', formKey: 'name', type: 'text', editable: true },
    { icon: Mail, label: "Email", value: user.email, key: 'email', formKey: 'email', type: 'email', editable: false }, // Email usually not editable here
    { 
      icon: CalendarDays, 
      label: "Data de Nascimento", 
      value: user.dateOfBirth ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado', 
      formValue: editForm.dateOfBirth, 
      key: 'dateOfBirth',
      formKey: 'dateOfBirth',
      type: 'date',
      editable: true 
    },
    { 
      icon: Droplet, 
      label: "Tipo de Diabetes", 
      value: user.diabetesType ? user.diabetesType.charAt(0).toUpperCase() + user.diabetesType.slice(1) : 'Não informado',
      formValue: editForm.diabetesType,
      key: 'diabetesType', 
      formKey: 'diabetesType',
      type: 'select',
      editable: true,
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
          <AvatarImage src={isEditing ? editForm.avatarUrl || user.avatarUrl : user.avatarUrl || `https://placehold.co/120x120.png`} alt={user.name} />
          <AvatarFallback className="text-4xl bg-primary/20 text-primary font-semibold">
            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)}
          </AvatarFallback>
        </Avatar>
        {/* Avatar URL editing can be added here if desired */}
        {isEditing && (
             <Input 
                id="avatarUrl" 
                name="avatarUrl" 
                placeholder="URL do Avatar (opcional)"
                value={editForm.avatarUrl || ''} 
                onChange={handleInputChange} 
                className="mt-2 text-sm text-center h-auto p-1" 
            />
        )}
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
         <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {profileInfoItems.map(item => (
          (item.key !== 'name' && item.key !== 'email') && ( 
            <div key={item.key} className="flex items-start space-x-4">
              <item.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-grow">
                <Label htmlFor={item.formKey} className="text-sm text-muted-foreground">{item.label}</Label>
                {isEditing && item.editable ? (
                  item.type === 'select' && item.options ? (
                    <select 
                      name={item.formKey} 
                      id={item.formKey} 
                      value={editForm[item.formKey as keyof UserProfile] as string || ''} 
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-input bg-background p-2 text-base focus:border-primary focus:ring-primary"
                    >
                      <option value="">Não especificado</option>
                      {item.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <Input 
                      id={item.formKey} 
                      name={item.formKey} 
                      type={item.type} 
                      value={editForm[item.formKey as keyof UserProfile] as string || ''} 
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
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
              {isSaving? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button variant="outline" onClick={handleEditToggle} className="flex-1" disabled={isSaving}>
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
