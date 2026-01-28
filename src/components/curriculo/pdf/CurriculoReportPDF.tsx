import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FullAnalysisResult } from '@/types/curriculo';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  scoreMessage: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  metricDetails: {
    fontSize: 9,
    color: '#6B7280',
  },
  culturalBridge: {
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    marginBottom: 12,
  },
  bridgeTitle: {
    fontSize: 10,
    color: '#4F46E5',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  bridgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bridgeLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  bridgeValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  bridgeExplanation: {
    fontSize: 9,
    color: '#4B5563',
    marginTop: 8,
  },
  marketValue: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  marketRange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803D',
    marginBottom: 4,
  },
  marketContext: {
    fontSize: 9,
    color: '#4B5563',
  },
  improvementCard: {
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  improvementTags: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    fontSize: 8,
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    padding: 4,
    borderRadius: 4,
  },
  originalText: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecoration: 'line-through',
    marginBottom: 6,
  },
  improvedText: {
    fontSize: 10,
    color: '#1F2937',
  },
  impactLabel: {
    fontSize: 8,
    color: '#6366F1',
    marginTop: 6,
    fontWeight: 'bold',
  },
  linkedinSection: {
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginBottom: 12,
  },
  linkedinHeadline: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 8,
  },
  linkedinReasoning: {
    fontSize: 9,
    color: '#4B5563',
  },
  interviewQuestion: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  questionContext: {
    fontSize: 9,
    color: '#6B7280',
  },
  powerVerbsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  powerVerb: {
    fontSize: 9,
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    padding: 6,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 8,
  },
});

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#15803D';
  if (score >= 50) return '#D97706';
  return '#DC2626';
};

interface CurriculoReportPDFProps {
  result: FullAnalysisResult;
}

export const CurriculoReportPDF = ({ result }: CurriculoReportPDFProps) => {
  const score = result.header?.score ?? 0;
  const generatedDate = new Date().toLocaleDateString('pt-BR');

  return (
    <Document>
      {/* Page 1: Overview */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Currículo USA</Text>
          <Text style={styles.subtitle}>Gerado em {generatedDate}</Text>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
            {score}%
          </Text>
          <Text style={styles.scoreLabel}>
            {result.header?.status_tag || 'Análise Completa'}
          </Text>
          <Text style={styles.scoreMessage}>
            {result.header?.main_message}
          </Text>
        </View>

        {/* Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas de Qualidade</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Formato ATS</Text>
              <Text style={styles.metricValue}>{result.metrics?.ats_format?.label || 'N/A'}</Text>
              <Text style={styles.metricDetails}>{result.metrics?.ats_format?.details_pt || ''}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Palavras-Chave</Text>
              <Text style={styles.metricValue}>
                {result.metrics?.keywords?.matched_count || 0}/{result.metrics?.keywords?.total_required || 0}
              </Text>
              <Text style={styles.metricDetails}>{result.metrics?.keywords?.details_pt || ''}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Verbos de Ação</Text>
              <Text style={styles.metricValue}>{result.metrics?.action_verbs?.count || 0} encontrados</Text>
              <Text style={styles.metricDetails}>{result.metrics?.action_verbs?.details_pt || ''}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Brevidade</Text>
              <Text style={styles.metricValue}>
                {result.metrics?.brevity?.page_count || 0}/{result.metrics?.brevity?.ideal_page_count || 1} páginas
              </Text>
              <Text style={styles.metricDetails}>{result.metrics?.brevity?.details_pt || ''}</Text>
            </View>
          </View>
        </View>

        {/* Cultural Bridge */}
        {result.cultural_bridge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ponte Cultural</Text>
            <View style={styles.culturalBridge}>
              <Text style={styles.bridgeTitle}>Equivalência de Cargo</Text>
              <View style={styles.bridgeRow}>
                <View>
                  <Text style={styles.bridgeLabel}>Brasil:</Text>
                  <Text style={styles.bridgeValue}>{result.cultural_bridge.brazil_title}</Text>
                </View>
                <View>
                  <Text style={styles.bridgeLabel}>EUA:</Text>
                  <Text style={styles.bridgeValue}>{result.cultural_bridge.us_equivalent}</Text>
                </View>
              </View>
              <Text style={styles.bridgeExplanation}>{result.cultural_bridge.explanation}</Text>
            </View>
          </View>
        )}

        {/* Market Value */}
        {result.market_value && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor de Mercado</Text>
            <View style={styles.marketValue}>
              <Text style={styles.marketRange}>{result.market_value.range}</Text>
              <Text style={styles.marketContext}>{result.market_value.context}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>Currículo USA - Relatório de Análise</Text>
      </Page>

      {/* Page 2: Improvements */}
      {result.improvements && result.improvements.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Melhorias Sugeridas</Text>
          </View>

          {/* Power Verbs */}
          {result.power_verbs_suggestions && result.power_verbs_suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Power Verbs Recomendados</Text>
              <View style={styles.powerVerbsSection}>
                {result.power_verbs_suggestions.slice(0, 12).map((verb, index) => (
                  <Text key={index} style={styles.powerVerb}>{verb}</Text>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Otimizações de Conteúdo</Text>
            {result.improvements.slice(0, 4).map((improvement, index) => (
              <View key={index} style={styles.improvementCard}>
                <View style={styles.improvementTags}>
                  {improvement.tags?.map((tag, tagIndex) => (
                    <Text key={tagIndex} style={styles.tag}>{tag}</Text>
                  ))}
                </View>
                <Text style={styles.originalText}>{improvement.original}</Text>
                <Text style={styles.improvedText}>{improvement.improved}</Text>
                <Text style={styles.impactLabel}>{improvement.impact_label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>Currículo USA - Melhorias Sugeridas</Text>
        </Page>
      )}

      {/* Page 3: Preparation */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Preparação para Entrevista</Text>
        </View>

        {/* LinkedIn Fix */}
        {result.linkedin_fix && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LinkedIn Quick-Fix</Text>
            <View style={styles.linkedinSection}>
              <Text style={styles.linkedinHeadline}>{result.linkedin_fix.headline}</Text>
              <Text style={styles.linkedinReasoning}>{result.linkedin_fix.reasoning_pt}</Text>
            </View>
          </View>
        )}

        {/* Interview Questions */}
        {result.interview_cheat_sheet && result.interview_cheat_sheet.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perguntas Prováveis</Text>
            {result.interview_cheat_sheet.slice(0, 5).map((question, index) => (
              <View key={index} style={styles.interviewQuestion}>
                <Text style={styles.questionText}>{question.question}</Text>
                <Text style={styles.questionContext}>{question.context_pt}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>Currículo USA - Guia de Preparação</Text>
      </Page>
    </Document>
  );
};
