import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const CleanupOrphanedFiles = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCleanup = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧹 Iniciando limpeza de arquivos órfãos...');

      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-files');

      if (error) throw error;

      setResult(data);

      if (data.success) {
        toast({
          title: "Limpeza concluída!",
          description: `Removidos ${data.deletedFiles.length} arquivos de ${data.orphanedFiles} pastas órfãs.`,
        });
      } else {
        toast({
          title: "Erro na limpeza",
          description: data.error || "Falha ao limpar arquivos órfãos",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na limpeza:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao executar limpeza",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Arquivos Órfãos
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar limpeza de arquivos</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover PERMANENTEMENTE todos os vídeos do Storage que não estão
              associados a nenhum projeto ativo. Esta operação não pode ser desfeita.
              <br /><br />
              Os arquivos de projetos ativos NÃO serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="font-semibold text-lg">Resultado da Limpeza</h3>
          <div className="space-y-1 text-sm">
            <p>Total de pastas: <strong>{result.totalFiles}</strong></p>
            <p>Pastas órfãs: <strong>{result.orphanedFiles}</strong></p>
            <p>Arquivos removidos: <strong className="text-destructive">{result.deletedFiles.length}</strong></p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-destructive font-medium">Erros ({result.errors.length}):</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {result.errors.slice(0, 5).map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
