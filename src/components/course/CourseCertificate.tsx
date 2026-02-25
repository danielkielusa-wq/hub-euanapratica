import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';

interface CourseCertificateProps {
  studentName: string;
  courseName: string;
  completedAt: string;
  totalLessons: number;
  totalDurationHours?: number;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 60,
    fontFamily: 'Helvetica',
  },
  border: {
    border: '3px solid #4F46E5',
    borderRadius: 8,
    padding: 40,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#4F46E5',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 2,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  certText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#4F46E5',
    marginBottom: 24,
    textAlign: 'center',
  },
  courseLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  courseName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  footer: {
    fontSize: 9,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 'auto',
  },
});

function CertificateDocument({
  studentName,
  courseName,
  completedAt,
  totalLessons,
  totalDurationHours,
}: CourseCertificateProps) {
  const date = new Date(completedAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.logo}>EU NA PRÁTICA</Text>
          <Text style={styles.subtitle}>Certificado de Conclusão</Text>

          <Text style={styles.certText}>
            Certificamos que
          </Text>

          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.courseLabel}>concluiu com sucesso o curso</Text>
          <Text style={styles.courseName}>{courseName}</Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Data de Conclusão</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Aulas Concluídas</Text>
              <Text style={styles.metaValue}>{totalLessons} aulas</Text>
            </View>
            {totalDurationHours && totalDurationHours > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Carga Horária</Text>
                <Text style={styles.metaValue}>{totalDurationHours}h</Text>
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            hub.euanapratica.com — Verificado digitalmente
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function CourseCertificate(props: CourseCertificateProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await pdf(<CertificateDocument {...props} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${props.courseName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
        <Award size={28} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Parabéns! Curso Concluído</h3>
        <p className="text-sm text-gray-500 mt-1">
          Você completou todas as aulas. Baixe seu certificado de conclusão.
        </p>
      </div>
      <Button
        onClick={handleDownload}
        disabled={generating}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        <Download className="h-4 w-4 mr-2" />
        {generating ? 'Gerando...' : 'Baixar Certificado PDF'}
      </Button>
    </div>
  );
}
