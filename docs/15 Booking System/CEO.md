# Sistema de Agendamentos — Visão Executiva

## O que é

O sistema de **Agendamentos** permite que alunos marquem sessões 1:1 com mentores diretamente pela plataforma. Mentores gerenciam sua própria disponibilidade, e administradores têm visão e controle total sobre todas as sessões, mentores e políticas.

---

## Como funciona para o aluno

1. O aluno acessa um serviço do tipo "mentoria ao vivo" no Hub
2. Se ele possui acesso ao serviço (via compra ou assinatura), é direcionado ao fluxo de agendamento
3. Escolhe o mentor, data e horário disponível
4. A sessão é confirmada imediatamente e um email de confirmação é enviado
5. Lembretes automáticos são enviados 24h e 1h antes da sessão
6. Após a sessão, o mentor marca como concluída

Se o aluno **não** possui acesso ao serviço, ele vê uma mensagem explicativa com links para adquirir.

---

## Como funciona para o mentor

O mentor tem duas páginas dedicadas no painel:

### Minha Disponibilidade (`/mentor/disponibilidade`)
- Configura o **link de reunião** (Google Meet, Zoom, etc.) por serviço
- Define **horários semanais recorrentes** (ex: segunda e quarta, 9h–17h)
- Cria **bloqueios de agenda** para períodos específicos (férias, feriados)

### Meus Agendamentos (`/mentor/agendamentos`)
- Vê sessões próximas com dados do aluno
- Botão para entrar na reunião diretamente
- Marca sessões como concluídas (com notas opcionais)
- Histórico de sessões passadas com contadores de concluídas e no-shows

---

## Como funciona para o administrador

O painel admin (`/admin/agendamentos`) tem 3 abas:

### Aba "Agendamentos"
- Todas as sessões da plataforma com filtros por status e mentor
- Ações: marcar como concluída, cancelar (com motivo), marcar no-show
- Visão completa: aluno, mentor, serviço, data, duração, status

### Aba "Disponibilidade"
- Atribui mentores a serviços (qual mentor atende qual tipo de sessão)
- Configura duração do slot, buffer entre sessões e link de reunião
- Gerencia horários semanais e bloqueios de qualquer mentor

### Aba "Políticas"
- Configurações globais do sistema:
  - Máximo de agendamentos simultâneos por aluno
  - Máximo de reagendamentos permitidos
  - Antecedência mínima para agendar (horas)
  - Antecedência máxima para agendar (dias)
  - Janela de cancelamento (horas)
  - Duração e intervalo padrão dos slots

---

## Emails automáticos

O sistema envia 6 tipos de email relacionados a agendamentos:

| Momento | Email |
|---------|-------|
| Sessão criada | Confirmação de agendamento |
| 24h antes | Lembrete com detalhes e link |
| 1h antes | Lembrete urgente |
| Reagendamento | Nova data com data antiga riscada |
| Cancelamento | Confirmação do cancelamento |
| Não comparecimento | Aviso ao aluno |

Todos os templates são editáveis em **Admin → Templates de Email**.

---

## Controle de acesso (gate de aquisição)

O fluxo de agendamento só é acessível para alunos que **possuem o serviço**. Isso é verificado pela tabela `user_hub_services`. Um aluno sem acesso vê uma tela com:

- Mensagem "Você precisa adquirir este serviço"
- Link para o catálogo de serviços
- Link para o Hub

Isso cria um funil natural de conversão: aluno descobre o serviço → tenta agendar → precisa comprar.

> Administradores sempre têm acesso total, independente de compra.

---

## Navegação

| Papel | Menu | Link |
|-------|------|------|
| Aluno | Discovery → Agendamentos | `/dashboard/agendamentos` |
| Mentor | Gestão → Agendamentos | `/mentor/agendamentos` |
| Mentor | Gestão → Disponibilidade | `/mentor/disponibilidade` |
| Admin | Gestão de Conteúdo → Agendamentos | `/admin/agendamentos` |

---

## Métricas disponíveis

No painel do mentor:
- Total de sessões próximas
- Total de sessões concluídas
- Total de no-shows

No painel admin:
- Todas as métricas acima, por mentor
- Filtros por status e mentor para análise

---

## Por que isso importa

- **Receita**: agendamentos são vinculados a serviços pagos — mais sessões = mais conversões
- **Retenção**: alunos que fazem sessões com mentores têm maior engajamento
- **Operação**: mentores gerenciam sua própria agenda sem depender do admin
- **Qualidade**: administrador pode acompanhar no-shows e tomar ações
- **Escalabilidade**: políticas globais e auto-serviço do mentor permitem crescer sem gargalo operacional
