

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/types';
import { getUserProfile, saveUserProfile } from '@/lib/storage'; 
import { Edit3, Save, UserCircle, Mail, CalendarDays, Droplet, Loader2, Upload, Target, Info, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { GLUCOSE_THRESHOLDS } from '@/config/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '../ui/separator';

export default function UserProfileCard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
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
          setEditForm(profile); // Initialize form with full profile data
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
                    languagePreference: 'pt-BR',
                };
                setUser(newProfile);
                setEditForm(newProfile);
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
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(user?.avatarUrl || null);
    }
  };

  const handleEditToggle = () => {
    if (user && !isEditing) { 
      setEditForm(user);
      setAvatarPreview(user.avatarUrl || null); 
      setAvatarFile(null); 
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle number inputs correctly
    const val = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
    setEditForm(prev => ({ ...prev, [name]: val }));
  };


  const handleSave = async () => {
    if (user) {
      setIsSaving(true);
      try {
        const profileToSave: UserProfile = {
          ...user,
          ...editForm,
        };
        
        const updatedProfile = await saveUserProfile(profileToSave, avatarFile || undefined);
        setUser(updatedProfile); 
        setEditForm(updatedProfile);
        setAvatarPreview(updatedProfile.avatarUrl || null); 
        setIsEditing(false);
        setAvatarFile(null); 
        toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
        // Force a page reload to ensure all components get the new profile settings
        window.location.reload();

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
    { 
      icon: CalendarDays, 
      label: "Data de Nascimento", 
      value: user.dateOfBirth ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado', 
      formKey: 'dateOfBirth',
      type: 'date'
    },
    { 
      icon: Droplet, 
      label: "Tipo de Diabetes", 
      value: user.diabetesType ? (user.diabetesType.charAt(0).toUpperCase() + user.diabetesType.slice(1)).replace('tipo', 'Tipo ') : 'Não informado',
      formKey: 'diabetesType',
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
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="items-center text-center border-b pb-6">
          <div className="relative group">
            <Avatar className="w-32 h-32 mb-4 border-4 border-primary shadow-lg" data-ai-hint="person avatar portrait">
              <AvatarImage src={avatarPreview || `https://placehold.co/128x128.png`} alt={user.name || 'Avatar do usuário'} />
              <AvatarFallback className="text-5xl bg-primary/20 text-primary font-semibold">
                {(user.name)?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2) || <UserCircle size={64}/>}
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
            <CardTitle className="text-3xl font-headline text-primary mt-2">{user.name || 'Usuário'}</CardTitle>
          )}
           <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {profileInfoItems.map(item => (
              <div key={item.formKey} className="flex items-start space-x-4">
                <item.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-grow">
                  <Label htmlFor={item.formKey} className="text-sm text-muted-foreground">{item.label}</Label>
                  {isEditing ? (
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
                        disabled={isSaving}
                      />
                    )
                  ) : (
                    <p className="text-lg font-medium text-card-foreground mt-0.5">{item.value || 'Não informado'}</p>
                  )}
                </div>
              </div>
          ))}
        </CardContent>
        {isEditing ? null : (
            <CardFooter className="border-t pt-6">
                <Button onClick={handleEditToggle} className="w-full">
                    <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil e Configurações
                </Button>
            </CardFooter>
        )}
      </Card>
      
      {/* Glucose Targets & Bolus Calculator Settings */}
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Target className="mr-2 h-5 w-5" /> Configurações de Tratamento
          </CardTitle>
          <CardDescription>
            Personalize as faixas glicêmicas e os fatores para cálculo de bolus de insulina.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center"><Target className="mr-2 h-4 w-4"/> Metas Glicêmicas</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hypo_glucose_threshold">Limite de Hipoglicemia (mg/dL)</Label>
                      <Input id="hypo_glucose_threshold" name="hypo_glucose_threshold" type="number" value={editForm.hypo_glucose_threshold ?? ''} onChange={handleInputChange} placeholder={`${GLUCOSE_THRESHOLDS.low}`} disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">Valores abaixo disso são 'baixa'.</p>
                    </div>
                    <div>
                      <Label htmlFor="target_glucose_low">Início da Faixa Alvo (mg/dL)</Label>
                      <Input id="target_glucose_low" name="target_glucose_low" type="number" value={editForm.target_glucose_low ?? ''} onChange={handleInputChange} placeholder={`${GLUCOSE_THRESHOLDS.low}`} disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">Início da faixa 'normal'.</p>
                    </div>
                    <div>
                      <Label htmlFor="target_glucose_high">Fim da Faixa Alvo (mg/dL)</Label>
                      <Input id="target_glucose_high" name="target_glucose_high" type="number" value={editForm.target_glucose_high ?? ''} onChange={handleInputChange} placeholder={`${GLUCOSE_THRESHOLDS.normalIdealMax}`} disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">Fim da faixa 'normal'.</p>
                    </div>
                    <div>
                      <Label htmlFor="hyper_glucose_threshold">Início da Hiperglicemia (mg/dL)</Label>
                      <Input id="hyper_glucose_threshold" name="hyper_glucose_threshold" type="number" value={editForm.hyper_glucose_threshold ?? ''} onChange={handleInputChange} placeholder={`${GLUCOSE_THRESHOLDS.high}`} disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">Valores acima disso são 'muito alta'.</p>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Metas Atuais</AlertTitle>
                    <AlertDescription className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Hipoglicemia:</span> <strong>&lt; {user.hypo_glucose_threshold ?? GLUCOSE_THRESHOLDS.low} mg/dL</strong>
                        <span>Faixa Alvo:</span> <strong>{user.target_glucose_low ?? GLUCOSE_THRESHOLDS.low} - {user.target_glucose_high ?? GLUCOSE_THRESHOLDS.normalIdealMax} mg/dL</strong>
                        <span>Hiperglicemia:</span> <strong>&gt; {user.target_glucose_high ?? GLUCOSE_THRESHOLDS.normalIdealMax} mg/dL</strong>
                        <span>Hiper. Grave:</span> <strong>&gt; {user.hyper_glucose_threshold ?? GLUCOSE_THRESHOLDS.high} mg/dL</strong>
                    </AlertDescription>
                  </Alert>
                )}
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center"><Calculator className="mr-2 h-4 w-4"/> Fatores para Cálculo de Bolus</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carb_ratio">Ratio Carboidrato/Insulina</Label>
                      <Input id="carb_ratio" name="carb_ratio" type="number" step="0.1" value={editForm.carb_ratio ?? ''} onChange={handleInputChange} placeholder="Ex: 15" disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">1 unidade de insulina para X gramas de carboidrato.</p>
                    </div>
                    <div>
                      <Label htmlFor="correction_factor">Fator de Correção/Sensibilidade</Label>
                      <Input id="correction_factor" name="correction_factor" type="number" step="0.1" value={editForm.correction_factor ?? ''} onChange={handleInputChange} placeholder="Ex: 50" disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">Quantos mg/dL 1 unidade de insulina reduz.</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="target_glucose">Glicemia Alvo para Correção (mg/dL)</Label>
                      <Input id="target_glucose" name="target_glucose" type="number" value={editForm.target_glucose ?? ''} onChange={handleInputChange} placeholder="Ex: 100" disabled={isSaving}/>
                      <p className="text-xs text-muted-foreground mt-1">O valor que a dose de correção tentará alcançar.</p>
                    </div>
                  </div>
                ) : (
                  <Alert variant="info">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Fatores Atuais</AlertTitle>
                    <AlertDescription className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Ratio Carboidrato:</span> <strong>{user.carb_ratio ? `1 U : ${user.carb_ratio} g` : 'Não definido'}</strong>
                        <span>Fator de Correção:</span> <strong>{user.correction_factor ? `1 U ~ ${user.correction_factor} mg/dL` : 'Não definido'}</strong>
                        <span>Glicemia Alvo:</span> <strong>{user.target_glucose ? `${user.target_glucose} mg/dL` : 'Não definido'}</strong>
                    </AlertDescription>
                  </Alert>
                )}
            </div>
        </CardContent>
        {isEditing && (
             <CardFooter className="border-t pt-6">
                <div className="flex gap-4 w-full">
                    <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                        {isSaving? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button variant="outline" onClick={handleEditToggle} className="flex-1" disabled={isSaving}>
                        Cancelar
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
    </>
  );
}
