import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download, 
  Upload, 
  Key, 
  Globe, 
  Database,
  Settings as SettingsIcon,
  Save,
  Trash2,
  Camera,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from 'next-themes';
import { CleanupOrphanedFiles } from "@/components/CleanupOrphanedFiles";

export default function Settings() {
  const { user } = useUser();
  const { profile, loading, uploading, updateProfile, uploadAvatar } = useProfile();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || user?.email || "",
    cargo: profile?.cargo || "",
    bio: profile?.bio || "",
  });

  const [notifications, setNotifications] = useState({
    emailNewProject: true,
    emailFeedback: true,
    emailApproval: false,
    pushNewProject: true,
    pushFeedback: true,
    pushApproval: true
  });

  const [preferences, setPreferences] = useState({
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    autoSave: true,
    defaultView: "grid"
  });

  const { toast } = useToast();

  // Atualizar formulário quando o perfil carregar
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        email: profile.email || user?.email || "",
        cargo: profile.cargo || "",
        bio: profile.bio || "",
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    await updateProfile({
      full_name: profileData.full_name,
      email: profileData.email,
      cargo: profileData.cargo,
      bio: profileData.bio,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    await uploadAvatar(file);
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notificações atualizadas!",
      description: "Suas preferências de notificação foram salvas."
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferências atualizadas!",
      description: "Suas configurações foram salvas com sucesso."
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: "Tema alterado!",
      description: `Tema ${newTheme === 'dark' ? 'escuro' : newTheme === 'light' ? 'claro' : 'automático'} aplicado com sucesso.`,
    });
  };

  const handleExportData = () => {
    toast({
      title: "Exportando dados...",
      description: "Seus dados serão enviados por email em breve."
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Função não disponível",
      description: "Entre em contato com o suporte para excluir sua conta.",
      variant: "destructive"
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Configurações" 
        subtitle="Personalize sua experiência na plataforma"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dados
            </TabsTrigger>
          </TabsList>

          {/* Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando perfil...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage 
                            src={profile?.avatar_url || undefined} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                            {(profile?.full_name || user?.email)
                              ?.split(" ")
                              .map(n => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                          onClick={handleAvatarClick}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">
                          {profile?.full_name || user?.email?.split('@')[0] || "Usuário"}
                        </h3>
                        <p className="text-muted-foreground">{profile?.email || user?.email}</p>
                        <Badge variant="secondary">Stream Lab</Badge>
                      </div>
                    </div>

                     <div className="space-y-4">
                       <div className="space-y-2">
                         <Label htmlFor="name">Nome Completo</Label>
                         <Input
                           id="name"
                           value={profileData.full_name}
                           onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                           placeholder="Digite seu nome completo"
                         />
                       </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            placeholder="Digite seu email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cargo">Cargo</Label>
                          <Input
                            id="cargo"
                            value={profileData.cargo}
                            onChange={(e) => setProfileData({...profileData, cargo: e.target.value})}
                            placeholder="Digite seu cargo ou função"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Biografia</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                            placeholder="Conte um pouco sobre você, sua experiência e interesses..."
                            rows={4}
                          />
                        </div>
                     </div>

                    <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Perfil
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Notificações por Email</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-new-project">Novos Projetos</Label>
                        <p className="text-sm text-muted-foreground">Receba emails quando novos projetos forem criados</p>
                      </div>
                      <Switch
                        id="email-new-project"
                        checked={notifications.emailNewProject}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailNewProject: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-feedback">Feedbacks</Label>
                        <p className="text-sm text-muted-foreground">Receba emails quando houver novos comentários</p>
                      </div>
                      <Switch
                        id="email-feedback"
                        checked={notifications.emailFeedback}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailFeedback: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-approval">Aprovações</Label>
                        <p className="text-sm text-muted-foreground">Receba emails quando projetos forem aprovados/rejeitados</p>
                      </div>
                      <Switch
                        id="email-approval"
                        checked={notifications.emailApproval}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailApproval: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Notificações Push</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-new-project">Novos Projetos</Label>
                        <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                      </div>
                      <Switch
                        id="push-new-project"
                        checked={notifications.pushNewProject}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushNewProject: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-feedback">Feedbacks</Label>
                        <p className="text-sm text-muted-foreground">Notificações instantâneas de comentários</p>
                      </div>
                      <Switch
                        id="push-feedback"
                        checked={notifications.pushFeedback}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushFeedback: checked})
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-approval">Aprovações</Label>
                        <p className="text-sm text-muted-foreground">Notificações de status de aprovação</p>
                      </div>
                      <Switch
                        id="push-approval"
                        checked={notifications.pushApproval}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushApproval: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Notificações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferências */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferências da Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select value={theme || "light"} onValueChange={handleThemeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre tema claro, escuro ou automático (baseado no sistema)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={preferences.language} onValueChange={(value) => 
                      setPreferences({...preferences, language: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={preferences.timezone} onValueChange={(value) => 
                      setPreferences({...preferences, timezone: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-view">Visualização Padrão</Label>
                    <Select value={preferences.defaultView} onValueChange={(value) => 
                      setPreferences({...preferences, defaultView: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grade</SelectItem>
                        <SelectItem value="list">Lista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save">Salvamento Automático</Label>
                    <p className="text-sm text-muted-foreground">Salvar alterações automaticamente</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, autoSave: checked})
                    }
                  />
                </div>

                <Button onClick={handleSavePreferences} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Alterar Senha</h3>
                    <div className="space-y-3">
                      <Input type="password" placeholder="Senha atual" />
                      <Input type="password" placeholder="Nova senha" />
                      <Input type="password" placeholder="Confirmar nova senha" />
                      <Button className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Alterar Senha
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Autenticação de Dois Fatores</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                    <Button variant="outline">
                      Configurar 2FA
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Sessões Ativas</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Sessão Atual</p>
                          <p className="text-sm text-muted-foreground">Chrome • São Paulo, Brasil</p>
                        </div>
                        <Badge variant="secondary">Ativa</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dados */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Gerenciamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Exportar Dados</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Baixe uma cópia de todos os seus dados da plataforma
                  </p>
                  <Button onClick={handleExportData} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Dados
                  </Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Importar Dados</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Importe projetos e configurações de um backup anterior
                  </p>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importar Backup
                  </Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Limpeza de Storage</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Remove vídeos órfãos que não estão associados a nenhum projeto ativo. Esta operação ajuda a liberar espaço no Storage.
                  </p>
                  <CleanupOrphanedFiles />
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2 text-destructive">Zona Perigosa</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ações irreversíveis que afetam permanentemente sua conta
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}