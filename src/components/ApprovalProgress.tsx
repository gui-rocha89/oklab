import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CreativeApproval {
  status: 'pending' | 'approved' | 'changes_requested';
  feedback?: string;
}

interface ApprovalProgressProps {
  approvals: CreativeApproval[];
  totalCreatives: number;
  isGeneratingKit?: boolean;
}

export const ApprovalProgress: React.FC<ApprovalProgressProps> = ({
  approvals,
  totalCreatives,
  isGeneratingKit = false
}) => {
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const changesRequestedCount = approvals.filter(a => a.status === 'changes_requested').length;
  const pendingCount = totalCreatives - approvals.length + approvals.filter(a => a.status === 'pending').length;
  
  const isFullyApproved = approvedCount === totalCreatives;
  const progressPercentage = (approvedCount / totalCreatives) * 100;

  return (
    <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl text-foreground">Progresso da Aprovação</span>
          <Badge variant={isFullyApproved ? "default" : "secondary"}>
            {approvedCount}/{totalCreatives} Creativos
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-medium text-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800">{approvedCount}</p>
                <p className="text-sm text-green-600">Aprovados</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-800">{changesRequestedCount}</p>
                <p className="text-sm text-amber-600">Alterações</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-800">{pendingCount}</p>
                <p className="text-sm text-blue-600">Pendentes</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full Approval Message and Download */}
        {isFullyApproved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-green-50 to-primary/5 border border-green-200 rounded-lg p-6 text-center"
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-green-800">
                  🎉 Todos os Creativos Aprovados!
                </h3>
                <p className="text-green-700">
                  Perfeito! Todos os {totalCreatives} creativos foram aprovados. 
                  Role para baixo para baixar o kit completo com o PDF e todos os arquivos organizados.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Partial Approval Message */}
        {!isFullyApproved && approvedCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700">
              <strong>{approvedCount} de {totalCreatives} creativos aprovados.</strong>
              {pendingCount > 0 && ` Ainda restam ${pendingCount} creativos para revisar.`}
              {changesRequestedCount > 0 && ` ${changesRequestedCount} creativos precisam de alterações.`}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              O kit completo será liberado após a aprovação de todos os creativos.
            </p>
          </div>
        )}

        {/* No Progress Message */}
        {approvedCount === 0 && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Revise cada criativo individualmente e aprove ou solicite alterações conforme necessário.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};