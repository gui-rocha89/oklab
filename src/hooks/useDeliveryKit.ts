import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  client: string;
  created_at: string;
  approval_date: string;
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

export const useDeliveryKit = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async (project: Project, keyframes: Keyframe[]): Promise<Blob> => {
    const pdf = new jsPDF();
    
    // Configurações de cores
    const primaryColor: [number, number, number] = [94, 23, 235]; // RGB para hsl(258, 90%, 51%)
    const textColor: [number, number, number] = [30, 30, 30];
    const mutedColor: [number, number, number] = [100, 100, 100];
    
    // Página de capa
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Logo placeholder
    pdf.setFillColor(255, 255, 255);
    pdf.circle(105, 80, 25, 'F');
    pdf.setFontSize(20);
    pdf.setTextColor(94, 23, 235);
    pdf.text('OK LAB', 105, 85, { align: 'center' });
    
    // Título do documento
    pdf.setFontSize(28);
    pdf.setTextColor(255, 255, 255);
    pdf.text('KIT COMPLETO', 105, 130, { align: 'center' });
    pdf.text('DE ENTREGA', 105, 145, { align: 'center' });
    
    // Informações do projeto
    pdf.setFontSize(16);
    pdf.text(project.title, 105, 170, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Cliente: ${project.client}`, 105, 185, { align: 'center' });
    pdf.text(`Aprovado em: ${format(new Date(project.approval_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 105, 200, { align: 'center' });
    
    // Footer
    pdf.setFontSize(10);
    pdf.text('By Stream Lab - Soluções Criativas', 105, 280, { align: 'center' });
    
    // Nova página - Cronograma
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Header da página
    pdf.setFontSize(24);
    pdf.setTextColor(...primaryColor);
    pdf.text('CRONOGRAMA DE PUBLICAÇÕES', 20, 30);
    
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(2);
    pdf.line(20, 35, 190, 35);
    
    let yPosition = 60;
    
    keyframes.forEach((keyframe, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Título do criativo
      pdf.setFontSize(16);
      pdf.setTextColor(...textColor);
      pdf.text(`${index + 1}. ${keyframe.title}`, 20, yPosition);
      yPosition += 15;
      
      // Informações de cada attachment
      keyframe.attachments.forEach((attachment, attachIndex) => {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 30;
        }
        
        const publishDate = attachment.publishDate 
          ? format(new Date(attachment.publishDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          : 'Data não especificada';
          
        // Retângulo para o item
        pdf.setFillColor(248, 249, 250);
        pdf.rect(25, yPosition - 5, 160, 25, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(...textColor);
        pdf.text(`📅 ${publishDate}`, 30, yPosition + 5);
        pdf.text(`📁 ${attachment.name}`, 30, yPosition + 12);
        pdf.text(`📱 Instagram Feed`, 30, yPosition + 19);
        
        yPosition += 35;
      });
      
      yPosition += 10;
    });
    
    // Instruções finais
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 30;
    }
    
    yPosition += 20;
    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.text('INSTRUÇÕES DE PUBLICAÇÃO', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(11);
    pdf.setTextColor(...textColor);
    const instructions = [
      '• Publique no horário sugerido para melhor engajamento',
      '• Use as legendas exatamente como fornecidas',
      '• Marque @oklab_oficial nas publicações',
      '• Aguarde pelo menos 2 horas entre posts',
      '• Em caso de dúvidas, entre em contato conosco'
    ];
    
    instructions.forEach(instruction => {
      pdf.text(instruction, 25, yPosition);
      yPosition += 8;
    });
    
    return pdf.output('blob');
  };

  const generateZIP = async (project: Project, keyframes: Keyframe[], pdfBlob: Blob): Promise<Blob> => {
    const zip = new JSZip();
    
    // Adicionar o PDF ao ZIP
    zip.file(`${project.client}_-_Kit_Completo_${format(new Date(), 'yyyy-MM-dd')}.pdf`, pdfBlob);
    
    // Criar pasta para imagens
    const imagesFolder = zip.folder('Imagens_Aprovadas');
    
    // Baixar e adicionar cada imagem ao ZIP
    for (let i = 0; i < keyframes.length; i++) {
      const keyframe = keyframes[i];
      const creativeFolder = imagesFolder!.folder(`${String(i + 1).padStart(2, '0')}_${keyframe.title.replace(/[^a-zA-Z0-9]/g, '_')}`);
      
      for (let j = 0; j < keyframe.attachments.length; j++) {
        const attachment = keyframe.attachments[j];
        if (attachment.url) {
          try {
            const response = await fetch(attachment.url);
            const imageBlob = await response.blob();
            const extension = attachment.name.split('.').pop() || 'png';
            const fileName = `${String(j + 1).padStart(2, '0')}_${attachment.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            creativeFolder!.file(fileName, imageBlob);
          } catch (error) {
            console.error(`Erro ao baixar imagem: ${attachment.name}`, error);
          }
        }
      }
    }
    
    return await zip.generateAsync({ type: 'blob' });
  };

  const logDownload = async (projectId: string, filesDownloaded: any[]) => {
    try {
      // Call edge function to log download
      const { error } = await supabase.functions.invoke('generate-delivery-kit', {
        body: { projectId }
      });

      if (error) {
        console.error('Erro ao registrar download:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar download:', error);
    }
  };

  const generateDeliveryKit = async (project: Project, keyframes: Keyframe[]) => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Gerando Kit de Entrega...",
        description: "Criando PDF e organizando arquivos. Aguarde...",
      });

      // Gerar PDF
      const pdfBlob = await generatePDF(project, keyframes);
      
      // Gerar ZIP com PDF e imagens
      const zipBlob = await generateZIP(project, keyframes, pdfBlob);
      
      // Criar arquivo para download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kit_Completo_${project.client}_${format(new Date(), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Registrar download
      await logDownload(project.id, []);
      
      toast({
        title: "Kit Baixado com Sucesso! ✨",
        description: "Seu kit completo foi gerado e baixado. Verifique sua pasta de downloads.",
      });
      
    } catch (error) {
      console.error('Erro ao gerar kit:', error);
      toast({
        title: "Erro ao Gerar Kit",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateDeliveryKit,
    isGenerating
  };
};