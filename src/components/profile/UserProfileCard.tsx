
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/types';
import { getUserProfile, saveUserProfile } from '@/lib/storage'; 
import { Edit3, Save, UserCircle, Mail, ShieldCheck, CalendarDays, Droplet, FileText, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';


export default function UserProfileCard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // editForm não precisa mais de avatarUrl, pois é gerenciado por avatarPreview e avatarFile
  const [editForm, setEditForm] = useState<Partial<Omit<UserProfile, 'avatarUrl'>>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
            email: profile.email, // Email não é editável aqui
            dateOfBirth: profile.dateOfBirth || '',
            diabetesType: profile.diabetesType || 'outro',
          });
          if (profile.avatarUrl) {
            setAvatarPreview(profile.avatarUrl);
          }
        } else {
           const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const newProfile: UserProfile = {
                    id: authUser.id,
                    name: authUser.user_metadata?.full_name || authUser.email || 'Novo Usuário',
                    email: authUser.email || '',
                    avatarUrl: authUser.user_metadata?.avatar_url,
                    // dateOfBirth and diabetesType start as undefined
                };
                setUser(newProfile);
                setEditForm({
                    name: newProfile.name,
                    email: newProfile.email,
                    dateOfBirth: '',
                    diabetesType: 'outro',
                });
                if (newProfile.avatarUrl) setAvatarPreview(newProfile.avatarUrl);
                toast({ title: "Complete seu Perfil", description: "Por favor, revise e complete suas informações de perfil."});
                setIsEditing(true); 
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string); // Mostra o preview do novo arquivo
      };
      reader.readAsDataURL(file);
    } else { // Usuário cancelou a seleção de arquivo ou não selecionou nenhum
      setAvatarFile(null);
      setAvatarPreview(user?.avatarUrl || null); // Volta para a imagem salva anteriormente ou null se não houver
    }
  };

  const handleEditToggle = () => {
    if (user && !isEditing) { 
      setEditForm({ 
        name: user.name, 
        email: user.email,
        dateOfBirth: user.dateOfBirth || '',
        diabetesType: user.diabetesType || 'outro',
      });
      setAvatarPreview(user.avatarUrl || null); 
      setAvatarFile(null); 
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (user) {
      setIsSaving(true);
      try {
        const profileToSave: UserProfile = {
          id: user.id, 
          name: editForm.name || user.name, // Usa o valor do formulário ou o original se não alterado
          email: user.email, // Email não é editado aqui
          avatarUrl: user.avatarUrl, // Passa a URL ATUAL. saveUserProfile cuidará do upload do avatarFile.
          dateOfBirth: editForm.dateOfBirth || undefined,
          diabetesType: editForm.diabetesType as UserProfile['diabetesType'] || undefined,
        };
        
        const updatedProfile = await saveUserProfile(profileToSave, avatarFile || undefined);
        setUser(updatedProfile); 
        setAvatarPreview(updatedProfile.avatarUrl || null); 
        setIsEditing(false);
        setAvatarFile(null); 
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
      <Card className="w-full max-w-2xl mx-auto shadow-xl animate-pulse">
        <CardHeader className="items-center text-center border-b pb-6">
          <div className="w-28 h-28 mb-4 rounded-full bg-muted" />
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
    { icon: Mail, label: "Email", value: user.email, formKey: 'email', type: 'email', editable: false },
    { 
      icon: CalendarDays, 
      label: "Data de Nascimento", 
      value: user.dateOfBirth ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado', 
      formValue: editForm.dateOfBirth, 
      formKey: 'dateOfBirth',
      type: 'date',
      editable: true 
    },
    { 
      icon: Droplet, 
      label: "Tipo de Diabetes", 
      value: user.diabetesType ? (user.diabetesType.charAt(0).toUpperCase() + user.diabetesType.slice(1)).replace('tipo', 'Tipo ') : 'Não informado',
      formValue: editForm.diabetesType,
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
        <div className="relative group">
          <Avatar className="w-32 h-32 mb-4 border-4 border-primary shadow-lg" data-ai-hint="person avatar">
            <AvatarImage src={avatarPreview || `https://placehold.co/128x128.png`} alt={user.name} />
            <AvatarFallback className="text-5xl bg-primary/20 text-primary font-semibold">
              {(user.name)?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-4 right-0 rounded-full bg-background hover:bg-muted border-primary text-primary hover:text-primary/90 shadow-md"
              onClick={() => fileInputRef.current?.click()}
              title="Alterar foto de perfil"
              disabled={isSaving}
            >
              <Upload className="h-5 w-5" />
              <span className="sr-only">Alterar foto de perfil</span>
            </Button>
          )}
        </div>
        <Input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarFileChange} 
            disabled={!isEditing || isSaving}
        />
        
        {isEditing ? (
          <Input 
            id="name" 
            name="name" 
            value={editForm.name || ''} 
            onChange={handleInputChange} 
            className="mt-2 text-3xl font-bold text-center h-auto p-1 border-2 border-transparent focus:border-primary rounded-md" 
            placeholder="Seu Nome Completo"
            disabled={isSaving}
          />
        ) : (
          <CardTitle className="text-3xl font-headline text-primary mt-2">{user.name}</CardTitle>
        )}
         <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {profileInfoItems.map(item => (
            <div key={item.formKey} className="flex items-start space-x-4">
              <item.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-grow">
                <Label htmlFor={item.formKey} className="text-sm text-muted-foreground">{item.label}</Label>
                {isEditing && item.editable ? (
                  item.type === 'select' && item.options ? (
                    <select 
                      name={item.formKey} 
                      id={item.formKey} 
                      value={(editForm as any)[item.formKey] || ''} 
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-input bg-background p-2.5 text-base focus:border-primary focus:ring-primary shadow-sm"
                      disabled={isSaving}
                    >
                      <option value="" disabled>Selecione...</option>
                      {item.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <Input 
                      id={item.formKey} 
                      name={item.formKey} 
                      type={item.type} 
                      value={(editForm as any)[item.formKey] || ''} 
                      onChange={handleInputChange} 
                      className="mt-1 text-base p-2.5" 
                      disabled={isSaving || !item.editable}
                    />
                  )
                ) : (
                  <p className="text-lg font-medium text-card-foreground mt-0.5">{item.value || 'Não informado'}</p>
                )}
              </div>
            </div>
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

    