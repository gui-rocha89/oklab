import React from 'react';
import { motion } from 'framer-motion';
import { Download, Package, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeliveryKit } from '@/hooks/useDeliveryKit';

interface Project {
  id: string;
  title: string;
  client: string;
  created_at: string;
  approval_date: string;
  status: string;
}

interface Keyframe {
  id: string;
  title: string;
  attachments: Array<{
    name: string;
    url?: string;
    publishDate?: string;
  }>;
}

interface DownloadSectionProps {
  project: Project;
  keyframes: Keyframe[];
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ project, keyframes }) => {
  const { generateDeliveryKit, isGenerating } = useDeliveryKit();

  if (project.status !== 'approved') {
    return null;
  }

  const totalFiles = keyframes.reduce((total, kf) => total + kf.attachments.length, 0) + 1; // +1 for PDF

  const handleDownloadKit = () => {
    generateDeliveryKit(project, keyframes);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-8"
    >
      <Card className="shadow-elegant border-0 bg-gradient-to-br from-success/5 to-primary/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-primary/10" />
        <div className="relative">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-foreground">🎉 Downloads Liberados!</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu projeto foi aprovado. Baixe o kit completo com tudo organizado.
                </p>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Projeto Aprovado
              </Badge>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Kit Completo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Kit Completo de Entrega</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Inclui guia PDF com cronograma de publicações, legendas organizadas e todos os arquivos aprovados em alta qualidade.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Guia PDF incluído</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Download className="w-4 h-4 text-primary" />
                        <span>{totalFiles} arquivos organizados</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Pronto para publicação</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Button
                    onClick={handleDownloadKit}
                    disabled={isGenerating}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 h-auto shadow-elegant"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white mr-3" />
                        Gerando Kit...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-3" />
                        Baixar Kit Completo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Informações adicionais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-4 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-primary">💡</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground">O que está incluso no kit:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-0">
                    <li>• <strong>Guia PDF:</strong> Cronograma completo com datas de publicação</li>
                    <li>• <strong>Imagens:</strong> Todos os criativos aprovados em alta resolução</li>
                    <li>• <strong>Legendas:</strong> Textos formatados para cada publicação</li>
                    <li>• <strong>Instruções:</strong> Dicas de horário e melhores práticas</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};